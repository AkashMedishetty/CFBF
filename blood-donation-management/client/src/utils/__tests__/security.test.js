/**
 * Security Utility Tests
 * Comprehensive tests for security measures and protection
 */

import security from '../security';
import { setupTestEnvironment, cleanupUtils, mockData } from '../testUtils';

describe('Security Manager', () => {
  let mocks;

  beforeEach(() => {
    mocks = setupTestEnvironment();
    // Reset security manager state
    security.clearSecurityData();
  });

  afterEach(() => {
    cleanupUtils.cleanupAll();
  });

  describe('Input Validation', () => {
    test('should validate normal text input', () => {
      const result = security.validateInput('Hello World', 'text');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello World');
      expect(result.error).toBeNull();
    });

    test('should reject XSS attempts', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const result = security.validateInput(maliciousInput, 'text', { allowHTML: false });
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('HTML content not allowed');
    });

    test('should sanitize HTML when allowed', () => {
      const htmlInput = '<p>Hello <script>alert("xss")</script> World</p>';
      const result = security.validateInput(htmlInput, 'text', { allowHTML: true });
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).toContain('<p>');
    });

    test('should validate email format', () => {
      const validEmail = 'user@example.com';
      const invalidEmail = 'invalid-email';
      
      const validResult = security.validateInput(validEmail, 'email');
      const invalidResult = security.validateInput(invalidEmail, 'email');
      
      expect(validResult.isValid).toBe(true);
      expect(validResult.sanitized).toBe('user@example.com');
      
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('Invalid email format');
    });

    test('should validate phone format', () => {
      const validPhone = '+1234567890';
      const invalidPhone = '123';
      
      const validResult = security.validateInput(validPhone, 'phone');
      const invalidResult = security.validateInput(invalidPhone, 'phone');
      
      expect(validResult.isValid).toBe(true);
      expect(validResult.sanitized).toBe('1234567890');
      
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('Invalid phone number format');
    });

    test('should enforce length limits', () => {
      const shortInput = 'Hi';
      const longInput = 'A'.repeat(1001);
      
      const shortResult = security.validateInput(shortInput, 'text', { minLength: 5 });
      const longResult = security.validateInput(longInput, 'text', { maxLength: 1000 });
      
      expect(shortResult.isValid).toBe(false);
      expect(shortResult.error).toContain('too short');
      
      expect(longResult.isValid).toBe(false);
      expect(longResult.error).toContain('too long');
    });

    test('should validate against custom patterns', () => {
      const pattern = /^[A-Z]+$/; // Only uppercase letters
      const validInput = 'HELLO';
      const invalidInput = 'hello';
      
      const validResult = security.validateInput(validInput, 'text', { pattern });
      const invalidResult = security.validateInput(invalidInput, 'text', { pattern });
      
      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('Input format is invalid');
    });
  });

  describe('Rate Limiting', () => {
    test('should allow requests within limit', () => {
      const key = 'test_action';
      
      // Should allow first 5 requests
      for (let i = 0; i < 5; i++) {
        const allowed = security.checkRateLimit(key, 5, 60000);
        expect(allowed).toBe(true);
      }
    });

    test('should block requests exceeding limit', () => {
      const key = 'test_action';
      
      // Fill up the rate limit
      for (let i = 0; i < 5; i++) {
        security.checkRateLimit(key, 5, 60000);
      }
      
      // Next request should be blocked
      const blocked = security.checkRateLimit(key, 5, 60000);
      expect(blocked).toBe(false);
    });

    test('should reset rate limit after time window', () => {
      const key = 'test_action';
      const windowMs = 100; // 100ms window
      
      // Fill up the rate limit
      for (let i = 0; i < 3; i++) {
        security.checkRateLimit(key, 3, windowMs);
      }
      
      // Should be blocked
      expect(security.checkRateLimit(key, 3, windowMs)).toBe(false);
      
      // Wait for window to expire
      return new Promise(resolve => {
        setTimeout(() => {
          // Should be allowed again
          expect(security.checkRateLimit(key, 3, windowMs)).toBe(true);
          resolve();
        }, windowMs + 10);
      });
    });
  });

  describe('Secure Storage', () => {
    test('should store and retrieve data securely', () => {
      const testData = { message: 'secret data', value: 12345 };
      
      const stored = security.secureStore('test_key', testData, true);
      expect(stored).toBe(true);
      
      const retrieved = security.secureRetrieve('test_key', true);
      expect(retrieved).toEqual(testData);
    });

    test('should store data without encryption', () => {
      const testData = { message: 'public data' };
      
      const stored = security.secureStore('test_key', testData, false);
      expect(stored).toBe(true);
      
      const retrieved = security.secureRetrieve('test_key', false);
      expect(retrieved).toEqual(testData);
    });

    test('should handle storage errors gracefully', () => {
      // Mock localStorage to throw error
      mocks.localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const testData = { message: 'test' };
      const stored = security.secureStore('test_key', testData);
      
      expect(stored).toBe(false);
    });

    test('should handle retrieval errors gracefully', () => {
      // Mock localStorage to return invalid data
      mocks.localStorage.getItem.mockReturnValue('invalid-json');
      
      const retrieved = security.secureRetrieve('test_key');
      expect(retrieved).toBeNull();
    });
  });

  describe('Token Generation', () => {
    test('should generate secure tokens', () => {
      const token1 = security.generateSecureToken();
      const token2 = security.generateSecureToken();
      
      expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2); // Should be unique
      expect(token1).toMatch(/^[a-f0-9]+$/); // Should be hex
    });

    test('should generate tokens of custom length', () => {
      const shortToken = security.generateSecureToken(16);
      const longToken = security.generateSecureToken(64);
      
      expect(shortToken).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(longToken).toHaveLength(128); // 64 bytes = 128 hex chars
    });
  });

  describe('Encryption/Decryption', () => {
    test('should encrypt and decrypt data correctly', () => {
      const originalText = 'This is secret data';
      
      const encrypted = security.encrypt(originalText);
      expect(encrypted).not.toBe(originalText);
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64 format
      
      const decrypted = security.decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    test('should handle decryption errors', () => {
      const invalidEncrypted = 'invalid-encrypted-data';
      
      expect(() => {
        security.decrypt(invalidEncrypted);
      }).toThrow('Decryption failed');
    });
  });

  describe('Suspicious Content Detection', () => {
    test('should detect suspicious input patterns', () => {
      const suspiciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '<img onerror="alert(1)" src="x">',
        'eval(maliciousCode)',
        'document.cookie = "stolen"',
        'window.location = "evil.com"'
      ];
      
      suspiciousInputs.forEach(input => {
        const result = security.validateInput(input, 'text', { allowHTML: false });
        expect(result.isValid).toBe(false);
      });
    });

    test('should allow safe content', () => {
      const safeInputs = [
        'Hello World',
        'user@example.com',
        '+1234567890',
        'This is a normal message',
        '123.45'
      ];
      
      safeInputs.forEach(input => {
        const result = security.validateInput(input, 'text');
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Security Report', () => {
    test('should generate security report', () => {
      const report = security.getSecurityReport();
      
      expect(report).toHaveProperty('csrfToken');
      expect(report).toHaveProperty('rateLimits');
      expect(report).toHaveProperty('securityEvents');
      expect(report).toHaveProperty('isHTTPS');
      expect(report).toHaveProperty('hasCSP');
      
      expect(typeof report.isHTTPS).toBe('boolean');
      expect(typeof report.hasCSP).toBe('boolean');
      expect(Array.isArray(report.securityEvents)).toBe(true);
    });
  });

  describe('URL Validation', () => {
    test('should validate allowed URLs', () => {
      // Mock current origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://callforblood.org' },
        writable: true
      });
      
      const allowedUrls = [
        '/api/users',
        'https://callforblood.org/api/requests',
        'https://api.callforblood.org/donors'
      ];
      
      allowedUrls.forEach(url => {
        const isAllowed = security.isAllowedURL(url);
        expect(isAllowed).toBe(true);
      });
    });

    test('should reject suspicious URLs', () => {
      const suspiciousUrls = [
        'https://evil.com/steal-data',
        'http://malicious-site.com',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>'
      ];
      
      suspiciousUrls.forEach(url => {
        const isAllowed = security.isAllowedURL(url);
        expect(isAllowed).toBe(false);
      });
    });
  });

  describe('CSRF Protection', () => {
    test('should generate CSRF token on initialization', () => {
      const report = security.getSecurityReport();
      expect(report.csrfToken).toBe('Set');
      
      // Check if meta tag is created
      const csrfMeta = document.querySelector('meta[name="csrf-token"]');
      expect(csrfMeta).toBeTruthy();
      expect(csrfMeta.content).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle validation errors gracefully', () => {
      // Test with null input
      const nullResult = security.validateInput(null);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.error).toBe('Input must be a string');
      
      // Test with undefined input
      const undefinedResult = security.validateInput(undefined);
      expect(undefinedResult.isValid).toBe(false);
      expect(undefinedResult.error).toBe('Input must be a string');
    });

    test('should handle rate limiting errors gracefully', () => {
      // Test with invalid parameters
      const result1 = security.checkRateLimit('', 5, 60000);
      const result2 = security.checkRateLimit('test', -1, 60000);
      const result3 = security.checkRateLimit('test', 5, -1);
      
      // Should handle gracefully without throwing
      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
      expect(typeof result3).toBe('boolean');
    });
  });

  describe('Performance', () => {
    test('should validate input quickly', () => {
      const startTime = performance.now();
      
      // Validate 100 inputs
      for (let i = 0; i < 100; i++) {
        security.validateInput(`test input ${i}`, 'text');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (100ms for 100 validations)
      expect(duration).toBeLessThan(100);
    });

    test('should handle rate limiting efficiently', () => {
      const startTime = performance.now();
      
      // Check rate limit 1000 times
      for (let i = 0; i < 1000; i++) {
        security.checkRateLimit(`test_${i % 10}`, 10, 60000);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(100);
    });
  });
});