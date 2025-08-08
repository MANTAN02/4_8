import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@shared/schema';
import { logInfo, logError, logWarn } from './logger';

// Enhanced SQLite configuration
const sqlite = new Database('./database.sqlite');

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = NORMAL');
sqlite.pragma('cache_size = 1000000');
sqlite.pragma('temp_store = memory');
sqlite.pragma('mmap_size = 268435456'); // 256MB

// Initialize Drizzle with SQLite
export const db = drizzle(sqlite, { schema });

// Database performance monitoring
let queryCount = 0;
let totalQueryTime = 0;

// Wrap sqlite for performance monitoring
const originalPrepare = sqlite.prepare;
sqlite.prepare = function(sql: string) {
  const stmt = originalPrepare.call(this, sql);
  const originalAll = stmt.all;
  const originalGet = stmt.get;
  const originalRun = stmt.run;

  stmt.all = function(...args: any[]) {
    const start = performance.now();
    queryCount++;
    const result = originalAll.apply(this, args);
    const duration = performance.now() - start;
    totalQueryTime += duration;
    
    if (duration > 100) { // Log slow queries
      logWarn(`Slow query detected: ${sql} (${duration.toFixed(2)}ms)`);
    }
    
    return result;
  };

  stmt.get = function(...args: any[]) {
    const start = performance.now();
    queryCount++;
    const result = originalGet.apply(this, args);
    const duration = performance.now() - start;
    totalQueryTime += duration;
    
    if (duration > 100) {
      logWarn(`Slow query detected: ${sql} (${duration.toFixed(2)}ms)`);
    }
    
    return result;
  };

  stmt.run = function(...args: any[]) {
    const start = performance.now();
    queryCount++;
    const result = originalRun.apply(this, args);
    const duration = performance.now() - start;
    totalQueryTime += duration;
    
    if (duration > 100) {
      logWarn(`Slow query detected: ${sql} (${duration.toFixed(2)}ms)`);
    }
    
    return result;
  };

  return stmt;
};

// Initialize database with enhanced schema and optimizations
export const initializeDatabase = async () => {
  try {
    // Create tables with enhanced schema
    sqlite.exec(`
      -- Users table with enhanced constraints and indexing
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL CHECK(email LIKE '%@%.%'),
        password TEXT NOT NULL CHECK(length(password) >= 8),
        user_type TEXT NOT NULL CHECK(user_type IN ('customer', 'business')),
        name TEXT NOT NULL CHECK(length(trim(name)) > 0),
        phone TEXT CHECK(phone IS NULL OR length(phone) >= 10),
        is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
        last_login TEXT,
        failed_login_attempts INTEGER DEFAULT 0,
        account_locked_until TEXT,
        email_verified INTEGER DEFAULT 0 CHECK(email_verified IN (0, 1)),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Businesses table with enhanced schema
      CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        business_name TEXT NOT NULL CHECK(length(trim(business_name)) > 0),
        category TEXT NOT NULL CHECK(category IN (
          'electronics', 'clothing', 'restaurant', 'salon', 'footwear',
          'cafe', 'gifts', 'pharmacy', 'stationery', 'ethnic-wear',
          'kids-clothing', 'formal-wear', 'cosmetics', 'turf', 'beauty-parlour'
        )),
        description TEXT,
        address TEXT NOT NULL CHECK(length(trim(address)) > 0),
        pincode TEXT NOT NULL CHECK(length(pincode) = 6 AND pincode GLOB '[0-9]*'),
        phone TEXT CHECK(phone IS NULL OR length(phone) >= 10),
        is_verified INTEGER DEFAULT 0 CHECK(is_verified IN (0, 1)),
        verification_requested INTEGER DEFAULT 0 CHECK(verification_requested IN (0, 1)),
        bcoin_rate REAL DEFAULT 5.0 CHECK(bcoin_rate >= 0 AND bcoin_rate <= 100),
        total_transactions INTEGER DEFAULT 0,
        total_revenue REAL DEFAULT 0.0,
        rating_average REAL DEFAULT 0.0 CHECK(rating_average >= 0 AND rating_average <= 5),
        rating_count INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- B-Coin transactions with enhanced tracking
      CREATE TABLE IF NOT EXISTS bcoin_transactions (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        business_id TEXT NOT NULL,
        amount REAL NOT NULL CHECK(amount > 0),
        bcoins_earned REAL NOT NULL CHECK(bcoins_earned >= 0),
        qr_code_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('earned', 'redeemed', 'transfer', 'bonus')),
        status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed', 'cancelled')),
        metadata TEXT, -- JSON for additional data
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        processed_at TEXT,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
        FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id)
      );

      -- QR codes with enhanced security
      CREATE TABLE IF NOT EXISTS qr_codes (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        amount REAL NOT NULL CHECK(amount > 0),
        is_used INTEGER DEFAULT 0 CHECK(is_used IN (0, 1)),
        used_by TEXT,
        expires_at TEXT, -- QR code expiration
        usage_limit INTEGER DEFAULT 1,
        usage_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        used_at TEXT,
        metadata TEXT, -- JSON for additional data
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
        FOREIGN KEY (used_by) REFERENCES users(id)
      );

      -- Enhanced ratings system
      CREATE TABLE IF NOT EXISTS ratings (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        business_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        is_verified INTEGER DEFAULT 0 CHECK(is_verified IN (0, 1)),
        helpful_votes INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
        UNIQUE(customer_id, business_id) -- One rating per customer per business
      );

      -- Enhanced bundles system
      CREATE TABLE IF NOT EXISTS bundles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL CHECK(length(trim(name)) > 0),
        pincode TEXT NOT NULL CHECK(length(pincode) = 6 AND pincode GLOB '[0-9]*'),
        description TEXT,
        category TEXT, -- Bundle category
        max_members INTEGER DEFAULT 50,
        current_members INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      -- Enhanced bundle memberships
      CREATE TABLE IF NOT EXISTS bundle_memberships (
        id TEXT PRIMARY KEY,
        bundle_id TEXT NOT NULL,
        business_id TEXT NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'pending', 'rejected')),
        joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
        left_at TEXT,
        FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
        UNIQUE(bundle_id, business_id)
      );

      -- User sessions for enhanced security
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        refresh_token_hash TEXT,
        device_info TEXT,
        ip_address TEXT,
        user_agent TEXT,
        expires_at TEXT NOT NULL,
        is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_accessed TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Notification system
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('transaction', 'verification', 'bundle', 'system', 'promotional')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT, -- JSON data
        is_read INTEGER DEFAULT 0 CHECK(is_read IN (0, 1)),
        is_sent INTEGER DEFAULT 0 CHECK(is_sent IN (0, 1)),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        read_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Analytics and metrics
      CREATE TABLE IF NOT EXISTS analytics_events (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        event_type TEXT NOT NULL,
        event_data TEXT, -- JSON data
        session_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      -- System logs
      CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL CHECK(level IN ('error', 'warn', 'info', 'debug')),
        message TEXT NOT NULL,
        context TEXT, -- JSON context data
        user_id TEXT,
        request_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Create indexes for better performance
    sqlite.exec(`
      -- User indexes
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

      -- Business indexes
      CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
      CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
      CREATE INDEX IF NOT EXISTS idx_businesses_pincode ON businesses(pincode);
      CREATE INDEX IF NOT EXISTS idx_businesses_verified ON businesses(is_verified);
      CREATE INDEX IF NOT EXISTS idx_businesses_active ON businesses(is_active);
      CREATE INDEX IF NOT EXISTS idx_businesses_rating ON businesses(rating_average);
      CREATE INDEX IF NOT EXISTS idx_businesses_created ON businesses(created_at);

      -- Transaction indexes
      CREATE INDEX IF NOT EXISTS idx_transactions_customer ON bcoin_transactions(customer_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_business ON bcoin_transactions(business_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON bcoin_transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON bcoin_transactions(status);
      CREATE INDEX IF NOT EXISTS idx_transactions_created ON bcoin_transactions(created_at);
      CREATE INDEX IF NOT EXISTS idx_transactions_amount ON bcoin_transactions(amount);

      -- QR code indexes
      CREATE INDEX IF NOT EXISTS idx_qr_business ON qr_codes(business_id);
      CREATE INDEX IF NOT EXISTS idx_qr_used ON qr_codes(is_used);
      CREATE INDEX IF NOT EXISTS idx_qr_created ON qr_codes(created_at);
      CREATE INDEX IF NOT EXISTS idx_qr_expires ON qr_codes(expires_at);

      -- Rating indexes
      CREATE INDEX IF NOT EXISTS idx_ratings_business ON ratings(business_id);
      CREATE INDEX IF NOT EXISTS idx_ratings_customer ON ratings(customer_id);
      CREATE INDEX IF NOT EXISTS idx_ratings_rating ON ratings(rating);
      CREATE INDEX IF NOT EXISTS idx_ratings_created ON ratings(created_at);

      -- Bundle indexes
      CREATE INDEX IF NOT EXISTS idx_bundles_pincode ON bundles(pincode);
      CREATE INDEX IF NOT EXISTS idx_bundles_active ON bundles(is_active);
      CREATE INDEX IF NOT EXISTS idx_bundles_category ON bundles(category);

      -- Session indexes
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
      CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

      -- Notification indexes
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

      -- Analytics indexes
      CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);

      -- System log indexes
      CREATE INDEX IF NOT EXISTS idx_logs_level ON system_logs(level);
      CREATE INDEX IF NOT EXISTS idx_logs_created ON system_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_logs_user ON system_logs(user_id);
    `);

    // Create triggers for automatic updates
    sqlite.exec(`
      -- Update timestamps
      CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
        AFTER UPDATE ON users 
        BEGIN 
          UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;

      CREATE TRIGGER IF NOT EXISTS update_businesses_timestamp 
        AFTER UPDATE ON businesses 
        BEGIN 
          UPDATE businesses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;

      CREATE TRIGGER IF NOT EXISTS update_ratings_timestamp 
        AFTER UPDATE ON ratings 
        BEGIN 
          UPDATE ratings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;

      -- Auto-update business statistics
      CREATE TRIGGER IF NOT EXISTS update_business_stats_on_transaction
        AFTER INSERT ON bcoin_transactions
        BEGIN
          UPDATE businesses 
          SET 
            total_transactions = total_transactions + 1,
            total_revenue = total_revenue + NEW.amount,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = NEW.business_id;
        END;

      -- Auto-update business rating
      CREATE TRIGGER IF NOT EXISTS update_business_rating_on_new_rating
        AFTER INSERT ON ratings
        BEGIN
          UPDATE businesses 
          SET 
            rating_average = (
              SELECT ROUND(AVG(rating), 2) 
              FROM ratings 
              WHERE business_id = NEW.business_id
            ),
            rating_count = rating_count + 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = NEW.business_id;
        END;

      CREATE TRIGGER IF NOT EXISTS update_business_rating_on_update_rating
        AFTER UPDATE ON ratings
        BEGIN
          UPDATE businesses 
          SET 
            rating_average = (
              SELECT ROUND(AVG(rating), 2) 
              FROM ratings 
              WHERE business_id = NEW.business_id
            ),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = NEW.business_id;
        END;

      -- Auto-update bundle member count
      CREATE TRIGGER IF NOT EXISTS update_bundle_members_on_join
        AFTER INSERT ON bundle_memberships
        BEGIN
          UPDATE bundles 
          SET 
            current_members = current_members + 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = NEW.bundle_id;
        END;

      CREATE TRIGGER IF NOT EXISTS update_bundle_members_on_leave
        AFTER UPDATE ON bundle_memberships
        WHEN NEW.status = 'inactive' AND OLD.status = 'active'
        BEGIN
          UPDATE bundles 
          SET 
            current_members = current_members - 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = NEW.bundle_id;
        END;

      -- Clean up expired QR codes
      CREATE TRIGGER IF NOT EXISTS cleanup_expired_qr_codes
        BEFORE INSERT ON qr_codes
        BEGIN
          DELETE FROM qr_codes 
          WHERE expires_at < CURRENT_TIMESTAMP AND is_used = 0;
        END;

      -- Clean up old sessions
      CREATE TRIGGER IF NOT EXISTS cleanup_expired_sessions
        BEFORE INSERT ON user_sessions
        BEGIN
          DELETE FROM user_sessions 
          WHERE expires_at < CURRENT_TIMESTAMP;
        END;
    `);

    // Create views for common queries
    sqlite.exec(`
      -- Business summary view
      CREATE VIEW IF NOT EXISTS business_summary AS
      SELECT 
        b.*,
        u.name as owner_name,
        u.email as owner_email,
        COALESCE(t.transaction_count, 0) as recent_transaction_count,
        COALESCE(t.recent_revenue, 0) as recent_revenue
      FROM businesses b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN (
        SELECT 
          business_id,
          COUNT(*) as transaction_count,
          SUM(amount) as recent_revenue
        FROM bcoin_transactions 
        WHERE created_at >= datetime('now', '-30 days')
        GROUP BY business_id
      ) t ON b.id = t.business_id;

      -- User dashboard view
      CREATE VIEW IF NOT EXISTS user_dashboard AS
      SELECT 
        u.*,
        COALESCE(customer_stats.total_bcoins, 0) as total_bcoins,
        COALESCE(customer_stats.transaction_count, 0) as transaction_count,
        COALESCE(business_stats.business_count, 0) as business_count
      FROM users u
      LEFT JOIN (
        SELECT 
          customer_id,
          SUM(bcoins_earned) as total_bcoins,
          COUNT(*) as transaction_count
        FROM bcoin_transactions 
        WHERE type = 'earned'
        GROUP BY customer_id
      ) customer_stats ON u.id = customer_stats.customer_id
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as business_count
        FROM businesses 
        WHERE is_active = 1
        GROUP BY user_id
      ) business_stats ON u.id = business_stats.user_id;

      -- Analytics summary view
      CREATE VIEW IF NOT EXISTS analytics_summary AS
      SELECT 
        date(created_at) as date,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_type = 'transaction' THEN 1 END) as transactions,
        COUNT(CASE WHEN event_type = 'registration' THEN 1 END) as registrations
      FROM analytics_events
      GROUP BY date(created_at)
      ORDER BY date DESC;
    `);

    logInfo('Enhanced SQLite database initialized successfully with optimizations');
    return true;
  } catch (error) {
    logError(error as Error, { context: 'Enhanced database initialization' });
    return false;
  }
};

// Enhanced health check with detailed statistics
export const checkDatabaseHealth = () => {
  try {
    const start = performance.now();
    sqlite.prepare('SELECT 1').get();
    const queryTime = performance.now() - start;

    // Get database statistics
    const stats = {
      isHealthy: true,
      connectionType: 'SQLite Enhanced',
      queryTime: Math.round(queryTime * 100) / 100,
      totalQueries: queryCount,
      averageQueryTime: queryCount > 0 ? Math.round((totalQueryTime / queryCount) * 100) / 100 : 0,
      totalQueryTime: Math.round(totalQueryTime * 100) / 100,
      timestamp: new Date().toISOString()
    };

    // Get table counts
    try {
      const userCount = sqlite.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0;
      const businessCount = sqlite.prepare('SELECT COUNT(*) as count FROM businesses').get()?.count || 0;
      const transactionCount = sqlite.prepare('SELECT COUNT(*) as count FROM bcoin_transactions').get()?.count || 0;
      
      stats.tableCounts = {
        users: userCount,
        businesses: businessCount,
        transactions: transactionCount
      };
    } catch (e) {
      // Tables might not exist yet
    }

    return {
      healthy: true,
      stats
    };
  } catch (error) {
    return {
      healthy: false,
      stats: {
        isHealthy: false,
        connectionType: 'SQLite Enhanced',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};

// Database maintenance functions
export const performMaintenance = () => {
  try {
    logInfo('Starting database maintenance...');
    
    // Optimize database
    sqlite.exec('VACUUM');
    sqlite.exec('ANALYZE');
    
    // Clean up old data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Clean expired sessions
    const expiredSessions = sqlite.prepare('DELETE FROM user_sessions WHERE expires_at < ?').run(new Date().toISOString());
    
    // Clean old analytics events (keep 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const oldAnalytics = sqlite.prepare('DELETE FROM analytics_events WHERE created_at < ?').run(ninetyDaysAgo);
    
    // Clean old system logs (keep 30 days)
    const oldLogs = sqlite.prepare('DELETE FROM system_logs WHERE created_at < ?').run(thirtyDaysAgo);
    
    logInfo('Database maintenance completed', {
      expiredSessionsRemoved: expiredSessions.changes,
      oldAnalyticsRemoved: oldAnalytics.changes,
      oldLogsRemoved: oldLogs.changes
    });
    
    return true;
  } catch (error) {
    logError(error as Error, { context: 'Database maintenance' });
    return false;
  }
};

// Get database performance metrics
export const getPerformanceMetrics = () => {
  return {
    totalQueries: queryCount,
    totalQueryTime: Math.round(totalQueryTime * 100) / 100,
    averageQueryTime: queryCount > 0 ? Math.round((totalQueryTime / queryCount) * 100) / 100 : 0,
    timestamp: new Date().toISOString()
  };
};

// Reset performance metrics
export const resetPerformanceMetrics = () => {
  queryCount = 0;
  totalQueryTime = 0;
  logInfo('Performance metrics reset');
};

export default db;