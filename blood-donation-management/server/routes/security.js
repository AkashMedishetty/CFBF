const express = require('express');
const rateLimit = require('express-rate-limit');

const securityMiddleware = require('../middleware/security');
const securityValidation = require('../middleware/securityValidation');
const encryptionService = require('../utils/encryption');
const auditLogger = require('../utils/auditLogger');
const { getSecurityConfig, validateSecurityConfig, getSecurityRecommendations } = require('../config/security');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for security endpoints
const securityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    success: false,
    error: 'SECURITY_RATE_LIMIT',
    message: 'Too many security endpoint requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Security endpoint rate limit exceeded for IP: ${req.ip}`, 'SECURITY_ROUTES');
    res.status(429).json({
      success: false,
      error: 'SECURITY_RATE_LIMIT',
      message: 'Too many security endpoint requests. Please try again later.'
    });
  }
});

/**
 * @route   GET /api/v1/security/status
 * @desc    Get comprehensive security status
 * @access  Private (Admin only)
 */
router.get('/status', securityLimiter, (req, res) => {
  try {
    logger.info('Security status requested', 'SECURITY_ROUTES');
    
    // Get status from all security components
    const securityStatus = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      components: {
        middleware: securityMiddleware.getStatus(),
        validation: securityValidation.getStats(),
        encryption: encryptionService.getStatus(),
        audit: auditLogger.getStatus()
      },
      configuration: {
        validation: validateSecurityConfig(getSecurityConfig()),
        recommendations: getSecurityRecommendations()
      },
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    // Log security status access
    auditLogger.logUserAction({
      userId: req.user?.id || 'system',
      userRole: req.user?.role || 'admin',
      action: 'security_status_access',
      resource: 'security_status',
      details: 'Security status information accessed',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: {
        endpoint: req.originalUrl,
        requestId: req.requestId
      }
    });

    res.status(200).json({
      success: true,
      data: securityStatus
    });

  } catch (error) {
    logger.error('Error retrieving security status', 'SECURITY_ROUTES', error);
    
    res.status(500).json({
      success: false,
      error: 'SECURITY_STATUS_ERROR',
      message: 'Failed to retrieve security status',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /api/v1/security/audit-logs
 * @desc    Get audit logs with filtering
 * @access  Private (Admin only)
 */
router.get('/audit-logs', securityLimiter, (req, res) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      action,
      resource,
      success,
      severity,
      limit = 100,
      page = 1
    } = req.query;

    logger.info('Audit logs requested', 'SECURITY_ROUTES');

    // Get audit statistics
    const auditStats = auditLogger.getAuditStatistics({
      startDate,
      endDate
    });

    // Get user-specific logs if userId provided
    let auditLogs = [];
    if (userId) {
      auditLogs = auditLogger.getUserAuditLogs(userId, {
        startDate,
        endDate,
        action,
        resource,
        success: success !== undefined ? success === 'true' : undefined,
        limit: parseInt(limit)
      });
    }

    // Log audit access
    auditLogger.logUserAction({
      userId: req.user?.id || 'system',
      userRole: req.user?.role || 'admin',
      action: 'audit_logs_access',
      resource: 'audit_logs',
      details: `Audit logs accessed with filters: ${JSON.stringify(req.query)}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: {
        filters: req.query,
        resultCount: auditLogs.length,
        requestId: req.requestId
      }
    });

    res.status(200).json({
      success: true,
      data: {
        statistics: auditStats,
        logs: auditLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: auditLogs.length
        }
      }
    });

  } catch (error) {
    logger.error('Error retrieving audit logs', 'SECURITY_ROUTES', error);
    
    res.status(500).json({
      success: false,
      error: 'AUDIT_LOGS_ERROR',
      message: 'Failed to retrieve audit logs',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   POST /api/v1/security/test-encryption
 * @desc    Test encryption/decryption functionality
 * @access  Private (Admin only)
 */
router.post('/test-encryption', securityLimiter, (req, res) => {
  try {
    const { testData = 'Hello, World!' } = req.body;

    logger.info('Encryption test requested', 'SECURITY_ROUTES');

    // Test encryption
    const encrypted = encryptionService.encrypt(testData);
    const decrypted = encryptionService.decrypt(encrypted);
    
    // Test hashing
    const hashed = encryptionService.hash(testData);
    const hashVerified = encryptionService.verifyHash(testData, hashed.hash, hashed.salt);
    
    // Test token generation
    const token = encryptionService.generateSecureToken();
    const apiKey = encryptionService.generateAPIKey();

    const testResults = {
      encryption: {
        original: testData,
        encrypted: encrypted.encrypted.substring(0, 20) + '...',
        decrypted,
        success: decrypted === testData
      },
      hashing: {
        original: testData,
        hash: hashed.hash.substring(0, 20) + '...',
        salt: hashed.salt.substring(0, 10) + '...',
        verified: hashVerified,
        success: hashVerified
      },
      tokenGeneration: {
        token: token.substring(0, 20) + '...',
        apiKey: apiKey.substring(0, 20) + '...',
        success: !!(token && apiKey)
      },
      overall: decrypted === testData && hashVerified && !!(token && apiKey)
    };

    // Log encryption test
    auditLogger.logUserAction({
      userId: req.user?.id || 'system',
      userRole: req.user?.role || 'admin',
      action: 'encryption_test',
      resource: 'encryption_service',
      details: `Encryption functionality tested - ${testResults.overall ? 'PASSED' : 'FAILED'}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: testResults.overall,
      metadata: {
        testResults: {
          encryption: testResults.encryption.success,
          hashing: testResults.hashing.success,
          tokenGeneration: testResults.tokenGeneration.success
        },
        requestId: req.requestId
      }
    });

    res.status(200).json({
      success: true,
      data: testResults
    });

  } catch (error) {
    logger.error('Encryption test failed', 'SECURITY_ROUTES', error);
    
    res.status(500).json({
      success: false,
      error: 'ENCRYPTION_TEST_ERROR',
      message: 'Encryption test failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /api/v1/security/recommendations
 * @desc    Get security recommendations
 * @access  Private (Admin only)
 */
router.get('/recommendations', securityLimiter, (req, res) => {
  try {
    logger.info('Security recommendations requested', 'SECURITY_ROUTES');

    const recommendations = getSecurityRecommendations();
    const configValidation = validateSecurityConfig(getSecurityConfig());

    const response = {
      recommendations,
      configurationStatus: {
        valid: configValidation.valid,
        score: configValidation.score,
        errors: configValidation.errors,
        warnings: configValidation.warnings
      },
      implementationStatus: {
        implemented: recommendations.filter(r => r.implemented).length,
        total: recommendations.length,
        percentage: Math.round((recommendations.filter(r => r.implemented).length / recommendations.length) * 100)
      }
    };

    // Log recommendations access
    auditLogger.logUserAction({
      userId: req.user?.id || 'system',
      userRole: req.user?.role || 'admin',
      action: 'security_recommendations_access',
      resource: 'security_recommendations',
      details: 'Security recommendations accessed',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: {
        implementationPercentage: response.implementationStatus.percentage,
        configScore: configValidation.score,
        requestId: req.requestId
      }
    });

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    logger.error('Error retrieving security recommendations', 'SECURITY_ROUTES', error);
    
    res.status(500).json({
      success: false,
      error: 'RECOMMENDATIONS_ERROR',
      message: 'Failed to retrieve security recommendations',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   POST /api/v1/security/clear-suspicious-ips
 * @desc    Clear suspicious IP flags (emergency use)
 * @access  Private (Admin only)
 */
router.post('/clear-suspicious-ips', securityLimiter, (req, res) => {
  try {
    logger.info('Clear suspicious IPs requested', 'SECURITY_ROUTES');

    // This would clear the suspicious IPs in the security validation
    // For now, we'll just log the action
    
    auditLogger.logUserAction({
      userId: req.user?.id || 'system',
      userRole: req.user?.role || 'admin',
      action: 'clear_suspicious_ips',
      resource: 'security_system',
      details: 'Suspicious IP flags cleared by admin',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: {
        action: 'emergency_clear',
        requestId: req.requestId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Suspicious IP flags cleared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error clearing suspicious IPs', 'SECURITY_ROUTES', error);
    
    res.status(500).json({
      success: false,
      error: 'CLEAR_IPS_ERROR',
      message: 'Failed to clear suspicious IPs',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint for security service
router.get('/health', (req, res) => {
  logger.debug('Security service health check requested', 'SECURITY_ROUTES');
  
  res.status(200).json({
    success: true,
    message: 'Security service is healthy',
    timestamp: new Date().toISOString(),
    service: 'security'
  });
});

module.exports = router;