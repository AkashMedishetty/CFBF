const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');
const cors = require('cors');
const compression = require('compression');
const logger = require('../utils/logger');
const auditLogger = require('../utils/auditLogger');
const encryptionService = require('../utils/encryption');

/**
 * Security middleware configuration
 */
class SecurityMiddleware {
  constructor() {
    this.trustedProxies = process.env.TRUSTED_PROXIES?.split(',') || [];
    this.allowedOrigins = this.getAllowedOrigins();
    
    logger.info('Security middleware initialized', 'SECURITY');
    logger.debug(`Trusted proxies: ${this.trustedProxies.join(', ')}`, 'SECURITY');
    logger.debug(`Allowed origins: ${this.allowedOrigins.join(', ')}`, 'SECURITY');
  }

  /**
   * Get allowed origins based on environment
   * @returns {Array} Array of allowed origins
   */
  getAllowedOrigins() {
    if (process.env.NODE_ENV === 'production') {
      return [
        'https://callforbloodfoundation.com',
        'https://www.callforbloodfoundation.com',
        'https://admin.callforbloodfoundation.com'
      ];
    }
    
    return [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    ];
  }

  /**
   * Configure Helmet security headers
   * @returns {Function} Helmet middleware
   */
  configureHelmet() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.whatsapp.com", "https://graph.facebook.com"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
      },
      crossOriginEmbedderPolicy: false, // Allow embedding for WhatsApp integration
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      frameguard: { action: 'deny' },
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    });
  }

  /**
   * Configure CORS with security considerations
   * @returns {Function} CORS middleware
   */
  configureCORS() {
    return cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (this.allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        logger.warn(`CORS blocked request from origin: ${origin}`, 'SECURITY');
        auditLogger.logSecurityEvent({
          action: 'cors_violation',
          resource: 'api',
          severity: 'medium',
          details: `Blocked request from unauthorized origin: ${origin}`,
          metadata: { origin, allowedOrigins: this.allowedOrigins }
        });
        
        return callback(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-Request-ID'
      ],
      exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining'],
      maxAge: 86400 // 24 hours
    });
  }

  /**
   * Configure rate limiting
   * @param {Object} options - Rate limiting options
   * @returns {Function} Rate limiting middleware
   */
  configureRateLimit(options = {}) {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((options.windowMs || 15 * 60 * 1000) / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
      },
      keyGenerator: (req) => {
        // Use IP + User ID for authenticated requests
        return req.ip + (req.user?.id || '');
      },
      handler: (req, res) => {
        logger.warn(`Rate limit exceeded for ${req.ip}`, 'SECURITY');
        
        auditLogger.logSecurityEvent({
          userId: req.user?.id || 'anonymous',
          action: 'rate_limit_exceeded',
          resource: req.originalUrl,
          severity: 'medium',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          details: `Rate limit exceeded`,
          metadata: {
            endpoint: req.originalUrl
          }
        });
        
        res.status(429).json(defaultOptions.message);
      }
    };

    return rateLimit({ ...defaultOptions, ...options });
  }

  /**
   * Configure slow down middleware for progressive delays
   * @param {Object} options - Slow down options
   * @returns {Function} Slow down middleware
   */
  configureSlowDown(options = {}) {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 50, // Allow 50 requests per windowMs without delay
      delayMs: () => 500, // Add 500ms delay per request after delayAfter
      maxDelayMs: 20000, // Maximum delay of 20 seconds
      validate: { delayMs: false },
      skipFailedRequests: false,
      skipSuccessfulRequests: false,
      keyGenerator: (req) => req.ip + (req.user?.id || ''),
      // onLimitReached is deprecated in express-slow-down v2, removed
    };

    return slowDown({ ...defaultOptions, ...options });
  }

  /**
   * Configure HTTP Parameter Pollution protection
   * @returns {Function} HPP middleware
   */
  configureHPP() {
    return hpp({
      whitelist: ['tags', 'bloodTypes', 'locations'] // Allow arrays for these parameters
    });
  }

  /**
   * Configure compression middleware
   * @returns {Function} Compression middleware
   */
  configureCompression() {
    return compression({
      filter: (req, res) => {
        // Don't compress responses if the request includes a cache-control: no-transform directive
        if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
          return false;
        }
        
        // Use compression filter function
        return compression.filter(req, res);
      },
      level: 6, // Compression level (1-9, 6 is default)
      threshold: 1024, // Only compress responses larger than 1KB
      memLevel: 8 // Memory usage level (1-9, 8 is default)
    });
  }

  /**
   * Security headers middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  securityHeaders(req, res, next) {
    // Add custom security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Add request ID for tracking
    const requestId = encryptionService.generateSecureToken(16);
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    // Remove server information
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    
    next();
  }

  /**
   * Request logging middleware for security monitoring
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  securityLogger(req, res, next) {
    const startTime = Date.now();
    
    // Log request details
    logger.debug(`${req.method} ${req.originalUrl} from ${req.ip}`, 'SECURITY');
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      // Log security-relevant requests
      if (statusCode >= 400 || req.originalUrl.includes('auth') || req.originalUrl.includes('admin')) {
        auditLogger.logUserAction({
          userId: req.user?.id || 'anonymous',
          userRole: req.user?.role || 'guest',
          action: `http_${req.method.toLowerCase()}`,
          resource: req.originalUrl,
          details: `${req.method} ${req.originalUrl} - ${statusCode}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID,
          success: statusCode < 400,
          errorMessage: statusCode >= 400 ? `HTTP ${statusCode}` : null,
          metadata: {
            duration,
            statusCode,
            requestId: req.requestId,
            contentLength: res.get('Content-Length') || 0
          }
        });
      }
      
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  }

  /**
   * Input validation and sanitization middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  inputSanitization(req, res, next) {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = this.sanitizeObject(req.body);
      }
      
      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = this.sanitizeObject(req.query);
      }
      
      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        req.params = this.sanitizeObject(req.params);
      }
      
      next();
      
    } catch (error) {
      logger.error('Input sanitization error', 'SECURITY', error);
      
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Invalid input data provided',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Sanitize object recursively
   * @param {Object} obj - Object to sanitize
   * @returns {Object} Sanitized object
   */
  sanitizeObject(obj) {
    if (typeof obj === 'string') {
      return obj
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .substring(0, 10000); // Limit length
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip potentially dangerous keys
        if (!['__proto__', 'constructor', 'prototype'].includes(key)) {
          sanitized[key] = this.sanitizeObject(value);
        }
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * IP whitelist middleware
   * @param {Array} whitelist - Array of allowed IP addresses
   * @returns {Function} IP whitelist middleware
   */
  ipWhitelist(whitelist = []) {
    return (req, res, next) => {
      if (whitelist.length === 0) {
        return next(); // No whitelist configured
      }
      
      const clientIP = req.ip;
      
      if (!whitelist.includes(clientIP)) {
        logger.warn(`IP not in whitelist: ${clientIP}`, 'SECURITY');
        
        auditLogger.logSecurityEvent({
          action: 'ip_not_whitelisted',
          resource: req.originalUrl,
          severity: 'high',
          ipAddress: clientIP,
          userAgent: req.get('User-Agent'),
          details: `IP ${clientIP} not in whitelist`,
          metadata: { whitelist, endpoint: req.originalUrl }
        });
        
        return res.status(403).json({
          success: false,
          error: 'IP_NOT_ALLOWED',
          message: 'Your IP address is not authorized to access this resource',
          timestamp: new Date().toISOString()
        });
      }
      
      next();
    };
  }

  /**
   * Get all security middleware configured
   * @returns {Object} Object containing all middleware functions
   */
  getAllMiddleware() {
    return {
      helmet: this.configureHelmet(),
      cors: this.configureCORS(),
      rateLimit: this.configureRateLimit(),
      slowDown: this.configureSlowDown(),
      hpp: this.configureHPP(),
      compression: this.configureCompression(),
      securityHeaders: this.securityHeaders.bind(this),
      securityLogger: this.securityLogger.bind(this),
      inputSanitization: this.inputSanitization.bind(this),
      ipWhitelist: this.ipWhitelist.bind(this)
    };
  }

  /**
   * Get security middleware status
   * @returns {Object} Security status
   */
  getStatus() {
    return {
      trustedProxies: this.trustedProxies,
      allowedOrigins: this.allowedOrigins,
      environment: process.env.NODE_ENV,
      httpsEnabled: process.env.NODE_ENV === 'production',
      ready: true
    };
  }
}

// Create singleton instance
const securityMiddleware = new SecurityMiddleware();

module.exports = securityMiddleware;