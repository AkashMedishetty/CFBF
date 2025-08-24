/**
 * Comprehensive Error Handling System
 * Centralized error handling with logging, reporting, and user feedback
 */

/* eslint-disable no-restricted-globals */
import logger from './logger';

class ErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.maxQueueSize = 100;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    
    this.initializeGlobalErrorHandling();
  }

  // Initialize global error handling
  initializeGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: 'unhandled_promise_rejection',
        source: 'global',
        url: window.location.href
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        type: 'javascript_error',
        source: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        url: window.location.href
      });
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError(new Error(`Resource failed to load: ${event.target.src || event.target.href}`), {
          type: 'resource_error',
          source: 'global',
          element: event.target.tagName,
          url: event.target.src || event.target.href
        });
      }
    }, true);
  }

  // Main error handling method
  handleError(error, context = {}) {
    try {
      const errorInfo = this.processError(error, context);
      
      // Log the error
      this.logError(errorInfo);
      
      // Add to queue for batch processing
      this.queueError(errorInfo);
      
      // Show user notification if appropriate
      this.showUserNotification(errorInfo);
      
      // Report to external service if configured
      this.reportError(errorInfo);
      
      return errorInfo;
    } catch (handlingError) {
      console.error('[ErrorHandler] Error in error handling:', handlingError);
    }
  }

  // Process and enrich error information
  processError(error, context) {
    const timestamp = new Date().toISOString();
    const errorId = this.generateErrorId();
    
    const errorInfo = {
      id: errorId,
      timestamp,
      message: error.message || 'Unknown error',
      stack: error.stack,
      name: error.name || 'Error',
      type: context.type || 'unknown',
      source: context.source || 'application',
      severity: this.determineSeverity(error, context),
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp,
        sessionId: this.getSessionId(),
        userId: this.getUserId()
      },
      browser: this.getBrowserInfo(),
      device: this.getDeviceInfo(),
      network: this.getNetworkInfo()
    };

    return errorInfo;
  }

  // Determine error severity
  determineSeverity(error, context) {
    // Critical errors that break core functionality
    if (context.type === 'unhandled_promise_rejection' || 
        error.message.includes('ChunkLoadError') ||
        error.message.includes('Network Error') ||
        context.source === 'emergency_request') {
      return 'critical';
    }
    
    // High severity errors that impact user experience
    if (context.type === 'javascript_error' ||
        error.message.includes('TypeError') ||
        error.message.includes('ReferenceError')) {
      return 'high';
    }
    
    // Medium severity errors
    if (context.type === 'resource_error' ||
        error.message.includes('Failed to fetch')) {
      return 'medium';
    }
    
    // Low severity errors
    return 'low';
  }

  // Log error with appropriate level
  logError(errorInfo) {
    const logData = {
      errorId: errorInfo.id,
      message: errorInfo.message,
      stack: errorInfo.stack,
      context: errorInfo.context,
      severity: errorInfo.severity
    };

    switch (errorInfo.severity) {
      case 'critical':
        logger.error('Critical error occurred', 'ERROR_HANDLER', logData);
        break;
      case 'high':
        logger.error('High severity error', 'ERROR_HANDLER', logData);
        break;
      case 'medium':
        logger.warn('Medium severity error', 'ERROR_HANDLER', logData);
        break;
      case 'low':
        logger.info('Low severity error', 'ERROR_HANDLER', logData);
        break;
      default:
        logger.error('Unknown severity error', 'ERROR_HANDLER', logData);
    }
  }

  // Queue error for batch processing
  queueError(errorInfo) {
    this.errorQueue.push(errorInfo);
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
    
    // Process queue periodically
    this.scheduleQueueProcessing();
  }

  // Show user notification based on error severity
  showUserNotification(errorInfo) {
    // Don't show notifications for low severity errors
    if (errorInfo.severity === 'low') return;
    
    // Don't spam users with notifications
    if (this.shouldSuppressNotification(errorInfo)) return;
    
    const notification = this.createUserNotification(errorInfo);
    this.displayNotification(notification);
  }

  // Create user-friendly notification
  createUserNotification(errorInfo) {
    const notifications = {
      critical: {
        title: 'System Error',
        message: 'A critical error occurred. Please refresh the page or contact support if the problem persists.',
        type: 'error',
        duration: 0, // Persistent
        actions: [
          { label: 'Refresh Page', action: () => window.location.reload() },
          { label: 'Report Issue', action: () => this.openReportDialog(errorInfo) }
        ]
      },
      high: {
        title: 'Something went wrong',
        message: 'An error occurred while processing your request. Please try again.',
        type: 'warning',
        duration: 8000,
        actions: [
          { label: 'Try Again', action: () => this.retryLastAction() },
          { label: 'Dismiss', action: () => {} }
        ]
      },
      medium: {
        title: 'Minor Issue',
        message: 'A minor issue occurred but the application should continue working normally.',
        type: 'info',
        duration: 5000,
        actions: [
          { label: 'Dismiss', action: () => {} }
        ]
      }
    };

    return notifications[errorInfo.severity] || notifications.medium;
  }

  // Display notification to user
  displayNotification(notification) {
    // Try to use the app's notification system first
    if (window.showNotification) {
      window.showNotification(notification);
      return;
    }
    
    // Fallback to browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png'
      });
      return;
    }
    
    // Fallback to console for development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[User Notification] ${notification.title}: ${notification.message}`);
    }
  }

  // Check if notification should be suppressed
  shouldSuppressNotification(errorInfo) {
    const suppressionKey = `${errorInfo.type}_${errorInfo.message}`;
    const lastShown = localStorage.getItem(`error_notification_${suppressionKey}`);
    
    if (lastShown) {
      const timeSinceLastShown = Date.now() - parseInt(lastShown);
      // Suppress if shown within last 5 minutes
      if (timeSinceLastShown < 5 * 60 * 1000) {
        return true;
      }
    }
    
    localStorage.setItem(`error_notification_${suppressionKey}`, Date.now().toString());
    return false;
  }

  // Report error to external service
  async reportError(errorInfo) {
    // Only report critical and high severity errors
    if (!['critical', 'high'].includes(errorInfo.severity)) return;
    
    try {
      // In a real application, this would send to an error reporting service
      // like Sentry, Bugsnag, or a custom endpoint
      const reportData = {
        ...errorInfo,
        // Remove sensitive information
        context: {
          ...errorInfo.context,
          userId: errorInfo.context.userId ? 'redacted' : null
        }
      };
      
      // Simulate API call
      if (process.env.NODE_ENV === 'development') {
        console.log('[ErrorHandler] Would report error:', reportData);
      } else {
        // await fetch('/api/v1/errors/report', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(reportData)
        // });
      }
    } catch (reportingError) {
      console.error('[ErrorHandler] Failed to report error:', reportingError);
    }
  }

  // Schedule queue processing
  scheduleQueueProcessing() {
    if (this.queueProcessingScheduled) return;
    
    this.queueProcessingScheduled = true;
    setTimeout(() => {
      this.processErrorQueue();
      this.queueProcessingScheduled = false;
    }, 5000); // Process every 5 seconds
  }

  // Process error queue
  async processErrorQueue() {
    if (this.errorQueue.length === 0) return;
    
    const errors = [...this.errorQueue];
    this.errorQueue = [];
    
    try {
      // Batch process errors
      await this.batchProcessErrors(errors);
    } catch (error) {
      console.error('[ErrorHandler] Failed to process error queue:', error);
      // Re-queue errors for retry
      this.errorQueue.unshift(...errors);
    }
  }

  // Batch process errors
  async batchProcessErrors(errors) {
    // Group errors by type for analysis
    const errorGroups = this.groupErrorsByType(errors);
    
    // Analyze patterns
    const patterns = this.analyzeErrorPatterns(errorGroups);
    
    // Log patterns for monitoring
    if (patterns.length > 0) {
      logger.warn('Error patterns detected', 'ERROR_HANDLER', { patterns });
    }
    
    // Store errors locally for offline analysis
    this.storeErrorsLocally(errors);
  }

  // Group errors by type
  groupErrorsByType(errors) {
    const groups = {};
    
    errors.forEach(error => {
      const key = `${error.type}_${error.name}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(error);
    });
    
    return groups;
  }

  // Analyze error patterns
  analyzeErrorPatterns(errorGroups) {
    const patterns = [];
    
    Object.entries(errorGroups).forEach(([type, errors]) => {
      if (errors.length >= 3) {
        patterns.push({
          type,
          count: errors.length,
          timespan: errors[errors.length - 1].timestamp - errors[0].timestamp,
          severity: errors[0].severity
        });
      }
    });
    
    return patterns;
  }

  // Store errors locally
  storeErrorsLocally(errors) {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('error_log') || '[]');
      const updatedErrors = [...existingErrors, ...errors].slice(-50); // Keep last 50 errors
      localStorage.setItem('error_log', JSON.stringify(updatedErrors));
    } catch (error) {
      console.warn('[ErrorHandler] Failed to store errors locally:', error);
    }
  }

  // Retry mechanism
  async retryOperation(operation, context = {}) {
    const operationId = context.operationId || this.generateErrorId();
    const attempts = this.retryAttempts.get(operationId) || 0;
    
    if (attempts >= this.maxRetries) {
      throw new Error(`Operation failed after ${this.maxRetries} attempts`);
    }
    
    try {
      const result = await operation();
      this.retryAttempts.delete(operationId);
      return result;
    } catch (error) {
      this.retryAttempts.set(operationId, attempts + 1);
      
      // Exponential backoff
      const delay = Math.pow(2, attempts) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      this.handleError(error, {
        ...context,
        type: 'retry_attempt',
        attempt: attempts + 1,
        operationId
      });
      
      return this.retryOperation(operation, { ...context, operationId });
    }
  }

  // Utility methods
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSessionId() {
    return sessionStorage.getItem('sessionId') || 'unknown';
  }

  getUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || null;
    } catch {
      return null;
    }
  }

  getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  getDeviceInfo() {
    return {
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      devicePixelRatio: window.devicePixelRatio || 1,
      touchSupport: 'ontouchstart' in window
    };
  }

  getNetworkInfo() {
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

  // Public API methods
  reportUserError(message, context = {}) {
    const error = new Error(message);
    return this.handleError(error, {
      ...context,
      type: 'user_reported',
      source: 'user'
    });
  }

  getErrorLog() {
    try {
      return JSON.parse(localStorage.getItem('error_log') || '[]');
    } catch {
      return [];
    }
  }

  clearErrorLog() {
    localStorage.removeItem('error_log');
    this.errorQueue = [];
    this.retryAttempts.clear();
  }

  getErrorStats() {
    const errors = this.getErrorLog();
    const stats = {
      total: errors.length,
      bySeverity: {},
      byType: {},
      recent: errors.filter(e => Date.now() - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000).length
    };
    
    errors.forEach(error => {
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });
    
    return stats;
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Export convenience methods
export const handleError = (error, context) => errorHandler.handleError(error, context);
export const retryOperation = (operation, context) => errorHandler.retryOperation(operation, context);
export const reportUserError = (message, context) => errorHandler.reportUserError(message, context);

export default errorHandler;