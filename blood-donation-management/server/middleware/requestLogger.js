const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const auditLogger = require('../utils/auditLogger');

/**
 * Request logging middleware
 * Logs all incoming requests and adds request ID
 */
const requestLogger = (req, res, next) => {
  // Generate unique request ID
  req.requestId = uuidv4();
  
  // Add request ID to response headers
  res.set('X-Request-ID', req.requestId);

  // Start timer
  const startTime = Date.now();

  // Log request start
  const requestInfo = {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer'),
    timestamp: new Date().toISOString()
  };

  // Don't log sensitive data in body
  const sensitiveFields = ['password', 'token', 'otp', 'secret'];
  let logBody = {};
  
  if (req.body && typeof req.body === 'object') {
    logBody = { ...req.body };
    sensitiveFields.forEach(field => {
      if (logBody[field]) {
        logBody[field] = '[REDACTED]';
      }
    });
  }

  // Log request (exclude health checks and static files from detailed logging)
  if (!req.path.includes('/health') && !req.path.includes('/static')) {
    logger.info(`${req.method} ${req.path}`, 'REQUEST', {
      ...requestInfo,
      body: Object.keys(logBody).length > 0 ? logBody : undefined,
      query: Object.keys(req.query).length > 0 ? req.query : undefined
    });
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Log response
    const responseInfo = {
      requestId: req.requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: JSON.stringify(data).length
    };

    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.path} - ${res.statusCode}`, 'RESPONSE', responseInfo);
    } else if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.path} - ${res.statusCode}`, 'RESPONSE', responseInfo);
    } else if (!req.path.includes('/health')) {
      logger.success(`${req.method} ${req.path} - ${res.statusCode}`, 'RESPONSE', responseInfo);
    }

    // Log slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn(`Slow request detected: ${duration}ms`, 'PERFORMANCE', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        userId: req.user?.id || null
      });
    }

    // Log API usage for analytics
    if (req.path.startsWith('/api/')) {
      auditLogger.logApiUsage({
        requestId: req.requestId,
        method: req.method,
        endpoint: req.path,
        statusCode: res.statusCode,
        duration,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || null,
        userRole: req.user?.role || null,
        success: res.statusCode < 400,
        timestamp: new Date()
      });
    }

    // Call original json method
    return originalJson.call(this, data);
  };

  // Override res.send to log non-JSON responses
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Only log if not already logged by res.json
    if (!res.headersSent || res.get('Content-Type')?.includes('json')) {
      const responseInfo = {
        requestId: req.requestId,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: data ? data.length : 0
      };

      if (res.statusCode >= 500) {
        logger.error(`${req.method} ${req.path} - ${res.statusCode}`, 'RESPONSE', responseInfo);
      } else if (res.statusCode >= 400) {
        logger.warn(`${req.method} ${req.path} - ${res.statusCode}`, 'RESPONSE', responseInfo);
      } else if (!req.path.includes('/health')) {
        logger.success(`${req.method} ${req.path} - ${res.statusCode}`, 'RESPONSE', responseInfo);
      }
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Security event logging middleware
 * Logs security-related events
 */
const securityLogger = (req, res, next) => {
  // Log suspicious activities
  const suspiciousPatterns = [
    /\.\./,           // Directory traversal
    /<script/i,       // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i,   // JavaScript injection
    /eval\(/i,        // Code injection
    /exec\(/i         // Command injection
  ];

  const requestData = JSON.stringify({
    url: req.url,
    body: req.body,
    query: req.query,
    headers: req.headers
  });

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));

  if (isSuspicious) {
    auditLogger.logSecurityEvent({
      event: 'suspicious_request',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: 'Suspicious patterns detected in request',
      severity: 'high',
      metadata: {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        patterns: suspiciousPatterns.filter(pattern => pattern.test(requestData)).map(p => p.toString()),
        userId: req.user?.id || null
      }
    });

    logger.warn('Suspicious request detected', 'SECURITY', {
      requestId: req.requestId,
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
  }

  next();
};

/**
 * Performance monitoring middleware
 * Tracks response times and resource usage
 */
const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

    // Log performance metrics for slow requests or high memory usage
    if (duration > 1000 || Math.abs(memoryDelta) > 10 * 1024 * 1024) { // 1 second or 10MB
      logger.info('Performance metrics', 'PERFORMANCE', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        duration: `${duration.toFixed(2)}ms`,
        memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
        statusCode: res.statusCode,
        userId: req.user?.id || null
      });
    }
  });

  next();
};

/**
 * Rate limit logging middleware
 * Logs rate limit violations
 */
const rateLimitLogger = (req, res, next) => {
  const originalStatus = res.status;
  
  res.status = function(code) {
    if (code === 429) {
      auditLogger.logSecurityEvent({
        event: 'rate_limit_violation',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: 'Rate limit exceeded',
        severity: 'medium',
        metadata: {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          userId: req.user?.id || null
        }
      });
    }
    
    return originalStatus.call(this, code);
  };

  next();
};

module.exports = {
  requestLogger,
  securityLogger,
  performanceMonitor,
  rateLimitLogger
};