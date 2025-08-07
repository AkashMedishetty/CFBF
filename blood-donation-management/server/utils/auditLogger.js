const logger = require('./logger');
const encryptionService = require('./encryption');

class AuditLogger {
  constructor() {
    this.auditLogs = new Map(); // In production, use database
    this.maxLogsInMemory = 10000;
    this.retentionDays = 90;
    
    logger.info('Audit Logger initialized', 'AUDIT');
    logger.debug(`Max logs in memory: ${this.maxLogsInMemory}`, 'AUDIT');
    logger.debug(`Retention period: ${this.retentionDays} days`, 'AUDIT');
    
    // Cleanup old logs every hour
    setInterval(() => {
      this.cleanupOldLogs();
    }, 60 * 60 * 1000);
  }

  /**
   * Log user action for audit trail
   * @param {Object} auditData - Audit log data
   */
  logUserAction(auditData) {
    try {
      const {
        userId,
        userRole,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
        sessionId,
        success = true,
        errorMessage = null,
        metadata = {}
      } = auditData;

      // Validate required fields
      if (!userId || !action || !resource) {
        logger.warn('Incomplete audit data provided', 'AUDIT');
        return;
      }

      const auditId = this.generateAuditId();
      const timestamp = new Date().toISOString();

      const auditEntry = {
        auditId,
        timestamp,
        userId: encryptionService.maskSensitiveData(userId),
        userRole,
        action,
        resource,
        resourceId: resourceId ? encryptionService.maskSensitiveData(resourceId) : null,
        details: this.sanitizeDetails(details),
        ipAddress: encryptionService.maskSensitiveData(ipAddress || 'unknown'),
        userAgent: userAgent ? encryptionService.maskSensitiveData(userAgent, 10) : null,
        sessionId: sessionId ? encryptionService.maskSensitiveData(sessionId) : null,
        success,
        errorMessage,
        metadata: this.sanitizeMetadata(metadata),
        severity: this.calculateSeverity(action, success),
        category: this.categorizeAction(action)
      };

      // Store in memory (in production, store in database)
      this.auditLogs.set(auditId, auditEntry);

      // Log to file/console
      logger.audit(
        `${action} on ${resource}${resourceId ? ` (${resourceId})` : ''} by user ${userId}`,
        'AUDIT',
        auditEntry
      );

      // Check for suspicious activity
      this.checkSuspiciousActivity(auditEntry);

      // Cleanup if memory limit exceeded
      if (this.auditLogs.size > this.maxLogsInMemory) {
        this.cleanupOldestLogs();
      }

    } catch (error) {
      logger.error('Failed to log audit entry', 'AUDIT', error);
    }
  }

  /**
   * Log authentication events
   * @param {Object} authData - Authentication event data
   */
  logAuthEvent(authData) {
    const {
      userId,
      phoneNumber,
      action, // 'login', 'logout', 'otp_request', 'otp_verify', 'failed_login'
      success,
      ipAddress,
      userAgent,
      errorMessage = null,
      metadata = {}
    } = authData;

    this.logUserAction({
      userId: userId || phoneNumber,
      userRole: 'user',
      action: `auth_${action}`,
      resource: 'authentication',
      resourceId: phoneNumber,
      details: `Authentication ${action} ${success ? 'successful' : 'failed'}`,
      ipAddress,
      userAgent,
      success,
      errorMessage,
      metadata: {
        ...metadata,
        authType: 'otp',
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log data access events
   * @param {Object} accessData - Data access event data
   */
  logDataAccess(accessData) {
    const {
      userId,
      userRole,
      action, // 'read', 'create', 'update', 'delete'
      resource, // 'user_profile', 'blood_request', 'donation_record'
      resourceId,
      sensitiveFields = [],
      ipAddress,
      userAgent,
      success = true,
      errorMessage = null
    } = accessData;

    this.logUserAction({
      userId,
      userRole,
      action: `data_${action}`,
      resource,
      resourceId,
      details: `Data ${action} on ${resource}${sensitiveFields.length ? ` (sensitive fields: ${sensitiveFields.join(', ')})` : ''}`,
      ipAddress,
      userAgent,
      success,
      errorMessage,
      metadata: {
        sensitiveFields,
        dataClassification: this.classifyDataSensitivity(resource, sensitiveFields)
      }
    });
  }

  /**
   * Log security events
   * @param {Object} securityData - Security event data
   */
  logSecurityEvent(securityData) {
    const {
      userId,
      action, // 'rate_limit_exceeded', 'suspicious_activity', 'unauthorized_access'
      resource,
      severity = 'medium', // 'low', 'medium', 'high', 'critical'
      ipAddress,
      userAgent,
      details,
      metadata = {}
    } = securityData;

    this.logUserAction({
      userId: userId || 'anonymous',
      userRole: 'unknown',
      action: `security_${action}`,
      resource: resource || 'system',
      details,
      ipAddress,
      userAgent,
      success: false,
      metadata: {
        ...metadata,
        securityEvent: true,
        severity,
        requiresInvestigation: severity === 'high' || severity === 'critical'
      }
    });

    // Alert for high severity events
    if (severity === 'high' || severity === 'critical') {
      logger.error(`SECURITY ALERT: ${action} - ${details}`, 'SECURITY', securityData);
    }
  }

  /**
   * Get audit logs for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Array} Audit logs
   */
  getUserAuditLogs(userId, filters = {}) {
    const {
      startDate,
      endDate,
      action,
      resource,
      success,
      limit = 100
    } = filters;

    const userLogs = Array.from(this.auditLogs.values())
      .filter(log => log.userId.includes(encryptionService.maskSensitiveData(userId)))
      .filter(log => {
        if (startDate && new Date(log.timestamp) < new Date(startDate)) return false;
        if (endDate && new Date(log.timestamp) > new Date(endDate)) return false;
        if (action && !log.action.includes(action)) return false;
        if (resource && log.resource !== resource) return false;
        if (success !== undefined && log.success !== success) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    logger.info(`Retrieved ${userLogs.length} audit logs for user`, 'AUDIT');
    return userLogs;
  }

  /**
   * Get system audit statistics
   * @param {Object} filters - Filter options
   * @returns {Object} Audit statistics
   */
  getAuditStatistics(filters = {}) {
    const { startDate, endDate } = filters;
    const logs = Array.from(this.auditLogs.values())
      .filter(log => {
        if (startDate && new Date(log.timestamp) < new Date(startDate)) return false;
        if (endDate && new Date(log.timestamp) > new Date(endDate)) return false;
        return true;
      });

    const stats = {
      totalLogs: logs.length,
      successfulActions: logs.filter(log => log.success).length,
      failedActions: logs.filter(log => !log.success).length,
      uniqueUsers: new Set(logs.map(log => log.userId)).size,
      actionBreakdown: {},
      resourceBreakdown: {},
      severityBreakdown: {},
      categoryBreakdown: {},
      timeRange: {
        startDate: startDate || (logs.length ? logs[logs.length - 1].timestamp : null),
        endDate: endDate || (logs.length ? logs[0].timestamp : null)
      }
    };

    // Calculate breakdowns
    logs.forEach(log => {
      stats.actionBreakdown[log.action] = (stats.actionBreakdown[log.action] || 0) + 1;
      stats.resourceBreakdown[log.resource] = (stats.resourceBreakdown[log.resource] || 0) + 1;
      stats.severityBreakdown[log.severity] = (stats.severityBreakdown[log.severity] || 0) + 1;
      stats.categoryBreakdown[log.category] = (stats.categoryBreakdown[log.category] || 0) + 1;
    });

    logger.info(`Generated audit statistics for ${logs.length} logs`, 'AUDIT');
    return stats;
  }

  /**
   * Generate unique audit ID
   * @returns {string} Audit ID
   */
  generateAuditId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `audit_${timestamp}_${random}`;
  }

  /**
   * Sanitize audit details
   * @param {string} details - Details to sanitize
   * @returns {string} Sanitized details
   */
  sanitizeDetails(details) {
    if (!details) return null;
    
    // Remove potential sensitive information
    return details
      .replace(/password[=:]\s*\S+/gi, 'password=***')
      .replace(/token[=:]\s*\S+/gi, 'token=***')
      .replace(/key[=:]\s*\S+/gi, 'key=***')
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '****-****-****-****') // Credit card
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****') // SSN
      .substring(0, 500); // Limit length
  }

  /**
   * Sanitize metadata
   * @param {Object} metadata - Metadata to sanitize
   * @returns {Object} Sanitized metadata
   */
  sanitizeMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') return {};
    
    const sanitized = {};
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'otp'];
    
    for (const [key, value] of Object.entries(metadata)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '***';
      } else if (typeof value === 'string' && value.length > 200) {
        sanitized[key] = value.substring(0, 200) + '...';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Calculate severity level
   * @param {string} action - Action performed
   * @param {boolean} success - Whether action was successful
   * @returns {string} Severity level
   */
  calculateSeverity(action, success) {
    const highRiskActions = ['delete', 'admin', 'security', 'auth_failed'];
    const mediumRiskActions = ['update', 'create', 'access'];
    
    if (!success) return 'high';
    if (highRiskActions.some(risk => action.includes(risk))) return 'high';
    if (mediumRiskActions.some(risk => action.includes(risk))) return 'medium';
    return 'low';
  }

  /**
   * Categorize action
   * @param {string} action - Action performed
   * @returns {string} Action category
   */
  categorizeAction(action) {
    if (action.includes('auth')) return 'authentication';
    if (action.includes('data')) return 'data_access';
    if (action.includes('security')) return 'security';
    if (action.includes('admin')) return 'administration';
    return 'general';
  }

  /**
   * Classify data sensitivity
   * @param {string} resource - Resource type
   * @param {Array} sensitiveFields - Sensitive fields accessed
   * @returns {string} Data classification
   */
  classifyDataSensitivity(resource, sensitiveFields = []) {
    const highSensitivityResources = ['user_profile', 'medical_data', 'payment_info'];
    const highSensitivityFields = ['phone', 'email', 'address', 'medicalConditions', 'nationalId'];
    
    if (highSensitivityResources.includes(resource)) return 'high';
    if (sensitiveFields.some(field => highSensitivityFields.includes(field))) return 'high';
    if (sensitiveFields.length > 0) return 'medium';
    return 'low';
  }

  /**
   * Check for suspicious activity patterns
   * @param {Object} auditEntry - Audit entry to analyze
   */
  checkSuspiciousActivity(auditEntry) {
    const recentLogs = Array.from(this.auditLogs.values())
      .filter(log => log.userId === auditEntry.userId)
      .filter(log => new Date(log.timestamp) > new Date(Date.now() - 5 * 60 * 1000)) // Last 5 minutes
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Check for rapid successive failures
    const recentFailures = recentLogs.filter(log => !log.success).length;
    if (recentFailures >= 5) {
      this.logSecurityEvent({
        userId: auditEntry.userId,
        action: 'suspicious_activity',
        resource: 'user_account',
        severity: 'high',
        ipAddress: auditEntry.ipAddress,
        userAgent: auditEntry.userAgent,
        details: `Multiple failed attempts detected: ${recentFailures} failures in 5 minutes`,
        metadata: { failureCount: recentFailures, timeWindow: '5min' }
      });
    }

    // Check for unusual access patterns
    const uniqueResources = new Set(recentLogs.map(log => log.resource)).size;
    if (uniqueResources >= 10) {
      this.logSecurityEvent({
        userId: auditEntry.userId,
        action: 'unusual_access_pattern',
        resource: 'system',
        severity: 'medium',
        ipAddress: auditEntry.ipAddress,
        userAgent: auditEntry.userAgent,
        details: `Accessing multiple resources rapidly: ${uniqueResources} different resources`,
        metadata: { resourceCount: uniqueResources, timeWindow: '5min' }
      });
    }
  }

  /**
   * Cleanup old logs beyond retention period
   */
  cleanupOldLogs() {
    const cutoffDate = new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [auditId, log] of this.auditLogs.entries()) {
      if (new Date(log.timestamp) < cutoffDate) {
        this.auditLogs.delete(auditId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} old audit logs`, 'AUDIT');
    }
  }

  /**
   * Cleanup oldest logs when memory limit is exceeded
   */
  cleanupOldestLogs() {
    const logs = Array.from(this.auditLogs.entries())
      .sort(([, a], [, b]) => new Date(a.timestamp) - new Date(b.timestamp));

    const toRemove = logs.slice(0, Math.floor(this.maxLogsInMemory * 0.1)); // Remove 10%
    
    toRemove.forEach(([auditId]) => {
      this.auditLogs.delete(auditId);
    });

    logger.info(`Cleaned up ${toRemove.length} oldest audit logs due to memory limit`, 'AUDIT');
  }

  /**
   * Log API usage for analytics
   * @param {Object} apiData - API usage data
   */
  logApiUsage(apiData) {
    const {
      requestId,
      method,
      endpoint,
      statusCode,
      duration,
      ipAddress,
      userAgent,
      userId,
      userRole,
      success,
      timestamp
    } = apiData;

    this.logUserAction({
      userId: userId || 'anonymous',
      userRole: userRole || 'guest',
      action: `api_${method.toLowerCase()}`,
      resource: endpoint,
      resourceId: requestId,
      details: `${method} ${endpoint} - ${statusCode} (${duration}ms)`,
      ipAddress,
      userAgent,
      success,
      metadata: {
        statusCode,
        duration,
        timestamp
      }
    });
  }

  /**
   * Log system events
   * @param {Object} systemData - System event data
   */
  logSystemEvent(systemData) {
    const {
      event,
      service,
      details,
      success = true,
      metadata = {}
    } = systemData;

    this.logUserAction({
      userId: 'system',
      userRole: 'system',
      action: `system_${event}`,
      resource: service || 'system',
      resourceId: null,
      details: details || event,
      ipAddress: 'localhost',
      userAgent: 'system',
      success,
      metadata
    });
  }

  /**
   * Get audit service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      totalLogs: this.auditLogs.size,
      maxLogsInMemory: this.maxLogsInMemory,
      retentionDays: this.retentionDays,
      oldestLog: this.auditLogs.size > 0 ? 
        Math.min(...Array.from(this.auditLogs.values()).map(log => new Date(log.timestamp))) : null,
      newestLog: this.auditLogs.size > 0 ? 
        Math.max(...Array.from(this.auditLogs.values()).map(log => new Date(log.timestamp))) : null,
      ready: true
    };
  }
}

// Create singleton instance
const auditLogger = new AuditLogger();

module.exports = auditLogger;