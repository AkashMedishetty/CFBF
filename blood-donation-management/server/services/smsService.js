const twilio = require('twilio');
const logger = require('../utils/logger');

class SMSService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    this.isConfigured = !!(this.accountSid && this.authToken && this.fromNumber);
    
    if (this.isConfigured) {
      this.client = twilio(this.accountSid, this.authToken);
      logger.success('SMS Service initialized with Twilio credentials', 'SMS_SERVICE');
    } else {
      logger.warn('SMS Service initialized without credentials (development mode)', 'SMS_SERVICE');
      logger.debug('Missing: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER', 'SMS_SERVICE');
    }
  }

  /**
   * Send SMS message
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - Message text
   * @param {Object} options - Send options
   * @returns {Promise<Object>} Send result
   */
  async sendSMS(phoneNumber, message, options = {}) {
    logger.info(`Sending SMS to: ${this.maskPhoneNumber(phoneNumber)}`, 'SMS_SERVICE');
    
    // Development mode - simulate sending
    if (!this.isConfigured) {
      logger.warn('SMS not configured - simulating SMS send', 'SMS_SERVICE');
      logger.info(`[SIMULATED] SMS to ${this.maskPhoneNumber(phoneNumber)}: ${message.substring(0, 50)}...`, 'SMS_SERVICE');
      
      return {
        success: true,
        messageId: `sim_sms_${Date.now()}`,
        message: 'SMS sent successfully (simulated)',
        simulated: true
      };
    }

    try {
      // Format phone number for Twilio
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      if (!formattedNumber.valid) {
        return {
          success: false,
          error: 'INVALID_PHONE_NUMBER',
          message: formattedNumber.message
        };
      }

      // Truncate message if too long (SMS limit is 1600 characters)
      const truncatedMessage = message.length > 1600 
        ? message.substring(0, 1597) + '...'
        : message;

      const twilioMessage = await this.client.messages.create({
        body: truncatedMessage,
        from: this.fromNumber,
        to: formattedNumber.formatted,
        ...options
      });

      logger.success(`SMS sent successfully to: ${this.maskPhoneNumber(phoneNumber)}`, 'SMS_SERVICE');
      logger.debug(`Twilio Message SID: ${twilioMessage.sid}`, 'SMS_SERVICE');

      return {
        success: true,
        messageId: twilioMessage.sid,
        message: 'SMS sent successfully',
        status: twilioMessage.status,
        cost: twilioMessage.price,
        segments: twilioMessage.numSegments
      };

    } catch (error) {
      logger.error(`Failed to send SMS to: ${this.maskPhoneNumber(phoneNumber)}`, 'SMS_SERVICE', error);
      
      // Handle specific Twilio errors
      if (error.code) {
        return {
          success: false,
          error: 'TWILIO_ERROR',
          message: this.getTwilioErrorMessage(error.code),
          twilioCode: error.code,
          details: error.message
        };
      } else {
        return {
          success: false,
          error: 'SMS_SEND_ERROR',
          message: 'Failed to send SMS',
          details: error.message
        };
      }
    }
  }

  /**
   * Send OTP via SMS
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} otp - OTP code
   * @param {string} purpose - Purpose of OTP
   * @returns {Promise<Object>} Send result
   */
  async sendOTP(phoneNumber, otp, purpose = 'verification') {
    const message = this.formatOTPMessage(otp, purpose);
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send blood request notification via SMS
   * @param {string} phoneNumber - Recipient phone number
   * @param {Object} requestData - Blood request details
   * @returns {Promise<Object>} Send result
   */
  async sendBloodRequestNotification(phoneNumber, requestData) {
    const message = this.formatBloodRequestMessage(requestData);
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send bulk SMS messages
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Bulk send options
   * @returns {Promise<Object>} Bulk send result
   */
  async sendBulkSMS(messages, options = {}) {
    const { batchSize = 10, delayBetweenBatches = 1000 } = options;
    
    logger.info(`Sending bulk SMS: ${messages.length} total`, 'SMS_SERVICE');
    
    const results = {
      total: messages.length,
      successful: 0,
      failed: 0,
      results: []
    };

    // Process messages in batches to respect rate limits
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      logger.info(`Processing SMS batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(messages.length / batchSize)}`, 'SMS_SERVICE');
      
      // Send batch concurrently
      const batchPromises = batch.map(async (msg) => {
        try {
          const result = await this.sendSMS(msg.phoneNumber, msg.message);
          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
          }
          return { ...result, phoneNumber: this.maskPhoneNumber(msg.phoneNumber) };
        } catch (error) {
          results.failed++;
          return {
            success: false,
            error: 'SEND_FAILED',
            phoneNumber: this.maskPhoneNumber(msg.phoneNumber),
            message: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.results.push(...batchResults);

      // Delay between batches
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    logger.success(`Bulk SMS completed: ${results.successful} successful, ${results.failed} failed`, 'SMS_SERVICE');
    
    return results;
  }

  /**
   * Get SMS delivery status
   * @param {string} messageId - Twilio message SID
   * @returns {Promise<Object>} Delivery status
   */
  async getMessageStatus(messageId) {
    if (!this.isConfigured) {
      return {
        success: true,
        status: 'delivered',
        simulated: true
      };
    }

    try {
      const message = await this.client.messages(messageId).fetch();
      
      return {
        success: true,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
        price: message.price,
        priceUnit: message.priceUnit
      };

    } catch (error) {
      logger.error(`Failed to get SMS status: ${messageId}`, 'SMS_SERVICE', error);
      
      return {
        success: false,
        error: 'STATUS_CHECK_FAILED',
        message: 'Failed to check SMS status'
      };
    }
  }

  /**
   * Format OTP message
   * @param {string} otp - OTP code
   * @param {string} purpose - Purpose of OTP
   * @returns {string} Formatted message
   */
  formatOTPMessage(otp, purpose) {
    const purposeText = {
      'registration': 'complete your registration',
      'login': 'log into your account',
      'verification': 'verify your phone number',
      'password_reset': 'reset your password'
    };

    const action = purposeText[purpose] || 'verify your phone number';

    return `CallforBlood Foundation

Your verification code is: ${otp}

Use this code to ${action}.

This code expires in 5 minutes.
For security, don't share this code.

Need help? Contact http://wa.me/919491254120`;
  }

  /**
   * Format blood request message
   * @param {Object} requestData - Blood request details
   * @returns {string} Formatted message
   */
  formatBloodRequestMessage(requestData) {
    const urgencyText = {
      'critical': 'CRITICAL EMERGENCY',
      'urgent': 'URGENT REQUEST',
      'scheduled': 'SCHEDULED REQUEST'
    };

    const urgency = urgencyText[requestData.urgency] || 'BLOOD REQUEST';

    return `${urgency} - CallforBlood Foundation

Blood Type: ${requestData.bloodType}
Patient: ${requestData.patientName || 'Not specified'}
Hospital: ${requestData.hospital}
Location: ${requestData.location}
Contact: ${requestData.contactNumber}

Can you help save a life?
Reply YES to donate or NO if unavailable.

Every drop counts. Every donor matters.`;
  }

  /**
   * Format phone number for Twilio
   * @param {string} phoneNumber - Phone number to format
   * @returns {Object} Formatting result
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid Indian mobile number
    const indianMobileRegex = /^91[6-9]\d{9}$/;
    const isValidIndian = indianMobileRegex.test(cleaned);
    
    if (isValidIndian) {
      return {
        valid: true,
        formatted: `+${cleaned}`,
        country: 'IN',
        message: 'Valid Indian mobile number'
      };
    }

    // Check for international format
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      const formatted = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
      return {
        valid: true,
        formatted,
        country: 'UNKNOWN',
        message: 'Valid international number format'
      };
    }

    return {
      valid: false,
      error: 'INVALID_FORMAT',
      message: 'Invalid phone number format. Please include country code.'
    };
  }

  /**
   * Get Twilio error message
   * @param {number} errorCode - Twilio error code
   * @returns {string} User-friendly error message
   */
  getTwilioErrorMessage(errorCode) {
    const errorMessages = {
      21211: 'Invalid phone number format',
      21212: 'Phone number not found or invalid',
      21408: 'Permission denied for this phone number',
      21610: 'Message cannot be sent to landline',
      21614: 'Phone number is not a valid mobile number',
      30001: 'Message queue is full',
      30002: 'Account suspended',
      30003: 'Unreachable destination',
      30004: 'Message blocked by carrier',
      30005: 'Unknown destination',
      30006: 'Landline or unreachable carrier',
      30007: 'Carrier violation',
      30008: 'Unknown error'
    };

    return errorMessages[errorCode] || `Twilio error code: ${errorCode}`;
  }

  /**
   * Validate SMS content
   * @param {string} message - Message to validate
   * @returns {Object} Validation result
   */
  validateMessage(message) {
    const errors = [];

    if (!message || typeof message !== 'string') {
      errors.push('Message is required and must be a string');
    } else {
      if (message.trim().length === 0) {
        errors.push('Message cannot be empty');
      }
      
      if (message.length > 1600) {
        errors.push('Message is too long (max 1600 characters)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      length: message ? message.length : 0,
      segments: message ? Math.ceil(message.length / 160) : 0
    };
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
   * Get service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      hasAccountSid: !!this.accountSid,
      hasAuthToken: !!this.authToken,
      hasFromNumber: !!this.fromNumber,
      ready: this.isConfigured
    };
  }

  /**
   * Get account information (if configured)
   * @returns {Promise<Object>} Account info
   */
  async getAccountInfo() {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'SMS service not configured'
      };
    }

    try {
      const account = await this.client.api.accounts(this.accountSid).fetch();
      
      return {
        success: true,
        data: {
          friendlyName: account.friendlyName,
          status: account.status,
          type: account.type,
          dateCreated: account.dateCreated,
          dateUpdated: account.dateUpdated
        }
      };

    } catch (error) {
      logger.error('Failed to get Twilio account info', 'SMS_SERVICE', error);
      
      return {
        success: false,
        error: 'ACCOUNT_INFO_FAILED',
        message: 'Failed to get account information'
      };
    }
  }
}

// Create singleton instance
const smsService = new SMSService();

module.exports = smsService;