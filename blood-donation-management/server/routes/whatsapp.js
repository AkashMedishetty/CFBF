const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const whatsappService = require('../services/whatsappService');
const logger = require('../utils/logger');
const auditLogger = require('../utils/auditLogger');

const router = express.Router();

// Rate limiting for webhook endpoints
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: 'WEBHOOK_RATE_LIMIT',
    message: 'Too many webhook requests'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @route   GET /api/v1/whatsapp/webhook
 * @desc    WhatsApp webhook verification
 * @access  Public (WhatsApp verification)
 */
router.get('/webhook', webhookLimiter, (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    logger.info('WhatsApp webhook verification request received', 'WHATSAPP_WEBHOOK');
    logger.debug(`Mode: ${mode}, Token: ${token ? '***provided***' : 'missing'}`, 'WHATSAPP_WEBHOOK');

    // Verify the webhook
    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      logger.success('WhatsApp webhook verified successfully', 'WHATSAPP_WEBHOOK');
      
      // Log webhook verification
      auditLogger.logSystemEvent({
        event: 'webhook_verification',
        service: 'whatsapp',
        details: 'WhatsApp webhook verified successfully',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true,
        metadata: {
          mode,
          requestId: req.requestId
        }
      });

      res.status(200).send(challenge);
    } else {
      logger.error('WhatsApp webhook verification failed', 'WHATSAPP_WEBHOOK');
      logger.debug(`Expected token: ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ? '***configured***' : 'missing'}`, 'WHATSAPP_WEBHOOK');
      
      // Log failed verification
      auditLogger.logSystemEvent({
        event: 'webhook_verification_failed',
        service: 'whatsapp',
        details: 'WhatsApp webhook verification failed - invalid token or mode',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        metadata: {
          mode,
          tokenProvided: !!token,
          requestId: req.requestId
        }
      });

      res.status(403).json({
        success: false,
        error: 'WEBHOOK_VERIFICATION_FAILED',
        message: 'Webhook verification failed'
      });
    }
  } catch (error) {
    logger.error('Error in webhook verification', 'WHATSAPP_WEBHOOK', error);
    res.status(500).json({
      success: false,
      error: 'WEBHOOK_ERROR',
      message: 'Webhook verification error'
    });
  }
});

/**
 * @route   POST /api/v1/whatsapp/webhook
 * @desc    WhatsApp webhook message handler
 * @access  Public (WhatsApp messages)
 */
router.post('/webhook', webhookLimiter, async (req, res) => {
  try {
    logger.info('WhatsApp webhook message received', 'WHATSAPP_WEBHOOK');
    
    // Verify webhook signature
    const signature = req.get('X-Hub-Signature-256');
    if (!verifyWebhookSignature(req.body, signature)) {
      logger.error('Invalid webhook signature', 'WHATSAPP_WEBHOOK');
      return res.status(403).json({
        success: false,
        error: 'INVALID_SIGNATURE',
        message: 'Invalid webhook signature'
      });
    }

    const body = req.body;
    
    // Process webhook data
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            await processIncomingMessage(change.value);
          } else if (change.field === 'message_template_status_update') {
            await processTemplateStatusUpdate(change.value);
          }
        }
      }
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ success: true });

  } catch (error) {
    logger.error('Error processing webhook message', 'WHATSAPP_WEBHOOK', error);
    
    // Still respond with 200 to prevent WhatsApp from retrying
    res.status(200).json({ 
      success: false, 
      error: 'PROCESSING_ERROR',
      message: 'Error processing webhook message'
    });
  }
});

/**
 * @route   POST /api/v1/whatsapp/send-message
 * @desc    Send WhatsApp message
 * @access  Private
 */
router.post('/send-message', async (req, res) => {
  try {
    const { phoneNumber, message, templateName, templateParams } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'PHONE_NUMBER_REQUIRED',
        message: 'Phone number is required'
      });
    }

    let result;
    
    if (templateName) {
      // Send template message
      result = await whatsappService.sendTemplateMessage(phoneNumber, templateName, templateParams);
    } else if (message) {
      // Send text message
      result = await whatsappService.sendMessage(phoneNumber, message);
    } else {
      return res.status(400).json({
        success: false,
        error: 'MESSAGE_OR_TEMPLATE_REQUIRED',
        message: 'Either message or templateName is required'
      });
    }

    // Log message sending
    auditLogger.logUserAction({
      userId: req.user?.id || 'system',
      userRole: req.user?.role || 'system',
      action: 'send_whatsapp_message',
      resource: 'whatsapp_message',
      details: `Sent WhatsApp message to ${whatsappService.maskPhoneNumber(phoneNumber)}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: result.success,
      metadata: {
        phoneNumber: whatsappService.maskPhoneNumber(phoneNumber),
        templateName: templateName || null,
        messageId: result.messageId || null,
        requestId: req.requestId
      }
    });

    res.status(result.success ? 200 : 400).json(result);

  } catch (error) {
    logger.error('Error sending WhatsApp message', 'WHATSAPP_ROUTES', error);
    res.status(500).json({
      success: false,
      error: 'MESSAGE_SEND_ERROR',
      message: 'Failed to send WhatsApp message'
    });
  }
});

/**
 * @route   GET /api/v1/whatsapp/templates
 * @desc    Get WhatsApp message templates
 * @access  Private
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = await whatsappService.getMessageTemplates();
    
    res.status(200).json({
      success: true,
      data: { templates }
    });

  } catch (error) {
    logger.error('Error fetching WhatsApp templates', 'WHATSAPP_ROUTES', error);
    res.status(500).json({
      success: false,
      error: 'TEMPLATES_FETCH_ERROR',
      message: 'Failed to fetch message templates'
    });
  }
});

/**
 * @route   POST /api/v1/whatsapp/templates
 * @desc    Create or update WhatsApp message template
 * @access  Private (Admin only)
 */
router.post('/templates', async (req, res) => {
  try {
    const { name, category, language, components } = req.body;

    if (!name || !category || !language || !components) {
      return res.status(400).json({
        success: false,
        error: 'TEMPLATE_DATA_REQUIRED',
        message: 'Template name, category, language, and components are required'
      });
    }

    const result = await whatsappService.createMessageTemplate({
      name,
      category,
      language,
      components
    });

    // Log template creation
    auditLogger.logUserAction({
      userId: req.user?.id || 'admin',
      userRole: 'admin',
      action: 'create_whatsapp_template',
      resource: 'whatsapp_template',
      details: `Created WhatsApp template: ${name}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: result.success,
      metadata: {
        templateName: name,
        category,
        language,
        requestId: req.requestId
      }
    });

    res.status(result.success ? 201 : 400).json(result);

  } catch (error) {
    logger.error('Error creating WhatsApp template', 'WHATSAPP_ROUTES', error);
    res.status(500).json({
      success: false,
      error: 'TEMPLATE_CREATE_ERROR',
      message: 'Failed to create message template'
    });
  }
});

/**
 * @route   GET /api/v1/whatsapp/status
 * @desc    Get WhatsApp service status
 * @access  Private
 */
router.get('/status', (req, res) => {
  try {
    const status = whatsappService.getStatus();
    
    res.status(200).json({
      success: true,
      data: { status }
    });

  } catch (error) {
    logger.error('Error getting WhatsApp status', 'WHATSAPP_ROUTES', error);
    res.status(500).json({
      success: false,
      error: 'STATUS_ERROR',
      message: 'Failed to get service status'
    });
  }
});

/**
 * Verify webhook signature
 * @param {Object} payload - Request payload
 * @param {string} signature - X-Hub-Signature-256 header
 * @returns {boolean} Signature is valid
 */
function verifyWebhookSignature(payload, signature) {
  if (!signature || !process.env.WHATSAPP_WEBHOOK_SECRET) {
    logger.warn('Missing signature or webhook secret', 'WHATSAPP_WEBHOOK');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    logger.error('Error verifying webhook signature', 'WHATSAPP_WEBHOOK', error);
    return false;
  }
}

/**
 * Process incoming WhatsApp message
 * @param {Object} messageData - Message data from webhook
 */
async function processIncomingMessage(messageData) {
  try {
    logger.info('Processing incoming WhatsApp message', 'WHATSAPP_WEBHOOK');
    
    const { messages, contacts } = messageData;
    
    if (!messages || messages.length === 0) {
      logger.debug('No messages in webhook data', 'WHATSAPP_WEBHOOK');
      return;
    }

    for (const message of messages) {
      const { from, id, type, text, button, interactive } = message;
      const contact = contacts?.find(c => c.wa_id === from);
      
      logger.info(`Processing message from ${whatsappService.maskPhoneNumber(from)}`, 'WHATSAPP_WEBHOOK');
      logger.debug(`Message type: ${type}, ID: ${id}`, 'WHATSAPP_WEBHOOK');

      // Log incoming message
      auditLogger.logSystemEvent({
        event: 'whatsapp_message_received',
        service: 'whatsapp',
        details: `Received ${type} message from ${whatsappService.maskPhoneNumber(from)}`,
        success: true,
        metadata: {
          messageId: id,
          messageType: type,
          fromNumber: whatsappService.maskPhoneNumber(from),
          contactName: contact?.profile?.name || 'Unknown'
        }
      });

      // Process different message types
      if (type === 'text' && text?.body) {
        await handleTextMessage(from, text.body, id);
      } else if (type === 'button' && button?.payload) {
        await handleButtonResponse(from, button.payload, id);
      } else if (type === 'interactive') {
        await handleInteractiveResponse(from, interactive, id);
      } else {
        logger.debug(`Unhandled message type: ${type}`, 'WHATSAPP_WEBHOOK');
      }
    }

  } catch (error) {
    logger.error('Error processing incoming message', 'WHATSAPP_WEBHOOK', error);
  }
}

/**
 * Handle text message responses
 * @param {string} from - Sender phone number
 * @param {string} messageText - Message text
 * @param {string} messageId - WhatsApp message ID
 */
async function handleTextMessage(from, messageText, messageId) {
  try {
    logger.info(`Processing text message: "${messageText}"`, 'WHATSAPP_WEBHOOK');
    
    const normalizedText = messageText.toLowerCase().trim();
    
    // Handle common responses
    if (['yes', 'y', 'हाँ', 'हां', 'ok', 'okay'].includes(normalizedText)) {
      await handlePositiveResponse(from, messageId);
    } else if (['no', 'n', 'नहीं', 'नही', 'cancel'].includes(normalizedText)) {
      await handleNegativeResponse(from, messageId);
    } else if (['info', 'information', 'details', 'जानकारी'].includes(normalizedText)) {
      await handleInfoRequest(from, messageId);
    } else if (['help', 'मदद', 'सहायता'].includes(normalizedText)) {
      await handleHelpRequest(from, messageId);
    } else {
      // Forward to natural language processing
      await handleNaturalLanguageResponse(from, messageText, messageId);
    }

  } catch (error) {
    logger.error('Error handling text message', 'WHATSAPP_WEBHOOK', error);
  }
}

/**
 * Handle button response
 * @param {string} from - Sender phone number
 * @param {string} payload - Button payload
 * @param {string} messageId - WhatsApp message ID
 */
async function handleButtonResponse(from, payload, messageId) {
  try {
    logger.info(`Processing button response: ${payload}`, 'WHATSAPP_WEBHOOK');
    
    const [action, ...params] = payload.split('_');
    
    switch (action) {
      case 'DONATE':
        await handleDonationResponse(from, params, messageId);
        break;
      case 'DECLINE':
        await handleDeclineResponse(from, params, messageId);
        break;
      case 'INFO':
        await handleInfoRequest(from, messageId, params);
        break;
      default:
        logger.warn(`Unknown button payload: ${payload}`, 'WHATSAPP_WEBHOOK');
    }

  } catch (error) {
    logger.error('Error handling button response', 'WHATSAPP_WEBHOOK', error);
  }
}

/**
 * Handle interactive response (list/button)
 * @param {string} from - Sender phone number
 * @param {Object} interactive - Interactive response data
 * @param {string} messageId - WhatsApp message ID
 */
async function handleInteractiveResponse(from, interactive, messageId) {
  try {
    logger.info('Processing interactive response', 'WHATSAPP_WEBHOOK');
    
    if (interactive.type === 'button_reply') {
      await handleButtonResponse(from, interactive.button_reply.id, messageId);
    } else if (interactive.type === 'list_reply') {
      await handleListResponse(from, interactive.list_reply.id, messageId);
    }

  } catch (error) {
    logger.error('Error handling interactive response', 'WHATSAPP_WEBHOOK', error);
  }
}

/**
 * Handle positive donation response
 * @param {string} phoneNumber - Donor phone number
 * @param {string} messageId - WhatsApp message ID
 */
async function handlePositiveResponse(phoneNumber, messageId) {
  // This will be implemented when we build the donor matching system
  logger.info(`Positive response from ${whatsappService.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_WEBHOOK');
  
  // Send confirmation message
  await whatsappService.sendMessage(phoneNumber, 
    `🙏 Thank you for your willingness to donate blood! 

We're connecting you with the requester. You'll receive location and contact details shortly.

Your generosity can save a life! ❤️

*Call For Blood Foundation*`
  );
}

/**
 * Handle negative/decline response
 * @param {string} phoneNumber - Donor phone number
 * @param {string} messageId - WhatsApp message ID
 */
async function handleNegativeResponse(phoneNumber, messageId) {
  logger.info(`Negative response from ${whatsappService.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_WEBHOOK');
  
  // Send acknowledgment message
  await whatsappService.sendMessage(phoneNumber,
    `Thank you for responding. We understand you cannot donate at this time.

We'll continue searching for other donors. 

Thank you for being part of our community! 🩸

*Call For Blood Foundation*`
  );
}

/**
 * Handle information request
 * @param {string} phoneNumber - Requester phone number
 * @param {string} messageId - WhatsApp message ID
 * @param {Array} params - Additional parameters
 */
async function handleInfoRequest(phoneNumber, messageId, params = []) {
  logger.info(`Info request from ${whatsappService.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_WEBHOOK');
  
  // Send information message
  await whatsappService.sendMessage(phoneNumber,
    `ℹ️ *Blood Donation Information*

*What to expect:*
• Health screening (5-10 minutes)
• Blood donation (8-10 minutes)
• Rest and refreshments (10-15 minutes)

*Requirements:*
• Age: 18-65 years
• Weight: Minimum 50kg
• Good health condition
• 3 months gap from last donation

*Benefits:*
• Free health checkup
• Digital certificate
• Community recognition

Need more help? Reply with "HELP"

*Call For Blood Foundation*`
  );
}

/**
 * Handle help request
 * @param {string} phoneNumber - Requester phone number
 * @param {string} messageId - WhatsApp message ID
 */
async function handleHelpRequest(phoneNumber, messageId) {
  logger.info(`Help request from ${whatsappService.maskPhoneNumber(phoneNumber)}`, 'WHATSAPP_WEBHOOK');
  
  // Send help message
  await whatsappService.sendMessage(phoneNumber,
    `🆘 *Help & Support*

*Quick Commands:*
• YES - Agree to donate
• NO - Cannot donate
• INFO - Get more information
• HELP - Show this help

*Contact Support:*
📞 Phone: +91-911-BLOOD
📧 Email: support@callforblood.org
🌐 Website: www.callforblood.org

*Emergency:* For urgent help, call our 24/7 helpline.

*Call For Blood Foundation*`
  );
}



/**
 * Handle natural language response
 * @param {string} phoneNumber - Sender phone number
 * @param {string} messageText - Message text
 * @param {string} messageId - WhatsApp message ID
 */
async function handleNaturalLanguageResponse(phoneNumber, messageText, messageId) {
  logger.info(`Natural language processing for: "${messageText}"`, 'WHATSAPP_WEBHOOK');
  
  // Basic keyword detection (can be enhanced with NLP libraries)
  const keywords = {
    positive: ['can donate', 'will donate', 'available', 'ready', 'sure', 'definitely'],
    negative: ['cannot', 'busy', 'unavailable', 'not possible', 'sorry'],
    questions: ['when', 'where', 'how', 'what', 'why', 'which'],
    location: ['address', 'location', 'where', 'hospital', 'clinic']
  };

  const text = messageText.toLowerCase();
  
  if (keywords.positive.some(keyword => text.includes(keyword))) {
    await handlePositiveResponse(phoneNumber, messageId);
  } else if (keywords.negative.some(keyword => text.includes(keyword))) {
    await handleNegativeResponse(phoneNumber, messageId);
  } else if (keywords.questions.some(keyword => text.includes(keyword))) {
    await handleInfoRequest(phoneNumber, messageId);
  } else {
    // Default response for unrecognized messages
    await whatsappService.sendMessage(phoneNumber,
      `Thank you for your message. 

Please reply with:
✅ *YES* - I can donate
❌ *NO* - Cannot donate now
ℹ️ *INFO* - Need more details
🆘 *HELP* - Get help

*Call For Blood Foundation*`
    );
  }
}

/**
 * Process template status update
 * @param {Object} statusData - Template status data
 */
async function processTemplateStatusUpdate(statusData) {
  try {
    logger.info('Processing template status update', 'WHATSAPP_WEBHOOK');
    logger.logObject(statusData, 'Template Status Data', 'WHATSAPP_WEBHOOK');

    // Log template status change
    auditLogger.logSystemEvent({
      event: 'whatsapp_template_status_update',
      service: 'whatsapp',
      details: `Template status updated: ${statusData.message_template_name}`,
      success: true,
      metadata: {
        templateName: statusData.message_template_name,
        status: statusData.event,
        reason: statusData.reason || null
      }
    });

  } catch (error) {
    logger.error('Error processing template status update', 'WHATSAPP_WEBHOOK', error);
  }
}

// Health check endpoint
router.get('/health', (req, res) => {
  logger.debug('WhatsApp service health check requested', 'WHATSAPP_ROUTES');
  
  const status = whatsappService.getStatus();
  
  res.status(200).json({
    success: true,
    message: 'WhatsApp service is healthy',
    timestamp: new Date().toISOString(),
    service: 'whatsapp',
    status
  });
});

module.exports = router;