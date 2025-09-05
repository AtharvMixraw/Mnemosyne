
interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiry: number;
  }
  
  class AppCache {
    private cache = new Map<string, CacheItem<unknown>>();
    private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
    private readonly STALE_TIME = 30 * 1000; // 30 seconds
  
    set<T>(key: string, data: T, ttl?: number): void {
      const expiry = ttl || this.DEFAULT_TTL;
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiry
      });
    }
  
    get<T>(key: string): T | null {
      const item = this.cache.get(key);
      if (!item) return null;
  
      const now = Date.now();
      if (now - item.timestamp > item.expiry) {
        this.cache.delete(key);
        return null;
      }
  
      return item.data as T;
    }
  
    isStale(key: string): boolean {
      const item = this.cache.get(key);
      if (!item) return true;
      return Date.now() - item.timestamp > this.STALE_TIME;
    }
  
    has(key: string): boolean {
      const item = this.cache.get(key);
      if (!item) return false;
      
      const now = Date.now();
      if (now - item.timestamp > item.expiry) {
        this.cache.delete(key);
        return false;
      }
      return true;
    }
  
    invalidate(key: string): void {
      this.cache.delete(key);
    }
  
    clear(): void {
      this.cache.clear();
    }
  
    // Get stale data while revalidating
    getStaleWhileRevalidate<T>(key: string): { data: T | null; isStale: boolean } {
      const item = this.cache.get(key);
      if (!item) return { data: null, isStale: true };
  
      const now = Date.now();
      const isExpired = now - item.timestamp > item.expiry;
      const isStale = now - item.timestamp > this.STALE_TIME;
  
      if (isExpired) {
        this.cache.delete(key);
        return { data: null, isStale: true };
      }
  
      return { data: item.data as T, isStale };
    }
  }
  
  export const appCache = new AppCache();