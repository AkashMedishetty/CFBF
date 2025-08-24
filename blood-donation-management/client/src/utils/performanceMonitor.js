// Performance monitoring utility for Core Web Vitals and custom metrics

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
    this.isEnabled = process.env.NODE_ENV === 'production';
    
    if (this.isEnabled) {
      this.initializeObservers();
    }
  }

  initializeObservers() {
    // Performance Observer for navigation timing
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordMetric('FID', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.recordMetric('CLS', clsValue);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);

      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }

    // First Contentful Paint (FCP)
    this.measureFCP();
    
    // Time to Interactive (TTI)
    this.measureTTI();
  }

  measureFCP() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.recordMetric('FCP', fcpEntry.startTime);
      }
    }
  }

  measureTTI() {
    // Simplified TTI measurement - when main thread is idle for 5 seconds
    if ('requestIdleCallback' in window) {
      const startTime = performance.now();
      requestIdleCallback(() => {
        this.recordMetric('TTI', performance.now() - startTime);
      }, { timeout: 5000 });
    }
  }

  recordMetric(name, value) {
    this.metrics[name] = {
      value: Math.round(value),
      timestamp: Date.now()
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance Metric - ${name}: ${Math.round(value)}ms`);
    }

    // Send to analytics in production
    if (this.isEnabled) {
      this.sendToAnalytics(name, value);
    }
  }

  sendToAnalytics(name, value) {
    // In a real implementation, this would send to your analytics service
    // For now, we'll just store it locally
    try {
      const existingMetrics = JSON.parse(localStorage.getItem('performance_metrics') || '{}');
      existingMetrics[name] = {
        value: Math.round(value),
        timestamp: Date.now(),
        url: window.location.pathname
      };
      localStorage.setItem('performance_metrics', JSON.stringify(existingMetrics));
    } catch (error) {
      console.warn('Failed to store performance metrics:', error);
    }
  }

  // Custom timing measurements
  startTiming(name) {
    if (!this.isEnabled) return;
    
    this.metrics[`${name}_start`] = performance.now();
  }

  endTiming(name) {
    if (!this.isEnabled) return;
    
    const startTime = this.metrics[`${name}_start`];
    if (startTime) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration);
      delete this.metrics[`${name}_start`];
    }
  }

  // Measure component render time
  measureComponentRender(componentName, renderFunction) {
    if (!this.isEnabled) return renderFunction();
    
    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();
    
    this.recordMetric(`component_${componentName}`, endTime - startTime);
    return result;
  }

  // Measure resource loading
  measureResourceLoading() {
    if (!('performance' in window)) return;

    const resources = performance.getEntriesByType('resource');
    const resourceMetrics = {};

    resources.forEach(resource => {
      const type = this.getResourceType(resource.name);
      if (!resourceMetrics[type]) {
        resourceMetrics[type] = {
          count: 0,
          totalSize: 0,
          totalTime: 0
        };
      }

      resourceMetrics[type].count++;
      resourceMetrics[type].totalSize += resource.transferSize || 0;
      resourceMetrics[type].totalTime += resource.duration;
    });

    Object.entries(resourceMetrics).forEach(([type, metrics]) => {
      this.recordMetric(`resource_${type}_count`, metrics.count);
      this.recordMetric(`resource_${type}_size`, metrics.totalSize);
      this.recordMetric(`resource_${type}_time`, metrics.totalTime);
    });
  }

  getResourceType(url) {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  // Get current metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Get performance score based on Core Web Vitals
  getPerformanceScore() {
    const { LCP, FID, CLS, FCP } = this.metrics;
    let score = 100;

    // LCP scoring (Good: <2.5s, Needs Improvement: 2.5s-4s, Poor: >4s)
    if (LCP) {
      if (LCP.value > 4000) score -= 30;
      else if (LCP.value > 2500) score -= 15;
    }

    // FID scoring (Good: <100ms, Needs Improvement: 100ms-300ms, Poor: >300ms)
    if (FID) {
      if (FID.value > 300) score -= 25;
      else if (FID.value > 100) score -= 10;
    }

    // CLS scoring (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
    if (CLS) {
      if (CLS.value > 0.25) score -= 25;
      else if (CLS.value > 0.1) score -= 10;
    }

    // FCP scoring (Good: <1.8s, Needs Improvement: 1.8s-3s, Poor: >3s)
    if (FCP) {
      if (FCP.value > 3000) score -= 20;
      else if (FCP.value > 1800) score -= 10;
    }

    return Math.max(0, score);
  }

  // Clean up observers
  cleanup() {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Error disconnecting performance observer:', error);
      }
    });
    this.observers = [];
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  return {
    startTiming: (name) => performanceMonitor.startTiming(name),
    endTiming: (name) => performanceMonitor.endTiming(name),
    recordMetric: (name, value) => performanceMonitor.recordMetric(name, value),
    getMetrics: () => performanceMonitor.getMetrics(),
    getPerformanceScore: () => performanceMonitor.getPerformanceScore()
  };
};

export default performanceMonitor;