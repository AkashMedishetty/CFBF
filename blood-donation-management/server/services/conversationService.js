const logger = require('../utils/logger');

class ConversationService {
  constructor() {
    this.conversations = new Map(); // In-memory storage (use Redis in production)
    this.conversationTimeout = 30 * 60 * 1000; // 30 minutes
    this.cleanupInterval = 5 * 60 * 1000; // 5 minutes
    
    // Start cleanup interval
    this.startCleanupInterval();
    
    logger.success('Conversation Service initialized', 'CONVERSATION_SERVICE');
  }

  /**
   * Start a new conversation
   * @param {string} phoneNumber - User's phone number
   * @param {string} type - Conversation type
   * @param {Object} context - Initial context
   * @returns {string} Conversation ID
   */
  startConversation(phoneNumber, type, context = {}) {
    const conversationId = this.generateConversationId(phoneNumber, type);
    
    const conversation = {
      id: conversationId,
      phoneNumber,
      type,
      status: 'active',
      context,
      steps: [],
      currentStep: 0,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + this.conversationTimeout)
    };

    this.conversations.set(conversationId, conversation);
    
    logger.info(`Started conversation: ${conversationId} for ${this.maskPhoneNumber(phoneNumber)}`, 'CONVERSATION_SERVICE');
    
    return conversationId;
  }

  /**
   * Get active conversation for phone number
   * @param {string} phoneNumber - User's phone number
   * @param {string} type - Conversation type (optional)
   * @returns {Object|null} Conversation object or null
   */
  getActiveConversation(phoneNumber, type = null) {
    for (const conversation of this.conversations.values()) {
      if (conversation.phoneNumber === phoneNumber && 
          conversation.status === 'active' &&
          (!type || conversation.type === type)) {
        return conversation;
      }
    }
    return null;
  }

  /**
   * Get conversation by ID
   * @param {string} conversationId - Conversation ID
   * @returns {Object|null} Conversation object or null
   */
  getConversation(conversationId) {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Add step to conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} step - Step data
   * @returns {boolean} Success status
   */
  addStep(conversationId, step) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        logger.warn(`Conversation not found: ${conversationId}`, 'CONVERSATION_SERVICE');
        return false;
      }

      const stepData = {
        stepNumber: conversation.steps.length + 1,
        timestamp: new Date(),
        ...step
      };

      conversation.steps.push(stepData);
      conversation.currentStep = stepData.stepNumber;
      conversation.lastActivity = new Date();

      logger.debug(`Added step ${stepData.stepNumber} to conversation ${conversationId}`, 'CONVERSATION_SERVICE');
      return true;
    } catch (error) {
      logger.error('Error adding conversation step', 'CONVERSATION_SERVICE', error);
      return false;
    }
  }

  /**
   * Update conversation context
   * @param {string} conversationId - Conversation ID
   * @param {Object} contextUpdate - Context updates
   * @returns {boolean} Success status
   */
  updateContext(conversationId, contextUpdate) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        logger.warn(`Conversation not found: ${conversationId}`, 'CONVERSATION_SERVICE');
        return false;
      }

      conversation.context = { ...conversation.context, ...contextUpdate };
      conversation.lastActivity = new Date();

      logger.debug(`Updated context for conversation ${conversationId}`, 'CONVERSATION_SERVICE');
      return true;
    } catch (error) {
      logger.error('Error updating conversation context', 'CONVERSATION_SERVICE', error);
      return false;
    }
  }

  /**
   * Process user response in conversation
   * @param {string} phoneNumber - User's phone number
   * @param {string} response - User's response
   * @param {string} messageId - WhatsApp message ID
   * @returns {Object} Processing result
   */
  async processResponse(phoneNumber, response, messageId) {
    try {
      const conversation = this.getActiveConversation(phoneNumber);
      if (!conversation) {
        logger.debug(`No active conversation for ${this.maskPhoneNumber(phoneNumber)}`, 'CONVERSATION_SERVICE');
        return { success: false, reason: 'NO_ACTIVE_CONVERSATION' };
      }

      // Add user response as step
      this.addStep(conversation.id, {
        type: 'user_response',
        content: response,
        messageId
      });

      // Process based on conversation type
      let result;
      switch (conversation.type) {
        case 'blood_request':
          result = await this.processBloodRequestConversation(conversation, response);
          break;
        case 'donor_registration':
          result = await this.processDonorRegistrationConversation(conversation, response);
          break;
        case 'donation_scheduling':
          result = await this.processDonationSchedulingConversation(conversation, response);
          break;
        case 'feedback_collection':
          result = await this.processFeedbackConversation(conversation, response);
          break;
        default:
          result = await this.processGenericConversation(conversation, response);
      }

      return result;
    } catch (error) {
      logger.error('Error processing conversation response', 'CONVERSATION_SERVICE', error);
      return { success: false, reason: 'PROCESSING_ERROR', error: error.message };
    }
  }

  /**
   * Process blood request conversation
   * @param {Object} conversation - Conversation object
   * @param {string} response - User response
   * @returns {Object} Processing result
   */
  async processBloodRequestConversation(conversation, response) {
    const { context, currentStep } = conversation;
    const normalizedResponse = response.toLowerCase().trim();

    switch (currentStep) {
      case 1: // Initial blood request
        if (['yes', 'y', 'हाँ', 'ok'].includes(normalizedResponse)) {
          this.updateContext(conversation.id, { donationConfirmed: true });
          this.addStep(conversation.id, {
            type: 'system_response',
            content: 'donation_confirmed',
            nextAction: 'collect_availability'
          });
          return {
            success: true,
            action: 'ask_availability',
            message: 'Great! When can you donate? Please reply with:\n1. Now\n2. Within 2 hours\n3. Today\n4. Tomorrow'
          };
        } else if (['no', 'n', 'नहीं', 'cannot'].includes(normalizedResponse)) {
          this.updateContext(conversation.id, { donationConfirmed: false });
          this.completeConversation(conversation.id, 'declined');
          return {
            success: true,
            action: 'donation_declined',
            message: 'Thank you for responding. We understand you cannot donate at this time.'
          };
        }
        break;

      case 2: // Availability confirmation
        let availability = null;
        if (['1', 'now', 'immediately'].some(keyword => normalizedResponse.includes(keyword))) {
          availability = 'now';
        } else if (['2', 'within 2', '2 hours'].some(keyword => normalizedResponse.includes(keyword))) {
          availability = 'within_2_hours';
        } else if (['3', 'today'].some(keyword => normalizedResponse.includes(keyword))) {
          availability = 'today';
        } else if (['4', 'tomorrow'].some(keyword => normalizedResponse.includes(keyword))) {
          availability = 'tomorrow';
        }

        if (availability) {
          this.updateContext(conversation.id, { availability });
          this.completeConversation(conversation.id, 'completed');
          return {
            success: true,
            action: 'schedule_donation',
            message: `Perfect! We'll coordinate your donation. You'll receive location and contact details shortly.`,
            data: { availability, phoneNumber: conversation.phoneNumber }
          };
        }
        break;
    }

    // Default response for unrecognized input
    return {
      success: true,
      action: 'clarification_needed',
      message: 'I didn\'t understand that. Please reply with YES or NO for donation, or 1-4 for availability.'
    };
  }

  /**
   * Process donor registration conversation
   * @param {Object} conversation - Conversation object
   * @param {string} response - User response
   * @returns {Object} Processing result
   */
  async processDonorRegistrationConversation(conversation, response) {
    const { currentStep } = conversation;
    const normalizedResponse = response.toLowerCase().trim();

    switch (currentStep) {
      case 1: // Registration interest
        if (['yes', 'register', 'signup'].some(keyword => normalizedResponse.includes(keyword))) {
          this.addStep(conversation.id, {
            type: 'system_response',
            content: 'registration_started'
          });
          return {
            success: true,
            action: 'start_registration',
            message: 'Great! To register as a blood donor, please visit our website: www.callforblood.org/register\n\nOr reply with your full name to start here.'
          };
        }
        break;

      case 2: // Name collection
        if (response.length > 2 && /^[a-zA-Z\s]+$/.test(response)) {
          this.updateContext(conversation.id, { name: response });
          this.addStep(conversation.id, {
            type: 'system_response',
            content: 'name_collected'
          });
          return {
            success: true,
            action: 'collect_blood_type',
            message: `Thank you ${response}! What's your blood type?\n\nReply with: A+, A-, B+, B-, AB+, AB-, O+, or O-`
          };
        }
        break;

      case 3: // Blood type collection
        const bloodTypes = ['a+', 'a-', 'b+', 'b-', 'ab+', 'ab-', 'o+', 'o-'];
        if (bloodTypes.includes(normalizedResponse)) {
          this.updateContext(conversation.id, { bloodType: response.toUpperCase() });
          this.completeConversation(conversation.id, 'completed');
          return {
            success: true,
            action: 'complete_registration',
            message: `Perfect! Your blood type is ${response.toUpperCase()}.\n\nTo complete your registration, please visit: www.callforblood.org/register\n\nUse this phone number to continue your registration.`
          };
        }
        break;
    }

    return {
      success: true,
      action: 'clarification_needed',
      message: 'Please provide the requested information in the correct format.'
    };
  }

  /**
   * Process donation scheduling conversation
   * @param {Object} conversation - Conversation object
   * @param {string} response - User response
   * @returns {Object} Processing result
   */
  async processDonationSchedulingConversation(conversation, response) {
    // Implementation for donation scheduling
    return {
      success: true,
      action: 'schedule_processed',
      message: 'Thank you for scheduling your donation. We\'ll send you confirmation details shortly.'
    };
  }

  /**
   * Process feedback conversation
   * @param {Object} conversation - Conversation object
   * @param {string} response - User response
   * @returns {Object} Processing result
   */
  async processFeedbackConversation(conversation, response) {
    const { currentStep } = conversation;

    switch (currentStep) {
      case 1: // Rating collection
        const rating = parseInt(response);
        if (rating >= 1 && rating <= 5) {
          this.updateContext(conversation.id, { rating });
          this.addStep(conversation.id, {
            type: 'system_response',
            content: 'rating_collected'
          });
          return {
            success: true,
            action: 'collect_feedback',
            message: `Thank you for rating us ${rating}/5! Please share any additional feedback or suggestions.`
          };
        }
        break;

      case 2: // Feedback collection
        this.updateContext(conversation.id, { feedback: response });
        this.completeConversation(conversation.id, 'completed');
        return {
          success: true,
          action: 'feedback_completed',
          message: 'Thank you for your valuable feedback! It helps us improve our service.'
        };
    }

    return {
      success: true,
      action: 'clarification_needed',
      message: 'Please provide a rating from 1-5 or your feedback.'
    };
  }

  /**
   * Process generic conversation
   * @param {Object} conversation - Conversation object
   * @param {string} response - User response
   * @returns {Object} Processing result
   */
  async processGenericConversation(conversation, response) {
    return {
      success: true,
      action: 'generic_response',
      message: 'Thank you for your message. How can I help you today?'
    };
  }

  /**
   * Complete conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} status - Completion status
   * @returns {boolean} Success status
   */
  completeConversation(conversationId, status = 'completed') {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        return false;
      }

      conversation.status = status;
      conversation.completedAt = new Date();

      this.addStep(conversationId, {
        type: 'system_event',
        content: 'conversation_completed',
        status
      });

      logger.info(`Conversation completed: ${conversationId} with status: ${status}`, 'CONVERSATION_SERVICE');
      return true;
    } catch (error) {
      logger.error('Error completing conversation', 'CONVERSATION_SERVICE', error);
      return false;
    }
  }

  /**
   * Cancel conversation
   * @param {string} conversationId - Conversation ID
   * @returns {boolean} Success status
   */
  cancelConversation(conversationId) {
    return this.completeConversation(conversationId, 'cancelled');
  }

  /**
   * Get conversation history
   * @param {string} phoneNumber - User's phone number
   * @param {number} limit - Number of conversations to return
   * @returns {Array} Array of conversations
   */
  getConversationHistory(phoneNumber, limit = 10) {
    const userConversations = Array.from(this.conversations.values())
      .filter(conv => conv.phoneNumber === phoneNumber)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    return userConversations;
  }

  /**
   * Get conversation statistics
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const conversations = Array.from(this.conversations.values());
    
    const stats = {
      total: conversations.length,
      active: conversations.filter(c => c.status === 'active').length,
      completed: conversations.filter(c => c.status === 'completed').length,
      cancelled: conversations.filter(c => c.status === 'cancelled').length,
      byType: {},
      averageSteps: 0,
      averageDuration: 0
    };

    // Count by type
    conversations.forEach(conv => {
      stats.byType[conv.type] = (stats.byType[conv.type] || 0) + 1;
    });

    // Calculate averages
    const completedConversations = conversations.filter(c => c.completedAt);
    if (completedConversations.length > 0) {
      stats.averageSteps = completedConversations.reduce((sum, conv) => sum + conv.steps.length, 0) / completedConversations.length;
      
      const totalDuration = completedConversations.reduce((sum, conv) => {
        return sum + (conv.completedAt - conv.createdAt);
      }, 0);
      stats.averageDuration = totalDuration / completedConversations.length / 1000 / 60; // minutes
    }

    return stats;
  }

  /**
   * Generate conversation ID
   * @param {string} phoneNumber - User's phone number
   * @param {string} type - Conversation type
   * @returns {string} Conversation ID
   */
  generateConversationId(phoneNumber, type) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4);
    return `conv_${type}_${timestamp}_${random}`;
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
   * Start cleanup interval for expired conversations
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupExpiredConversations();
    }, this.cleanupInterval);

    logger.debug('Started conversation cleanup interval', 'CONVERSATION_SERVICE');
  }

  /**
   * Clean up expired conversations
   */
  cleanupExpiredConversations() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [id, conversation] of this.conversations.entries()) {
      if (conversation.expiresAt < now) {
        this.conversations.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired conversations`, 'CONVERSATION_SERVICE');
    }
  }

  /**
   * Export conversation data
   * @param {string} conversationId - Conversation ID
   * @returns {Object|null} Conversation data or null
   */
  exportConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return null;
    }

    return {
      ...conversation,
      phoneNumber: this.maskPhoneNumber(conversation.phoneNumber) // Mask for privacy
    };
  }
}

// Create singleton instance
const conversationService = new ConversationService();

module.exports = conversationService;