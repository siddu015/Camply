interface CachedContent {
  content: string;
  timestamp: number;
  user_id: string;
  college_id?: string;
}

interface CacheMetadata {
  lastFetch: number;
  expirationTime: number;
  version: string;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000;
const CACHE_VERSION = '1.0.0';

export class CampusCacheService {
  private static instance: CampusCacheService;
  
  private constructor() {}
  
  static getInstance(): CampusCacheService {
    if (!CampusCacheService.instance) {
      CampusCacheService.instance = new CampusCacheService();
    }
    return CampusCacheService.instance;
  }

  private getCacheKey(type: string, userId: string, collegeId?: string): string {
    return `campus_${type}_${userId}_${collegeId || 'default'}`;
  }

  private getMetadataKey(type: string, userId: string, collegeId?: string): string {
    return `${this.getCacheKey(type, userId, collegeId)}_meta`;
  }


  isCached(type: string, userId: string, collegeId?: string): boolean {
    try {
      const cacheKey = this.getCacheKey(type, userId, collegeId);
      const metaKey = this.getMetadataKey(type, userId, collegeId);
      
      const cachedContent = localStorage.getItem(cacheKey);
      const metadata = localStorage.getItem(metaKey);
      
      if (!cachedContent || !metadata) {
        return false;
      }

      const meta: CacheMetadata = JSON.parse(metadata);
      const now = Date.now();
      
      if (now > meta.expirationTime || meta.version !== CACHE_VERSION) {
        this.clearCache(type, userId, collegeId);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking cache:', error);
      return false;
    }
  }

  getCachedContent(type: string, userId: string, collegeId?: string): CachedContent | null {
    try {
      if (!this.isCached(type, userId, collegeId)) {
        return null;
      }

      const cacheKey = this.getCacheKey(type, userId, collegeId);
      const cachedData = localStorage.getItem(cacheKey);
      
      if (!cachedData) {
        return null;
      }

      return JSON.parse(cachedData) as CachedContent;
    } catch (error) {
      console.error('Error retrieving cached content:', error);
      return null;
    }
  }


  setCachedContent(
    type: string, 
    userId: string, 
    content: string, 
    collegeId?: string
  ): void {
    try {
      const cacheKey = this.getCacheKey(type, userId, collegeId);
      const metaKey = this.getMetadataKey(type, userId, collegeId);
      const now = Date.now();

      const cachedContent: CachedContent = {
        content,
        timestamp: now,
        user_id: userId,
        college_id: collegeId,
      };

      const metadata: CacheMetadata = {
        lastFetch: now,
        expirationTime: now + CACHE_DURATION,
        version: CACHE_VERSION,
      };

      localStorage.setItem(cacheKey, JSON.stringify(cachedContent));
      localStorage.setItem(metaKey, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error caching content:', error);
      this.cleanupOldCache();
    }
  }


  clearCache(type: string, userId: string, collegeId?: string): void {
    try {
      const cacheKey = this.getCacheKey(type, userId, collegeId);
      const metaKey = this.getMetadataKey(type, userId, collegeId);
      
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(metaKey);
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  }

  clearUserCache(userId: string): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(`campus_`) && key.includes(userId)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing user cache:', error);
    }
  }


  getCacheInfo(type: string, userId: string, collegeId?: string): {
    isCached: boolean;
    lastFetch?: Date;
    expiresAt?: Date;
  } {
    try {
      const metaKey = this.getMetadataKey(type, userId, collegeId);
      const metadata = localStorage.getItem(metaKey);
      
      if (!metadata) {
        return { isCached: false };
      }

      const meta: CacheMetadata = JSON.parse(metadata);
      
      return {
        isCached: this.isCached(type, userId, collegeId),
        lastFetch: new Date(meta.lastFetch),
        expiresAt: new Date(meta.expirationTime),
      };
    } catch (error) {
      console.error('Error getting cache info:', error);
      return { isCached: false };
    }
  }


  private cleanupOldCache(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('campus_') && key.includes('_meta')) {
          try {
            const metadata = localStorage.getItem(key);
            if (metadata) {
              const meta: CacheMetadata = JSON.parse(metadata);
              if (now > meta.expirationTime || meta.version !== CACHE_VERSION) {
                keysToRemove.push(key);
                keysToRemove.push(key.replace('_meta', ''));
              }
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }
  
  getCacheSize(): { totalKeys: number; estimatedSize: string } {
    try {
      let totalSize = 0;
      let campusKeys = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('campus_')) {
          campusKeys++;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
      
      const sizeInKB = (totalSize / 1024).toFixed(2);
      
      return {
        totalKeys: campusKeys,
        estimatedSize: `${sizeInKB} KB`,
      };
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return { totalKeys: 0, estimatedSize: '0 KB' };
    }
  }
} 
