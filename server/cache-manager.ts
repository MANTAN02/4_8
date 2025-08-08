import { logInfo, logError, logWarn } from './logger';

// Cache statistics tracking
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  totalMemory: number;
  entryCount: number;
}

interface CacheEntry<T = any> {
  value: T;
  expiresAt?: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

interface CacheOptions {
  maxSize?: number; // Maximum number of entries
  maxMemory?: number; // Maximum memory in bytes
  defaultTTL?: number; // Default TTL in milliseconds
  cleanupInterval?: number; // Cleanup interval in milliseconds
  enableStats?: boolean;
}

class AdvancedCacheManager {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    totalMemory: 0,
    entryCount: 0
  };
  
  private options: Required<CacheOptions>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: options.maxSize || 10000,
      maxMemory: options.maxMemory || 100 * 1024 * 1024, // 100MB
      defaultTTL: options.defaultTTL || 60 * 60 * 1000, // 1 hour
      cleanupInterval: options.cleanupInterval || 5 * 60 * 1000, // 5 minutes
      enableStats: options.enableStats !== false
    };

    this.startCleanupTimer();
    logInfo('Advanced Cache Manager initialized', this.options);
  }

  // Basic cache operations
  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      if (this.options.enableStats) this.stats.misses++;
      return null;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.updateMemoryStats();
      if (this.options.enableStats) this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    if (this.options.enableStats) this.stats.hits++;
    return entry.value;
  }

  async set<T = any>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const expiresAt = ttl ? Date.now() + ttl : 
                      this.options.defaultTTL ? Date.now() + this.options.defaultTTL : 
                      undefined;

      const size = this.calculateSize(value);
      const entry: CacheEntry<T> = {
        value,
        expiresAt,
        accessCount: 0,
        lastAccessed: Date.now(),
        size
      };

      // Check if we need to evict entries
      await this.ensureCapacity(size);

      this.cache.set(key, entry);
      this.updateMemoryStats();
      
      if (this.options.enableStats) this.stats.sets++;
      return true;
    } catch (error) {
      logError(error as Error, { context: 'Cache set operation', key });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateMemoryStats();
      if (this.options.enableStats) this.stats.deletes++;
    }
    return deleted;
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.updateMemoryStats();
      return false;
    }
    
    return true;
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    entry.expiresAt = Date.now() + ttl;
    return true;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.cache.get(key);
    if (!entry || !entry.expiresAt) return -1;
    
    const remaining = entry.expiresAt - Date.now();
    return remaining > 0 ? Math.floor(remaining / 1000) : -2;
  }

  // Advanced operations
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  async mset<T = any>(entries: Array<[string, T, number?]>): Promise<boolean> {
    try {
      await Promise.all(entries.map(([key, value, ttl]) => this.set(key, value, ttl)));
      return true;
    } catch (error) {
      logError(error as Error, { context: 'Cache mset operation' });
      return false;
    }
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());
    
    if (!pattern) return allKeys;
    
    // Simple glob pattern matching
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    return allKeys.filter(key => regex.test(key));
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.totalMemory = 0;
    this.stats.entryCount = 0;
    logInfo('Cache cleared');
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  // Cache-specific methods for common use cases
  async cacheFunction<T extends any[], R>(
    key: string,
    fn: (...args: T) => Promise<R> | R,
    ttl?: number,
    ...args: T
  ): Promise<R> {
    const cached = await this.get<R>(key);
    if (cached !== null) return cached;

    const result = await fn(...args);
    await this.set(key, result, ttl);
    return result;
  }

  async cacheQuery<T = any>(
    query: string,
    params: any[],
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const key = `query:${this.hashQuery(query, params)}`;
    return this.cacheFunction(key, queryFn, ttl);
  }

  async cacheUser(userId: string, userData: any, ttl?: number): Promise<void> {
    await this.set(`user:${userId}`, userData, ttl);
  }

  async getCachedUser(userId: string): Promise<any> {
    return this.get(`user:${userId}`);
  }

  async cacheBusiness(businessId: string, businessData: any, ttl?: number): Promise<void> {
    await this.set(`business:${businessId}`, businessData, ttl);
  }

  async getCachedBusiness(businessId: string): Promise<any> {
    return this.get(`business:${businessId}`);
  }

  async cacheBusinessList(filters: any, businessList: any[], ttl?: number): Promise<void> {
    const key = `businesses:${this.hashObject(filters)}`;
    await this.set(key, businessList, ttl);
  }

  async getCachedBusinessList(filters: any): Promise<any[] | null> {
    const key = `businesses:${this.hashObject(filters)}`;
    return this.get(key);
  }

  // Statistics and monitoring
  getStats(): CacheStats & { hitRate: number; memoryUsageMB: number } {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsageMB: Math.round((this.stats.totalMemory / 1024 / 1024) * 100) / 100
    };
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      totalMemory: this.stats.totalMemory,
      entryCount: this.stats.entryCount
    };
    logInfo('Cache statistics reset');
  }

  // Memory management
  private async ensureCapacity(newEntrySize: number): Promise<void> {
    // Check entry count limit
    if (this.cache.size >= this.options.maxSize) {
      await this.evictLeastRecentlyUsed();
    }

    // Check memory limit
    while (this.stats.totalMemory + newEntrySize > this.options.maxMemory) {
      await this.evictLeastRecentlyUsed();
    }
  }

  private async evictLeastRecentlyUsed(): Promise<void> {
    if (this.cache.size === 0) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      if (this.options.enableStats) this.stats.evictions++;
      this.updateMemoryStats();
    }
  }

  private calculateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimation (UTF-16)
    } catch {
      return 1000; // Default size for non-serializable objects
    }
  }

  private updateMemoryStats(): void {
    let totalMemory = 0;
    for (const entry of this.cache.values()) {
      totalMemory += entry.size;
    }
    this.stats.totalMemory = totalMemory;
    this.stats.entryCount = this.cache.size;
  }

  private hashQuery(query: string, params: any[]): string {
    return Buffer.from(query + JSON.stringify(params)).toString('base64').slice(0, 32);
  }

  private hashObject(obj: any): string {
    return Buffer.from(JSON.stringify(obj)).toString('base64').slice(0, 16);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.updateMemoryStats();
      logInfo(`Cache cleanup: removed ${expiredCount} expired entries`);
    }
  }

  // Shutdown
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
    logInfo('Cache manager destroyed');
  }
}

// Global cache instance
export const cacheManager = new AdvancedCacheManager({
  maxSize: 50000,
  maxMemory: 256 * 1024 * 1024, // 256MB
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  cleanupInterval: 2 * 60 * 1000, // 2 minutes
  enableStats: true
});

// Cache decorators for common patterns
export function cached(ttl?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const key = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      
      return cacheManager.cacheFunction(
        key,
        method.bind(this),
        ttl,
        ...args
      );
    };
  };
}

// Utility functions
export async function warmupCache(): Promise<void> {
  logInfo('Starting cache warmup...');
  
  try {
    // Pre-cache frequently accessed data
    // This would typically include:
    // - Active businesses
    // - User sessions
    // - Common query results
    
    logInfo('Cache warmup completed');
  } catch (error) {
    logError(error as Error, { context: 'Cache warmup' });
  }
}

export async function getCacheHealth(): Promise<{
  healthy: boolean;
  stats: any;
  memoryPressure: boolean;
}> {
  try {
    const stats = cacheManager.getStats();
    const memoryPressure = stats.memoryUsageMB > 200; // Alert if > 200MB
    
    return {
      healthy: true,
      stats,
      memoryPressure
    };
  } catch (error) {
    return {
      healthy: false,
      stats: null,
      memoryPressure: false
    };
  }
}

export default cacheManager;