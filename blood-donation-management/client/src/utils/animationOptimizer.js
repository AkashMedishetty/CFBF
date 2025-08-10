/**
 * Animation Optimizer
 * Ensures smooth 60fps animations with hardware acceleration
 */

// import performanceMonitor from './performanceMonitor';

class AnimationOptimizer {
  constructor() {
    this.activeAnimations = new Map();
    this.animationFrame = null;
    this.isReducedMotion = this.checkReducedMotionPreference();
    this.performanceMode = this.detectPerformanceMode();
    
    this.initializeOptimizations();
  }

  // Initialize animation optimizations
  initializeOptimizations() {
    // Listen for reduced motion preference changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', (e) => {
        this.isReducedMotion = e.matches;
        this.updateAnimationSettings();
      });
    }
    
    // Monitor performance and adjust animations
    this.setupPerformanceMonitoring();
    
    // Add CSS optimizations
    this.addCSSOptimizations();
  }

  // Check user's reduced motion preference
  checkReducedMotionPreference() {
    if (window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }

  // Detect device performance mode
  detectPerformanceMode() {
    // Check device memory (if available)
    const deviceMemory = navigator.deviceMemory || 4;
    
    // Check hardware concurrency
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    
    // Check connection speed
    const connection = navigator.connection;
    const effectiveType = connection?.effectiveType || '4g';
    
    // Determine performance mode
    if (deviceMemory >= 8 && hardwareConcurrency >= 8 && effectiveType === '4g') {
      return 'high';
    } else if (deviceMemory >= 4 && hardwareConcurrency >= 4) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // Setup performance monitoring for animations
  setupPerformanceMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    let lowFPSCount = 0;
    
    const monitorFrame = (currentTime) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        if (fps < 45) {
          lowFPSCount++;
          if (lowFPSCount >= 3) {
            // Reduce animation quality if consistently low FPS
            this.reduceAnimationQuality();
            lowFPSCount = 0;
          }
        } else {
          lowFPSCount = 0;
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(monitorFrame);
    };
    
    requestAnimationFrame(monitorFrame);
  }

  // Add CSS optimizations for better performance
  addCSSOptimizations() {
    const style = document.createElement('style');
    style.textContent = `
      /* Hardware acceleration for animations */
      .animate-optimized {
        will-change: transform, opacity;
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }
      
      /* Smooth scrolling optimization */
      .smooth-scroll {
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      }
      
      /* Reduce animations for low-performance devices */
      .performance-low * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }
      
      /* Disable animations for reduced motion preference */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
      
      /* GPU-accelerated transforms */
      .gpu-accelerated {
        transform: translate3d(0, 0, 0);
        will-change: transform;
      }
      
      /* Optimized fade animations */
      .fade-enter {
        opacity: 0;
        transform: translate3d(0, 10px, 0);
      }
      
      .fade-enter-active {
        opacity: 1;
        transform: translate3d(0, 0, 0);
        transition: opacity 300ms ease-out, transform 300ms ease-out;
      }
      
      .fade-exit {
        opacity: 1;
        transform: translate3d(0, 0, 0);
      }
      
      .fade-exit-active {
        opacity: 0;
        transform: translate3d(0, -10px, 0);
        transition: opacity 200ms ease-in, transform 200ms ease-in;
      }
    `;
    
    document.head.appendChild(style);
  }

  // Create optimized animation
  createOptimizedAnimation(element, keyframes, options = {}) {
    if (this.isReducedMotion) {
      // Skip animation for reduced motion preference
      return this.createInstantAnimation(element, keyframes);
    }
    
    const optimizedOptions = this.optimizeAnimationOptions(options);
    
    try {
      const animation = element.animate(keyframes, optimizedOptions);
      
      // Track animation
      const animationId = this.generateAnimationId();
      this.activeAnimations.set(animationId, {
        animation,
        element,
        startTime: performance.now()
      });
      
      // Clean up when animation finishes
      animation.addEventListener('finish', () => {
        this.activeAnimations.delete(animationId);
        this.cleanupElement(element);
      });
      
      animation.addEventListener('cancel', () => {
        this.activeAnimations.delete(animationId);
        this.cleanupElement(element);
      });
      
      return animation;
      
    } catch (error) {
      console.warn('[AnimationOptimizer] Animation creation failed:', error);
      return this.createInstantAnimation(element, keyframes);
    }
  }

  // Optimize animation options based on performance mode
  optimizeAnimationOptions(options) {
    const baseOptions = {
      duration: 300,
      easing: 'ease-out',
      fill: 'both',
      ...options
    };
    
    switch (this.performanceMode) {
      case 'low':
        return {
          ...baseOptions,
          duration: Math.min(baseOptions.duration * 0.5, 150),
          easing: 'linear' // Simpler easing for better performance
        };
      
      case 'medium':
        return {
          ...baseOptions,
          duration: Math.min(baseOptions.duration * 0.75, 250)
        };
      
      case 'high':
      default:
        return baseOptions;
    }
  }

  // Create instant animation for reduced motion
  createInstantAnimation(element, keyframes) {
    const finalFrame = keyframes[keyframes.length - 1];
    
    // Apply final styles immediately
    Object.assign(element.style, finalFrame);
    
    // Return a mock animation object
    return {
      finished: Promise.resolve(),
      cancel: () => {},
      pause: () => {},
      play: () => {},
      reverse: () => {}
    };
  }

  // Optimize element for animation
  optimizeElementForAnimation(element) {
    element.classList.add('animate-optimized');
    
    // Force hardware acceleration
    element.style.willChange = 'transform, opacity';
    element.style.transform = element.style.transform || 'translateZ(0)';
  }

  // Clean up element after animation
  cleanupElement(element) {
    element.classList.remove('animate-optimized');
    element.style.willChange = 'auto';
    
    // Remove translateZ if it was only added for optimization
    if (element.style.transform === 'translateZ(0)') {
      element.style.transform = '';
    }
  }

  // Batch DOM reads and writes for better performance
  batchDOMOperations(operations) {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        // Batch all reads first
        const readResults = operations.reads ? operations.reads.map(read => read()) : [];
        
        // Then batch all writes
        if (operations.writes) {
          operations.writes.forEach((write, index) => {
            write(readResults[index]);
          });
        }
        
        resolve(readResults);
      });
    });
  }

  // Create staggered animations for multiple elements
  createStaggeredAnimation(elements, keyframes, options = {}) {
    const staggerDelay = options.staggerDelay || 100;
    const animations = [];
    
    elements.forEach((element, index) => {
      const staggeredOptions = {
        ...options,
        delay: (options.delay || 0) + (index * staggerDelay)
      };
      
      const animation = this.createOptimizedAnimation(element, keyframes, staggeredOptions);
      animations.push(animation);
    });
    
    return animations;
  }

  // Create scroll-triggered animation
  createScrollAnimation(element, keyframes, options = {}) {
    const observerOptions = {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.createOptimizedAnimation(element, keyframes, options);
          observer.unobserve(element);
        }
      });
    }, observerOptions);
    
    observer.observe(element);
    
    return observer;
  }

  // Reduce animation quality for performance
  reduceAnimationQuality() {
    if (this.performanceMode !== 'low') {
      this.performanceMode = 'low';
      document.body.classList.add('performance-low');
      
      console.warn('[AnimationOptimizer] Reduced animation quality due to low FPS');
      
      // Cancel non-essential animations
      this.cancelNonEssentialAnimations();
    }
  }

  // Cancel non-essential animations
  cancelNonEssentialAnimations() {
    for (const [animationId, animationData] of this.activeAnimations.entries()) {
      const { animation, element } = animationData;
      
      // Keep only essential animations (emergency-related)
      if (!element.classList.contains('essential-animation')) {
        animation.cancel();
        this.activeAnimations.delete(animationId);
      }
    }
  }

  // Update animation settings based on preferences
  updateAnimationSettings() {
    if (this.isReducedMotion) {
      document.body.classList.add('reduced-motion');
      this.cancelAllAnimations();
    } else {
      document.body.classList.remove('reduced-motion');
    }
  }

  // Cancel all active animations
  cancelAllAnimations() {
    for (const [, animationData] of this.activeAnimations.entries()) {
      animationData.animation.cancel();
    }
    this.activeAnimations.clear();
  }

  // Generate unique animation ID
  generateAnimationId() {
    return `anim_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Get animation performance metrics
  getAnimationMetrics() {
    return {
      activeAnimations: this.activeAnimations.size,
      performanceMode: this.performanceMode,
      isReducedMotion: this.isReducedMotion,
      totalAnimationsCreated: this.activeAnimations.size
    };
  }

  // Preload animation assets
  async preloadAnimationAssets(assets) {
    const preloadPromises = assets.map(async (asset) => {
      if (asset.type === 'lottie') {
        // Preload Lottie animations
        return this.preloadLottieAnimation(asset.url);
      } else if (asset.type === 'video') {
        // Preload video animations
        return this.preloadVideoAnimation(asset.url);
      }
    });
    
    await Promise.allSettled(preloadPromises);
  }

  // Preload Lottie animation
  async preloadLottieAnimation(url) {
    try {
      const response = await fetch(url);
      const animationData = await response.json();
      
      // Store in memory for quick access
      this.lottieCache = this.lottieCache || new Map();
      this.lottieCache.set(url, animationData);
      
      return animationData;
    } catch (error) {
      console.warn(`[AnimationOptimizer] Failed to preload Lottie animation: ${url}`, error);
    }
  }

  // Preload video animation
  async preloadVideoAnimation(url) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => resolve(video);
      video.onerror = () => reject(new Error(`Failed to preload video: ${url}`));
      video.src = url;
    });
  }
}

// Create singleton instance
const animationOptimizer = new AnimationOptimizer();

export default animationOptimizer;