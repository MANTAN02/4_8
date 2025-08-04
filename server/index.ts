import express from "express";
import { createRouter } from "./simple-routes";
import { DatabaseStorage } from "./storage";

async function createServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

  // Storage instance
  const storage = new DatabaseStorage();
  
  // Make storage available to middleware
  app.locals.storage = storage;

  // Body parsing middleware
  app.use(express.json());

  // Add API routes
  app.use(createRouter(storage));

  // In development, use Vite middleware for frontend
  if (process.env.NODE_ENV === "development") {
    const vite = await import("vite");
    const path = await import("path");
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
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
    app.use(express.static("dist"));
    
    // Catch-all handler for SPA routing
    app.get("*", (_, res) => {
      res.sendFile("index.html", { root: "dist" });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch(console.error);