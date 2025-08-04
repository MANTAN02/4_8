import express from "express";
import { createServer as createHttpServer } from "http";
import { createProductionRouter } from "./production-routes";
import { DatabaseStorage } from "./db-storage";
import { initWebSocket } from "./websocket";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";

async function createServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

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
  }));
  
  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-domain.com', 'https://www.your-domain.com']
      : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'],
    credentials: true,
  }));
  
  // Compression middleware
  app.use(compression());

  // Storage instance
  const storage = new DatabaseStorage();
  
  // Make storage available to middleware
  app.locals.storage = storage;

  // Body parsing middleware with limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Add production API routes with security
  app.use(createProductionRouter(storage));

  // In development, use Vite middleware for frontend
  if (process.env.NODE_ENV === "development") {
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
  } else {
    // In production, serve static files
    app.use(express.static("dist/public"));
    
    // Catch-all handler for SPA routing
    app.get("*", (_, res) => {
      res.sendFile("index.html", { root: "dist/public" });
    });
  }

  const httpServer = createHttpServer(app);
  
  // Initialize WebSocket server
  initWebSocket(httpServer);

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch(console.error);