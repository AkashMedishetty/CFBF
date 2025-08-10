const otpService = require('../services/otpService');
const whatsappService = require('../services/whatsappService');
const logger = require('../utils/logger');

/**
 * Request OTP for phone number verification
 */
const requestOTP = async (req, res) => {
  try {
    const { phoneNumber, purpose = 'verification' } = req.body;
    
    logger.info(`OTP request received for: ${otpService.maskPhoneNumber(phoneNumber)}`, 'OTP_CONTROLLER');
    logger.debug(`Purpose: ${purpose}`, 'OTP_CONTROLLER');

    // Validate phone number
    const phoneValidation = whatsappService.validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      logger.warn(`Invalid phone number format: ${otpService.maskPhoneNumber(phoneNumber)}`, 'OTP_CONTROLLER');
      return res.status(400).json({
        success: false,
        error: 'INVALID_PHONE_NUMBER',
        message: phoneValidation.message
      });
    }

    const formattedPhone = phoneValidation.formatted;

    // Check rate limiting
    const rateLimitCheck = otpService.canRequestOTP(formattedPhone);
    if (!rateLimitCheck.canRequest) {
      logger.warn(`Rate limit exceeded for: ${otpService.maskPhoneNumber(formattedPhone)}`, 'OTP_CONTROLLER');
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
    otpService.storeOTP(formattedPhone, otp, purpose);

    // Send OTP via WhatsApp
    const sendResult = await whatsappService.sendOTP(formattedPhone, otp, purpose);
    
    if (sendResult.success) {
      logger.success(`OTP sent successfully to: ${otpService.maskPhoneNumber(formattedPhone)}`, 'OTP_CONTROLLER');
      
      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          phoneNumber: formattedPhone,
          purpose,
          expiresIn: 300, // 5 minutes in seconds
          messageId: sendResult.messageId,
          simulated: sendResult.simulated || false
        }
      });
    } else {
      logger.error(`Failed to send OTP to: ${otpService.maskPhoneNumber(formattedPhone)}`, 'OTP_CONTROLLER');
      
      // Clear stored OTP if sending failed
      otpService.clearOTP(formattedPhone);
      
      res.status(500).json({
        success: false,
        error: sendResult.error || 'OTP_SEND_FAILED',
        message: sendResult.message || 'Failed to send OTP. Please try again.'
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
 * Verify OTP
 */
const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp, purpose } = req.body;
    
    logger.info(`OTP verification request for: ${otpService.maskPhoneNumber(phoneNumber)}`, 'OTP_CONTROLLER');

    // Validate input
    if (!phoneNumber || !otp) {
      logger.warn('Missing phoneNumber or otp in verification request', 'OTP_CONTROLLER');
      return res.status(400).json({
        success: false,
        error: 'MISSING_PARAMETERS',
        message: 'Phone number and OTP are required'
      });
    }

    // Validate phone number format
    const phoneValidation = whatsappService.validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      logger.warn(`Invalid phone number format in verification: ${otpService.maskPhoneNumber(phoneNumber)}`, 'OTP_CONTROLLER');
      return res.status(400).json({
        success: false,
        error: 'INVALID_PHONE_NUMBER',
        message: phoneValidation.message
      });
    }

    const formattedPhone = phoneValidation.formatted;

    // Verify OTP
    const verificationResult = otpService.verifyOTP(formattedPhone, otp);
    
    if (verificationResult.success) {
      logger.success(`OTP verified successfully for: ${otpService.maskPhoneNumber(formattedPhone)}`, 'OTP_CONTROLLER');
      
      res.status(200).json({
        success: true,
        message: verificationResult.message,
        data: {
          phoneNumber: formattedPhone,
          purpose: verificationResult.purpose,
          verifiedAt: verificationResult.verifiedAt,
          verified: true
        }
      });
    } else {
      logger.warn(`OTP verification failed for: ${otpService.maskPhoneNumber(formattedPhone)} - ${verificationResult.error}`, 'OTP_CONTROLLER');
      
      const statusCode = verificationResult.error === 'OTP_NOT_FOUND' ? 404 : 400;
      
      res.status(statusCode).json({
        success: false,
        error: verificationResult.error,
        message: verificationResult.message,
        data: {
          phoneNumber: formattedPhone,
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
 * Get OTP status for a phone number
 */
const getOTPStatus = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    logger.info(`OTP status request for: ${otpService.maskPhoneNumber(phoneNumber)}`, 'OTP_CONTROLLER');

    // Validate phone number format
    const phoneValidation = whatsappService.validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PHONE_NUMBER',
        message: phoneValidation.message
      });
    }

    const formattedPhone = phoneValidation.formatted;
    const status = otpService.getOTPStatus(formattedPhone);
    
    logger.debug(`OTP status retrieved for: ${otpService.maskPhoneNumber(formattedPhone)}`, 'OTP_CONTROLLER');
    
    res.status(200).json({
      success: true,
      data: {
        phoneNumber: formattedPhone,
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
    const { phoneNumber, purpose = 'verification' } = req.body;
    
    logger.info(`OTP resend request for: ${otpService.maskPhoneNumber(phoneNumber)}`, 'OTP_CONTROLLER');

    // Clear existing OTP first
    const phoneValidation = whatsappService.validatePhoneNumber(phoneNumber);
    if (phoneValidation.valid) {
      otpService.clearOTP(phoneValidation.formatted);
      logger.debug(`Cleared existing OTP for resend: ${otpService.maskPhoneNumber(phoneValidation.formatted)}`, 'OTP_CONTROLLER');
    }

    // Use the same logic as requestOTP
    req.body.purpose = purpose;
    await requestOTP(req, res);

  } catch (error) {
    logger.error('Error in resendOTP controller', 'OTP_CONTROLLER', error);
    res.status(500).json({
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
    
    res.status(200).json({
      success: true,
      data: {
        otp: stats,
        whatsapp: whatsappStatus,
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

module.exports = {
  requestOTP,
  verifyOTP,
  getOTPStatus,
  resendOTP,
  getOTPStats
};