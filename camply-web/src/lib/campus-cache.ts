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

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
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

  /**
   * Check if cached content exists and is valid
   */
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
      
      // Check if cache is expired or version mismatch
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

  /**
   * Get cached content if available and valid
   */
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

  /**
   * Cache content with metadata
   */
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
      // If localStorage is full, try to clear old cache entries
      this.cleanupOldCache();
    }
  }

  /**
   * Clear specific cache entry
   */
  clearCache(type: string, userId: string, collegeId?: string): void {
    try {
      const cacheKey = this.getCacheKey(type, userId, collegeId);
      const metaKey = this.getMetadataKey(type, userId, collegeId);
      
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(metaKey);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Clear all campus cache for a user
   */
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

  /**
   * Get cache info for display
   */
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

  /**
   * Clean up expired cache entries
   */
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
                keysToRemove.push(key.replace('_meta', '')); // Remove content key too
              }
            }
          } catch (error) {
            // If we can't parse metadata, remove it
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  /**
   * Get total cache size (approximate)
   */
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