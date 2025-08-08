import { EventEmitter } from 'events';
import { logInfo, logError, logWarn } from './logger';
import { cacheManager } from './cache-manager';
import { superDb } from './super-database';
import { securityFortress } from './security-fortress';

interface AlertConfig {
  enabled: boolean;
  threshold: number;
  cooldown: number; // milliseconds
  severity: 'info' | 'warning' | 'critical';
  channels: ('console' | 'email' | 'sms' | 'webhook')[];
}

interface MetricPoint {
  timestamp: number;
  value: number;
  tags?: { [key: string]: string };
}

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
}

interface SystemMetrics {
  // System health
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  loadAverage: number[];
  
  // Application metrics
  activeConnections: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  
  // Database metrics
  dbConnections: number;
  queryLatency: number;
  slowQueries: number;
  
  // Security metrics
  threatLevel: number;
  blockedRequests: number;
  suspiciousActivity: number;
  
  // Business metrics
  transactionsPerMinute: number;
  revenue: number;
  activeUsers: number;
  businessSignups: number;
}

class SuperMonitoring extends EventEmitter {
  private metrics: Map<string, MetricPoint[]> = new Map();
  private alerts: Alert[] = [];
  private alertConfigs: Map<string, AlertConfig> = new Map();
  private lastAlerts: Map<string, number> = new Map();
  private monitoringInterval: NodeJS.Timeout;
  private isActive = false;

  constructor() {
    super();
    this.setupDefaultAlerts();
    this.startMonitoring();
  }

  private setupDefaultAlerts(): void {
    // System alerts
    this.alertConfigs.set('high_cpu', {
      enabled: true,
      threshold: 80,
      cooldown: 300000, // 5 minutes
      severity: 'warning',
      channels: ['console', 'webhook']
    });

    this.alertConfigs.set('high_memory', {
      enabled: true,
      threshold: 85,
      cooldown: 300000,
      severity: 'warning',
      channels: ['console', 'webhook']
    });

    this.alertConfigs.set('high_error_rate', {
      enabled: true,
      threshold: 5, // 5% error rate
      cooldown: 180000, // 3 minutes
      severity: 'critical',
      channels: ['console', 'email', 'webhook']
    });

    this.alertConfigs.set('slow_response_time', {
      enabled: true,
      threshold: 2000, // 2 seconds
      cooldown: 600000, // 10 minutes
      severity: 'warning',
      channels: ['console']
    });

    this.alertConfigs.set('database_slow_queries', {
      enabled: true,
      threshold: 10, // 10 slow queries per minute
      cooldown: 300000,
      severity: 'warning',
      channels: ['console', 'webhook']
    });

    this.alertConfigs.set('security_threat', {
      enabled: true,
      threshold: 50, // High threat level
      cooldown: 60000, // 1 minute
      severity: 'critical',
      channels: ['console', 'email', 'sms', 'webhook']
    });

    logInfo('Default alert configurations loaded', {
      totalAlerts: this.alertConfigs.size
    });
  }

  private startMonitoring(): void {
    this.isActive = true;
    
    // Collect metrics every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Analyze metrics every minute
    setInterval(() => {
      this.analyzeMetrics();
    }, 60000);

    // Cleanup old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000);

    logInfo('Super monitoring started', { interval: '30s' });
  }

  private async collectMetrics(): Promise<void> {
    try {
      const timestamp = Date.now();
      
      // System metrics
      const systemMetrics = await this.getSystemMetrics();
      
      // Application metrics
      const appMetrics = await this.getApplicationMetrics();
      
      // Database metrics
      const dbMetrics = await this.getDatabaseMetrics();
      
      // Security metrics
      const securityMetrics = await this.getSecurityMetrics();
      
      // Business metrics
      const businessMetrics = await this.getBusinessMetrics();

      // Store all metrics
      const allMetrics = {
        ...systemMetrics,
        ...appMetrics,
        ...dbMetrics,
        ...securityMetrics,
        ...businessMetrics
      };

      // Store each metric
      Object.entries(allMetrics).forEach(([key, value]) => {
        this.recordMetric(key, value, timestamp);
      });

      // Store aggregated metrics in cache for real-time dashboard
      await cacheManager.set('current_metrics', allMetrics, 60000);

      this.emit('metricsCollected', allMetrics);

    } catch (error) {
      logError(error as Error, { context: 'Metrics collection' });
    }
  }

  private async getSystemMetrics(): Promise<Partial<SystemMetrics>> {
    const os = await import('os');
    const process = await import('process');

    return {
      cpuUsage: await this.getCPUUsage(),
      memoryUsage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
      loadAverage: os.loadavg()
    };
  }

  private async getCPUUsage(): Promise<number> {
    const startUsage = process.cpuUsage();
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = endUsage.user + endUsage.system;
        const percentage = (totalUsage / 1000000) * 100; // Convert to percentage
        resolve(Math.min(percentage, 100));
      }, 100);
    });
  }

  private async getApplicationMetrics(): Promise<Partial<SystemMetrics>> {
    const responseTimeMetrics = await cacheManager.get('response_times') as number[] || [];
    const errorMetrics = await cacheManager.get('error_metrics') || { total: 0, errors: 0 };
    
    const avgResponseTime = responseTimeMetrics.length > 0 
      ? responseTimeMetrics.reduce((sum, time) => sum + time, 0) / responseTimeMetrics.length 
      : 0;

    const errorRate = errorMetrics.total > 0 
      ? (errorMetrics.errors / errorMetrics.total) * 100 
      : 0;

    return {
      averageResponseTime: avgResponseTime,
      errorRate: errorRate,
      requestsPerSecond: await this.calculateRequestsPerSecond()
    };
  }

  private async calculateRequestsPerSecond(): Promise<number> {
    const requestMetrics = await cacheManager.get('request_metrics') || [];
    const oneMinuteAgo = Date.now() - 60000;
    
    const recentRequests = requestMetrics.filter((timestamp: number) => timestamp > oneMinuteAgo);
    return recentRequests.length / 60; // Requests per second
  }

  private async getDatabaseMetrics(): Promise<Partial<SystemMetrics>> {
    try {
      const dbHealth = await superDb.getHealthStatus();
      const slowQueries = superDb.getSlowQueries(100); // > 100ms
      
      return {
        queryLatency: dbHealth.avgQueryTime,
        slowQueries: slowQueries.length,
        dbConnections: dbHealth.connectionCount
      };
    } catch (error) {
      return {
        queryLatency: 0,
        slowQueries: 0,
        dbConnections: 0
      };
    }
  }

  private async getSecurityMetrics(): Promise<Partial<SystemMetrics>> {
    const securityStats = securityFortress.getSecurityStats();
    
    // Calculate threat level based on recent security events
    const threatLevel = Math.min(
      securityStats.suspiciousIPs * 5 + 
      securityStats.blockedIPs * 10 + 
      securityStats.recentEvents * 2,
      100
    );

    return {
      threatLevel,
      blockedRequests: securityStats.blockedIPs,
      suspiciousActivity: securityStats.suspiciousIPs
    };
  }

  private async getBusinessMetrics(): Promise<Partial<SystemMetrics>> {
    try {
      // Get recent transactions
      const recentTransactions = await superDb.execute(`
        SELECT COUNT(*) as count, SUM(amount) as revenue
        FROM transactions 
        WHERE created_at >= datetime('now', '-1 hour')
      `);

      // Get active users (last 24 hours)
      const activeUsers = await superDb.execute(`
        SELECT COUNT(DISTINCT customer_id) as count
        FROM transactions 
        WHERE created_at >= datetime('now', '-24 hours')
      `);

      // Get business signups (last 24 hours)
      const businessSignups = await superDb.execute(`
        SELECT COUNT(*) as count
        FROM businesses 
        WHERE created_at >= datetime('now', '-24 hours')
      `);

      return {
        transactionsPerMinute: recentTransactions[0]?.count / 60 || 0,
        revenue: recentTransactions[0]?.revenue || 0,
        activeUsers: activeUsers[0]?.count || 0,
        businessSignups: businessSignups[0]?.count || 0
      };
    } catch (error) {
      return {
        transactionsPerMinute: 0,
        revenue: 0,
        activeUsers: 0,
        businessSignups: 0
      };
    }
  }

  private recordMetric(name: string, value: number, timestamp: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricPoints = this.metrics.get(name)!;
    metricPoints.push({ timestamp, value });

    // Keep only last 24 hours of data
    const oneDayAgo = timestamp - 24 * 60 * 60 * 1000;
    this.metrics.set(name, metricPoints.filter(point => point.timestamp > oneDayAgo));
  }

  private analyzeMetrics(): void {
    const currentMetrics = this.getCurrentMetrics();
    
    if (!currentMetrics) return;

    // Check each alert condition
    this.alertConfigs.forEach((config, alertType) => {
      if (!config.enabled) return;

      const shouldAlert = this.checkAlertCondition(alertType, currentMetrics, config);
      
      if (shouldAlert) {
        this.triggerAlert(alertType, currentMetrics, config);
      }
    });
  }

  private getCurrentMetrics(): SystemMetrics | null {
    const latest: any = {};
    
    this.metrics.forEach((points, name) => {
      if (points.length > 0) {
        latest[name] = points[points.length - 1].value;
      }
    });

    return Object.keys(latest).length > 0 ? latest : null;
  }

  private checkAlertCondition(alertType: string, metrics: SystemMetrics, config: AlertConfig): boolean {
    // Check cooldown
    const lastAlert = this.lastAlerts.get(alertType);
    if (lastAlert && Date.now() - lastAlert < config.cooldown) {
      return false;
    }

    // Check specific conditions
    switch (alertType) {
      case 'high_cpu':
        return metrics.cpuUsage > config.threshold;
      
      case 'high_memory':
        return metrics.memoryUsage > config.threshold;
      
      case 'high_error_rate':
        return metrics.errorRate > config.threshold;
      
      case 'slow_response_time':
        return metrics.averageResponseTime > config.threshold;
      
      case 'database_slow_queries':
        return metrics.slowQueries > config.threshold;
      
      case 'security_threat':
        return metrics.threatLevel > config.threshold;
      
      default:
        return false;
    }
  }

  private triggerAlert(alertType: string, metrics: SystemMetrics, config: AlertConfig): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: alertType,
      message: this.generateAlertMessage(alertType, metrics),
      severity: config.severity,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false
    };

    this.alerts.push(alert);
    this.lastAlerts.set(alertType, Date.now());

    // Send to configured channels
    config.channels.forEach(channel => {
      this.sendAlert(alert, channel);
    });

    // Store in cache for admin dashboard
    cacheManager.set('recent_alerts', this.getRecentAlerts(), 3600000);

    this.emit('alert', alert);

    logWarn('Alert triggered', {
      type: alertType,
      severity: config.severity,
      message: alert.message
    });
  }

  private generateAlertMessage(alertType: string, metrics: SystemMetrics): string {
    switch (alertType) {
      case 'high_cpu':
        return `High CPU usage detected: ${metrics.cpuUsage.toFixed(1)}%`;
      
      case 'high_memory':
        return `High memory usage detected: ${metrics.memoryUsage.toFixed(1)}%`;
      
      case 'high_error_rate':
        return `High error rate detected: ${metrics.errorRate.toFixed(1)}%`;
      
      case 'slow_response_time':
        return `Slow response time detected: ${metrics.averageResponseTime.toFixed(0)}ms`;
      
      case 'database_slow_queries':
        return `Database performance degraded: ${metrics.slowQueries} slow queries`;
      
      case 'security_threat':
        return `Security threat level elevated: ${metrics.threatLevel}/100`;
      
      default:
        return `Alert triggered for ${alertType}`;
    }
  }

  private sendAlert(alert: Alert, channel: string): void {
    switch (channel) {
      case 'console':
        this.sendConsoleAlert(alert);
        break;
      
      case 'email':
        this.sendEmailAlert(alert);
        break;
      
      case 'sms':
        this.sendSMSAlert(alert);
        break;
      
      case 'webhook':
        this.sendWebhookAlert(alert);
        break;
    }
  }

  private sendConsoleAlert(alert: Alert): void {
    const emoji = {
      'info': 'ℹ️',
      'warning': '⚠️',
      'critical': '🚨'
    }[alert.severity];
    
    console.log(`${emoji} [${alert.severity.toUpperCase()}] ${alert.message}`);
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    // Implement email sending logic
    logInfo('Email alert sent', { alertId: alert.id, type: alert.type });
  }

  private async sendSMSAlert(alert: Alert): Promise<void> {
    // Implement SMS sending logic
    logInfo('SMS alert sent', { alertId: alert.id, type: alert.type });
  }

  private async sendWebhookAlert(alert: Alert): Promise<void> {
    try {
      const webhookUrl = process.env.ALERT_WEBHOOK_URL;
      if (!webhookUrl) return;

      const payload = {
        alert: alert,
        timestamp: new Date().toISOString(),
        service: 'baartal-backend'
      };

      // Here you would send to your webhook endpoint
      logInfo('Webhook alert sent', { alertId: alert.id, type: alert.type });
    } catch (error) {
      logError(error as Error, { context: 'Webhook alert sending' });
    }
  }

  private cleanupOldMetrics(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    this.metrics.forEach((points, name) => {
      const filtered = points.filter(point => point.timestamp > oneDayAgo);
      this.metrics.set(name, filtered);
    });

    // Clean up old alerts (keep last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-50);
    }

    logInfo('Metrics cleanup completed', {
      totalMetrics: this.metrics.size,
      totalAlerts: this.alerts.length
    });
  }

  // Public API methods
  getMetrics(name: string, timeRange?: { start: number; end: number }): MetricPoint[] {
    const points = this.metrics.get(name) || [];
    
    if (!timeRange) return points;
    
    return points.filter(point => 
      point.timestamp >= timeRange.start && point.timestamp <= timeRange.end
    );
  }

  getAllMetrics(): { [key: string]: MetricPoint[] } {
    const result: { [key: string]: MetricPoint[] } = {};
    this.metrics.forEach((points, name) => {
      result[name] = points;
    });
    return result;
  }

  getRecentAlerts(limit: number = 50): Alert[] {
    return this.alerts
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  updateAlertConfig(alertType: string, config: Partial<AlertConfig>): void {
    const current = this.alertConfigs.get(alertType);
    if (current) {
      this.alertConfigs.set(alertType, { ...current, ...config });
      logInfo('Alert configuration updated', { alertType, config });
    }
  }

  getSystemStatus(): {
    status: 'healthy' | 'degraded' | 'critical';
    summary: string;
    metrics: any;
    alerts: number;
  } {
    const currentMetrics = this.getCurrentMetrics();
    const unacknowledgedAlerts = this.alerts.filter(a => !a.acknowledged).length;
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical' && !a.resolved).length;

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    let summary = 'All systems operational';

    if (criticalAlerts > 0) {
      status = 'critical';
      summary = `${criticalAlerts} critical alert${criticalAlerts > 1 ? 's' : ''} active`;
    } else if (unacknowledgedAlerts > 0) {
      status = 'degraded';
      summary = `${unacknowledgedAlerts} alert${unacknowledgedAlerts > 1 ? 's' : ''} require attention`;
    }

    return {
      status,
      summary,
      metrics: currentMetrics,
      alerts: unacknowledgedAlerts
    };
  }

  stop(): void {
    this.isActive = false;
    clearInterval(this.monitoringInterval);
    logInfo('Super monitoring stopped');
  }
}

// Create monitoring instance
export const superMonitoring = new SuperMonitoring();

// Middleware to track requests
export function monitoringMiddleware(req: any, res: any, next: any): void {
  const start = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;

    // Track response times
    const responseTimes = await cacheManager.get('response_times') || [];
    responseTimes.push(duration);
    if (responseTimes.length > 1000) responseTimes.shift();
    await cacheManager.set('response_times', responseTimes, 300000);

    // Track error metrics
    const errorMetrics = await cacheManager.get('error_metrics') || { total: 0, errors: 0 };
    errorMetrics.total++;
    if (isError) errorMetrics.errors++;
    await cacheManager.set('error_metrics', errorMetrics, 300000);

    // Track request timestamps
    const requestMetrics = await cacheManager.get('request_metrics') || [];
    requestMetrics.push(Date.now());
    if (requestMetrics.length > 1000) requestMetrics.shift();
    await cacheManager.set('request_metrics', requestMetrics, 300000);
  });

  next();
}

export default superMonitoring;