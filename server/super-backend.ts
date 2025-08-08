import cluster from 'cluster';
import os from 'os';
import { EventEmitter } from 'events';
import { logInfo, logError, logWarn } from './logger';
import { cacheManager } from './cache-manager';
import { superDb } from './super-database';

interface WorkerConfig {
  maxWorkers: number;
  minWorkers: number;
  cpuThreshold: number;
  memoryThreshold: number;
  restartThreshold: number;
  gracefulTimeout: number;
}

interface WorkerMetrics {
  pid: number;
  cpuUsage: number;
  memoryUsage: number;
  requestCount: number;
  errorCount: number;
  uptime: number;
  lastRestart: number;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  workers: WorkerMetrics[];
  totalRequests: number;
  totalErrors: number;
  avgResponseTime: number;
  cpuLoad: number;
  memoryUsage: number;
  dbHealth: any;
}

class SuperBackend extends EventEmitter {
  private config: WorkerConfig;
  private workers: Map<number, WorkerMetrics> = new Map();
  private systemMetrics: SystemHealth;
  private isShuttingDown = false;
  private monitoringInterval: NodeJS.Timeout;
  private autoScalingInterval: NodeJS.Timeout;
  private healthCheckInterval: NodeJS.Timeout;

  constructor(config: WorkerConfig) {
    super();
    this.config = config;
    this.setupMasterProcess();
  }

  private setupMasterProcess(): void {
    if (cluster.isPrimary) {
      logInfo('Starting Super Backend with clustering...', {
        cpuCount: os.cpus().length,
        config: this.config
      });

      this.initializeWorkers();
      this.setupMonitoring();
      this.setupAutoScaling();
      this.setupHealthChecks();
      this.setupGracefulShutdown();
    }
  }

  private initializeWorkers(): void {
    const numWorkers = Math.min(this.config.maxWorkers, os.cpus().length);
    
    for (let i = 0; i < numWorkers; i++) {
      this.createWorker();
    }

    cluster.on('exit', (worker, code, signal) => {
      logWarn('Worker died', { 
        pid: worker.process.pid, 
        code, 
        signal,
        uptime: Date.now() - (this.workers.get(worker.process.pid!)?.lastRestart || 0)
      });

      this.workers.delete(worker.process.pid!);

      if (!this.isShuttingDown) {
        // Restart worker unless shutting down
        setTimeout(() => this.createWorker(), 1000);
      }
    });

    cluster.on('online', (worker) => {
      logInfo('Worker started', { pid: worker.process.pid });
    });
  }

  private createWorker(): void {
    const worker = cluster.fork();
    
    if (worker.process.pid) {
      this.workers.set(worker.process.pid, {
        pid: worker.process.pid,
        cpuUsage: 0,
        memoryUsage: 0,
        requestCount: 0,
        errorCount: 0,
        uptime: 0,
        lastRestart: Date.now()
      });
    }

    // Listen for worker messages
    worker.on('message', (message) => {
      this.handleWorkerMessage(worker.process.pid!, message);
    });
  }

  private handleWorkerMessage(pid: number, message: any): void {
    const worker = this.workers.get(pid);
    if (!worker) return;

    switch (message.type) {
      case 'metrics':
        Object.assign(worker, message.data);
        break;
      case 'error':
        worker.errorCount++;
        logError(new Error(message.error), { worker: pid });
        break;
      case 'request':
        worker.requestCount++;
        break;
    }
  }

  private setupMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds

    logInfo('System monitoring enabled', { interval: '30s' });
  }

  private async collectSystemMetrics(): Promise<void> {
    try {
      // Collect OS metrics
      const cpuLoad = os.loadavg()[0] / os.cpus().length;
      const memInfo = process.memoryUsage();
      const memoryUsage = (memInfo.heapUsed / memInfo.heapTotal) * 100;

      // Calculate totals
      let totalRequests = 0;
      let totalErrors = 0;
      const workers: WorkerMetrics[] = [];

      for (const worker of this.workers.values()) {
        totalRequests += worker.requestCount;
        totalErrors += worker.errorCount;
        worker.uptime = Date.now() - worker.lastRestart;
        workers.push({ ...worker });
      }

      // Get database health
      const dbHealth = await superDb.getHealthStatus();

      this.systemMetrics = {
        status: this.determineSystemStatus(cpuLoad, memoryUsage, dbHealth),
        workers,
        totalRequests,
        totalErrors,
        avgResponseTime: await this.getAverageResponseTime(),
        cpuLoad,
        memoryUsage,
        dbHealth
      };

      // Store metrics in cache
      await cacheManager.set('system_health', this.systemMetrics, 60000);

      // Emit health status
      this.emit('healthUpdate', this.systemMetrics);

      logInfo('System metrics collected', {
        workers: workers.length,
        cpuLoad: cpuLoad.toFixed(2),
        memoryUsage: memoryUsage.toFixed(2),
        status: this.systemMetrics.status
      });

    } catch (error) {
      logError(error as Error, { context: 'System metrics collection' });
    }
  }

  private determineSystemStatus(cpuLoad: number, memoryUsage: number, dbHealth: any): 'healthy' | 'degraded' | 'critical' {
    if (cpuLoad > 0.9 || memoryUsage > 90 || dbHealth.status === 'critical') {
      return 'critical';
    } else if (cpuLoad > 0.7 || memoryUsage > 70 || dbHealth.status === 'degraded') {
      return 'degraded';
    }
    return 'healthy';
  }

  private async getAverageResponseTime(): Promise<number> {
    try {
      const metrics = await cacheManager.get('response_times') as number[] || [];
      if (metrics.length === 0) return 0;
      
      return metrics.reduce((sum, time) => sum + time, 0) / metrics.length;
    } catch (error) {
      return 0;
    }
  }

  private setupAutoScaling(): void {
    this.autoScalingInterval = setInterval(() => {
      this.performAutoScaling();
    }, 60000); // Every minute

    logInfo('Auto-scaling enabled', { interval: '60s' });
  }

  private performAutoScaling(): void {
    if (!this.systemMetrics) return;

    const { cpuLoad, memoryUsage, workers } = this.systemMetrics;
    const currentWorkers = workers.length;

    // Scale up conditions
    if ((cpuLoad > this.config.cpuThreshold || memoryUsage > this.config.memoryThreshold) 
        && currentWorkers < this.config.maxWorkers) {
      
      logInfo('Scaling up: Adding worker', {
        currentWorkers,
        cpuLoad: cpuLoad.toFixed(2),
        memoryUsage: memoryUsage.toFixed(2)
      });
      
      this.createWorker();
    }

    // Scale down conditions
    else if (cpuLoad < (this.config.cpuThreshold * 0.5) 
             && memoryUsage < (this.config.memoryThreshold * 0.5) 
             && currentWorkers > this.config.minWorkers) {
      
      logInfo('Scaling down: Removing worker', {
        currentWorkers,
        cpuLoad: cpuLoad.toFixed(2),
        memoryUsage: memoryUsage.toFixed(2)
      });
      
      this.removeWorker();
    }

    // Restart unhealthy workers
    this.restartUnhealthyWorkers();
  }

  private removeWorker(): void {
    const workers = Array.from(this.workers.keys());
    if (workers.length <= this.config.minWorkers) return;

    const oldestWorkerPid = workers[0]; // Remove oldest worker
    const worker = cluster.workers[oldestWorkerPid];
    
    if (worker) {
      worker.disconnect();
      setTimeout(() => {
        if (!worker.isDead()) {
          worker.kill('SIGKILL');
        }
      }, this.config.gracefulTimeout);
    }
  }

  private restartUnhealthyWorkers(): void {
    for (const [pid, metrics] of this.workers.entries()) {
      const shouldRestart = (
        metrics.errorCount > this.config.restartThreshold ||
        metrics.memoryUsage > 90 ||
        metrics.uptime > 24 * 60 * 60 * 1000 // 24 hours
      );

      if (shouldRestart) {
        logWarn('Restarting unhealthy worker', { 
          pid, 
          errorCount: metrics.errorCount,
          memoryUsage: metrics.memoryUsage,
          uptime: metrics.uptime
        });

        const worker = cluster.workers[pid];
        if (worker) {
          worker.disconnect();
          setTimeout(() => {
            if (!worker.isDead()) {
              worker.kill('SIGKILL');
            }
          }, this.config.gracefulTimeout);
        }
      }
    }
  }

  private setupHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 15000); // Every 15 seconds

    logInfo('Health checks enabled', { interval: '15s' });
  }

  private async performHealthChecks(): Promise<void> {
    try {
      // Check database connectivity
      const dbHealth = await superDb.getHealthStatus();
      
      // Check cache connectivity
      const cacheHealthy = await this.checkCacheHealth();
      
      // Check worker responsiveness
      const workerHealth = await this.checkWorkerHealth();

      const overallHealth = {
        database: dbHealth.status,
        cache: cacheHealthy ? 'healthy' : 'critical',
        workers: workerHealth,
        timestamp: new Date().toISOString()
      };

      await cacheManager.set('health_checks', overallHealth, 30000);

      if (overallHealth.database === 'critical' || !overallHealth.cache) {
        this.emit('criticalHealth', overallHealth);
      }

    } catch (error) {
      logError(error as Error, { context: 'Health checks' });
    }
  }

  private async checkCacheHealth(): Promise<boolean> {
    try {
      await cacheManager.set('health_test', 'ok', 1000);
      const result = await cacheManager.get('health_test');
      return result === 'ok';
    } catch (error) {
      return false;
    }
  }

  private async checkWorkerHealth(): Promise<string> {
    const totalWorkers = this.workers.size;
    const maxWorkers = this.config.maxWorkers;
    
    if (totalWorkers === 0) return 'critical';
    if (totalWorkers < this.config.minWorkers) return 'degraded';
    
    return 'healthy';
  }

  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      logInfo(`Received ${signal}, starting graceful shutdown...`);
      this.isShuttingDown = true;

      // Clear intervals
      clearInterval(this.monitoringInterval);
      clearInterval(this.autoScalingInterval);
      clearInterval(this.healthCheckInterval);

      // Disconnect all workers
      const workers = Object.values(cluster.workers);
      let disconnectedWorkers = 0;

      workers.forEach((worker) => {
        if (worker) {
          worker.disconnect();
          
          worker.on('disconnect', () => {
            disconnectedWorkers++;
            if (disconnectedWorkers === workers.length) {
              logInfo('All workers disconnected, shutting down master');
              process.exit(0);
            }
          });
        }
      });

      // Force shutdown after timeout
      setTimeout(() => {
        logWarn('Force shutdown after timeout');
        workers.forEach((worker) => {
          if (worker && !worker.isDead()) {
            worker.kill('SIGKILL');
          }
        });
        process.exit(1);
      }, this.config.gracefulTimeout);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  // Circuit breaker for external services
  createCircuitBreaker(name: string, config: {
    threshold: number;
    timeout: number;
    resetTime: number;
  }) {
    return new CircuitBreaker(name, config);
  }

  // Get current system status
  getSystemHealth(): SystemHealth | null {
    return this.systemMetrics || null;
  }

  // Manual worker restart
  async restartAllWorkers(): Promise<void> {
    logInfo('Manual restart of all workers initiated');
    
    const workers = Object.values(cluster.workers);
    for (const worker of workers) {
      if (worker) {
        worker.disconnect();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Worker message broadcasting
  broadcastToWorkers(message: any): void {
    Object.values(cluster.workers).forEach((worker) => {
      if (worker) {
        worker.send(message);
      }
    });
  }
}

// Circuit Breaker implementation
class CircuitBreaker {
  private failures = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private nextAttempt = 0;

  constructor(
    private name: string,
    private config: { threshold: number; timeout: number; resetTime: number }
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
      this.state = 'half-open';
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Circuit breaker timeout')), this.config.timeout)
        )
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    
    if (this.failures >= this.config.threshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.config.resetTime;
      
      logWarn(`Circuit breaker ${this.name} opened`, {
        failures: this.failures,
        nextAttempt: new Date(this.nextAttempt).toISOString()
      });
    }
  }

  getState(): string {
    return this.state;
  }
}

// Request tracking middleware for workers
export function trackRequest(req: any, res: any, next: any): void {
  const start = Date.now();
  
  // Send message to master
  if (process.send) {
    process.send({ type: 'request', timestamp: start });
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Track response times
    cacheManager.get('response_times').then((times: number[] = []) => {
      times.push(duration);
      if (times.length > 1000) times.shift(); // Keep last 1000
      cacheManager.set('response_times', times, 300000); // 5 minutes
    });

    // Send metrics to master
    if (process.send) {
      process.send({
        type: 'metrics',
        data: {
          cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
          memoryUsage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
        }
      });
    }
  });

  next();
}

// Configuration for super backend
const superBackendConfig: WorkerConfig = {
  maxWorkers: Math.min(16, os.cpus().length * 2),
  minWorkers: Math.max(2, Math.ceil(os.cpus().length / 2)),
  cpuThreshold: 0.7, // 70% CPU
  memoryThreshold: 70, // 70% memory
  restartThreshold: 50, // 50 errors before restart
  gracefulTimeout: 30000 // 30 seconds
};

export const superBackend = new SuperBackend(superBackendConfig);
export { CircuitBreaker };
export default superBackend;