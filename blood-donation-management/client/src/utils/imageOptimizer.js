/**
 * Image Optimization Utility
 * Handles image compression, resizing, and format optimization
 */

class ImageOptimizer {
  constructor() {
    this.defaultOptions = {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      format: 'webp', // Preferred format
      fallbackFormat: 'jpeg'
    };
  }

  // Check if WebP is supported
  isWebPSupported() {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  // Optimize image file
  async optimizeImage(file, options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Create image element
      const img = await this.loadImage(file);
      
      // Calculate new dimensions
      const { width, height } = this.calculateDimensions(
        img.naturalWidth,
        img.naturalHeight,
        opts.maxWidth,
        opts.maxHeight
      );
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = width;
      canvas.height = height;
      
      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Check WebP support and choose format
      const webpSupported = await this.isWebPSupported();
      const format = webpSupported ? opts.format : opts.fallbackFormat;
      const mimeType = `image/${format}`;
      
      // Convert to blob
      const blob = await this.canvasToBlob(canvas, mimeType, opts.quality);
      
      // Create optimized file object
      const optimizedFile = new File([blob], this.generateOptimizedFileName(file.name, format), {
        type: mimeType,
        lastModified: Date.now()
      });
      
      return {
        file: optimizedFile,
        originalSize: file.size,
        optimizedSize: blob.size,
        compressionRatio: ((file.size - blob.size) / file.size * 100).toFixed(1),
        dimensions: { width, height },
        format: format
      };
      
    } catch (error) {
      console.error('[ImageOptimizer] Optimization failed:', error);
      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }

  // Load image from file
  loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Calculate optimal dimensions maintaining aspect ratio
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let { width, height } = { width: originalWidth, height: originalHeight };
    
    // If image is smaller than max dimensions, keep original size
    if (width <= maxWidth && height <= maxHeight) {
      return { width, height };
    }
    
    // Calculate aspect ratio
    const aspectRatio = width / height;
    
    // Resize based on which dimension exceeds the limit more
    if (width / maxWidth > height / maxHeight) {
      width = maxWidth;
      height = Math.round(width / aspectRatio);
    } else {
      height = maxHeight;
      width = Math.round(height * aspectRatio);
    }
    
    return { width, height };
  }

  // Convert canvas to blob
  canvasToBlob(canvas, mimeType, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        mimeType,
        quality
      );
    });
  }

  // Generate optimized file name
  generateOptimizedFileName(originalName, format) {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_optimized.${format}`;
  }

  // Optimize multiple images
  async optimizeImages(files, options = {}) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.optimizeImage(file, options);
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message, 
          originalFile: file 
        });
      }
    }
    
    return results;
  }

  // Create responsive image srcset
  async createResponsiveSrcSet(file, breakpoints = [480, 768, 1024, 1440]) {
    const srcSet = [];
    
    for (const width of breakpoints) {
      try {
        const optimized = await this.optimizeImage(file, {
          ...this.defaultOptions,
          maxWidth: width,
          maxHeight: Math.round(width * 0.75) // 4:3 aspect ratio
        });
        
        const url = URL.createObjectURL(optimized.file);
        srcSet.push(`${url} ${width}w`);
      } catch (error) {
        console.warn(`[ImageOptimizer] Failed to create ${width}w variant:`, error);
      }
    }
    
    return srcSet.join(', ');
  }

  // Preload critical images
  preloadImage(src, crossOrigin = null) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      
      if (crossOrigin) {
        link.crossOrigin = crossOrigin;
      }
      
      link.onload = () => resolve(src);
      link.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
      
      document.head.appendChild(link);
    });
  }

  // Lazy load images with intersection observer
  setupLazyLoading(selector = 'img[data-src]', options = {}) {
    const defaultOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };
    
    const observerOptions = { ...defaultOptions, ...options };
    
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      this.loadAllImages(selector);
      return;
    }
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.classList.remove('lazy');
            img.classList.add('lazy-loaded');
            observer.unobserve(img);
          }
        }
      });
    }, observerOptions);
    
    // Observe all lazy images
    const lazyImages = document.querySelectorAll(selector);
    lazyImages.forEach(img => imageObserver.observe(img));
    
    return imageObserver;
  }

  // Fallback for browsers without IntersectionObserver
  loadAllImages(selector) {
    const lazyImages = document.querySelectorAll(selector);
    lazyImages.forEach(img => {
      const src = img.dataset.src;
      if (src) {
        img.src = src;
        img.classList.remove('lazy');
        img.classList.add('lazy-loaded');
      }
    });
  }

  // Get image metadata
  async getImageMetadata(file) {
    try {
      const img = await this.loadImage(file);
      
      return {
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        size: file.size,
        type: file.type,
        name: file.name,
        lastModified: file.lastModified
      };
    } catch (error) {
      throw new Error(`Failed to get image metadata: ${error.message}`);
    }
  }

  // Validate image file
  validateImage(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    } = options;
    
    const errors = [];
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`);
    }
    
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create singleton instance
const imageOptimizer = new ImageOptimizer();

export default imageOptimizer;