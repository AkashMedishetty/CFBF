const logger = require('../utils/logger');
const auditLogger = require('../utils/auditLogger');
const encryptionService = require('../utils/encryption');

/**
 * Security validation middleware for enhanced protection
 */
class SecurityValidation {
  constructor() {
    this.suspiciousPatterns = [
      // SQL Injection patterns
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /('|(\\')|(;)|(--)|(\|)|(\*)|(%27)|(%3D)|(%3B)|(%2D%2D))/i,
      
      // XSS patterns
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe|<object|<embed|<link|<meta/i,
      
      // Command injection patterns
      /(\||&|;|\$\(|\`)/,
      /(wget|curl|nc|netcat|bash|sh|cmd|powershell)/i,
      
      // Path traversal patterns
      /(\.\.[\/\\]|\.\.%2f|\.\.%5c)/i,
      /(\/etc\/passwd|\/etc\/shadow|\/windows\/system32)/i,
      
      // LDAP injection patterns
      /(\(|\)|&|\||!|=|\*|<|>|~)/,
      
      // NoSQL injection patterns
      /(\$where|\$ne|\$in|\$nin|\$gt|\$lt|\$regex)/i
    ];
    
    this.blockedUserAgents = [
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
      /burp/i,
      /w3af/i,
      /acunetix/i,
      /netsparker/i,
      /appscan/i,
      /websecurify/i,
      /paros/i
    ];
    
    this.rateLimitStore = new Map();
    this.suspiciousIPs = new Set();
    
    logger.info('Security validation middleware initialized', 'SECURITY_VALIDATION');
  }

  /**
   * Main security validation middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  validateRequest(req, res, next) {
    try {
      const clientIP = req.ip;
      const userAgent = req.get('User-Agent') || '';
      const requestId = req.requestId || 'unknown';
      
      // Check for suspicious user agents
      if (this.isSuspiciousUserAgent(userAgent)) {
        this.logSecurityViolation(req, 'SUSPICIOUS_USER_AGENT', `Blocked suspicious user agent: ${userAgent}`);
        return this.blockRequest(res, 'Suspicious user agent detected');
      }
      
      // Check for suspicious IPs
      if (this.suspiciousIPs.has(clientIP)) {
        this.logSecurityViolation(req, 'SUSPICIOUS_IP', `Request from flagged IP: ${clientIP}`);
        return this.blockRequest(res, 'IP address flagged for suspicious activity');
      }
      
      // Validate request headers
      const headerValidation = this.validateHeaders(req);
      if (!headerValidation.valid) {
        this.logSecurityViolation(req, 'INVALID_HEADERS', headerValidation.reason);
        return this.blockRequest(res, 'Invalid request headers');
      }
      
      // Check for injection attacks in all input
      const injectionCheck = this.checkForInjectionAttacks(req);
      if (injectionCheck.detected) {
        this.logSecurityViolation(req, 'INJECTION_ATTEMPT', `Injection attack detected: ${injectionCheck.type}`);
        this.flagSuspiciousIP(clientIP);
        return this.blockRequest(res, 'Malicious input detected');
      }
      
      // Validate request size
      const sizeValidation = this.validateRequestSize(req);
      if (!sizeValidation.valid) {
        this.logSecurityViolation(req, 'REQUEST_TOO_LARGE', sizeValidation.reason);
        return this.blockRequest(res, 'Request size exceeds limits');
      }
      
      // Check for unusual request patterns
      const patternCheck = this.checkRequestPatterns(req);
      if (patternCheck.suspicious) {
        this.logSecurityViolation(req, 'SUSPICIOUS_PATTERN', patternCheck.reason);
        // Don't block, but log for monitoring
      }
      
      // Add security context to request
      req.securityContext = {
        requestId,
        clientIP,
        userAgent,
        validated: true,
        timestamp: new Date().toISOString()
      };
      
      logger.debug(`Security validation passed for request ${requestId}`, 'SECURITY_VALIDATION');
      next();
      
    } catch (error) {
      logger.error('Security validation error', 'SECURITY_VALIDATION', error);
      return this.blockRequest(res, 'Security validation failed');
    }
  }

  /**
   * Check if user agent is suspicious
   * @param {string} userAgent - User agent string
   * @returns {boolean} True if suspicious
   */
  isSuspiciousUserAgent(userAgent) {
    if (!userAgent || userAgent.length < 10) {
      return true; // Too short or missing
    }
    
    return this.blockedUserAgents.some(pattern => pattern.test(userAgent));
  }

  /**
   * Validate request headers
   * @param {Object} req - Express request object
   * @returns {Object} Validation result
   */
  validateHeaders(req) {
    // Check for required headers
    const contentType = req.get('Content-Type');
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (!contentType) {
        return { valid: false, reason: 'Missing Content-Type header' };
      }
      
      // Validate content type
      const allowedTypes = [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain'
      ];
      
      if (!allowedTypes.some(type => contentType.includes(type))) {
        return { valid: false, reason: `Invalid Content-Type: ${contentType}` };
      }
    }
    
    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-cluster-client-ip'
    ];
    
    for (const header of suspiciousHeaders) {
      const value = req.get(header);
      if (value && this.containsSuspiciousContent(value)) {
        return { valid: false, reason: `Suspicious ${header} header` };
      }
    }
    
    return { valid: true };
  }

  /**
   * Check for injection attacks in request data
   * @param {Object} req - Express request object
   * @returns {Object} Detection result
   */
  checkForInjectionAttacks(req) {
    const dataToCheck = [
      ...Object.values(req.query || {}),
      ...Object.values(req.params || {}),
      ...this.flattenObject(req.body || {})
    ];
    
    for (const data of dataToCheck) {
      if (typeof data === 'string') {
        for (const pattern of this.suspiciousPatterns) {
          if (pattern.test(data)) {
            return {
              detected: true,
              type: this.getInjectionType(pattern),
              payload: encryptionService.maskSensitiveData(data, 10)
            };
          }
        }
      }
    }
    
    return { detected: false };
  }

  /**
   * Validate request size
   * @param {Object} req - Express request object
   * @returns {Object} Validation result
   */
  validateRequestSize(req) {
    const maxSize = parseInt(process.env.MAX_REQUEST_SIZE) || 10 * 1024 * 1024; // 10MB
    const contentLength = parseInt(req.get('Content-Length') || '0');
    
    if (contentLength > maxSize) {
      return {
        valid: false,
        reason: `Request size ${contentLength} exceeds maximum ${maxSize}`
      };
    }
    
    // Check URL length
    if (req.url.length > 2048) {
      return {
        valid: false,
        reason: `URL length ${req.url.length} exceeds maximum 2048`
      };
    }
    
    return { valid: true };
  }

  /**
   * Check for unusual request patterns
   * @param {Object} req - Express request object
   * @returns {Object} Pattern analysis result
   */
  checkRequestPatterns(req) {
    const clientIP = req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    
    // Initialize or get IP data
    if (!this.rateLimitStore.has(clientIP)) {
      this.rateLimitStore.set(clientIP, {
        requests: [],
        endpoints: new Set(),
        methods: new Set(),
        userAgents: new Set()
      });
    }
    
    const ipData = this.rateLimitStore.get(clientIP);
    
    // Clean old requests
    ipData.requests = ipData.requests.filter(time => now - time < windowMs);
    
    // Add current request
    ipData.requests.push(now);
    ipData.endpoints.add(req.originalUrl);
    ipData.methods.add(req.method);
    ipData.userAgents.add(req.get('User-Agent') || '');
    
    // Check for suspicious patterns
    const requestsPerMinute = ipData.requests.length;
    const uniqueEndpoints = ipData.endpoints.size;
    const uniqueUserAgents = ipData.userAgents.size;
    
    // Too many requests
    if (requestsPerMinute > 120) {
      return {
        suspicious: true,
        reason: `High request rate: ${requestsPerMinute} requests/minute`
      };
    }
    
    // Too many different endpoints
    if (uniqueEndpoints > 20) {
      return {
        suspicious: true,
        reason: `Accessing too many endpoints: ${uniqueEndpoints}`
      };
    }
    
    // Multiple user agents (possible bot)
    if (uniqueUserAgents > 3) {
      return {
        suspicious: true,
        reason: `Multiple user agents: ${uniqueUserAgents}`
      };
    }
    
    return { suspicious: false };
  }

  /**
   * Check if content contains suspicious patterns
   * @param {string} content - Content to check
   * @returns {boolean} True if suspicious
   */
  containsSuspiciousContent(content) {
    return this.suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Flatten object to array of values
   * @param {Object} obj - Object to flatten
   * @returns {Array} Array of values
   */
  flattenObject(obj, depth = 0) {
    if (depth > 10) return []; // Prevent deep recursion
    
    const values = [];
    
    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        values.push(...this.flattenObject(value, depth + 1));
      } else if (Array.isArray(value)) {
        values.push(...value.filter(item => typeof item === 'string'));
      } else if (typeof value === 'string') {
        values.push(value);
      }
    }
    
    return values;
  }

  /**
   * Get injection type from pattern
   * @param {RegExp} pattern - Matched pattern
   * @returns {string} Injection type
   */
  getInjectionType(pattern) {
    const patternString = pattern.toString();
    
    if (patternString.includes('SELECT|INSERT|UPDATE')) return 'SQL_INJECTION';
    if (patternString.includes('script|javascript')) return 'XSS';
    if (patternString.includes('wget|curl|bash')) return 'COMMAND_INJECTION';
    if (patternString.includes('\\.\\.')) return 'PATH_TRAVERSAL';
    if (patternString.includes('\\$where|\\$ne')) return 'NOSQL_INJECTION';
    
    return 'UNKNOWN_INJECTION';
  }

  /**
   * Flag IP as suspicious
   * @param {string} ip - IP address to flag
   */
  flagSuspiciousIP(ip) {
    this.suspiciousIPs.add(ip);
    logger.warn(`IP flagged as suspicious: ${ip}`, 'SECURITY_VALIDATION');
    
    // Auto-remove after 1 hour
    setTimeout(() => {
      this.suspiciousIPs.delete(ip);
      logger.info(`IP unflagged: ${ip}`, 'SECURITY_VALIDATION');
    }, 60 * 60 * 1000);
  }

  /**
   * Log security violation
   * @param {Object} req - Express request object
   * @param {string} violationType - Type of violation
   * @param {string} details - Violation details
   */
  logSecurityViolation(req, violationType, details) {
    logger.warn(`Security violation: ${violationType} - ${details}`, 'SECURITY_VALIDATION');
    
    auditLogger.logSecurityEvent({
      userId: req.user?.id || 'anonymous',
      action: violationType.toLowerCase(),
      resource: req.originalUrl,
      severity: 'high',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details,
      metadata: {
        method: req.method,
        endpoint: req.originalUrl,
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Block request with security response
   * @param {Object} res - Express response object
   * @param {string} reason - Block reason
   */
  blockRequest(res, reason) {
    logger.warn(`Request blocked: ${reason}`, 'SECURITY_VALIDATION');
    
    return res.status(403).json({
      success: false,
      error: 'SECURITY_VIOLATION',
      message: 'Request blocked for security reasons',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get security validation statistics
   * @returns {Object} Validation statistics
   */
  getStats() {
    return {
      suspiciousIPs: this.suspiciousIPs.size,
      trackedIPs: this.rateLimitStore.size,
      patternsCount: this.suspiciousPatterns.length,
      blockedUserAgents: this.blockedUserAgents.length
    };
  }

  /**
   * Clean up old data
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    for (const [ip, data] of this.rateLimitStore.entries()) {
      if (data.requests.length === 0 || now - Math.max(...data.requests) > maxAge) {
        this.rateLimitStore.delete(ip);
      }
    }
    
    logger.debug(`Cleaned up security validation data`, 'SECURITY_VALIDATION');
  }
}

// Create singleton instance
const securityValidation = new SecurityValidation();

// Cleanup every 30 minutes
setInterval(() => {
  securityValidation.cleanup();
}, 30 * 60 * 1000);

module.exports = securityValidation;