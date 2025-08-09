import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createHttpServer } from "http";
import { createProductionRouter } from "./production-routes";
import { initializeFirebaseAdmin } from './firebase-admin';
import { initWebSocket } from "./websocket";
import { httpLogger, logger, logInfo, logError } from "./logger";
import { errorHandler } from "./error-handler";
import { runMigrationsNow } from "./backup-manager";
import { initializeDatabase } from "./db-local";
import cors from "cors";

async function createDevServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;

  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'],
    credentials: true,
  }));

  app.use(express.json());
  app.use(httpLogger);

  await initializeDatabase();
  await runMigrationsNow();
  
  try {
    initializeFirebaseAdmin();
    logInfo('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logError(error as Error, { context: 'FIREBASE_INITIALIZATION' });
  }

  app.use(createProductionRouter());

  // Development Vite middleware
  if (process.env.NODE_ENV === "development") {
    try {
      const vite = await import("vite");
      const path = await import("path");
      const viteServer = await vite.createServer({
        server: { middlewareMode: true },
        appType: "spa",
        root: "./client",
        resolve: {
          alias: {
            "@": path.resolve(process.cwd(), "client", "src"),
          },
        },
      });
      app.use(viteServer.middlewares);
      logInfo('Vite development server initialized');
    } catch (error) {
      logError(error as Error, { context: 'VITE_INITIALIZATION' });
    }
  }

  app.use(errorHandler);

  const httpServer = createHttpServer(app);
  initWebSocket(httpServer);
  
  httpServer.listen(PORT, "0.0.0.0", () => {
    logInfo(`🚀 Development server running on http://localhost:${PORT}`);
  });
}

createDevServer().catch(error => {
  logError(error, { context: 'DEV_SERVER_STARTUP' });
  process.exit(1);
});