import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { logError, logInfo, logDatabaseOperation, logWarn } from './logger';
import { DatabaseConnectionError } from './error-handler';

neonConfig.webSocketConstructor = ws;

// Database configuration
const DB_CONFIG = {
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  min: parseInt(process.env.DB_POOL_MIN || '5'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
};

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

class DatabaseManager {
  private pool: Pool;
  private db: any;
  private isHealthy: boolean = false;
  private lastHealthCheck: Date = new Date();
  private connectionAttempts: number = 0;
  private maxRetryAttempts: number = 5;
  private retryDelay: number = 1000;

  constructor() {
    this.pool = new Pool(DB_CONFIG);
    this.db = drizzle({ client: this.pool, schema });
    this.initializeHealthChecks();
  }

  private initializeHealthChecks(): void {
    this.checkHealth();
    
    setInterval(() => {
      this.checkHealth();
    }, 30000);

    this.pool.on('connect', () => {
      logInfo('Database connection established');
      this.connectionAttempts = 0;
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

  async checkHealth(): Promise<boolean> {
    try {
      const start = Date.now();
      await this.pool.query('SELECT 1');
      const duration = Date.now() - start;
      
      this.isHealthy = true;
      this.lastHealthCheck = new Date();
      
      logDatabaseOperation('HEALTH_CHECK', 'system', duration, true);
      
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

  async getDatabase(): Promise<any> {
    if (!this.isHealthy) {
      const isHealthy = await this.checkHealth();
      if (!isHealthy) {
        throw new DatabaseConnectionError('Database is not healthy');
      }
    }
    return this.db;
  }

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
        
        this.connectionAttempts = 0;
        
        return result;
      } catch (error) {
        lastError = error as Error;
        this.connectionAttempts++;
        
        const duration = Date.now();
        logDatabaseOperation(operationName, tableName, duration, false, lastError);
        
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
        
        break;
      }
    }
    
    throw lastError!;
  }

  private shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.maxRetryAttempts) {
      return false;
    }

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

  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, 30000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async withTransaction<T>(
    operation: (tx: any) => Promise<T>
  ): Promise<T> {
    const db = await this.getDatabase();
    
    return this.executeWithRetry(async () => {
      return await db.transaction(async (tx: any) => {
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

  getPool(): Pool {
    return this.pool;
  }
}

export const dbManager = new DatabaseManager();

export const db = dbManager.getDatabase();
export const withTransaction = (operation: (tx: any) => Promise<any>) => 
  dbManager.withTransaction(operation);
export const executeWithRetry = (operation: () => Promise<any>, operationName: string, tableName?: string) =>
  dbManager.executeWithRetry(operation, operationName, tableName);

export const getDatabaseHealth = () => ({
  healthy: dbManager.getPoolStats().isHealthy,
  stats: dbManager.getPoolStats(),
  timestamp: new Date().toISOString()
});

export { dbManager };

process.on('SIGINT', async () => {
  await dbManager.shutdown();
});

process.on('SIGTERM', async () => {
  await dbManager.shutdown();
});