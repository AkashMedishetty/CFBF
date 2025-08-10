/**
 * Performance Optimization Hook
 * Provides performance optimization utilities for React components
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import performanceMonitor from '../utils/performanceMonitor';
import animationOptimizer from '../utils/animationOptimizer';
import imageOptimizer from '../utils/imageOptimizer';

export const usePerformanceOptimization = (componentName, options = {}) => {
  const {
    measureRender = true,
    optimizeAnimations = true,
    lazyLoadImages = true,
    debounceDelay = 300,
    throttleDelay = 100
  } = options;

  const renderStartTime = useRef(null);
  const componentRef = useRef(null);
  const imageObserver = useRef(null);

  // Measure component render time
  useEffect(() => {
    if (measureRender) {
      renderStartTime.current = performance.now();
      
      return () => {
        if (renderStartTime.current) {
          const renderTime = performance.now() - renderStartTime.current;
          performanceMonitor.recordMetric('component_render', {
            component: componentName,
            duration: renderTime
          });
        }
      };
    }
  });

  // Setup lazy loading for images
  useEffect(() => {
    if (lazyLoadImages && componentRef.current) {
      imageObserver.current = imageOptimizer.setupLazyLoading(
        'img[data-src]',
        { root: componentRef.current }
      );
      
      return () => {
        if (imageObserver.current) {
          imageObserver.current.disconnect();
        }
      };
    }
  }, [lazyLoadImages]);

  // Optimize element for animations
  const optimizeForAnimation = useCallback((element) => {
    if (optimizeAnimations && element) {
      animationOptimizer.optimizeElementForAnimation(element);
    }
  }, [optimizeAnimations]);

  // Create optimized animation
  const createAnimation = useCallback((element, keyframes, animationOptions = {}) => {
    if (!optimizeAnimations) return null;
    
    return animationOptimizer.createOptimizedAnimation(element, keyframes, animationOptions);
  }, [optimizeAnimations]);

  // Debounced function creator
  const createDebouncedCallback = useCallback((callback, delay = debounceDelay) => {
    let timeoutId = null;
    
    return (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        callback(...args);
      }, delay);
    };
  }, [debounceDelay]);

  // Throttled function creator
  const createThrottledCallback = useCallback((callback, delay = throttleDelay) => {
    let lastCallTime = 0;
    let timeoutId = null;
    
    return (...args) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime;
      
      if (timeSinceLastCall >= delay) {
        lastCallTime = now;
        callback(...args);
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    };
  }, [throttleDelay]);

  // Memoized expensive calculations
  const memoizeExpensiveCalculation = useCallback((calculation, dependencies) => {
    // This is a factory function that returns a memoized value
    // The actual useMemo should be called in the component using this hook
    return { calculation, dependencies };
  }, []);

  // Batch DOM operations
  const batchDOMOperations = useCallback((operations) => {
    return animationOptimizer.batchDOMOperations(operations);
  }, []);

  // Measure async operation
  const measureAsyncOperation = useCallback(async (operationName, asyncFunction) => {
    return performanceMonitor.measureAsyncOperation(operationName, asyncFunction);
  }, []);

  // Preload images
  const preloadImages = useCallback(async (imageUrls) => {
    const preloadPromises = imageUrls.map(url => imageOptimizer.preloadImage(url));
    return Promise.allSettled(preloadPromises);
  }, []);

  // Optimize images
  const optimizeImages = useCallback(async (files, optimizationOptions = {}) => {
    return imageOptimizer.optimizeImages(files, optimizationOptions);
  }, []);

  // Create intersection observer for visibility tracking
  const createVisibilityObserver = useCallback((callback, options = {}) => {
    const defaultOptions = {
      threshold: 0.1,
      rootMargin: '0px'
    };
    
    const observerOptions = { ...defaultOptions, ...options };
    
    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        callback(entry.isIntersecting, entry);
      });
    }, observerOptions);
  }, []);

  // Performance-aware state updater
  const createPerformantStateUpdater = useCallback((setState) => {
    return createThrottledCallback((newState) => {
      requestAnimationFrame(() => {
        setState(newState);
      });
    }, 16); // ~60fps
  }, [createThrottledCallback]);

  // Virtual scrolling helper
  const createVirtualScrollHelper = useCallback((items, itemHeight, containerHeight) => {
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // Buffer
    
    return {
      getVisibleItems: (scrollTop) => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount, items.length);
        
        return {
          startIndex,
          endIndex,
          items: items.slice(startIndex, endIndex),
          offsetY: startIndex * itemHeight
        };
      },
      totalHeight: items.length * itemHeight
    };
  }, []);

  // Memory usage monitor
  const monitorMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = performance.memory;
      performanceMonitor.recordMetric('memory_usage', {
        component: componentName,
        usedJSHeapSize: memInfo.usedJSHeapSize,
        totalJSHeapSize: memInfo.totalJSHeapSize,
        jsHeapSizeLimit: memInfo.jsHeapSizeLimit
      });
    }
  }, [componentName]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (imageObserver.current) {
      imageObserver.current.disconnect();
    }
  }, []);

  return {
    componentRef,
    optimizeForAnimation,
    createAnimation,
    createDebouncedCallback,
    createThrottledCallback,
    memoizeExpensiveCalculation,
    batchDOMOperations,
    measureAsyncOperation,
    preloadImages,
    optimizeImages,
    createVisibilityObserver,
    createPerformantStateUpdater,
    createVirtualScrollHelper,
    monitorMemoryUsage,
    cleanup
  };
};

// Hook for measuring component performance
export const useComponentPerformance = (componentName) => {
  const renderCount = useRef(0);
  const renderTimes = useRef([]);
  const mountTime = useRef(null);

  useEffect(() => {
    mountTime.current = performance.now();
    renderCount.current = 0;
    renderTimes.current = [];
  }, []);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now();
    renderTimes.current.push(renderTime);

    // Keep only last 10 render times
    if (renderTimes.current.length > 10) {
      renderTimes.current = renderTimes.current.slice(-10);
    }

    performanceMonitor.recordMetric('component_performance', {
      component: componentName,
      renderCount: renderCount.current,
      renderTime: renderTime,
      mountTime: mountTime.current
    });
  });

  const getPerformanceStats = useCallback(() => {
    const avgRenderTime = renderTimes.current.length > 1
      ? renderTimes.current.slice(1).reduce((sum, time, index) => 
          sum + (time - renderTimes.current[index]), 0) / (renderTimes.current.length - 1)
      : 0;

    return {
      renderCount: renderCount.current,
      averageRenderTime: avgRenderTime,
      totalMountTime: mountTime.current ? performance.now() - mountTime.current : 0
    };
  }, []);

  return { getPerformanceStats };
};

// Hook for optimizing list rendering
export const useVirtualizedList = (items, itemHeight, containerHeight) => {
  const { createVirtualScrollHelper } = usePerformanceOptimization('VirtualizedList');
  
  const virtualHelper = createVirtualScrollHelper(items, itemHeight, containerHeight);
  
  const getVisibleItems = useCallback((scrollTop) => {
    return virtualHelper.getVisibleItems(scrollTop);
  }, [virtualHelper]);

  return {
    getVisibleItems,
    totalHeight: virtualHelper.totalHeight
  };
};

// Hook for image optimization
export const useImageOptimization = () => {
  const optimizeImage = useCallback(async (file, options = {}) => {
    return imageOptimizer.optimizeImage(file, options);
  }, []);

  const createResponsiveSrcSet = useCallback(async (file, breakpoints) => {
    return imageOptimizer.createResponsiveSrcSet(file, breakpoints);
  }, []);

  const validateImage = useCallback((file, options = {}) => {
    return imageOptimizer.validateImage(file, options);
  }, []);

  return {
    optimizeImage,
    createResponsiveSrcSet,
    validateImage
  };
};

export default usePerformanceOptimization;