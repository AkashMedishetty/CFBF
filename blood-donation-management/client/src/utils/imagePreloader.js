// Image preloading utility for hero section
export class ImagePreloader {
  constructor() {
    this.cache = new Map();
    this.preloadPromises = new Map();
  }

  // Preload critical hero images
  async preloadHeroImages() {
    const heroImages = [
      '/bd1.jpg',
      '/bd2.jpg'
    ];

    console.log('Starting hero image preload...');
    
    const preloadPromises = heroImages.map(src => this.preloadImage(src));
    
    try {
      await Promise.all(preloadPromises);
      console.log('All hero images preloaded successfully');
    } catch (error) {
      console.warn('Some hero images failed to preload:', error);
    }
  }

  // Preload individual image with retry logic
  async preloadImage(src, retryAttempts = 2) {
    // Return existing promise if already preloading
    if (this.preloadPromises.has(src)) {
      return this.preloadPromises.get(src);
    }

    // Return cached image if already loaded
    if (this.cache.has(src)) {
      return this.cache.get(src);
    }

    const preloadPromise = this._loadImageWithRetry(src, retryAttempts);
    this.preloadPromises.set(src, preloadPromise);

    try {
      const img = await preloadPromise;
      this.cache.set(src, img);
      return img;
    } catch (error) {
      this.preloadPromises.delete(src);
      throw error;
    }
  }

  // Internal method to load image with retry
  async _loadImageWithRetry(src, retryAttempts) {
    let lastError;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const img = await this._loadImage(src);
        
        // Add preload link to document head for browser optimization
        this._addPreloadLink(src);
        
        return img;
      } catch (error) {
        lastError = error;
        console.warn(`Image preload attempt ${attempt + 1} failed for ${src}:`, error);
        
        if (attempt < retryAttempts) {
          // Wait before retry with exponential backoff
          await this._delay(Math.pow(2, attempt) * 500);
        }
      }
    }

    throw lastError;
  }

  // Promise-based image loading
  _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        console.log(`Image preloaded: ${src}`);
        resolve(img);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to preload image: ${src}`));
      };
      
      // Set crossOrigin if needed for CORS
      if (src.startsWith('http') && !src.startsWith(window.location.origin)) {
        img.crossOrigin = 'anonymous';
      }
      
      img.src = src;
    });
  }

  // Add preload link to document head
  _addPreloadLink(src) {
    // Check if preload link already exists
    const existingLink = document.querySelector(`link[href="${src}"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    
    // Add to head
    document.head.appendChild(link);
  }

  // Utility delay function
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get cached image
  getCachedImage(src) {
    return this.cache.get(src);
  }

  // Check if image is cached
  isCached(src) {
    return this.cache.has(src);
  }

  // Clear cache (useful for memory management)
  clearCache() {
    this.cache.clear();
    this.preloadPromises.clear();
  }

  // Get cache size for monitoring
  getCacheSize() {
    return this.cache.size;
  }
}

// Create singleton instance
export const imagePreloader = new ImagePreloader();

// Auto-preload hero images when module loads
if (typeof window !== 'undefined') {
  // Preload after a short delay to not block initial page load
  setTimeout(() => {
    imagePreloader.preloadHeroImages().catch(error => {
      console.warn('Hero image preloading failed:', error);
    });
  }, 100);
}

// Connection-aware loading
export const getOptimalImageQuality = () => {
  if (typeof navigator === 'undefined' || !navigator.connection) {
    return 85; // Default quality
  }

  const connection = navigator.connection;
  const effectiveType = connection.effectiveType;

  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return 60;
    case '3g':
      return 75;
    case '4g':
    default:
      return 90;
  }
};

// Detect slow connection
export const isSlowConnection = () => {
  if (typeof navigator === 'undefined' || !navigator.connection) {
    return false;
  }

  const connection = navigator.connection;
  return connection.effectiveType === 'slow-2g' || 
         connection.effectiveType === '2g' ||
         connection.downlink < 1.5;
};