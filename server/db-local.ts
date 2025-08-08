import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@shared/schema';
import { logInfo, logError } from './logger';

// Create SQLite database
const sqlite = new Database('./database.sqlite');
sqlite.pragma('journal_mode = WAL');

// Initialize Drizzle with SQLite
export const db = drizzle(sqlite, { schema });

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    // Create tables if they don't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        user_type TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        business_name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        address TEXT NOT NULL,
        pincode TEXT NOT NULL,
        phone TEXT,
        is_verified INTEGER DEFAULT 0,
        bcoin_rate REAL DEFAULT 5.0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS bcoin_transactions (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        business_id TEXT NOT NULL,
        amount TEXT NOT NULL,
        bcoins_earned TEXT NOT NULL,
        qr_code_id TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id),
        FOREIGN KEY (business_id) REFERENCES businesses(id)
      );

      CREATE TABLE IF NOT EXISTS qr_codes (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        amount TEXT NOT NULL,
        is_used INTEGER DEFAULT 0,
        used_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        used_at TEXT,
        FOREIGN KEY (business_id) REFERENCES businesses(id),
        FOREIGN KEY (used_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS ratings (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        business_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id),
        FOREIGN KEY (business_id) REFERENCES businesses(id)
      );

      CREATE TABLE IF NOT EXISTS bundles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pincode TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bundle_memberships (
        id TEXT PRIMARY KEY,
        bundle_id TEXT NOT NULL,
        business_id TEXT NOT NULL,
        joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bundle_id) REFERENCES bundles(id),
        FOREIGN KEY (business_id) REFERENCES businesses(id)
      );
    `);

    logInfo('Local SQLite database initialized successfully');
    return true;
  } catch (error) {
    logError(error as Error, { context: 'Database initialization' });
    return false;
  }
};

// Health check for local database
export const checkDatabaseHealth = () => {
  try {
    sqlite.prepare('SELECT 1').get();
    return {
      healthy: true,
      stats: {
        isHealthy: true,
        connectionType: 'SQLite',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      healthy: false,
      stats: {
        isHealthy: false,
        connectionType: 'SQLite',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};

export default db;