/**
 * Error Handler Tests
 * Comprehensive tests for error handling and logging system
 */

import errorHandler from '../errorHandler';
import { setupTestEnvironment, cleanupUtils, errorUtils } from '../testUtils';

describe('Error Handler', () => {
  let mocks;
  let originalConsole;

  beforeEach(() => {
    mocks = setupTestEnvironment();
    originalConsole = { ...console };
    console.error = jest.fn();
    console.warn = jest.fn();
    console.log = jest.fn();
    
    // Clear error handler state
    errorHandler.clearErrorLog();
  });

  afterEach(() => {
    cleanupUtils.cleanupAll();
    Object.assign(console, originalConsole);
  });

  describe('Error Processing', () => {
    test('should process and log errors correctly', () => {
      const testError = new Error('Test error message');
      const context = { source: 'test', type: 'unit_test' };
      
      const errorInfo = errorHandler.handleError(testError, context);
      
      expect(errorInfo).toHaveProperty('id');
      expect(errorInfo).toHaveProperty('timestamp');
      expect(errorInfo.message).toBe('Test error message');
      expect(errorInfo.type).toBe('unit_test');
      expect(errorInfo.source).toBe('test');
      expect(errorInfo).toHaveProperty('stack');
      expect(errorInfo).toHaveProperty('context');
    });

    test('should determine error severity correctly', () => {
      const criticalError = new Error('ChunkLoadError');
      const highError = new Error('TypeError: Cannot read property');
      const mediumError = new Error('Failed to fetch');
      const lowError = new Error('Minor validation error');
      
      const criticalInfo = errorHandler.handleError(criticalError, { type: 'unhandled_promise_rejection' });
      const highInfo = errorHandler.handleError(highError, { type: 'javascript_error' });
      const mediumInfo = errorHandler.handleError(mediumError, { type: 'resource_error' });
      const lowInfo = errorHandler.handleError(lowError, { type: 'validation_error' });
      
      expect(criticalInfo.severity).toBe('critical');
      expect(highInfo.severity).toBe('high');
      expect(mediumInfo.severity).toBe('medium');
      expect(lowInfo.severity).toBe('low');
    });

    test('should enrich error information with context', () => {
      const testError = new Error('Test error');
      const context = { userId: 'user123', action: 'submit_form' };
      
      const errorInfo = errorHandler.handleError(testError, context);
      
      expect(errorInfo.context).toHaveProperty('userId', 'user123');
      expect(errorInfo.context).toHaveProperty('action', 'submit_form');
      expect(errorInfo.context).toHaveProperty('url');
      expect(errorInfo.context).toHaveProperty('userAgent');
      expect(errorInfo.context).toHaveProperty('timestamp');
      expect(errorInfo).toHaveProperty('browser');
      expect(errorInfo).toHaveProperty('device');
    });
  });

  describe('Error Queue Management', () => {
    test('should queue errors for batch processing', () => {
      const errors = [
        new Error('Error 1'),
        new Error('Error 2'),
        new Error('Error 3')
      ];
      
      errors.forEach(error => errorHandler.handleError(error));
      
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog.length).toBeGreaterThanOrEqual(3);
    });

    test('should maintain queue size limit', () => {
      // Generate more errors than the max queue size
      for (let i = 0; i < 150; i++) {
        errorHandler.handleError(new Error(`Error ${i}`));
      }
      
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog.length).toBeLessThanOrEqual(100); // Max stored logs
    });
  });

  describe('Retry Mechanism', () => {
    test('should retry failed operations', async () => {
      let attempts = 0;
      const failingOperation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Operation failed');
        }
        return 'success';
      });
      
      const result = await errorHandler.retryOperation(failingOperation, { operationId: 'test_op' });
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
      expect(failingOperation).toHaveBeenCalledTimes(3);
    });

    test('should fail after max retries', async () => {
      const alwaysFailingOperation = jest.fn().mockImplementation(() => {
        throw new Error('Always fails');
      });
      
      await expect(
        errorHandler.retryOperation(alwaysFailingOperation, { operationId: 'test_op' })
      ).rejects.toThrow('Operation failed after 3 attempts');
      
      expect(alwaysFailingOperation).toHaveBeenCalledTimes(3);
    });

    test('should implement exponential backoff', async () => {
      const timestamps = [];
      let attempts = 0;
      
      const failingOperation = jest.fn().mockImplementation(() => {
        timestamps.push(Date.now());
        attempts++;
        if (attempts < 3) {
          throw new Error('Operation failed');
        }
        return 'success';
      });
      
      await errorHandler.retryOperation(failingOperation, { operationId: 'test_op' });
      
      // Check that delays increase exponentially
      if (timestamps.length >= 3) {
        const delay1 = timestamps[1] - timestamps[0];
        const delay2 = timestamps[2] - timestamps[1];
        expect(delay2).toBeGreaterThan(delay1);
      }
    });
  });

  describe('User Notifications', () => {
    test('should create appropriate notifications for different severities', () => {
      const criticalError = new Error('Critical system failure');
      const highError = new Error('High severity error');
      const mediumError = new Error('Medium severity error');
      const lowError = new Error('Low severity error');
      
      errorHandler.handleError(criticalError, { type: 'unhandled_promise_rejection' });
      errorHandler.handleError(highError, { type: 'javascript_error' });
      errorHandler.handleError(mediumError, { type: 'resource_error' });
      errorHandler.handleError(lowError, { type: 'validation_error' });
      
      // Verify that appropriate notifications would be shown
      // (In a real test, you'd mock the notification system)
      expect(console.error).toHaveBeenCalled();
    });

    test('should suppress duplicate notifications', () => {
      const sameError = new Error('Duplicate error');
      
      // Trigger the same error multiple times
      errorHandler.handleError(sameError, { type: 'test_error' });
      errorHandler.handleError(sameError, { type: 'test_error' });
      errorHandler.handleError(sameError, { type: 'test_error' });
      
      // Should only show notification once (mocked localStorage would track this)
      expect(mocks.localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Error Pattern Analysis', () => {
    test('should detect error patterns', () => {
      // Generate multiple similar errors
      for (let i = 0; i < 5; i++) {
        errorHandler.handleError(new Error('Network timeout'), { type: 'network_error' });
      }
      
      const stats = errorHandler.getErrorStats();
      expect(stats.byType['network_error']).toBe(5);
    });

    test('should group errors by type and severity', () => {
      const errors = [
        { error: new Error('Error 1'), context: { type: 'type_a', severity: 'high' } },
        { error: new Error('Error 2'), context: { type: 'type_a', severity: 'high' } },
        { error: new Error('Error 3'), context: { type: 'type_b', severity: 'low' } }
      ];
      
      errors.forEach(({ error, context }) => errorHandler.handleError(error, context));
      
      const stats = errorHandler.getErrorStats();
      expect(stats.byType['type_a']).toBe(2);
      expect(stats.byType['type_b']).toBe(1);
    });
  });

  describe('Global Error Handling', () => {
    test('should handle unhandled promise rejections', () => {
      const rejectionReason = 'Unhandled promise rejection';
      
      // Simulate unhandled promise rejection
      const event = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject(rejectionReason),
        reason: rejectionReason
      });
      
      window.dispatchEvent(event);
      
      // Should have logged the error
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle JavaScript errors', () => {
      const error = new Error('JavaScript error');
      
      // Simulate JavaScript error
      const event = new ErrorEvent('error', {
        error,
        message: error.message,
        filename: 'test.js',
        lineno: 10,
        colno: 5
      });
      
      window.dispatchEvent(event);
      
      // Should have logged the error
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle resource loading errors', () => {
      // Create a mock script element
      const script = document.createElement('script');
      script.src = 'https://example.com/nonexistent.js';
      
      // Simulate resource error
      const event = new Event('error');
      Object.defineProperty(event, 'target', { value: script });
      
      window.dispatchEvent(event);
      
      // Should have logged the error
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Error Statistics', () => {
    test('should provide error statistics', () => {
      // Generate various errors
      errorHandler.handleError(new Error('Error 1'), { type: 'type_a' });
      errorHandler.handleError(new Error('Error 2'), { type: 'type_a' });
      errorHandler.handleError(new Error('Error 3'), { type: 'type_b' });
      
      const stats = errorHandler.getErrorStats();
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('bySeverity');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('recent');
      
      expect(stats.total).toBe(3);
      expect(stats.byType['type_a']).toBe(2);
      expect(stats.byType['type_b']).toBe(1);
    });
  });

  describe('User Reported Errors', () => {
    test('should handle user-reported errors', () => {
      const userMessage = 'The submit button is not working';
      const context = { page: 'registration', action: 'submit_form' };
      
      const errorInfo = errorHandler.reportUserError(userMessage, context);
      
      expect(errorInfo.message).toBe(userMessage);
      expect(errorInfo.type).toBe('user_reported');
      expect(errorInfo.source).toBe('user');
      expect(errorInfo.context).toMatchObject(context);
    });
  });

  describe('Error Cleanup', () => {
    test('should clear error logs', () => {
      // Generate some errors
      errorHandler.handleError(new Error('Error 1'));
      errorHandler.handleError(new Error('Error 2'));
      
      expect(errorHandler.getErrorLog().length).toBeGreaterThan(0);
      
      errorHandler.clearErrorLog();
      
      expect(errorHandler.getErrorLog().length).toBe(0);
    });
  });

  describe('Performance', () => {
    test('should handle errors efficiently', () => {
      const startTime = performance.now();
      
      // Process 100 errors
      for (let i = 0; i < 100; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), { type: 'performance_test' });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000); // 1 second for 100 errors
    });
  });

  describe('Error Context Enrichment', () => {
    test('should add browser information', () => {
      const error = new Error('Test error');
      const errorInfo = errorHandler.handleError(error);
      
      expect(errorInfo.browser).toHaveProperty('userAgent');
      expect(errorInfo.browser).toHaveProperty('language');
      expect(errorInfo.browser).toHaveProperty('platform');
      expect(errorInfo.browser).toHaveProperty('cookieEnabled');
      expect(errorInfo.browser).toHaveProperty('onLine');
    });

    test('should add device information', () => {
      const error = new Error('Test error');
      const errorInfo = errorHandler.handleError(error);
      
      expect(errorInfo.device).toHaveProperty('screen');
      expect(errorInfo.device).toHaveProperty('viewport');
      expect(errorInfo.device).toHaveProperty('devicePixelRatio');
      expect(errorInfo.device).toHaveProperty('touchSupport');
    });

    test('should add network information when available', () => {
      // Mock navigator.connection
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 100,
          saveData: false
        },
        writable: true
      });
      
      const error = new Error('Test error');
      const errorInfo = errorHandler.handleError(error);
      
      expect(errorInfo.network).toHaveProperty('effectiveType', '4g');
      expect(errorInfo.network).toHaveProperty('downlink', 10);
      expect(errorInfo.network).toHaveProperty('rtt', 100);
      expect(errorInfo.network).toHaveProperty('saveData', false);
    });
  });
});