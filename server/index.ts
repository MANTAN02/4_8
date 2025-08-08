import express from "express";
import { createServer as createHttpServer } from "http";
import { createProductionRouter } from "./production-routes";
import firebaseRoutes from "./firebase-routes";
import adminRoutes from "./admin-routes";
import paymentRoutes from "./payment-routes";
import mumbaiRoutes from "./mumbai-routes";
import { DatabaseStorage } from "./db-storage";
import { initWebSocket } from "./websocket";
import { initializeFirebaseAdmin } from './firebase-admin';
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { httpLogger, logger, logInfo, logError } from "./logger";
import { 
  errorHandler, 
  unhandledRejectionHandler, 
  uncaughtExceptionHandler, 
  gracefulShutdown 
} from "./error-handler";
import { initializeDatabase, checkDatabaseHealth } from "./db-local";
import { cacheManager, warmupCache } from "./cache-manager";
import { 
  requestMonitoring, 
  securityMiddleware, 
  performanceMonitoring,
  healthCheck,
  validateJsonPayload,
  apiVersioning,
  requestTimeout,
  rateLimitConfigs
} from "./advanced-middleware";
import { backupManager, migrationManager, runMigrationsNow } from "./backup-manager";

// Enhanced rate limiting
const createRateLimit = (windowMs: number, max: number, message: string) => 
  rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1', // Skip localhost
  });

// Request ID middleware
const requestId = (req: any, res: any, next: any) => {
  req.requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// Security headers middleware
const securityHeaders = (req: any, res: any, next: any) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

async function createServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

  // Trust proxy for proper IP detection
  app.set('trust proxy', 1);

  // Advanced middleware stack
  app.use(requestMonitoring);
  app.use(healthCheck);
  app.use(securityMiddleware);
  app.use(performanceMonitoring);
  app.use(validateJsonPayload);
  app.use(apiVersioning);
  app.use(requestTimeout(30000));

  // Request ID tracking (legacy support)
  app.use(requestId);

  // HTTP request logging
  app.use(httpLogger);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Additional security headers
  app.use(securityHeaders);

  // CORS configuration
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS || 'https://your-domain.com').split(',')
    : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'];

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200
  }));

  // Compression
  app.use(compression({ threshold: 1024 }));

  // Enhanced rate limiting
  app.use('/api/auth', rateLimitConfigs.auth);
  app.use('/api', rateLimitConfigs.api);
  app.use(rateLimitConfigs.generous);

  // Body parsing with limits
  app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new Error('Invalid JSON');
      }
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize local database
  await initializeDatabase();

  // Run database migrations
  await runMigrationsNow();

  // Warm up cache
  await warmupCache();

  // Start scheduled backups
  backupManager.startScheduledBackups({
    fullBackupInterval: 24, // every 24 hours
    incrementalInterval: 6  // every 6 hours
  });

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      const dbHealth = checkDatabaseHealth();
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: dbHealth,
        version: process.env.npm_package_version || '1.0.0'
      };
      res.json(health);
    } catch (error) {
      res.status(503).json({
        status: 'error',
        message: 'Service unhealthy',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Metrics endpoint (basic)
  app.get('/metrics', (req, res) => {
    const metrics = {
      process: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        pid: process.pid
      },
      timestamp: new Date().toISOString()
    };
    res.json(metrics);
  });

  // Storage instance with enhanced error handling
  let storage: DatabaseStorage;
  try {
    storage = new DatabaseStorage();
    logInfo('Database storage initialized successfully');
  } catch (error) {
    logError(error as Error, { context: 'DATABASE_INITIALIZATION' });
    throw error;
  }

  app.locals.storage = storage;

  // Initialize Firebase Admin
  try {
    initializeFirebaseAdmin();
    logInfo('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logError(error as Error, { context: 'FIREBASE_INITIALIZATION' });
    // Continue without Firebase if it fails
  }

  // API routes
  app.use(createProductionRouter(storage));
  app.use('/api/firebase', firebaseRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/mumbai', mumbaiRoutes);

  // Development Vite middleware
  if (process.env.NODE_ENV === "development") {
    try {
      const vite = await import("vite");
      const path = await import("path");
      const viteServer = await vite.createServer({
        server: { 
          middlewareMode: true,
          host: "0.0.0.0",
          allowedHosts: [
            "localhost",
            ".replit.app", 
            ".replit.dev",
            ".spock.replit.dev"
          ]
        },
        appType: "spa",
        root: "./client",
        resolve: {
          alias: {
            "@": path.resolve(process.cwd(), "client", "src"),
            "@shared": path.resolve(process.cwd(), "shared"),
            "@assets": path.resolve(process.cwd(), "attached_assets"),
          },
        },
      });
      app.use(viteServer.middlewares);
      logInfo('Vite development server initialized');
    } catch (error) {
      logError(error as Error, { context: 'VITE_INITIALIZATION' });
    }
  } else {
    // Production static files
    app.use(express.static("dist/public", {
      maxAge: '1y',
      etag: true,
      lastModified: true
    }));
    
    // SPA fallback
    app.get("*", (req, res) => {
      res.sendFile("index.html", { 
        root: "dist/public",
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
    });
  }

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Endpoint not found',
        code: 'NOT_FOUND',
        statusCode: 404,
        timestamp: new Date().toISOString()
      }
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Create HTTP server
  const httpServer = createHttpServer(app);

  // Initialize WebSocket with error handling
  try {
    initWebSocket(httpServer);
    logInfo('WebSocket server initialized');
  } catch (error) {
    logError(error as Error, { context: 'WEBSOCKET_INITIALIZATION' });
  }

  // Graceful shutdown setup
  process.on('SIGINT', () => {
    logInfo('Received SIGINT. Starting graceful shutdown...');
    httpServer.close(() => {
      console.log('Server closed. Exiting process...');
      process.exit(0);
    });
  });
  
  process.on('SIGTERM', () => {
    logInfo('Received SIGTERM. Starting graceful shutdown...');
    httpServer.close(() => {
      console.log('Server closed. Exiting process...');
      process.exit(0);
    });
  });

  // Start server with error handling
  httpServer.listen(PORT, "0.0.0.0", () => {
    logInfo(`🚀 Server running on http://0.0.0.0:${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      nodeVersion: process.version
    });
    
    console.log(`\n📱 MOBILE ACCESS:`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`📱 Network: http://172.30.0.2:${PORT}`);
    console.log(`☁️  Public: Check your IDE's port forwarding for port ${PORT}`);
    console.log(`\n✅ Your Baartal app is ready!`);
  });

  // Handle server errors
  httpServer.on('error', (error) => {
    logError(error, { context: 'SERVER_ERROR' });
  });

  return httpServer;
}

// Global error handlers
process.on('unhandledRejection', unhandledRejectionHandler);
process.on('uncaughtException', uncaughtExceptionHandler);

// Start server
createServer().catch((error) => {
  logError(error, { context: 'SERVER_STARTUP_FAILED' });
  process.exit(1);
});