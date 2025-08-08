import { Router } from 'express';
import { authenticateToken } from './enhanced-auth';
import { validate } from './validation';
import { z } from 'zod';
import { logInfo, logError } from './logger';
import { cacheManager, getCacheHealth } from './cache-manager';
import { 
  backupManager, 
  createBackupNow, 
  restoreFromBackupNow 
} from './backup-manager';
import { checkDatabaseHealth, performMaintenance, getPerformanceMetrics } from './db-local';

const router = Router();

// Admin middleware - require admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Apply auth and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// === CACHE MANAGEMENT ===

// Get cache statistics
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = cacheManager.getStats();
    const health = await getCacheHealth();
    
    res.json({
      stats,
      health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError(error as Error, { context: 'Cache stats retrieval' });
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

// Clear cache
router.post('/cache/clear', async (req, res) => {
  try {
    await cacheManager.clear();
    
    logInfo('Cache cleared by admin', { 
      adminId: req.user.id, 
      adminEmail: req.user.email 
    });
    
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    logError(error as Error, { context: 'Cache clear' });
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Get cached keys with pattern
router.get('/cache/keys', async (req, res) => {
  try {
    const pattern = req.query.pattern as string;
    const keys = await cacheManager.keys(pattern);
    
    res.json({
      keys: keys.slice(0, 100), // Limit to first 100
      total: keys.length,
      pattern: pattern || '*'
    });
  } catch (error) {
    logError(error as Error, { context: 'Cache keys retrieval' });
    res.status(500).json({ error: 'Failed to get cache keys' });
  }
});

// Get specific cache value
router.get('/cache/value/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await cacheManager.get(key);
    const ttl = await cacheManager.ttl(key);
    
    res.json({
      key,
      value,
      ttl,
      exists: value !== null
    });
  } catch (error) {
    logError(error as Error, { context: 'Cache value retrieval' });
    res.status(500).json({ error: 'Failed to get cache value' });
  }
});

// Delete cache key
router.delete('/cache/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const deleted = await cacheManager.del(key);
    
    if (deleted) {
      logInfo('Cache key deleted by admin', { 
        key, 
        adminId: req.user.id 
      });
    }
    
    res.json({ success: deleted, key });
  } catch (error) {
    logError(error as Error, { context: 'Cache key deletion' });
    res.status(500).json({ error: 'Failed to delete cache key' });
  }
});

// === BACKUP MANAGEMENT ===

// List all backups
router.get('/backups', async (req, res) => {
  try {
    const backups = await backupManager.listBackups();
    res.json({ backups });
  } catch (error) {
    logError(error as Error, { context: 'Backup listing' });
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

// Create backup
const createBackupSchema = z.object({
  type: z.enum(['full', 'incremental', 'schema']).default('full')
});

router.post('/backups', validate({ body: createBackupSchema }), async (req, res) => {
  try {
    const { type } = req.body;
    const filename = await createBackupNow(type);
    
    if (filename) {
      logInfo('Backup created by admin', { 
        type, 
        filename, 
        adminId: req.user.id 
      });
      
      res.json({ 
        success: true, 
        filename, 
        type,
        message: `${type} backup created successfully` 
      });
    } else {
      res.status(500).json({ error: 'Backup creation failed' });
    }
  } catch (error) {
    logError(error as Error, { context: 'Backup creation' });
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Verify backup
router.post('/backups/:filename/verify', async (req, res) => {
  try {
    const { filename } = req.params;
    const isValid = await backupManager.verifyBackup(filename);
    
    res.json({ 
      filename, 
      isValid, 
      message: isValid ? 'Backup is valid' : 'Backup is corrupted' 
    });
  } catch (error) {
    logError(error as Error, { context: 'Backup verification' });
    res.status(500).json({ error: 'Failed to verify backup' });
  }
});

// Restore backup
const restoreBackupSchema = z.object({
  tables: z.array(z.string()).optional(),
  dataOnly: z.boolean().default(false),
  schemaOnly: z.boolean().default(false),
  dryRun: z.boolean().default(false)
});

router.post('/backups/:filename/restore', validate({ body: restoreBackupSchema }), async (req, res) => {
  try {
    const { filename } = req.params;
    const options = req.body;
    
    const success = await restoreFromBackupNow(filename, options);
    
    if (success) {
      logInfo('Backup restored by admin', { 
        filename, 
        options, 
        adminId: req.user.id 
      });
      
      res.json({ 
        success: true, 
        message: options.dryRun ? 'Dry run completed' : 'Backup restored successfully' 
      });
    } else {
      res.status(500).json({ error: 'Backup restoration failed' });
    }
  } catch (error) {
    logError(error as Error, { context: 'Backup restoration' });
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// Delete backup
router.delete('/backups/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const success = await backupManager.deleteBackup(filename);
    
    if (success) {
      logInfo('Backup deleted by admin', { 
        filename, 
        adminId: req.user.id 
      });
    }
    
    res.json({ success, filename });
  } catch (error) {
    logError(error as Error, { context: 'Backup deletion' });
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

// === DATABASE MANAGEMENT ===

// Get database health and statistics
router.get('/database/health', async (req, res) => {
  try {
    const health = checkDatabaseHealth();
    const performance = getPerformanceMetrics();
    
    res.json({
      health,
      performance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError(error as Error, { context: 'Database health check' });
    res.status(500).json({ error: 'Failed to get database health' });
  }
});

// Perform database maintenance
router.post('/database/maintenance', async (req, res) => {
  try {
    const success = performMaintenance();
    
    if (success) {
      logInfo('Database maintenance performed by admin', { 
        adminId: req.user.id 
      });
    }
    
    res.json({ 
      success, 
      message: success ? 'Database maintenance completed' : 'Maintenance failed' 
    });
  } catch (error) {
    logError(error as Error, { context: 'Database maintenance' });
    res.status(500).json({ error: 'Failed to perform maintenance' });
  }
});

// === SYSTEM MONITORING ===

// Get comprehensive system stats
router.get('/system/stats', async (req, res) => {
  try {
    const [dbHealth, cacheHealth] = await Promise.all([
      checkDatabaseHealth(),
      getCacheHealth()
    ]);
    
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    const performance = getPerformanceMetrics();
    
    res.json({
      healthy: dbHealth.healthy && cacheHealth.healthy,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      memory: {
        rss: Math.round(memory.rss / 1024 / 1024),
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
        external: Math.round(memory.external / 1024 / 1024)
      },
      database: dbHealth,
      cache: cacheHealth,
      performance,
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    logError(error as Error, { context: 'System stats retrieval' });
    res.status(500).json({ error: 'Failed to get system stats' });
  }
});

// Get recent logs
router.get('/logs', async (req, res) => {
  try {
    const level = req.query.level as string || 'info';
    const limit = parseInt(req.query.limit as string) || 100;
    
    // This would typically read from log files or database
    // For now, return placeholder data
    res.json({
      logs: [],
      level,
      limit,
      message: 'Log retrieval not implemented yet'
    });
  } catch (error) {
    logError(error as Error, { context: 'Log retrieval' });
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

// === ANALYTICS ===

// Get performance analytics
router.get('/analytics/performance', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const performance = getPerformanceMetrics();
    
    res.json({
      performance,
      period: `${days} days`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError(error as Error, { context: 'Performance analytics' });
    res.status(500).json({ error: 'Failed to get performance analytics' });
  }
});

// Get usage analytics
router.get('/analytics/usage', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    
    // This would query the analytics_events table
    // For now, return placeholder data
    res.json({
      totalRequests: 0,
      uniqueUsers: 0,
      errorRate: 0,
      averageResponseTime: 0,
      period: `${days} days`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError(error as Error, { context: 'Usage analytics' });
    res.status(500).json({ error: 'Failed to get usage analytics' });
  }
});

// === MAINTENANCE ACTIONS ===

// Force garbage collection
router.post('/system/gc', async (req, res) => {
  try {
    if (global.gc) {
      const memBefore = process.memoryUsage();
      global.gc();
      const memAfter = process.memoryUsage();
      
      logInfo('Garbage collection forced by admin', { 
        adminId: req.user.id,
        memoryFreed: memBefore.heapUsed - memAfter.heapUsed
      });
      
      res.json({
        success: true,
        message: 'Garbage collection completed',
        memoryBefore: memBefore,
        memoryAfter: memAfter,
        freed: memBefore.heapUsed - memAfter.heapUsed
      });
    } else {
      res.status(400).json({ 
        error: 'Garbage collection not available' 
      });
    }
  } catch (error) {
    logError(error as Error, { context: 'Garbage collection' });
    res.status(500).json({ error: 'Failed to run garbage collection' });
  }
});

// Reset performance metrics
router.post('/system/reset-metrics', async (req, res) => {
  try {
    const { resetPerformanceMetrics } = await import('./db-local');
    resetPerformanceMetrics();
    cacheManager.resetStats();
    
    logInfo('Performance metrics reset by admin', { 
      adminId: req.user.id 
    });
    
    res.json({ 
      success: true, 
      message: 'Performance metrics reset' 
    });
  } catch (error) {
    logError(error as Error, { context: 'Metrics reset' });
    res.status(500).json({ error: 'Failed to reset metrics' });
  }
});

export default router;