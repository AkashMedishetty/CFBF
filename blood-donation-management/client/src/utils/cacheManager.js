// Cache management utilities for PWA
import { pwaManager } from './pwaManager';

export const cacheManager = {
  // Cache version management
  CURRENT_VERSION: '2.0.0',
  CACHE_PREFIX: 'bdms-cache',
  
  // Cache names
  getCacheNames: () => ({
    static: `${cacheManager.CACHE_PREFIX}-static-v${cacheManager.CURRENT_VERSION}`,
    dynamic: `${cacheManager.CACHE_PREFIX}-dynamic-v${cacheManager.CURRENT_VERSION}`,
    api: `${cacheManager.CACHE_PREFIX}-api-v${cacheManager.CURRENT_VERSION}`,
    images: `${cacheManager.CACHE_PREFIX}-images-v${cacheManager.CURRENT_VERSION}`
  }),

  // Generate cache-busting URL
  addCacheBuster: (url) => {
    const separator = url.includes('?') ? '&' : '?';
    const timestamp = Date.now();
    const version = cacheManager.CURRENT_VERSION;
    return `${url}${separator}v=${version}&t=${timestamp}`;
  },

  // Clear all old caches
  clearOldCaches: async () => {
    try {
      const cacheNames = await caches.keys();
      const currentCacheNames = Object.values(cacheManager.getCacheNames());
      
      const oldCaches = cacheNames.filter(name => 
        name.startsWith(cacheManager.CACHE_PREFIX) && 
        !currentCacheNames.includes(name)
      );

      const deletePromises = oldCaches.map(cacheName => {
        console.log(`[Cache Manager] Deleting old cache: ${cacheName}`);
        return caches.delete(cacheName);
      });

      await Promise.all(deletePromises);
      console.log(`[Cache Manager] Cleared ${oldCaches.length} old caches`);
      
      return oldCaches.length;
    } catch (error) {
      console.error('[Cache Manager] Failed to clear old caches:', error);
      return 0;
    }
  },

  // Force refresh of specific resources
  forceRefresh: async (urls) => {
    const cacheNames = cacheManager.getCacheNames();
    
    for (const url of urls) {
      try {
        // Remove from all caches
        for (const cacheName of Object.values(cacheNames)) {
          const cache = await caches.open(cacheName);
          await cache.delete(url);
        }
        
        // Fetch fresh version
        const freshResponse = await fetch(cacheManager.addCacheBuster(url));
        
        if (freshResponse.ok) {
          // Cache the fresh version
          const cache = await caches.open(cacheNames.dynamic);
          await cache.put(url, freshResponse.clone());
          console.log(`[Cache Manager] Refreshed: ${url}`);
        }
      } catch (error) {
        console.error(`[Cache Manager] Failed to refresh ${url}:`, error);
      }
    }
  },

  // Check if cache needs update
  needsUpdate: async () => {
    try {
      // Check if there's a version mismatch
      const storedVersion = localStorage.getItem('bdms-cache-version');
      const currentVersion = cacheManager.CURRENT_VERSION;
      
      if (storedVersion !== currentVersion) {
        console.log(`[Cache Manager] Version mismatch: ${storedVersion} -> ${currentVersion}`);
        return true;
      }

      // Check if critical files are missing from cache
      const criticalFiles = [
        '/',
        '/static/js/main.js',
        '/static/css/main.css',
        '/manifest.json'
      ];

      const cache = await caches.open(cacheManager.getCacheNames().static);
      
      for (const file of criticalFiles) {
        const response = await cache.match(file);
        if (!response) {
          console.log(`[Cache Manager] Missing critical file: ${file}`);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('[Cache Manager] Error checking cache status:', error);
      return true; // Assume update needed on error
    }
  },

  // Update cache version
  updateVersion: () => {
    localStorage.setItem('bdms-cache-version', cacheManager.CURRENT_VERSION);
    localStorage.setItem('bdms-cache-updated', Date.now().toString());
  },

  // Get cache statistics
  getCacheStats: async () => {
    try {
      const stats = {
        version: cacheManager.CURRENT_VERSION,
        caches: {},
        totalSize: 0,
        totalEntries: 0
      };

      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        if (cacheName.startsWith(cacheManager.CACHE_PREFIX)) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          
          stats.caches[cacheName] = {
            entries: keys.length,
            urls: keys.map(req => req.url).slice(0, 5) // First 5 URLs
          };
          
          stats.totalEntries += keys.length;
        }
      }

      return stats;
    } catch (error) {
      console.error('[Cache Manager] Failed to get cache stats:', error);
      return null;
    }
  },

  // Preload critical resources
  preloadCriticalResources: async () => {
    const criticalResources = [
      '/',
      '/manifest.json',
      '/static/css/main.css',
      // Add other critical resources
    ];

    const cache = await caches.open(cacheManager.getCacheNames().static);
    
    const preloadPromises = criticalResources.map(async (url) => {
      try {
        const response = await fetch(cacheManager.addCacheBuster(url));
        if (response.ok) {
          await cache.put(url, response);
          console.log(`[Cache Manager] Preloaded: ${url}`);
        }
      } catch (error) {
        console.error(`[Cache Manager] Failed to preload ${url}:`, error);
      }
    });

    await Promise.all(preloadPromises);
  },

  // Handle cache update notifications
  notifyUpdate: () => {
    // Notify user about available update
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_UPDATED',
        version: cacheManager.CURRENT_VERSION
      });
    }

    // Show update notification to user
    const event = new CustomEvent('cacheUpdated', {
      detail: {
        version: cacheManager.CURRENT_VERSION,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(event);
  },

  // Initialize cache management
  initialize: async () => {
    try {
      console.log('[Cache Manager] Initializing...');
      
      // Clear old caches
      await cacheManager.clearOldCaches();
      
      // Check if update is needed
      const needsUpdate = await cacheManager.needsUpdate();
      
      if (needsUpdate) {
        console.log('[Cache Manager] Cache update needed');
        
        // Preload critical resources
        await cacheManager.preloadCriticalResources();
        
        // Update version
        cacheManager.updateVersion();
        
        // Notify about update
        cacheManager.notifyUpdate();
      }
      
      console.log('[Cache Manager] Initialization complete');
      
      // Log cache stats in development
      if (process.env.NODE_ENV === 'development') {
        const stats = await cacheManager.getCacheStats();
        console.log('[Cache Manager] Stats:', stats);
      }
      
    } catch (error) {
      console.error('[Cache Manager] Initialization failed:', error);
    }
  }
};

// Auto-initialize when module loads
if (typeof window !== 'undefined' && 'caches' in window) {
  // Initialize after a short delay to avoid blocking initial page load
  setTimeout(() => {
    cacheManager.initialize();
  }, 1000);
}

export default cacheManager;