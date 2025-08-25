const logger = require('./logger');

class AuditLogger {
  constructor() {
    this.logLevel = process.env.AUDIT_LOG_LEVEL || 'info';
  }

  /**
   * Log user action for audit trail
   * @param {Object} actionData - Action data to log
   * @param {string} actionData.userId - User ID performing the action
   * @param {string} actionData.userRole - User role
   * @param {string} actionData.action - Action performed
   * @param {string} actionData.resource - Resource affected
   * @param {string} actionData.details - Action details
   * @param {string} actionData.ipAddress - User IP address
   * @param {string} actionData.userAgent - User agent string
   * @param {boolean} actionData.success - Whether action was successful
   * @param {Object} actionData.metadata - Additional metadata
   */
  logUserAction(actionData) {
    try {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        userId: actionData.userId,
        userRole: actionData.userRole,
        action: actionData.action,
        resource: actionData.resource,
        details: actionData.details,
        ipAddress: actionData.ipAddress,
        userAgent: actionData.userAgent,
        success: actionData.success,
        metadata: actionData.metadata || {}
      };

      // Log to console/file based on log level
      if (actionData.success) {
        logger.info(`AUDIT: ${actionData.action} on ${actionData.resource} by ${actionData.userId}`, 'AUDIT', auditEntry);
      } else {
        logger.error(`AUDIT: Failed ${actionData.action} on ${actionData.resource} by ${actionData.userId}`, 'AUDIT', auditEntry);
      }

      // In production, you might want to store this in a separate audit database
      // For now, we'll just log it
      
    } catch (error) {
      logger.error('Failed to log audit entry', 'AUDIT', error);
    }
  }

  /**
   * Log system event
   * @param {Object} eventData - Event data to log
   */
  logSystemEvent(eventData) {
    try {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        type: 'system_event',
        event: eventData.event,
        details: eventData.details,
        metadata: eventData.metadata || {}
      };

      logger.info(`AUDIT: System event - ${eventData.event}`, 'AUDIT', auditEntry);
      
    } catch (error) {
      logger.error('Failed to log system event', 'AUDIT', error);
    }
  }

  /**
   * Log data access
   * @param {Object} accessData - Access data to log
   */
  logDataAccess(accessData) {
    try {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        userId: accessData.userId,
        userRole: accessData.userRole,
        action: 'data_access',
        resource: accessData.resource,
        details: accessData.details,
        ipAddress: accessData.ipAddress,
        metadata: accessData.metadata || {}
      };

      logger.info(`AUDIT: Data access - ${accessData.resource} by ${accessData.userId}`, 'AUDIT', auditEntry);
      
    } catch (error) {
      logger.error('Failed to log data access', 'AUDIT', error);
    }
  }
}

// Create singleton instance
const auditLogger = new AuditLogger();

module.exports = auditLogger;