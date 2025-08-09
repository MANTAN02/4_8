import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logInfo, logError, logWarn } from './logger';
import { cacheManager } from './cache-manager';
import { db } from './db-local';

// Enhanced request interface
interface EnhancedRequest extends Request {
  requestId: string;
  startTime: number;
  user?: any;
  clientInfo?: {
    ip: string;
    userAgent: string;
    country?: string;
    device?: string;
  };
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    reset: Date;
  };
}

// Advanced rate limiting configurations
export const createAdvancedRateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skipIf?: (req: Request) => boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: { error: options.message || 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req) => req.ip || 'unknown'),
    skip: options.skipIf || (() => false),
    handler: (req: any, res: any) => {
      const enhanced = req as EnhancedRequest;
      logWarn('Rate limit exceeded', {
        ip: enhanced.clientInfo?.ip,
        userAgent: enhanced.clientInfo?.userAgent,
        endpoint: req.path,
        requestId: enhanced.requestId
      });
      
      res.status(429).json({ error: options.message || 'Too many requests' });
    }
  });
};

// Comprehensive request monitoring
export const requestMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const enhanced = req as EnhancedRequest;
  enhanced.startTime = Date.now();
  enhanced.requestId = req.headers['x-request-id'] as string || 
                      `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Extract client information
  enhanced.clientInfo = {
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  };

  // Set request ID header
  res.setHeader('X-Request-ID', enhanced.requestId);

  // Monitor response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - enhanced.startTime;
    
    // Log request completion
    logInfo('Request completed', {
      requestId: enhanced.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: enhanced.clientInfo?.ip,
      userAgent: enhanced.clientInfo?.userAgent,
      contentLength: Buffer.byteLength(data || '', 'utf8')
    });

    // Store analytics
    storeAnalyticsEvent(enhanced, res.statusCode, duration);

    return originalSend.call(this, data);
  };

  next();
};

// Analytics event storage
async function storeAnalyticsEvent(req: EnhancedRequest, statusCode: number, duration: number) {
  try {
    // Use sqlite directly for analytics
    const { sqlite } = await import('./db-local');
    sqlite.prepare(`
      INSERT INTO analytics_events (
        id, user_id, event_type, event_data, session_id, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      req.user?.id || null,
      'api_request',
      JSON.stringify({
        method: req.method,
        path: req.path,
        statusCode,
        duration,
        userAgent: req.clientInfo?.userAgent
      }),
      req.headers['x-session-id'] || null,
      req.clientInfo?.ip,
      req.clientInfo?.userAgent,
      new Date().toISOString()
    );
  } catch (error) {
    // Fail silently for analytics
  }
}

// Security middleware
export const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const enhanced = req as EnhancedRequest;
  
  // Detect potential attacks
  const suspiciousPatterns = [
    /(<script|javascript:|data:)/i,
    /(union|select|insert|update|delete|drop|create|alter)/i,
    /(\.\.|\/etc\/|\/proc\/|\.env)/i,
    /(eval\(|function\(|setTimeout\()/i
  ];

  const requestData = JSON.stringify({
    url: req.url,
    query: req.query,
    body: req.body,
    headers: req.headers
  });

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      logWarn('Suspicious request detected', {
        pattern: pattern.source,
        ip: enhanced.clientInfo?.ip,
        userAgent: enhanced.clientInfo?.userAgent,
        requestId: enhanced.requestId,
        url: req.url
      });
      
      // Increase rate limiting for this IP
      incrementSecurityScore(enhanced.clientInfo?.ip || 'unknown');
      break;
    }
  }

  next();
};

// Security scoring system
const securityScores = new Map<string, { score: number; lastUpdate: number }>();

async function incrementSecurityScore(ip: string) {
  const current = securityScores.get(ip) || { score: 0, lastUpdate: Date.now() };
  const now = Date.now();
  
  // Reset score if it's been more than an hour
  if (now - current.lastUpdate > 60 * 60 * 1000) {
    current.score = 1;
  } else {
    current.score += 1;
  }
  
  current.lastUpdate = now;
  securityScores.set(ip, current);
  
  // Cache for rate limiting
  await cacheManager.set(`security:${ip}`, current.score, 60 * 60 * 1000);
  
  if (current.score > 10) {
    logError(new Error('High security score detected'), {
      ip,
      score: current.score,
      context: 'Security monitoring'
    });
  }
}

// Performance monitoring middleware
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const enhanced = req as EnhancedRequest;
  
  // Monitor memory usage
  const memBefore = process.memoryUsage();
  
  const originalSend = res.send;
  res.send = function(data) {
    const memAfter = process.memoryUsage();
    const duration = Date.now() - enhanced.startTime;
    
    // Alert on slow requests
    if (duration > 5000) {
      logWarn('Slow request detected', {
        requestId: enhanced.requestId,
        path: req.path,
        duration,
        memoryDelta: {
          rss: memAfter.rss - memBefore.rss,
          heapUsed: memAfter.heapUsed - memBefore.heapUsed
        }
      });
    }
    
    // Store performance metrics
    storePerformanceMetrics(req.path, duration, memAfter);
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Performance metrics storage
async function storePerformanceMetrics(path: string, duration: number, memory: NodeJS.MemoryUsage) {
  try {
    const key = `perf:${path}`;
    const existing = await cacheManager.get(key) || [];
    
    existing.push({
      timestamp: Date.now(),
      duration,
      memory: memory.heapUsed
    });
    
    // Keep only last 100 measurements per endpoint
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }
    
    await cacheManager.set(key, existing, 60 * 60 * 1000); // 1 hour
  } catch (error) {
    // Fail silently
  }
}

// API health check middleware
export const healthCheck = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health' || req.path === '/api/health') {
    return getSystemHealth().then(health => {
      res.status(health.healthy ? 200 : 503).json(health);
    });
  }
  next();
};

// System health check
async function getSystemHealth() {
  try {
    const [dbHealth, cacheHealth] = await Promise.all([
      checkDatabaseHealth(),
      getCacheHealth()
    ]);
    
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      healthy: dbHealth.healthy && cacheHealth.healthy,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      memory: {
        rss: Math.round(memory.rss / 1024 / 1024),
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024)
      },
      database: dbHealth,
      cache: cacheHealth,
      version: process.env.npm_package_version || '1.0.0'
    };
  } catch (error: any) {
    return {
      healthy: false,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

// Import health check functions
async function checkDatabaseHealth() {
  try {
    const { checkDatabaseHealth } = await import('./db-local');
    return checkDatabaseHealth();
  } catch (error: any) {
    return { healthy: false, error: error?.message || 'Unknown error' };
  }
}

async function getCacheHealth() {
  try {
    const { getCacheHealth } = await import('./cache-manager');
    return getCacheHealth();
  } catch (error: any) {
    return { healthy: false, error: error?.message || 'Unknown error' };
  }
}

// Request validation middleware
export const validateJsonPayload = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers['content-type']?.includes('application/json') && req.body) {
    try {
      // Validate JSON structure
      if (typeof req.body === 'string') {
        req.body = JSON.parse(req.body);
      }
      
      // Check payload size
      const size = JSON.stringify(req.body).length;
      if (size > 1024 * 1024) { // 1MB limit
        return res.status(413).json({ error: 'Payload too large' });
      }
      
      // Check nesting depth
      if (getObjectDepth(req.body) > 10) {
        return res.status(400).json({ error: 'Object nesting too deep' });
      }
      
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
  }
  
  next();
};

// Utility function to check object depth
function getObjectDepth(obj: any, depth = 0): number {
  if (typeof obj !== 'object' || obj === null) return depth;
  
  const depths = Object.values(obj).map(value => getObjectDepth(value, depth + 1));
  return Math.max(depth, ...depths);
}

// API versioning middleware
export const apiVersioning = (req: Request, res: Response, next: NextFunction) => {
  const version = req.headers['api-version'] || (typeof req.query.v === 'string' ? req.query.v : 'v1');
  
  // Store version info for analytics
  (req as any).apiVersion = version;
  
  // Set version header in response
  res.setHeader('API-Version', version);
  
  next();
};

// Response compression optimization
export const smartCompression = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Only compress responses larger than 1KB
    if (data && Buffer.byteLength(data, 'utf8') > 1024) {
      res.setHeader('Content-Encoding', 'gzip');
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Request timeout middleware
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logWarn('Request timeout', {
          requestId: (req as EnhancedRequest).requestId,
          path: req.path,
          timeout: timeoutMs
        });
        
        res.status(408).json({ error: 'Request timeout' });
      }
    }, timeoutMs);
    
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    
    next();
  };
};

// Export rate limiting configurations
export const rateLimitConfigs = {
  strict: createAdvancedRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many requests from this IP, please try again later'
  }),
  
  moderate: createAdvancedRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Rate limit exceeded'
  }),
  
  generous: createAdvancedRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Rate limit exceeded'
  }),
  
  auth: createAdvancedRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts',
    keyGenerator: (req) => `auth:${req.ip}:${req.body?.email || 'unknown'}`
  }),
  
  api: createAdvancedRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    message: 'API rate limit exceeded',
    keyGenerator: (req) => {
      const user = (req as any).user;
      return user ? `api:user:${user.id}` : `api:ip:${req.ip}`;
    }
  })
};

export default {
  requestMonitoring,
  securityMiddleware,
  performanceMonitoring,
  healthCheck,
  validateJsonPayload,
  apiVersioning,
  smartCompression,
  requestTimeout,
  rateLimitConfigs
};