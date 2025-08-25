const otpService = require('../services/otpService');
const whatsappService = require('../services/whatsappService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * Request OTP for phone number or email verification
 */
const requestOTP = async (req, res) => {
  try {
    const { phoneNumber, email, purpose = 'verification', method = 'whatsapp' } = req.body;

    // Determine the target (phone or email)
    const target = phoneNumber || email;
    const isEmail = !!email && !phoneNumber;

    logger.info(`OTP request received for: ${isEmail ? emailService.maskEmail(target) : otpService.maskPhoneNumber(target)}`, 'OTP_CONTROLLER');
    logger.debug(`Purpose: ${purpose}, Method: ${method}, Type: ${isEmail ? 'email' : 'phone'}`, 'OTP_CONTROLLER');

    if (!target) {
      logger.warn('No phone number or email provided in OTP request', 'OTP_CONTROLLER');
      return res.status(400).json({
        success: false,
        error: 'MISSING_TARGET',
        message: 'Either phone number or email is required'
      });
    }

    let formattedTarget = target;
    let validationResult = { valid: true };

    // Validate input based on type
    if (isEmail) {
      validationResult = emailService.validateEmail(email);
      if (!validationResult.valid) {
        logger.warn(`Invalid email format: ${emailService.maskEmail(email)}`, 'OTP_CONTROLLER');
        return res.status(400).json({
          success: false,
          error: 'INVALID_EMAIL',
          message: validationResult.message
        });
      }
      formattedTarget = email.toLowerCase().trim();
    } else {
      validationResult = whatsappService.validatePhoneNumber(phoneNumber);
      if (!validationResult.valid) {
        logger.warn(`Invalid phone number format: ${otpService.maskPhoneNumber(phoneNumber)}`, 'OTP_CONTROLLER');
        return res.status(400).json({
          success: false,
          error: 'INVALID_PHONE_NUMBER',
          message: validationResult.message
        });
      }
      formattedTarget = validationResult.formatted;
    }

    // Check rate limiting
    const rateLimitCheck = otpService.canRequestOTP(formattedTarget);
    if (!rateLimitCheck.canRequest) {
      logger.warn(`Rate limit exceeded for: ${isEmail ? emailService.maskEmail(formattedTarget) : otpService.maskPhoneNumber(formattedTarget)}`, 'OTP_CONTROLLER');
      return res.status(429).json({
        success: false,
        error: rateLimitCheck.error,
        message: rateLimitCheck.message,
        retryAfter: rateLimitCheck.retryAfter
      });
    }

    // Generate OTP
    const otp = otpService.generateOTP();

    // Store OTP
    otpService.storeOTP(formattedTarget, otp, purpose);

    let sendResult;
    let deliveryMethod = method;

    // Send OTP based on type and method preference
    if (isEmail || method === 'email') {
      // Send via email
      sendResult = await emailService.sendOTP(formattedTarget, otp, purpose);
      deliveryMethod = 'email';
    } else {
      // Send via WhatsApp (default for phone numbers)
      sendResult = await whatsappService.sendOTP(formattedTarget, otp, purpose);
      deliveryMethod = 'whatsapp';

      // If WhatsApp fails and we have email as fallback, try email
      if (!sendResult.success && method === 'auto' && email) {
        logger.warn(`WhatsApp delivery failed, trying email fallback for: ${otpService.maskPhoneNumber(formattedTarget)}`, 'OTP_CONTROLLER');
        sendResult = await emailService.sendOTP(email, otp, purpose);
        deliveryMethod = 'email';
        formattedTarget = email; // Update target for response
      }
    }

    if (sendResult.success) {
      logger.success(`OTP sent successfully via ${deliveryMethod} to: ${isEmail || deliveryMethod === 'email' ? emailService.maskEmail(formattedTarget) : otpService.maskPhoneNumber(formattedTarget)}`, 'OTP_CONTROLLER');

      res.status(200).json({
        success: true,
        message: `OTP sent successfully via ${deliveryMethod}`,
        data: {
          target: formattedTarget,
          type: isEmail || deliveryMethod === 'email' ? 'email' : 'phone',
          method: deliveryMethod,
          purpose,
          expiresIn: 300, // 5 minutes in seconds
          messageId: sendResult.messageId,
          simulated: sendResult.simulated || false
        }
      });
    } else {
      logger.error(`Failed to send OTP via ${deliveryMethod} to: ${isEmail || deliveryMethod === 'email' ? emailService.maskEmail(formattedTarget) : otpService.maskPhoneNumber(formattedTarget)}`, 'OTP_CONTROLLER');

      // Clear stored OTP if sending failed
      otpService.clearOTP(formattedTarget);

      res.status(500).json({
        success: false,
        error: sendResult.error || 'OTP_SEND_FAILED',
        message: sendResult.message || `Failed to send OTP via ${deliveryMethod}. Please try again.`
      });
    }

  } catch (error) {
    logger.error('Error in requestOTP controller', 'OTP_CONTROLLER', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal error occurred. Please try again.'
    });
  }
};

/**
 * Verify OTP for phone number or email
 */
const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, email, otp, purpose } = req.body;

    // Determine the target (phone or email)
    const target = phoneNumber || email;
    const isEmail = !!email && !phoneNumber;

    logger.info(`OTP verification request for: ${isEmail ? emailService.maskEmail(target) : otpService.maskPhoneNumber(target)}`, 'OTP_CONTROLLER');

    // Validate input
    if (!target || !otp) {
      logger.warn('Missing target (phone/email) or otp in verification request', 'OTP_CONTROLLER');
      return res.status(400).json({
        success: false,
        error: 'MISSING_PARAMETERS',
        message: 'Phone number or email, and OTP are required'
      });
    }

    let formattedTarget = target;
    let validationResult = { valid: true };

    // Validate input based on type
    if (isEmail) {
      validationResult = emailService.validateEmail(email);
      if (!validationResult.valid) {
        logger.warn(`Invalid email format in verification: ${emailService.maskEmail(email)}`, 'OTP_CONTROLLER');
        return res.status(400).json({
          success: false,
          error: 'INVALID_EMAIL',
          message: validationResult.message
        });
      }
      formattedTarget = email.toLowerCase().trim();
    } else {
      validationResult = whatsappService.validatePhoneNumber(phoneNumber);
      if (!validationResult.valid) {
        logger.warn(`Invalid phone number format in verification: ${otpService.maskPhoneNumber(phoneNumber)}`, 'OTP_CONTROLLER');
        return res.status(400).json({
          success: false,
          error: 'INVALID_PHONE_NUMBER',
          message: validationResult.message
        });
      }
      formattedTarget = validationResult.formatted;
    }

    // Verify OTP
    const verificationResult = otpService.verifyOTP(formattedTarget, otp);

    if (verificationResult.success) {
      logger.success(`OTP verified successfully for: ${isEmail ? emailService.maskEmail(formattedTarget) : otpService.maskPhoneNumber(formattedTarget)}`, 'OTP_CONTROLLER');

      res.status(200).json({
        success: true,
        message: verificationResult.message,
        data: {
          target: formattedTarget,
          type: isEmail ? 'email' : 'phone',
          purpose: verificationResult.purpose,
          verifiedAt: verificationResult.verifiedAt,
          verified: true
        }
      });
    } else {
      logger.warn(`OTP verification failed for: ${isEmail ? emailService.maskEmail(formattedTarget) : otpService.maskPhoneNumber(formattedTarget)} - ${verificationResult.error}`, 'OTP_CONTROLLER');

      const statusCode = verificationResult.error === 'OTP_NOT_FOUND' ? 404 : 400;

      res.status(statusCode).json({
        success: false,
        error: verificationResult.error,
        message: verificationResult.message,
        data: {
          target: formattedTarget,
          type: isEmail ? 'email' : 'phone',
          remainingAttempts: verificationResult.remainingAttempts || 0,
          verified: false
        }
      });
    }

  } catch (error) {
    logger.error('Error in verifyOTP controller', 'OTP_CONTROLLER', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal error occurred. Please try again.'
    });
  }
};

/**
 * Get OTP status for a phone number or email
 */
const getOTPStatus = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { email } = req.query;

    const target = phoneNumber || email;
    const isEmail = !!email && !phoneNumber;

    logger.info(`OTP status request for: ${isEmail ? emailService.maskEmail(target) : otpService.maskPhoneNumber(target)}`, 'OTP_CONTROLLER');

    if (!target) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TARGET',
        message: 'Phone number or email is required'
      });
    }

    let formattedTarget = target;
    let validationResult = { valid: true };

    // Validate input based on type
    if (isEmail) {
      validationResult = emailService.validateEmail(email);
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_EMAIL',
          message: validationResult.message
        });
      }
      formattedTarget = email.toLowerCase().trim();
    } else {
      validationResult = whatsappService.validatePhoneNumber(phoneNumber);
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PHONE_NUMBER',
          message: validationResult.message
        });
      }
      formattedTarget = validationResult.formatted;
    }

    const status = otpService.getOTPStatus(formattedTarget);

    logger.debug(`OTP status retrieved for: ${isEmail ? emailService.maskEmail(formattedTarget) : otpService.maskPhoneNumber(formattedTarget)}`, 'OTP_CONTROLLER');

    res.status(200).json({
      success: true,
      data: {
        target: formattedTarget,
        type: isEmail ? 'email' : 'phone',
        ...status
      }
    });

  } catch (error) {
    logger.error('Error in getOTPStatus controller', 'OTP_CONTROLLER', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal error occurred. Please try again.'
    });
  }
};

/**
 * Resend OTP (same as request but with different logging)
 */
const resendOTP = async (req, res) => {
  try {
    const { phoneNumber, email } = req.body;

    const target = phoneNumber || email;
    const isEmail = !!email && !phoneNumber;

    logger.info(`OTP resend request for: ${isEmail ? emailService.maskEmail(target) : otpService.maskPhoneNumber(target)}`, 'OTP_CONTROLLER');

    // Clear existing OTP first
    if (isEmail) {
      const emailValidation = emailService.validateEmail(email);
      if (emailValidation.valid) {
        otpService.clearOTP(email.toLowerCase().trim());
        logger.debug(`Cleared existing OTP for resend: ${emailService.maskEmail(email)}`, 'OTP_CONTROLLER');
      }
    } else {
      const phoneValidation = whatsappService.validatePhoneNumber(phoneNumber);
      if (phoneValidation.valid) {
        otpService.clearOTP(phoneValidation.formatted);
        logger.debug(`Cleared existing OTP for resend: ${otpService.maskPhoneNumber(phoneValidation.formatted)}`, 'OTP_CONTROLLER');
      }
    }

    // Use the same logic as requestOTP
    return await requestOTP(req, res);

  } catch (error) {
    logger.error('Error in resendOTP controller', 'OTP_CONTROLLER', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal error occurred. Please try again.'
    });
  }
};

/**
 * Get OTP service statistics (admin only)
 */
const getOTPStats = async (req, res) => {
  try {
    logger.info('OTP statistics requested', 'OTP_CONTROLLER');

    const stats = otpService.getStats();
    const whatsappStatus = whatsappService.getStatus();
    const emailStatus = emailService.getStatus();

    res.status(200).json({
      success: true,
      data: {
        otp: stats,
        whatsapp: whatsappStatus,
        email: emailStatus,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error in getOTPStats controller', 'OTP_CONTROLLER', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal error occurred. Please try again.'
    });
  }
};

/**
 * Request OTP for email verification (dedicated email endpoint)
 */
const requestEmailOTP = async (req, res) => {
  try {
    const { email, purpose = 'verification' } = req.body;

    logger.info(`Email OTP request received for: ${emailService.maskEmail(email)}`, 'OTP_CONTROLLER');
    logger.debug(`Purpose: ${purpose}`, 'OTP_CONTROLLER');

    // Validate email
    const validationResult = emailService.validateEmail(email);
    if (!validationResult.valid) {
      logger.warn(`Invalid email format: ${emailService.maskEmail(email)}`, 'OTP_CONTROLLER');
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL',
        message: validationResult.message
      });
    }

    const formattedEmail = email.toLowerCase().trim();

    // Check rate limiting
    const rateLimitCheck = otpService.canRequestOTP(formattedEmail);
    if (!rateLimitCheck.canRequest) {
      logger.warn(`Rate limit exceeded for email: ${emailService.maskEmail(formattedEmail)}`, 'OTP_CONTROLLER');
      return res.status(429).json({
        success: false,
        error: rateLimitCheck.error,
        message: rateLimitCheck.message,
        retryAfter: rateLimitCheck.retryAfter
      });
    }

    // Generate and store OTP
    const otp = otpService.generateOTP();
    otpService.storeOTP(formattedEmail, otp, purpose);

    // Send OTP via email
    const sendResult = await emailService.sendOTP(formattedEmail, otp, purpose);

    if (sendResult.success) {
      logger.success(`Email OTP sent successfully to: ${emailService.maskEmail(formattedEmail)}`, 'OTP_CONTROLLER');

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully via email',
        data: {
          email: formattedEmail,
          purpose,
          expiresIn: 300, // 5 minutes in seconds
          messageId: sendResult.messageId,
          simulated: sendResult.simulated || false
        }
      });
    } else {
      logger.error(`Failed to send email OTP to: ${emailService.maskEmail(formattedEmail)}`, 'OTP_CONTROLLER');

      // Clear stored OTP if sending failed
      otpService.clearOTP(formattedEmail);

      return res.status(500).json({
        success: false,
        error: sendResult.error || 'EMAIL_OTP_SEND_FAILED',
        message: sendResult.message || 'Failed to send OTP via email. Please try again.'
      });
    }

  } catch (error) {
    logger.error('Error in requestEmailOTP controller', 'OTP_CONTROLLER', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal error occurred. Please try again.'
    });
  }
};

/**
 * Verify email OTP (dedicated email endpoint)
 */
const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    logger.info(`Email OTP verification request for: ${emailService.maskEmail(email)}`, 'OTP_CONTROLLER');

    // Validate email
    const validationResult = emailService.validateEmail(email);
    if (!validationResult.valid) {
      logger.warn(`Invalid email format in verification: ${emailService.maskEmail(email)}`, 'OTP_CONTROLLER');
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL',
        message: validationResult.message
      });
    }

    const formattedEmail = email.toLowerCase().trim();

    // Verify OTP
    const verificationResult = otpService.verifyOTP(formattedEmail, otp);

    if (verificationResult.success) {
      logger.success(`Email OTP verified successfully for: ${emailService.maskEmail(formattedEmail)}`, 'OTP_CONTROLLER');

      return res.status(200).json({
        success: true,
        message: verificationResult.message,
        data: {
          email: formattedEmail,
          purpose: verificationResult.purpose,
          verifiedAt: verificationResult.verifiedAt,
          verified: true
        }
      });
    } else {
      logger.warn(`Email OTP verification failed for: ${emailService.maskEmail(formattedEmail)} - ${verificationResult.error}`, 'OTP_CONTROLLER');

      const statusCode = verificationResult.error === 'OTP_NOT_FOUND' ? 404 : 400;

      return res.status(statusCode).json({
        success: false,
        error: verificationResult.error,
        message: verificationResult.message,
        data: {
          email: formattedEmail,
          remainingAttempts: verificationResult.remainingAttempts || 0,
          verified: false
        }
      });
    }

  } catch (error) {
    logger.error('Error in verifyEmailOTP controller', 'OTP_CONTROLLER', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal error occurred. Please try again.'
    });
  }
};

module.exports = {
  requestOTP,
  verifyOTP,
  getOTPStatus,
  resendOTP,
  getOTPStats,
  requestEmailOTP,
  verifyEmailOTP
};