import { Pool, neonConfig, PoolConfig } from '@neondatabase/serverless';
import { drizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { logError, logInfo, logDatabaseOperation, logWarn } from './logger';
import { DatabaseConnectionError } from './error-handler';

neonConfig.webSocketConstructor = ws;

// Database configuration
const DB_CONFIG: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum connections in pool
  min: parseInt(process.env.DB_POOL_MIN || '5'),  // Minimum connections in pool
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'), // 10 seconds
};

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

class DatabaseManager {
  private pool: Pool;
  private db: NeonDatabase<typeof schema>;
  private isHealthy: boolean = false;
  private lastHealthCheck: Date = new Date();
  private connectionAttempts: number = 0;
  private maxRetryAttempts: number = 5;
  private retryDelay: number = 1000; // Start with 1 second

  constructor() {
    this.pool = new Pool(DB_CONFIG);
    this.db = drizzle({ client: this.pool, schema });
    this.initializeHealthChecks();
  }

  // Initialize health monitoring
  private initializeHealthChecks(): void {
    // Check health immediately
    this.checkHealth();
    
    // Schedule periodic health checks every 30 seconds
    setInterval(() => {
      this.checkHealth();
    }, 30000);

    // Log pool events
    this.pool.on('connect', () => {
      logInfo('Database connection established');
      this.connectionAttempts = 0; // Reset on successful connection
    });

    this.pool.on('error', (err) => {
      this.isHealthy = false;
      logError(err, { 
        type: 'DATABASE_POOL_ERROR',
        connectionAttempts: this.connectionAttempts 
      });
    });

    this.pool.on('remove', () => {
      logInfo('Database connection removed from pool');
    });
  }

  // Health check method
  async checkHealth(): Promise<boolean> {
    try {
      const start = Date.now();
      await this.pool.query('SELECT 1');
      const duration = Date.now() - start;
      
      this.isHealthy = true;
      this.lastHealthCheck = new Date();
      
      logDatabaseOperation('HEALTH_CHECK', 'system', duration, true);
      
      // Warn if health check is slow
      if (duration > 5000) {
        logWarn('Slow database health check', { 
          duration: `${duration}ms`,
          threshold: '5000ms'
        });
      }
      
      return true;
    } catch (error) {
      this.isHealthy = false;
      logError(error as Error, { 
        type: 'HEALTH_CHECK_FAILED',
        lastHealthCheck: this.lastHealthCheck.toISOString()
      });
      return false;
    }
  }

  // Get database instance with health check
  async getDatabase(): Promise<NeonDatabase<typeof schema>> {
    if (!this.isHealthy) {
      // Try to reconnect
      const isHealthy = await this.checkHealth();
      if (!isHealthy) {
        throw new DatabaseConnectionError('Database is not healthy');
      }
    }
    return this.db;
  }

  // Execute query with retry logic and monitoring
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    tableName: string = 'unknown'
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetryAttempts; attempt++) {
      try {
        const start = Date.now();
        const result = await operation();
        const duration = Date.now() - start;
        
        logDatabaseOperation(operationName, tableName, duration, true);
        
        // Reset attempts on success
        this.connectionAttempts = 0;
        
        return result;
      } catch (error) {
        lastError = error as Error;
        this.connectionAttempts++;
        
        const duration = Date.now();
        logDatabaseOperation(operationName, tableName, duration, false, lastError);
        
        // Check if it's a connection error that should be retried
        if (this.shouldRetry(lastError, attempt)) {
          const delay = this.calculateRetryDelay(attempt);
          logWarn(`Database operation failed, retrying in ${delay}ms`, {
            operation: operationName,
            table: tableName,
            attempt,
            maxAttempts: this.maxRetryAttempts,
            error: lastError.message
          });
          
          await this.sleep(delay);
          continue;
        }
        
        // Don't retry for these errors
        break;
      }
    }
    
    throw lastError!;
  }

  // Determine if error should be retried
  private shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.maxRetryAttempts) {
      return false;
    }

    // Retry on connection errors
    const retryableErrors = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
      'connection terminated unexpectedly'
    ];

    return retryableErrors.some(errorCode => 
      error.message.includes(errorCode) || 
      (error as any).code === errorCode
    );
  }

  // Calculate exponential backoff delay
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  // Sleep utility
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Transaction wrapper with proper error handling
  async withTransaction<T>(
    operation: (tx: NeonDatabase<typeof schema>) => Promise<T>
  ): Promise<T> {
    const db = await this.getDatabase();
    
    return this.executeWithRetry(async () => {
      return await db.transaction(async (tx) => {
        try {
          const result = await operation(tx);
          logInfo('Transaction completed successfully');
          return result;
        } catch (error) {
          logError(error as Error, { 
            type: 'TRANSACTION_FAILED',
            operation: 'database_transaction'
          });
          throw error;
        }
      });
    }, 'TRANSACTION', 'multiple');
  }

  // Get connection pool statistics
  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      isHealthy: this.isHealthy,
      lastHealthCheck: this.lastHealthCheck,
      connectionAttempts: this.connectionAttempts
    };
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    try {
      logInfo('Shutting down database connections...');
      await this.pool.end();
      logInfo('Database connections closed successfully');
    } catch (error) {
      logError(error as Error, { type: 'DATABASE_SHUTDOWN_ERROR' });
      throw error;
    }
  }

  // Get raw pool for direct access if needed
  getPool(): Pool {
    return this.pool;
  }
}

// Create singleton instance
export const dbManager = new DatabaseManager();

// Export convenience methods
export const db = dbManager.getDatabase();
export const withTransaction = (operation: (tx: NeonDatabase<typeof schema>) => Promise<any>) => 
  dbManager.withTransaction(operation);
export const executeWithRetry = (operation: () => Promise<any>, operationName: string, tableName?: string) =>
  dbManager.executeWithRetry(operation, operationName, tableName);

// Health check endpoint
export const getDatabaseHealth = () => ({
  healthy: dbManager.getPoolStats().isHealthy,
  stats: dbManager.getPoolStats(),
  timestamp: new Date().toISOString()
});

// Export the manager for advanced usage
export { dbManager };

// Handle process termination
process.on('SIGINT', async () => {
  await dbManager.shutdown();
});

process.on('SIGTERM', async () => {
  await dbManager.shutdown();
});