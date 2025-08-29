import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  console.log("🗄️  Initializing Prebucks database...");
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  try {
    // Test database connection
    console.log("📡 Testing database connection...");
    const result = await pool.query('SELECT NOW() as current_time');
    console.log("✅ Database connected successfully:", result.rows[0].current_time);

    console.log("🚀 Database initialization complete!");
    console.log("📊 Your Prebucks platform is ready!");
    
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();