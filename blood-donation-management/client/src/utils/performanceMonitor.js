/**
 * Performance Monitoring Utility
 * Tracks and optimizes application performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true';
    
    if (this.isEnabled) {
      this.initializeObservers();
    }
  }

  // Initialize performance observers
  initializeObservers() {
    // Performance Observer for navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('navigation', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
              type: entry.entryType
            });
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navObserver);
      } catch (error) {
        console.warn('[Performance] Navigation observer not supported:', error);
      }

      // Performance Observer for resource loading
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 100) { // Only track slow resources
              this.recordMetric('resource', {
                name: entry.name,
                duration: entry.duration,
                size: entry.transferSize || 0,
                type: this.getResourceType(entry.name)
              });
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (error) {
        console.warn('[Performance] Resource observer not supported:', error);
      }

      // Performance Observer for long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('longtask', {
              duration: entry.duration,
              startTime: entry.startTime,
              attribution: entry.attribution
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (error) {
        console.warn('[Performance] Long task observer not supported:', error);
      }
    }

    // Monitor frame rate
    this.startFrameRateMonitoring();
  }

  // Start monitoring frame rate for 60fps target
  startFrameRateMonitoring() {
    let lastTime = performance.now();
    let frameCount = 0;
    let totalFrameTime = 0;

    const measureFrameRate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      frameCount++;
      totalFrameTime += deltaTime;

      // Calculate FPS every second
      if (totalFrameTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / totalFrameTime);
        this.recordMetric('framerate', {
          fps,
          timestamp: currentTime,
          target: 60
        });

        // Reset counters
        frameCount = 0;
        totalFrameTime = 0;
      }

      lastTime = currentTime;
      requestAnimationFrame(measureFrameRate);
    };

    requestAnimationFrame(measureFrameRate);
  }

  // Record performance metric
  recordMetric(category, data) {
    if (!this.isEnabled) return;

    const timestamp = Date.now();
    const key = `${category}_${timestamp}`;
    
    this.metrics.set(key, {
      category,
      timestamp,
      ...data
    });

    // Keep only last 100 metrics per category to prevent memory leaks
    this.cleanupMetrics(category);

    // Log critical performance issues
    this.checkPerformanceThresholds(category, data);
  }

  // Clean up old metrics
  cleanupMetrics(category) {
    const categoryMetrics = Array.from(this.metrics.entries())
      .filter(([, metric]) => metric.category === category)
      .sort(([, a], [, b]) => b.timestamp - a.timestamp);

    if (categoryMetrics.length > 100) {
      const toDelete = categoryMetrics.slice(100);
      toDelete.forEach(([key]) => this.metrics.delete(key));
    }
  }

  // Check performance thresholds and warn about issues
  checkPerformanceThresholds(category, data) {
    switch (category) {
      case 'navigation':
        if (data.duration > 2000) {
          console.warn(`[Performance] Slow navigation: ${data.duration}ms for ${data.name}`);
        }
        break;
      
      case 'resource':
        if (data.duration > 1000) {
          console.warn(`[Performance] Slow resource load: ${data.duration}ms for ${data.name}`);
        }
        if (data.size > 1024 * 1024) { // 1MB
          console.warn(`[Performance] Large resource: ${(data.size / 1024 / 1024).toFixed(2)}MB for ${data.name}`);
        }
        break;
      
      case 'longtask':
        if (data.duration > 50) {
          console.warn(`[Performance] Long task detected: ${data.duration}ms`);
        }
        break;
      
      case 'framerate':
        if (data.fps < 30) {
          console.warn(`[Performance] Low frame rate: ${data.fps}fps (target: 60fps)`);
        }
        break;
    }
  }

  // Get resource type from URL
  getResourceType(url) {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    } else if (['js', 'jsx', 'ts', 'tsx'].includes(extension)) {
      return 'script';
    } else if (['css'].includes(extension)) {
      return 'stylesheet';
    } else if (['woff', 'woff2', 'ttf', 'otf'].includes(extension)) {
      return 'font';
    } else if (['mp4', 'webm', 'ogg'].includes(extension)) {
      return 'video';
    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return 'audio';
    }
    
    return 'other';
  }

  // Measure component render time
  measureComponentRender(componentName, renderFunction) {
    if (!this.isEnabled) return renderFunction();

    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();

    this.recordMetric('component_render', {
      component: componentName,
      duration: endTime - startTime
    });

    return result;
  }

  // Measure async operation
  async measureAsyncOperation(operationName, asyncFunction) {
    if (!this.isEnabled) return await asyncFunction();

    const startTime = performance.now();
    try {
      const result = await asyncFunction();
      const endTime = performance.now();
      
      this.recordMetric('async_operation', {
        operation: operationName,
        duration: endTime - startTime,
        success: true
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      this.recordMetric('async_operation', {
        operation: operationName,
        duration: endTime - startTime,
        success: false,
        error: error.message
      });
      
      throw error;
    }
  }

  // Get performance summary
  getPerformanceSummary() {
    if (!this.isEnabled) return null;

    const summary = {
      navigation: [],
      resources: [],
      longTasks: [],
      frameRate: [],
      componentRenders: [],
      asyncOperations: []
    };

    for (const [, metric] of this.metrics.entries()) {
      switch (metric.category) {
        case 'navigation':
          summary.navigation.push(metric);
          break;
        case 'resource':
          summary.resources.push(metric);
          break;
        case 'longtask':
          summary.longTasks.push(metric);
          break;
        case 'framerate':
          summary.frameRate.push(metric);
          break;
        case 'component_render':
          summary.componentRenders.push(metric);
          break;
        case 'async_operation':
          summary.asyncOperations.push(metric);
          break;
      }
    }

    // Calculate averages
    const calculateAverage = (items, field) => {
      if (items.length === 0) return 0;
      return items.reduce((sum, item) => sum + item[field], 0) / items.length;
    };

    return {
      ...summary,
      averages: {
        navigationTime: calculateAverage(summary.navigation, 'duration'),
        resourceLoadTime: calculateAverage(summary.resources, 'duration'),
        frameRate: calculateAverage(summary.frameRate, 'fps'),
        componentRenderTime: calculateAverage(summary.componentRenders, 'duration'),
        asyncOperationTime: calculateAverage(summary.asyncOperations, 'duration')
      },
      counts: {
        totalNavigations: summary.navigation.length,
        totalResources: summary.resources.length,
        longTasksCount: summary.longTasks.length,
        componentRenders: summary.componentRenders.length,
        asyncOperations: summary.asyncOperations.length
      }
    };
  }

  // Export performance data
  exportPerformanceData() {
    if (!this.isEnabled) return null;

    const summary = this.getPerformanceSummary();
    const exportData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null,
      summary
    };

    return exportData;
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Disconnect all observers
  disconnect() {
    for (const [, observer] of this.observers.entries()) {
      observer.disconnect();
    }
    this.observers.clear();
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;