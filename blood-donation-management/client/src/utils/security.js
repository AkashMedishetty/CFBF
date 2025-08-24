/**
 * Security Utility
 * Comprehensive security measures for client-side protection
 */

import logger from './logger';

class SecurityManager {
  constructor() {
    this.rateLimits = new Map();
    this.securityEvents = [];
    this.maxSecurityEvents = 100;
    this.csrfToken = null;
    
    this.initializeSecurity();
  }

  // Initialize security measures
  initializeSecurity() {
    this.setupCSRFProtection();
    this.setupContentSecurityPolicy();
    this.setupSecurityHeaders();
    this.monitorSecurityEvents();
    
    logger.info('Security manager initialized', 'SECURITY');
  }

  // Setup CSRF protection
  setupCSRFProtection() {
    // Generate CSRF token
    this.csrfToken = this.generateSecureToken();
    
    // Store in meta tag for server validation
    let csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (!csrfMeta) {
      csrfMeta = document.createElement('meta');
      csrfMeta.name = 'csrf-token';
      document.head.appendChild(csrfMeta);
    }
    csrfMeta.content = this.csrfToken;
    
    logger.debug('CSRF protection initialized', 'SECURITY');
  }

  // Setup Content Security Policy
  setupContentSecurityPolicy() {
    // Check if CSP is already set
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) return;
    
    // Create CSP meta tag
    const csp = document.createElement('meta');
    csp.httpEquiv = 'Content-Security-Policy';
    csp.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for React
      "style-src 'self' 'unsafe-inline'", // Allow inline styles
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    document.head.appendChild(csp);
    logger.debug('Content Security Policy set', 'SECURITY');
  }

  // Setup security headers
  setupSecurityHeaders() {
    // These would typically be set by the server, but we can add some client-side measures
    
    // Prevent clickjacking
    if (window.self !== window.top) {
      logger.security('Potential clickjacking attempt detected', { 
        referrer: document.referrer,
        location: window.location.href 
      });
    }
    
    // Check for HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      logger.security('Insecure connection detected', { 
        protocol: window.location.protocol,
        hostname: window.location.hostname 
      });
    }
  }

  // Monitor security events
  monitorSecurityEvents() {
    // Monitor for suspicious activities
    this.setupDOMMonitoring();
    this.setupNetworkMonitoring();
    this.setupInputMonitoring();
  }

  // Setup DOM monitoring for suspicious changes
  setupDOMMonitoring() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.checkSuspiciousElement(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Check for suspicious elements
  checkSuspiciousElement(element) {
    // Check for suspicious scripts
    if (element.tagName === 'SCRIPT') {
      const src = element.src;
      const content = element.textContent;
      
      if (src && !this.isAllowedScript(src)) {
        logger.security('Suspicious script detected', { src, content: content.substring(0, 100) });
        element.remove();
      }
    }
    
    // Check for suspicious iframes
    if (element.tagName === 'IFRAME') {
      const src = element.src;
      if (src && !this.isAllowedFrame(src)) {
        logger.security('Suspicious iframe detected', { src });
        element.remove();
      }
    }
  }

  // Check if script source is allowed
  isAllowedScript(src) {
    const allowedDomains = [
      window.location.origin,
      'https://cdnjs.cloudflare.com',
      'https://unpkg.com'
    ];
    
    return allowedDomains.some(domain => src.startsWith(domain));
  }

  // Check if frame source is allowed
  isAllowedFrame(src) {
    const allowedDomains = [
      window.location.origin
    ];
    
    return allowedDomains.some(domain => src.startsWith(domain));
  }

  // Setup network monitoring
  setupNetworkMonitoring() {
    // Override fetch to monitor requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options = {}] = args;
      
      // Add CSRF token to requests
      if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
        options.headers = {
          ...options.headers,
          'X-CSRF-Token': this.csrfToken
        };
      }
      
      // Log suspicious requests
      if (typeof url === 'string' && !this.isAllowedURL(url)) {
        logger.security('Suspicious network request', { url, method: options.method });
      }
      
      return originalFetch.apply(this, args);
    };
  }

  // Check if URL is allowed
  isAllowedURL(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      const allowedOrigins = [
        window.location.origin,
        'https://api.callforblood.org'
      ];
      
      return allowedOrigins.includes(urlObj.origin);
    } catch {
      return false;
    }
  }

  // Setup input monitoring
  setupInputMonitoring() {
    document.addEventListener('input', (event) => {
      const value = event.target.value;
      if (this.containsSuspiciousContent(value)) {
        logger.security('Suspicious input detected', { 
          tagName: event.target.tagName,
          type: event.target.type,
          name: event.target.name,
          value: value.substring(0, 50)
        });
      }
    });
  }

  // Check for suspicious content in inputs
  containsSuspiciousContent(value) {
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /document\.cookie/gi,
      /window\.location/gi
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(value));
  }

  // Rate limiting
  checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, []);
    }
    
    const requests = this.rateLimits.get(key);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      logger.security('Rate limit exceeded', { key, requests: validRequests.length });
      return false;
    }
    
    validRequests.push(now);
    this.rateLimits.set(key, validRequests);
    
    return true;
  }

  // Input validation and sanitization
  validateInput(input, type = 'text', options = {}) {
    if (typeof input !== 'string') {
      return { isValid: false, error: 'Input must be a string' };
    }
    
    const {
      maxLength = 1000,
      minLength = 0,
      allowHTML = false,
      pattern = null
    } = options;
    
    // Length validation
    if (input.length < minLength) {
      return { isValid: false, error: `Input too short (minimum ${minLength} characters)` };
    }
    
    if (input.length > maxLength) {
      return { isValid: false, error: `Input too long (maximum ${maxLength} characters)` };
    }
    
    // HTML validation
    if (!allowHTML && this.containsHTML(input)) {
      return { isValid: false, error: 'HTML content not allowed' };
    }
    
    // Pattern validation
    if (pattern && !pattern.test(input)) {
      return { isValid: false, error: 'Input format is invalid' };
    }
    
    // Type-specific validation
    switch (type) {
      case 'email':
        return this.validateEmail(input);
      case 'phone':
        return this.validatePhone(input);
      case 'url':
        return this.validateURL(input);
      default:
        return { isValid: true, sanitized: this.sanitizeInput(input, allowHTML) };
    }
  }

  // Check if input contains HTML
  containsHTML(input) {
    const htmlPattern = /<[^>]*>/;
    return htmlPattern.test(input);
  }

  // Sanitize input
  sanitizeInput(input, allowHTML = false) {
    if (allowHTML) {
      // Basic HTML sanitization - in production, use a library like DOMPurify
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    
    // Escape HTML entities
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // Email validation
  validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailPattern.test(email);
    
    return {
      isValid,
      error: isValid ? null : 'Invalid email format',
      sanitized: isValid ? email.toLowerCase().trim() : email
    };
  }

  // Phone validation
  validatePhone(phone) {
    const phonePattern = /^\+?[\ds\-()]{10,}$/;
    const isValid = phonePattern.test(phone);
    
    return {
      isValid,
      error: isValid ? null : 'Invalid phone number format',
      sanitized: isValid ? phone.replace(/\D/g, '') : phone
    };
  }

  // URL validation
  validateURL(url) {
    try {
      new URL(url);
      return { isValid: true, error: null, sanitized: url };
    } catch {
      return { isValid: false, error: 'Invalid URL format', sanitized: url };
    }
  }

  // Generate secure token
  generateSecureToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Secure storage
  secureStore(key, value, encrypt = true) {
    try {
      const data = encrypt ? this.encrypt(JSON.stringify(value)) : JSON.stringify(value);
      localStorage.setItem(`secure_${key}`, data);
      return true;
    } catch (error) {
      logger.error('Failed to store data securely', 'SECURITY', error);
      return false;
    }
  }

  // Secure retrieval
  secureRetrieve(key, decrypt = true) {
    try {
      const data = localStorage.getItem(`secure_${key}`);
      if (!data) return null;
      
      const parsed = decrypt ? this.decrypt(data) : data;
      return JSON.parse(parsed);
    } catch (error) {
      logger.error('Failed to retrieve data securely', 'SECURITY', error);
      return null;
    }
  }

  // Simple encryption (for demo - use proper encryption in production)
  encrypt(text) {
    // This is a simple XOR cipher for demo purposes
    // In production, use proper encryption libraries
    const key = 'callforblood2024';
    let result = '';
    
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    return btoa(result);
  }

  // Simple decryption
  decrypt(encryptedText) {
    try {
      const text = atob(encryptedText);
      const key = 'callforblood2024';
      let result = '';
      
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      
      return result;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  // Get security report
  getSecurityReport() {
    return {
      csrfToken: this.csrfToken ? 'Set' : 'Not Set',
      rateLimits: Object.fromEntries(this.rateLimits),
      securityEvents: this.securityEvents.slice(-10), // Last 10 events
      isHTTPS: window.location.protocol === 'https:',
      hasCSP: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    };
  }

  // Clear security data
  clearSecurityData() {
    this.rateLimits.clear();
    this.securityEvents = [];
    logger.info('Security data cleared', 'SECURITY');
  }
}

// Create singleton instance
const security = new SecurityManager();

export default security;