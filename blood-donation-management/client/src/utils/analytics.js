/**
 * Analytics and Monitoring System
 * Comprehensive analytics for PWA usage, performance, and user engagement
 */

import logger from './logger';

class AnalyticsManager {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.events = [];
    this.metrics = new Map();
    this.performanceEntries = [];
    this.userEngagement = {
      sessionStart: Date.now(),
      pageViews: 0,
      interactions: 0,
      timeSpent: 0,
      features: new Set()
    };
    
    this.initializeAnalytics();
  }

  // Initialize analytics system
  initializeAnalytics() {
    this.setupPerformanceMonitoring();
    this.setupUserEngagementTracking();
    this.setupErrorTracking();
    this.setupPWAMetrics();
    this.startSessionTracking();
    
    logger.info('Analytics system initialized', 'ANALYTICS', {
      sessionId: this.sessionId
    });
  }

  // Generate unique session ID
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set user ID for tracking
  setUserId(userId) {
    this.userId = userId;
    this.track('user_identified', { userId });
  }

  // Track custom events
  track(eventName, properties = {}, options = {}) {
    const event = {
      id: this.generateEventId(),
      name: eventName,
      properties: {
        ...properties,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        connection: this.getConnectionInfo(),
        device: this.getDeviceInfo()
      },
      options
    };

    this.events.push(event);
    this.processEvent(event);
    
    // Maintain event buffer size
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500);
    }

    logger.debug(`Event tracked: ${eventName}`, 'ANALYTICS', event.properties);
  }

  // Track page views
  trackPageView(path, title) {
    this.userEngagement.pageViews++;
    
    this.track('page_view', {
      path,
      title,
      referrer: document.referrer,
      pageLoadTime: this.getPageLoadTime()
    });
  }

  // Track user interactions
  trackInteraction(type, element, details = {}) {
    this.userEngagement.interactions++;
    
    this.track('user_interaction', {
      type,
      element,
      ...details
    });
  }

  // Track feature usage
  trackFeatureUsage(featureName, action = 'used', metadata = {}) {
    this.userEngagement.features.add(featureName);
    
    this.track('feature_usage', {
      feature: featureName,
      action,
      ...metadata
    });
  }

  // Track PWA-specific events
  trackPWAEvent(eventType, data = {}) {
    this.track('pwa_event', {
      eventType,
      ...data,
      isPWA: this.isPWA(),
      isStandalone: this.isStandalone(),
      installPromptAvailable: this.isInstallPromptAvailable()
    });
  }

  // Track performance metrics
  trackPerformance(metricName, value, context = {}) {
    const metric = {
      name: metricName,
      value,
      timestamp: Date.now(),
      context,
      sessionId: this.sessionId
    };

    this.performanceEntries.push(metric);
    this.metrics.set(metricName, value);

    this.track('performance_metric', {
      metric: metricName,
      value,
      ...context
    });
  }

  // Track notification events
  trackNotification(eventType, notificationData = {}) {
    this.track('notification_event', {
      eventType,
      ...notificationData,
      notificationPermission: Notification.permission,
      serviceWorkerSupported: 'serviceWorker' in navigator
    });
  }

  // Track emergency request events
  trackEmergencyRequest(eventType, requestData = {}) {
    this.track('emergency_request', {
      eventType,
      ...requestData,
      urgencyLevel: requestData.urgencyLevel,
      bloodType: requestData.bloodType,
      location: requestData.location
    });
  }

  // Track donor response events
  trackDonorResponse(eventType, responseData = {}) {
    this.track('donor_response', {
      eventType,
      ...responseData,
      responseTime: responseData.responseTime,
      donorLocation: responseData.donorLocation
    });
  }

  // Setup performance monitoring
  setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor resource loading
    this.observeResourceTiming();
    
    // Monitor navigation timing
    this.observeNavigationTiming();
    
    // Monitor long tasks
    this.observeLongTasks();
  }

  // Observe Core Web Vitals
  observeWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.trackPerformance('lcp', lastEntry.startTime, {
            element: lastEntry.element?.tagName
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        logger.warn('LCP observer not supported', 'ANALYTICS', error);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.trackPerformance('fid', entry.processingStart - entry.startTime, {
              eventType: entry.name
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        logger.warn('FID observer not supported', 'ANALYTICS', error);
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.trackPerformance('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        logger.warn('CLS observer not supported', 'ANALYTICS', error);
      }
    }
  }

  // Observe resource timing
  observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.duration > 1000) { // Only track slow resources
              this.trackPerformance('slow_resource', entry.duration, {
                name: entry.name,
                type: entry.initiatorType,
                size: entry.transferSize
              });
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        logger.warn('Resource observer not supported', 'ANALYTICS', error);
      }
    }
  }

  // Observe navigation timing
  observeNavigationTiming() {
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.trackPerformance('page_load_time', entry.loadEventEnd - entry.fetchStart);
            this.trackPerformance('dom_content_loaded', entry.domContentLoadedEventEnd - entry.fetchStart);
            this.trackPerformance('first_paint', entry.responseEnd - entry.fetchStart);
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        logger.warn('Navigation observer not supported', 'ANALYTICS', error);
      }
    }
  }

  // Observe long tasks
  observeLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.trackPerformance('long_task', entry.duration, {
              startTime: entry.startTime,
              attribution: entry.attribution?.[0]?.name
            });
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        logger.warn('Long task observer not supported', 'ANALYTICS', error);
      }
    }
  }

  // Setup user engagement tracking
  setupUserEngagementTracking() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEngagementPause();
      } else {
        this.trackEngagementResume();
      }
    });

    // Track user interactions
    ['click', 'touchstart', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.trackInteraction(eventType, event.target.tagName, {
          targetId: event.target.id,
          targetClass: event.target.className
        });
      }, { passive: true });
    });

    // Track scroll depth
    this.setupScrollTracking();

    // Track time on page
    this.setupTimeTracking();
  }

  // Setup scroll tracking
  setupScrollTracking() {
    let maxScroll = 0;
    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        // Track scroll milestones
        if ([25, 50, 75, 90, 100].includes(scrollPercent)) {
          this.track('scroll_depth', { percent: scrollPercent });
        }
      }
    };

    window.addEventListener('scroll', trackScroll, { passive: true });
  }

  // Setup time tracking
  setupTimeTracking() {
    setInterval(() => {
      if (!document.hidden) {
        this.userEngagement.timeSpent += 10000; // 10 seconds
      }
    }, 10000);
  }

  // Setup error tracking
  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.track('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.track('unhandled_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      });
    });
  }

  // Setup PWA metrics
  setupPWAMetrics() {
    // Track PWA installation
    window.addEventListener('beforeinstallprompt', (event) => {
      this.trackPWAEvent('install_prompt_shown');
    });

    window.addEventListener('appinstalled', () => {
      this.trackPWAEvent('app_installed');
    });

    // Track service worker events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'analytics') {
          this.track('service_worker_event', event.data);
        }
      });
    }
  }

  // Start session tracking
  startSessionTracking() {
    this.track('session_start', {
      referrer: document.referrer,
      landingPage: window.location.href
    });

    // Track session end on page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Track session end on visibility change (mobile)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseSession();
      } else {
        this.resumeSession();
      }
    });
  }

  // Process individual events
  processEvent(event) {
    // Send to external analytics service
    this.sendToAnalyticsService(event);
    
    // Store locally for offline analysis
    this.storeEventLocally(event);
    
    // Update real-time metrics
    this.updateRealTimeMetrics(event);
  }

  // Send event to external analytics service
  async sendToAnalyticsService(event) {
    try {
      // In production, this would send to analytics service like Google Analytics, Mixpanel, etc.
      if (process.env.NODE_ENV === 'production') {
        // await fetch('/api/v1/analytics/events', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(event)
        // });
      }
    } catch (error) {
      logger.error('Failed to send analytics event', 'ANALYTICS', error);
    }
  }

  // Store event locally
  storeEventLocally(event) {
    try {
      const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      storedEvents.push(event);
      
      // Keep only last 100 events
      const recentEvents = storedEvents.slice(-100);
      localStorage.setItem('analytics_events', JSON.stringify(recentEvents));
    } catch (error) {
      logger.warn('Failed to store analytics event locally', 'ANALYTICS', error);
    }
  }

  // Update real-time metrics
  updateRealTimeMetrics(event) {
    // Update engagement metrics based on event type
    switch (event.name) {
      case 'page_view':
        this.userEngagement.pageViews++;
        break;
      case 'user_interaction':
        this.userEngagement.interactions++;
        break;
      case 'feature_usage':
        this.userEngagement.features.add(event.properties.feature);
        break;
      default:
        // No specific metrics update needed for other event types
        break;
    }
  }

  // Utility methods
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  getPageLoadTime() {
    // Use modern Performance API if available
    if (performance.getEntriesByType) {
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0];
        return entry.loadEventEnd - entry.fetchStart;
      }
    }
    
    // Fallback to deprecated timing API
    if (performance.timing) {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    }
    
    return null;
  }

  getConnectionInfo() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }
    return null;
  }

  getDeviceInfo() {
    return {
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      deviceMemory: navigator.deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints
    };
  }

  isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  isInstallPromptAvailable() {
    return 'BeforeInstallPromptEvent' in window;
  }

  // Session management
  trackEngagementPause() {
    this.track('engagement_pause', {
      timeSpent: this.userEngagement.timeSpent
    });
  }

  trackEngagementResume() {
    this.track('engagement_resume');
  }

  pauseSession() {
    this.track('session_pause', {
      duration: Date.now() - this.userEngagement.sessionStart
    });
  }

  resumeSession() {
    this.track('session_resume');
  }

  endSession() {
    const sessionDuration = Date.now() - this.userEngagement.sessionStart;
    
    this.track('session_end', {
      duration: sessionDuration,
      pageViews: this.userEngagement.pageViews,
      interactions: this.userEngagement.interactions,
      featuresUsed: Array.from(this.userEngagement.features),
      timeSpent: this.userEngagement.timeSpent
    });
  }

  // Analytics reporting
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      duration: Date.now() - this.userEngagement.sessionStart,
      pageViews: this.userEngagement.pageViews,
      interactions: this.userEngagement.interactions,
      featuresUsed: Array.from(this.userEngagement.features),
      timeSpent: this.userEngagement.timeSpent,
      events: this.events.length,
      performanceMetrics: Object.fromEntries(this.metrics)
    };
  }

  getPerformanceReport() {
    return {
      metrics: Object.fromEntries(this.metrics),
      entries: this.performanceEntries,
      webVitals: {
        lcp: this.metrics.get('lcp'),
        fid: this.metrics.get('fid'),
        cls: this.metrics.get('cls')
      },
      pageLoadTime: this.metrics.get('page_load_time'),
      longTasks: this.performanceEntries.filter(entry => entry.name === 'long_task')
    };
  }

  getEngagementReport() {
    return {
      ...this.userEngagement,
      featuresUsed: Array.from(this.userEngagement.features),
      engagementScore: this.calculateEngagementScore()
    };
  }

  calculateEngagementScore() {
    const weights = {
      pageViews: 10,
      interactions: 5,
      timeSpent: 0.001, // per millisecond
      features: 20
    };

    return Math.round(
      this.userEngagement.pageViews * weights.pageViews +
      this.userEngagement.interactions * weights.interactions +
      this.userEngagement.timeSpent * weights.timeSpent +
      this.userEngagement.features.size * weights.features
    );
  }

  // Export data
  exportAnalyticsData() {
    return {
      session: this.getSessionSummary(),
      performance: this.getPerformanceReport(),
      engagement: this.getEngagementReport(),
      events: this.events,
      timestamp: new Date().toISOString()
    };
  }

  // Clear data
  clearAnalyticsData() {
    this.events = [];
    this.metrics.clear();
    this.performanceEntries = [];
    localStorage.removeItem('analytics_events');
    
    logger.info('Analytics data cleared', 'ANALYTICS');
  }
}

// Create singleton instance
const analytics = new AnalyticsManager();

export default analytics;