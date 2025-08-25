const axios = require('axios');
const logger = require('../utils/logger');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.baseURL = 'https://graph.facebook.com/v18.0';
    this.isConfigured = !!(this.accessToken && this.phoneNumberId);
    
    if (this.isConfigured) {
      logger.success('WhatsApp Service initialized with credentials', 'WHATSAPP_SERVICE');
      logger.debug(`Phone Number ID: ${this.phoneNumberId}`, 'WHATSAPP_SERVICE');
    } else {
      logger.warn('WhatsApp Service initialized without credentials (development mode)', 'WHATSAPP_SERVICE');
      logger.debug('Missing: WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_SERVICE');
    }
  }

  /**
   * Send OTP via WhatsApp
   * @param {string} phoneNumber - Recipient phone number (with country code)
   * @param {string} otp - OTP to send
   * @param {string} purpose - Purpose of OTP
   * @returns {Promise<Object>} Send result
   */
  async sendOTP(phoneNumber, otp, purpose = 'verification') {
    logger.info(`Sending OTP via WhatsApp to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE');
    
    // Development mode - simulate sending
    if (!this.isConfigured) {
      logger.warn('WhatsApp not configured - simulating OTP send', 'WHATSAPP_SERVICE');
      logger.info(`[SIMULATED] OTP for ${this.maskPhoneNumber(phoneNumber)}: ${otp}`, 'WHATSAPP_SERVICE');
      
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
        message: 'OTP sent successfully (simulated)',
        simulated: true
      };
    }

    try {
      const message = this.formatOTPMessage(otp, purpose);
      
      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message
        }
      };

      logger.debug('Sending WhatsApp message...', 'WHATSAPP_SERVICE');
      logger.logObject(payload, 'WhatsApp Payload', 'WHATSAPP_SERVICE');

      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 seconds timeout
        }
      );

      logger.success(`OTP sent successfully to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE');
      logger.debug(`Message ID: ${response.data.messages[0].id}`, 'WHATSAPP_SERVICE');

      return {
        success: true,
        messageId: response.data.messages[0].id,
        message: 'OTP sent successfully via WhatsApp',
        whatsappMessageId: response.data.messages[0].id
      };

    } catch (error) {
      logger.error(`Failed to send OTP via WhatsApp to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE', error);
      
      // Handle specific WhatsApp API errors
      if (error.response) {
        const { status, data } = error.response;
        logger.error(`WhatsApp API Error: ${status}`, 'WHATSAPP_SERVICE');
        logger.logObject(data, 'WhatsApp Error Response', 'WHATSAPP_SERVICE');
        
        return {
          success: false,
          error: 'WHATSAPP_API_ERROR',
          message: this.getErrorMessage(data),
          statusCode: status,
          details: data
        };
      } else if (error.code === 'ECONNABORTED') {
        logger.error('WhatsApp API timeout', 'WHATSAPP_SERVICE');
        return {
          success: false,
          error: 'TIMEOUT',
          message: 'WhatsApp service timeout. Please try again.'
        };
      } else {
        logger.error('Network error sending WhatsApp message', 'WHATSAPP_SERVICE', error);
        return {
          success: false,
          error: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection and try again.'
        };
      }
    }
  }

  /**
   * Send blood request notification via WhatsApp
   * @param {string} phoneNumber - Recipient phone number
   * @param {Object} requestData - Blood request details
   * @returns {Promise<Object>} Send result
   */
  async sendBloodRequestNotification(phoneNumber, requestData) {
    logger.info(`Sending blood request notification to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE');
    
    if (!this.isConfigured) {
      logger.warn('WhatsApp not configured - simulating blood request notification', 'WHATSAPP_SERVICE');
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
        message: 'Blood request notification sent (simulated)',
        simulated: true
      };
    }

    try {
      const message = this.formatBloodRequestMessage(requestData);
      
      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      logger.success(`Blood request notification sent to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE');
      
      return {
        success: true,
        messageId: response.data.messages[0].id,
        message: 'Blood request notification sent successfully'
      };

    } catch (error) {
      logger.error(`Failed to send blood request notification to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE', error);
      
      return {
        success: false,
        error: 'NOTIFICATION_FAILED',
        message: 'Failed to send blood request notification'
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

    return `🩸 *CallforBlood Foundation*

Your verification code is: *${otp}*

Use this code to ${action}.

⏰ This code expires in 5 minutes.
🔒 For security, don't share this code with anyone.

Need help? Contact us at http://wa.me/919491254120`;
  }

  /**
   * Format blood request message
   * @param {Object} requestData - Blood request details
   * @returns {string} Formatted message
   */
  formatBloodRequestMessage(requestData) {
    const urgencyEmoji = {
      'critical': '🚨',
      'urgent': '⚡',
      'scheduled': '📅'
    };

    const emoji = urgencyEmoji[requestData.urgency] || '🩸';

    return `${emoji} *BLOOD DONATION REQUEST*

*Blood Type Needed:* ${requestData.bloodType}
*Urgency:* ${requestData.urgency.toUpperCase()}
*Location:* ${requestData.location}
*Hospital:* ${requestData.hospital}

*Patient Details:*
${requestData.patientName ? `Name: ${requestData.patientName}` : ''}
${requestData.age ? `Age: ${requestData.age}` : ''}
${requestData.condition ? `Condition: ${requestData.condition}` : ''}

*Contact:* ${requestData.contactNumber}

Can you help save a life? 
Reply with:
✅ YES - I can donate
❌ NO - Cannot donate now
ℹ️ INFO - Need more details

*CallforBlood Foundation*
Every drop counts. Every donor matters.`;
  }

  /**
   * Get error message from WhatsApp API response
   * @param {Object} errorData - Error response data
   * @returns {string} User-friendly error message
   */
  getErrorMessage(errorData) {
    if (!errorData || !errorData.error) {
      return 'Unknown WhatsApp API error occurred';
    }

    const { code, message } = errorData.error;
    
    const errorMessages = {
      1: 'Invalid phone number format',
      2: 'Phone number not registered on WhatsApp',
      3: 'Rate limit exceeded. Please try again later',
      4: 'Invalid access token',
      5: 'Phone number ID not found',
      100: 'Invalid parameter provided',
      131000: 'Generic user error',
      131005: 'Phone number not registered on WhatsApp',
      131026: 'Message undeliverable',
      131047: 'Re-engagement message',
      131051: 'Unsupported message type',
      132000: 'Generic system error',
      132001: 'Authentication failed',
      132005: 'Access denied',
      132007: 'Rate limit exceeded',
      132012: 'Temporarily blocked for policy violations',
      132015: 'Generic client error',
      132016: 'Invalid request format'
    };

    return errorMessages[code] || message || 'WhatsApp service error';
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {Object} Validation result
   */
  validatePhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid Indian mobile number
    const indianMobileRegex = /^91[6-9]\d{9}$/;
    const isValidIndian = indianMobileRegex.test(cleaned);
    
    if (isValidIndian) {
      return {
        valid: true,
        formatted: cleaned,
        country: 'IN',
        message: 'Valid Indian mobile number'
      };
    }

    // Check for international format (basic validation)
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return {
        valid: true,
        formatted: cleaned,
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
   * Mask phone number for logging
   * @param {string} phoneNumber - Phone number to mask
   * @returns {string} Masked phone number
   */
  maskPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 4) return '****';
    return phoneNumber.slice(0, 2) + '*'.repeat(phoneNumber.length - 4) + phoneNumber.slice(-2);
  }

  /**
   * Send donor approval notification
   * @param {string} phoneNumber - Donor's phone number
   * @param {Object} data - Approval data
   * @returns {Promise<Object>} Send result
   */
  async sendApprovalNotification(phoneNumber, data) {
    logger.info(`Sending approval notification to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE');
    
    if (!this.isConfigured) {
      logger.warn('WhatsApp not configured - simulating approval notification', 'WHATSAPP_SERVICE');
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
        message: 'Approval notification sent (simulated)',
        simulated: true
      };
    }

    try {
      const message = `🎉 *Congratulations ${data.name}!*

Your blood donor registration has been *APPROVED* by our admin team!

✅ You are now a verified donor
✅ You can start receiving blood donation requests
✅ Help save lives in your community

Thank you for joining our life-saving mission! 🩸❤️

*CallforBlood Foundation*`;

      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      logger.success(`Approval notification sent to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE');
      
      return {
        success: true,
        messageId: response.data.messages[0].id,
        message: 'Approval notification sent successfully'
      };

    } catch (error) {
      logger.error(`Failed to send approval notification to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE', error);
      
      return {
        success: false,
        error: 'NOTIFICATION_FAILED',
        message: 'Failed to send approval notification'
      };
    }
  }

  /**
   * Send donor rejection notification
   * @param {string} phoneNumber - Donor's phone number
   * @param {Object} data - Rejection data
   * @returns {Promise<Object>} Send result
   */
  async sendRejectionNotification(phoneNumber, data) {
    logger.info(`Sending rejection notification to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE');
    
    if (!this.isConfigured) {
      logger.warn('WhatsApp not configured - simulating rejection notification', 'WHATSAPP_SERVICE');
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
        message: 'Rejection notification sent (simulated)',
        simulated: true
      };
    }

    try {
      const message = `❌ *Registration Update*

Dear ${data.name},

Unfortunately, your blood donor registration could not be approved at this time.

*Reason:* ${data.reason}

You can reapply after addressing the mentioned concerns. Please contact our support team if you have any questions.

*CallforBlood Foundation*
Support: http://wa.me/919491254120`;

      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      logger.success(`Rejection notification sent to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE');
      
      return {
        success: true,
        messageId: response.data.messages[0].id,
        message: 'Rejection notification sent successfully'
      };

    } catch (error) {
      logger.error(`Failed to send rejection notification to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE', error);
      
      return {
        success: false,
        error: 'NOTIFICATION_FAILED',
        message: 'Failed to send rejection notification'
      };
    }
  }

  /**
   * Send template message
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} templateName - Template name
   * @param {Array} parameters - Template parameters
   * @returns {Promise<Object>} Send result
   */
  async sendTemplateMessage(phoneNumber, templateName, parameters = []) {
    logger.info(`Sending template message to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE');
    
    if (!this.isConfigured) {
      logger.warn('WhatsApp not configured - simulating template message', 'WHATSAPP_SERVICE');
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
        message: 'Template message sent (simulated)',
        simulated: true
      };
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'en'
          },
          components: parameters.length > 0 ? [{
            type: 'body',
            parameters: parameters.map(param => ({
              type: 'text',
              text: param
            }))
          }] : []
        }
      };

      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      logger.success(`Template message sent to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE');
      
      return {
        success: true,
        messageId: response.data.messages[0].id,
        message: 'Template message sent successfully'
      };

    } catch (error) {
      logger.error(`Failed to send template message to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE', error);
      
      return {
        success: false,
        error: 'TEMPLATE_FAILED',
        message: 'Failed to send template message'
      };
    }
  }

  /**
   * Send message with retry logic
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - Message text
   * @param {Object} options - Send options
   * @returns {Promise<Object>} Send result
   */
  async sendMessage(phoneNumber, message, options = {}) {
    const { retries = 3, delay = 1000 } = options;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.info(`Sending message to: ${this.maskPhoneNumber(phoneNumber)} (attempt ${attempt})`, 'WHATSAPP_SERVICE');
        
        if (!this.isConfigured) {
          logger.warn('WhatsApp not configured - simulating message send', 'WHATSAPP_SERVICE');
          return {
            success: true,
            messageId: `sim_${Date.now()}`,
            message: 'Message sent successfully (simulated)',
            simulated: true
          };
        }

        const payload = {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            body: message
          }
        };

        const response = await axios.post(
          `${this.baseURL}/${this.phoneNumberId}/messages`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        logger.success(`Message sent successfully to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE');
        
        return {
          success: true,
          messageId: response.data.messages[0].id,
          message: 'Message sent successfully'
        };

      } catch (error) {
        logger.error(`Attempt ${attempt} failed for ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE', error);
        
        if (attempt === retries) {
          return {
            success: false,
            error: 'MESSAGE_SEND_FAILED',
            message: 'Failed to send message after retries',
            attempts: attempt
          };
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
  }

  /**
   * Send interactive message with buttons
   * @param {string} phoneNumber - Recipient phone number
   * @param {Object} messageData - Interactive message data
   * @returns {Promise<Object>} Send result
   */
  async sendInteractiveMessage(phoneNumber, messageData) {
    logger.info(`Sending interactive message to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE');
    
    if (!this.isConfigured) {
      logger.warn('WhatsApp not configured - simulating interactive message', 'WHATSAPP_SERVICE');
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
        message: 'Interactive message sent (simulated)',
        simulated: true
      };
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'interactive',
        interactive: messageData
      };

      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      logger.success(`Interactive message sent to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE');
      
      return {
        success: true,
        messageId: response.data.messages[0].id,
        message: 'Interactive message sent successfully'
      };

    } catch (error) {
      logger.error(`Failed to send interactive message to: ${this.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_SERVICE', error);
      
      return {
        success: false,
        error: 'INTERACTIVE_MESSAGE_FAILED',
        message: 'Failed to send interactive message'
      };
    }
  }

  /**
   * Get message templates from WhatsApp API
   * @returns {Promise<Array>} Array of templates
   */
  async getMessageTemplates() {
    logger.info('Fetching message templates from WhatsApp API', 'WHATSAPP_SERVICE');
    
    if (!this.isConfigured) {
      logger.warn('WhatsApp not configured - returning empty templates', 'WHATSAPP_SERVICE');
      return [];
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
          timeout: 10000
        }
      );

      logger.success('Message templates fetched successfully', 'WHATSAPP_SERVICE');
      return response.data.data || [];

    } catch (error) {
      logger.error('Failed to fetch message templates', 'WHATSAPP_SERVICE', error);
      return [];
    }
  }

  /**
   * Create message template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Creation result
   */
  async createMessageTemplate(templateData) {
    logger.info(`Creating message template: ${templateData.name}`, 'WHATSAPP_SERVICE');
    
    if (!this.isConfigured) {
      logger.warn('WhatsApp not configured - simulating template creation', 'WHATSAPP_SERVICE');
      return {
        success: true,
        message: 'Template created successfully (simulated)',
        simulated: true
      };
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
        templateData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      logger.success(`Template created successfully: ${templateData.name}`, 'WHATSAPP_SERVICE');
      
      return {
        success: true,
        templateId: response.data.id,
        message: 'Template created successfully'
      };

    } catch (error) {
      logger.error(`Failed to create template: ${templateData.name}`, 'WHATSAPP_SERVICE', error);
      
      return {
        success: false,
        error: 'TEMPLATE_CREATION_FAILED',
        message: 'Failed to create message template'
      };
    }
  }

  /**
   * Get message delivery status
   * @param {string} messageId - WhatsApp message ID
   * @returns {Promise<Object>} Delivery status
   */
  async getMessageStatus(messageId) {
    logger.info(`Checking message status: ${messageId}`, 'WHATSAPP_SERVICE');
    
    if (!this.isConfigured) {
      logger.warn('WhatsApp not configured - simulating status check', 'WHATSAPP_SERVICE');
      return {
        success: true,
        status: 'delivered',
        simulated: true
      };
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/${messageId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
          timeout: 10000
        }
      );

      logger.success(`Message status retrieved: ${messageId}`, 'WHATSAPP_SERVICE');
      
      return {
        success: true,
        status: response.data.status,
        timestamp: response.data.timestamp
      };

    } catch (error) {
      logger.error(`Failed to get message status: ${messageId}`, 'WHATSAPP_SERVICE', error);
      
      return {
        success: false,
        error: 'STATUS_CHECK_FAILED',
        message: 'Failed to check message status'
      };
    }
  }

  /**
   * Send bulk messages with rate limiting
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Bulk send options
   * @returns {Promise<Object>} Bulk send result
   */
  async sendBulkMessages(messages, options = {}) {
    const { batchSize = 10, delayBetweenBatches = 1000 } = options;
    
    logger.info(`Sending bulk messages: ${messages.length} total`, 'WHATSAPP_SERVICE');
    
    const results = {
      total: messages.length,
      successful: 0,
      failed: 0,
      results: []
    };

    // Process messages in batches
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(messages.length / batchSize)}`, 'WHATSAPP_SERVICE');
      
      // Send batch concurrently
      const batchPromises = batch.map(async (msg) => {
        try {
          const result = await this.sendMessage(msg.phoneNumber, msg.message, { retries: 2 });
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

      // Delay between batches to respect rate limits
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    logger.success(`Bulk send completed: ${results.successful} successful, ${results.failed} failed`, 'WHATSAPP_SERVICE');
    
    return results;
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      hasToken: !!this.accessToken,
      hasPhoneNumberId: !!this.phoneNumberId,
      baseURL: this.baseURL,
      ready: this.isConfigured
    };
  }
}

// Create singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;