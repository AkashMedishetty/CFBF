/**
 * Preload Manager
 * Handles intelligent preloading for critical user paths
 */

import performanceMonitor from './performanceMonitor';

class PreloadManager {
  constructor() {
    this.preloadedRoutes = new Set();
    this.preloadedAssets = new Set();
    this.preloadQueue = [];
    this.isPreloading = false;
    
    // Critical paths that should be preloaded
    this.criticalPaths = {
      '/': {
        priority: 1,
        components: ['HomePage'],
        assets: ['/logo192.png']
      },
      '/emergency': {
        priority: 1,
        components: ['EmergencyRequestPage', 'GuestEmergencyRequest'],
        assets: []
      },
      '/login': {
        priority: 2,
        components: ['SignInPage'],
        assets: []
      },
      '/register': {
        priority: 2,
        components: ['RegisterPage'],
        assets: []
      },
      '/donor/dashboard': {
        priority: 2,
        components: ['DonorDashboardPage'],
        assets: []
      }
    };
    
    // User behavior patterns for predictive preloading
    this.userPatterns = {
      '/': ['/emergency', '/login', '/register'],
      '/login': ['/donor/dashboard'],
      '/register': ['/donor/onboarding'],
      '/emergency': ['/login', '/register']
    };
    
    this.initializePreloading();
  }

  // Initialize preloading system
  initializePreloading() {
    // Preload critical assets on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.preloadCriticalAssets();
      });
    } else {
      this.preloadCriticalAssets();
    }
    
    // Set up intersection observer for link preloading
    this.setupLinkPreloading();
    
    // Set up idle time preloading
    this.setupIdlePreloading();
  }

  // Preload critical assets immediately
  async preloadCriticalAssets() {
    const currentPath = window.location.pathname;
    const criticalPath = this.criticalPaths[currentPath];
    
    if (criticalPath) {
      await this.preloadPath(currentPath, criticalPath);
    }
    
    // Preload next likely paths based on user patterns
    const likelyPaths = this.userPatterns[currentPath] || [];
    for (const path of likelyPaths.slice(0, 2)) { // Limit to 2 predictions
      this.queuePreload(path, 3); // Lower priority
    }
  }

  // Preload a specific path
  async preloadPath(path, pathConfig) {
    if (this.preloadedRoutes.has(path)) return;
    
    try {
      const startTime = performance.now();
      
      // Preload components
      if (pathConfig.components) {
        await this.preloadComponents(pathConfig.components);
      }
      
      // Preload assets
      if (pathConfig.assets) {
        await this.preloadAssets(pathConfig.assets);
      }
      
      this.preloadedRoutes.add(path);
      
      const endTime = performance.now();
      performanceMonitor.recordMetric('preload', {
        path,
        duration: endTime - startTime,
        componentsCount: pathConfig.components?.length || 0,
        assetsCount: pathConfig.assets?.length || 0
      });
      
      console.log(`[PreloadManager] Preloaded path: ${path} in ${(endTime - startTime).toFixed(2)}ms`);
      
    } catch (error) {
      console.warn(`[PreloadManager] Failed to preload path ${path}:`, error);
    }
  }

  // Preload React components
  async preloadComponents(componentNames) {
    const preloadPromises = componentNames.map(async (componentName) => {
      try {
        // Dynamic import based on component name
        const componentPath = this.getComponentPath(componentName);
        if (componentPath) {
          await import(componentPath);
          console.log(`[PreloadManager] Preloaded component: ${componentName}`);
        }
      } catch (error) {
        console.warn(`[PreloadManager] Failed to preload component ${componentName}:`, error);
      }
    });
    
    await Promise.allSettled(preloadPromises);
  }

  // Get component path based on name
  getComponentPath(componentName) {
    const componentPaths = {
      'HomePage': '../pages/public/HomePage.jsx',
      'EmergencyRequestPage': '../pages/public/EmergencyRequestPage.jsx',
      'GuestEmergencyRequest': '../components/features/GuestEmergencyRequest.jsx',
      'SignInPage': '../pages/auth/SignInPage.jsx',
      'RegisterPage': '../pages/auth/RegisterPage.jsx',
      'DonorDashboardPage': '../pages/donor/DashboardPage.jsx',
      'DonorOnboardingPage': '../pages/donor/OnboardingPage.jsx'
    };
    
    return componentPaths[componentName];
  }

  // Preload static assets
  async preloadAssets(assetUrls) {
    const preloadPromises = assetUrls.map(async (url) => {
      if (this.preloadedAssets.has(url)) return;
      
      try {
        await this.preloadAsset(url);
        this.preloadedAssets.add(url);
        console.log(`[PreloadManager] Preloaded asset: ${url}`);
      } catch (error) {
        console.warn(`[PreloadManager] Failed to preload asset ${url}:`, error);
      }
    });
    
    await Promise.allSettled(preloadPromises);
  }

  // Preload individual asset
  preloadAsset(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      
      // Determine asset type
      if (url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
        link.as = 'image';
      } else if (url.match(/\.(woff|woff2|ttf|otf)$/i)) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      } else if (url.match(/\.(css)$/i)) {
        link.as = 'style';
      } else if (url.match(/\.(js|jsx|ts|tsx)$/i)) {
        link.as = 'script';
      } else {
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
      }
      
      link.href = url;
      link.onload = () => resolve(url);
      link.onerror = () => reject(new Error(`Failed to preload: ${url}`));
      
      document.head.appendChild(link);
    });
  }

  // Set up link hover preloading
  setupLinkPreloading() {
    let hoverTimer;
    
    document.addEventListener('mouseover', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      
      // Clear any existing timer
      clearTimeout(hoverTimer);
      
      // Preload after 100ms hover (indicates intent)
      hoverTimer = setTimeout(() => {
        this.queuePreload(href, 4); // Low priority
      }, 100);
    });
    
    document.addEventListener('mouseout', (event) => {
      const link = event.target.closest('a[href]');
      if (link) {
        clearTimeout(hoverTimer);
      }
    });
  }

  // Set up idle time preloading
  setupIdlePreloading() {
    let idleTimer;
    
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        this.processPreloadQueue();
      }, 2000); // Start preloading after 2 seconds of inactivity
    };
    
    // Reset timer on user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });
    
    resetIdleTimer();
  }

  // Queue preload request
  queuePreload(path, priority = 3) {
    if (this.preloadedRoutes.has(path)) return;
    
    // Check if already in queue
    const existingIndex = this.preloadQueue.findIndex(item => item.path === path);
    if (existingIndex !== -1) {
      // Update priority if higher
      if (priority < this.preloadQueue[existingIndex].priority) {
        this.preloadQueue[existingIndex].priority = priority;
        this.preloadQueue.sort((a, b) => a.priority - b.priority);
      }
      return;
    }
    
    const pathConfig = this.criticalPaths[path];
    if (pathConfig) {
      this.preloadQueue.push({ path, priority, config: pathConfig });
      this.preloadQueue.sort((a, b) => a.priority - b.priority);
    }
  }

  // Process preload queue during idle time
  async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) return;
    
    this.isPreloading = true;
    
    try {
      // Process up to 3 items from queue
      const itemsToProcess = this.preloadQueue.splice(0, 3);
      
      for (const item of itemsToProcess) {
        await this.preloadPath(item.path, item.config);
        
        // Small delay between preloads to avoid blocking
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.warn('[PreloadManager] Error processing preload queue:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  // Preload based on user navigation pattern
  recordNavigation(fromPath, toPath) {
    // Update user patterns based on actual navigation
    if (!this.userPatterns[fromPath]) {
      this.userPatterns[fromPath] = [];
    }
    
    if (!this.userPatterns[fromPath].includes(toPath)) {
      this.userPatterns[fromPath].unshift(toPath);
      
      // Keep only top 3 patterns
      if (this.userPatterns[fromPath].length > 3) {
        this.userPatterns[fromPath] = this.userPatterns[fromPath].slice(0, 3);
      }
    }
  }

  // Preload emergency assets for critical situations
  async preloadEmergencyAssets() {
    const emergencyAssets = ['/logo192.png'];
    
    await this.preloadAssets(emergencyAssets);
    console.log('[PreloadManager] Emergency assets preloaded');
  }

  // Get preload status
  getPreloadStatus() {
    return {
      preloadedRoutes: Array.from(this.preloadedRoutes),
      preloadedAssets: Array.from(this.preloadedAssets),
      queueLength: this.preloadQueue.length,
      isPreloading: this.isPreloading,
      userPatterns: this.userPatterns
    };
  }

  // Clear preload cache
  clearPreloadCache() {
    this.preloadedRoutes.clear();
    this.preloadedAssets.clear();
    this.preloadQueue = [];
    
    // Remove preload links from head
    const preloadLinks = document.querySelectorAll('link[rel="preload"]');
    preloadLinks.forEach(link => link.remove());
    
    console.log('[PreloadManager] Preload cache cleared');
  }

  // Prefetch DNS for external domains
  prefetchDNS(domains) {
    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });
  }

  // Preconnect to critical origins
  preconnectOrigins(origins) {
    origins.forEach(origin => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }
}

// Create singleton instance
const preloadManager = new PreloadManager();

export default preloadManager;