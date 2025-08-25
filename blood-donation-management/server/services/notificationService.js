const whatsappService = require('./whatsappService');
const smsService = require('./smsService');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.retryQueue = new Map(); // In-memory queue (use Redis in production)
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
    this.exponentialBackoff = true;
    
    // Start retry processor
    this.startRetryProcessor();
    
    logger.success('Notification Service initialized', 'NOTIFICATION_SERVICE');
  }

  /**
   * Send notification with fallback channels
   * @param {Object} notification - Notification data
   * @returns {Promise<Object>} Send result
   */
  async sendNotification(notification) {
    const {
      phoneNumber,
      message,
      type = 'general',
      priority = 'normal',
      channels = ['push', 'email'],
      templateName = null,
      templateParams = [],
      userPreferences = {},
      metadata = {}
    } = notification;

    logger.info(`Sending ${type} notification to ${this.maskPhoneNumber(phoneNumber)}`, 'NOTIFICATION_SERVICE');

    const notificationId = this.generateNotificationId();
    const result = {
      id: notificationId,
      success: false,
      channelsAttempted: [],
      channelResults: {},
      finalChannel: null,
      message: '',
      timestamp: new Date().toISOString()
    };

    // Determine channel order using admin-configured settings with fallback
    const orderedChannels = await this.getAdminChannelOrder(channels, userPreferences, priority, metadata?.urgency);

    // Try each channel in order until success
    for (const channel of orderedChannels) {
      try {
        logger.info(`Attempting ${channel} for notification ${notificationId}`, 'NOTIFICATION_SERVICE');
        
        result.channelsAttempted.push(channel);
        
        let channelResult;
        switch (channel) {
          case 'whatsapp':
            channelResult = await this.sendWhatsAppNotification(phoneNumber, message, templateName, templateParams);
            break;
          case 'sms':
            channelResult = await this.sendSMSNotification(phoneNumber, message);
            break;
          case 'email':
            channelResult = await this.sendEmailNotification(notification.email || userPreferences.email, message, type);
            break;
          case 'push':
            channelResult = await this.sendWebPushNotification(notification);
            break;
          default:
            channelResult = { success: false, error: 'UNKNOWN_CHANNEL' };
        }

        result.channelResults[channel] = channelResult;

        if (channelResult.success) {
          result.success = true;
          result.finalChannel = channel;
          result.message = `Notification sent successfully via ${channel}`;
          result.messageId = channelResult.messageId;
          
          logger.success(`Notification ${notificationId} sent via ${channel}`, 'NOTIFICATION_SERVICE');
          break;
        } else {
          logger.warn(`${channel} failed for notification ${notificationId}: ${channelResult.message}`, 'NOTIFICATION_SERVICE');
        }

      } catch (error) {
        logger.error(`Error sending via ${channel} for notification ${notificationId}`, 'NOTIFICATION_SERVICE', error);
        result.channelResults[channel] = {
          success: false,
          error: 'CHANNEL_ERROR',
          message: error.message
        };
      }
    }

    // If all channels failed, queue for retry
    if (!result.success) {
      await this.queueForRetry(notification, result);
      result.message = 'All channels failed, queued for retry';
    }

    // Log notification attempt
    this.logNotificationAttempt(notification, result);

    return result;
  }

  async getAdminChannelOrder(defaultChannels, userPreferences, priority, urgency) {
    try {
      const NotificationSettings = require('../models/NotificationSettings');
      const settings = await NotificationSettings.getSettings();
      let order = [...(settings.channelOrder || defaultChannels)];
      // Append WhatsApp/SMS for escalation by urgency
      if (settings.enableWhatsApp && settings.escalateToWhatsAppOnPriority?.includes(urgency)) {
        if (!order.includes('whatsapp')) order.push('whatsapp');
      }
      if (settings.enableSMS && settings.escalateToSMSOnPriority?.includes(urgency)) {
        if (!order.includes('sms')) order.push('sms');
      }
      return this.getChannelOrder(order, userPreferences, priority);
    } catch (e) {
      logger.warn('Falling back to default channel order', 'NOTIFICATION_SERVICE', e);
      return this.getChannelOrder(defaultChannels, userPreferences, priority);
    }
  }

  async sendWebPushNotification(notification) {
    try {
      const webpush = require('web-push');
      const PushSubscription = require('../models/PushSubscription');
      const { userId, title = 'CallforBlood Foundation', message, metadata } = notification;
      const subs = await PushSubscription.find({ userId });
      if (!subs.length) return { success: false, message: 'NO_SUBSCRIPTIONS' };
      const payload = JSON.stringify({ title, body: message, data: { metadata } });
      await Promise.all(
        subs.map(s => webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload))
      );
      return { success: true };
    } catch (error) {
      logger.error('Web Push notification failed', 'NOTIFICATION_SERVICE', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send WhatsApp notification
   * @param {string} phoneNumber - Phone number
   * @param {string} message - Message text
   * @param {string} templateName - Template name
   * @param {Array} templateParams - Template parameters
   * @returns {Promise<Object>} Send result
   */
  async sendWhatsAppNotification(phoneNumber, message, templateName = null, templateParams = []) {
    try {
      if (templateName) {
        return await whatsappService.sendTemplateMessage(phoneNumber, templateName, templateParams);
      } else {
        return await whatsappService.sendMessage(phoneNumber, message);
      }
    } catch (error) {
      logger.error('WhatsApp notification failed', 'NOTIFICATION_SERVICE', error);
      return {
        success: false,
        error: 'WHATSAPP_FAILED',
        message: error.message
      };
    }
  }

  /**
   * Send SMS notification
   * @param {string} phoneNumber - Phone number
   * @param {string} message - Message text
   * @returns {Promise<Object>} Send result
   */
  async sendSMSNotification(phoneNumber, message) {
    try {
      return await smsService.sendSMS(phoneNumber, message);
    } catch (error) {
      logger.error('SMS notification failed', 'NOTIFICATION_SERVICE', error);
      return {
        success: false,
        error: 'SMS_FAILED',
        message: error.message
      };
    }
  }

  /**
   * Send email notification
   * @param {string} email - Email address
   * @param {string} message - Message text
   * @param {string} type - Notification type
   * @returns {Promise<Object>} Send result
   */
  async sendEmailNotification(email, message, type) {
    try {
      if (!email) {
        return {
          success: false,
          error: 'NO_EMAIL',
          message: 'No email address provided'
        };
      }

      const subject = this.getEmailSubject(type);
      return await emailService.sendEmail(email, subject, message);
    } catch (error) {
      logger.error('Email notification failed', 'NOTIFICATION_SERVICE', error);
      return {
        success: false,
        error: 'EMAIL_FAILED',
        message: error.message
      };
    }
  }

  /**
   * Send bulk notifications
   * @param {Array} notifications - Array of notification objects
   * @param {Object} options - Bulk send options
   * @returns {Promise<Object>} Bulk send result
   */
  async sendBulkNotifications(notifications, options = {}) {
    const { batchSize = 10, delayBetweenBatches = 1000, maxConcurrent = 5 } = options;
    
    logger.info(`Sending bulk notifications: ${notifications.length} total`, 'NOTIFICATION_SERVICE');
    
    const results = {
      total: notifications.length,
      successful: 0,
      failed: 0,
      results: []
    };

    // Process notifications in batches
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(notifications.length / batchSize)}`, 'NOTIFICATION_SERVICE');
      
      // Limit concurrent operations
      const semaphore = new Array(Math.min(maxConcurrent, batch.length)).fill(null);
      
      const batchPromises = batch.map(async (notification, index) => {
        // Wait for semaphore slot
        await new Promise(resolve => {
          const checkSlot = () => {
            const slotIndex = semaphore.findIndex(slot => slot === null);
            if (slotIndex !== -1) {
              semaphore[slotIndex] = index;
              resolve();
            } else {
              setTimeout(checkSlot, 100);
            }
          };
          checkSlot();
        });

        try {
          const result = await this.sendNotification(notification);
          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
          }
          return result;
        } catch (error) {
          results.failed++;
          return {
            success: false,
            error: 'SEND_FAILED',
            message: error.message
          };
        } finally {
          // Release semaphore slot
          const slotIndex = semaphore.findIndex(slot => slot === index);
          if (slotIndex !== -1) {
            semaphore[slotIndex] = null;
          }
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.results.push(...batchResults);

      // Delay between batches
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    logger.success(`Bulk notifications completed: ${results.successful} successful, ${results.failed} failed`, 'NOTIFICATION_SERVICE');
    
    return results;
  }

  /**
   * Queue notification for retry
   * @param {Object} notification - Original notification
   * @param {Object} lastResult - Last attempt result
   * @returns {Promise<void>}
   */
  async queueForRetry(notification, lastResult) {
    const retryId = this.generateRetryId();
    const retryData = {
      id: retryId,
      notification,
      attempts: 1,
      lastResult,
      nextRetry: new Date(Date.now() + this.retryDelay),
      createdAt: new Date()
    };

    this.retryQueue.set(retryId, retryData);
    
    logger.info(`Queued notification for retry: ${retryId}`, 'NOTIFICATION_SERVICE');
  }

  /**
   * Process retry queue
   */
  async processRetryQueue() {
    const now = new Date();
    const retryItems = Array.from(this.retryQueue.values())
      .filter(item => item.nextRetry <= now && item.attempts < this.maxRetries);

    if (retryItems.length === 0) {
      return;
    }

    logger.info(`Processing ${retryItems.length} retry items`, 'NOTIFICATION_SERVICE');

    for (const retryItem of retryItems) {
      try {
        logger.info(`Retrying notification: ${retryItem.id} (attempt ${retryItem.attempts + 1})`, 'NOTIFICATION_SERVICE');
        
        const result = await this.sendNotification(retryItem.notification);
        
        if (result.success) {
          // Success - remove from retry queue
          this.retryQueue.delete(retryItem.id);
          logger.success(`Retry successful for: ${retryItem.id}`, 'NOTIFICATION_SERVICE');
        } else {
          // Failed - update retry data
          retryItem.attempts++;
          retryItem.lastResult = result;
          
          if (retryItem.attempts >= this.maxRetries) {
            // Max retries reached - remove from queue
            this.retryQueue.delete(retryItem.id);
            logger.error(`Max retries reached for: ${retryItem.id}`, 'NOTIFICATION_SERVICE');
          } else {
            // Schedule next retry with exponential backoff
            const delay = this.exponentialBackoff 
              ? this.retryDelay * Math.pow(2, retryItem.attempts - 1)
              : this.retryDelay;
            
            retryItem.nextRetry = new Date(Date.now() + delay);
            logger.info(`Scheduled next retry for: ${retryItem.id} in ${delay}ms`, 'NOTIFICATION_SERVICE');
          }
        }

      } catch (error) {
        logger.error(`Error processing retry: ${retryItem.id}`, 'NOTIFICATION_SERVICE', error);
      }
    }
  }

  /**
   * Start retry processor
   */
  startRetryProcessor() {
    setInterval(() => {
      this.processRetryQueue();
    }, 30000); // Process every 30 seconds

    logger.debug('Started notification retry processor', 'NOTIFICATION_SERVICE');
  }

  /**
   * Get channel order based on preferences and priority
   * @param {Array} channels - Available channels
   * @param {Object} userPreferences - User preferences
   * @param {string} priority - Notification priority
   * @returns {Array} Ordered channels
   */
  getChannelOrder(channels, userPreferences, priority) {
    // Default order
    let orderedChannels = [...channels];

    // Apply user preferences
    if (userPreferences.preferredChannel) {
      const preferred = userPreferences.preferredChannel;
      if (channels.includes(preferred)) {
        orderedChannels = [preferred, ...channels.filter(c => c !== preferred)];
      }
    }

    // Adjust for priority
    if (priority === 'critical' || priority === 'urgent') {
      // For urgent notifications, try all channels simultaneously
      // For now, we'll keep the sequential approach but prioritize WhatsApp
      if (orderedChannels.includes('whatsapp')) {
        orderedChannels = ['whatsapp', ...orderedChannels.filter(c => c !== 'whatsapp')];
      }
    }

    // Filter out disabled channels
    if (userPreferences.disabledChannels) {
      orderedChannels = orderedChannels.filter(c => !userPreferences.disabledChannels.includes(c));
    }

    return orderedChannels;
  }

  /**
   * Get email subject based on notification type
   * @param {string} type - Notification type
   * @returns {string} Email subject
   */
  getEmailSubject(type) {
    const subjects = {
      'blood_request': '🩸 Urgent Blood Donation Request',
      'donation_confirmation': '✅ Blood Donation Confirmed',
      'appointment_reminder': '⏰ Blood Donation Appointment Reminder',
      'registration_approved': '🎉 Blood Donor Registration Approved',
      'registration_rejected': '❌ Blood Donor Registration Update',
      'otp_verification': '🔐 Verification Code - CallforBlood Foundation',
      'general': '📢 CallforBlood Foundation Notification'
    };

    return subjects[type] || subjects['general'];
  }

  /**
   * Log notification attempt
   * @param {Object} notification - Original notification
   * @param {Object} result - Send result
   */
  logNotificationAttempt(notification, result) {
    const logData = {
      notificationId: result.id,
      type: notification.type,
      phoneNumber: this.maskPhoneNumber(notification.phoneNumber),
      success: result.success,
      finalChannel: result.finalChannel,
      channelsAttempted: result.channelsAttempted,
      timestamp: result.timestamp
    };

    if (result.success) {
      logger.success('Notification sent successfully', 'NOTIFICATION_SERVICE', logData);
    } else {
      logger.error('Notification failed on all channels', 'NOTIFICATION_SERVICE', logData);
    }
  }

  /**
   * Get notification statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      retryQueueSize: this.retryQueue.size,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      exponentialBackoff: this.exponentialBackoff
    };
  }

  /**
   * Generate notification ID
   * @returns {string} Notification ID
   */
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Generate retry ID
   * @returns {string} Retry ID
   */
  generateRetryId() {
    return `retry_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Mask phone number for logging
   * @param {string} phoneNumber - Phone number to mask
   * @returns {string} Masked phone number
   */
  maskPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 4) return '****';
    return phoneNumber.slice(0, 2) + '*'.repeat(phoneNumber.length - 4) + phoneNumber.slice(-2);
  }

  /**
   * Clear retry queue (for testing/maintenance)
   */
  clearRetryQueue() {
    const size = this.retryQueue.size;
    this.retryQueue.clear();
    logger.info(`Cleared retry queue: ${size} items removed`, 'NOTIFICATION_SERVICE');
  }

  /**
   * Get retry queue status
   * @returns {Array} Retry queue items
   */
  getRetryQueueStatus() {
    return Array.from(this.retryQueue.values()).map(item => ({
      id: item.id,
      attempts: item.attempts,
      nextRetry: item.nextRetry,
      phoneNumber: this.maskPhoneNumber(item.notification.phoneNumber),
      type: item.notification.type
    }));
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;