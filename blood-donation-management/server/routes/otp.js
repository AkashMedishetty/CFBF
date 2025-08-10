const express = require('express');
const { body, param } = require('express-validator');
const rateLimit = require('express-rate-limit');

const otpController = require('../controllers/otpController');
const { validateRequest } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for OTP requests
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 OTP requests per 15 minutes per IP
  message: {
    success: false,
    error: 'TOO_MANY_OTP_REQUESTS',
    message: 'Too many OTP requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`OTP rate limit exceeded for IP: ${req.ip}`, 'OTP_ROUTES');
    res.status(429).json({
      success: false,
      error: 'TOO_MANY_OTP_REQUESTS',
      message: 'Too many OTP requests. Please try again later.'
    });
  }
});

// Rate limiting for OTP verification
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 verification attempts per 15 minutes per IP
  message: {
    success: false,
    error: 'TOO_MANY_VERIFY_ATTEMPTS',
    message: 'Too many verification attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`OTP verification rate limit exceeded for IP: ${req.ip}`, 'OTP_ROUTES');
    res.status(429).json({
      success: false,
      error: 'TOO_MANY_VERIFY_ATTEMPTS',
      message: 'Too many verification attempts. Please try again later.'
    });
  }
});

// Validation rules
const phoneNumberValidation = [
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isString()
    .withMessage('Phone number must be a string')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10-15 digits')
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Invalid phone number format')
];

const otpValidation = [
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isString()
    .withMessage('OTP must be a string')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
];

const purposeValidation = [
  body('purpose')
    .optional()
    .isIn(['registration', 'login', 'verification', 'password_reset'])
    .withMessage('Invalid purpose. Must be one of: registration, login, verification, password_reset')
];

const phoneParamValidation = [
  param('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isString()
    .withMessage('Phone number must be a string')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10-15 digits')
];

/**
 * @route   POST /api/v1/otp/request
 * @desc    Request OTP for phone number verification
 * @access  Public
 * @body    { phoneNumber: string, purpose?: string }
 */
router.post('/request',
  otpRequestLimiter,
  phoneNumberValidation,
  purposeValidation,
  validateRequest,
  (req, res, next) => {
    logger.info(`OTP request route hit from IP: ${req.ip}`, 'OTP_ROUTES');
    next();
  },
  otpController.requestOTP
);

/**
 * @route   POST /api/v1/otp/verify
 * @desc    Verify OTP
 * @access  Public
 * @body    { phoneNumber: string, otp: string }
 */
router.post('/verify',
  otpVerifyLimiter,
  phoneNumberValidation,
  otpValidation,
  purposeValidation,
  validateRequest,
  (req, res, next) => {
    logger.info(`OTP verification route hit from IP: ${req.ip}`, 'OTP_ROUTES');
    next();
  },
  otpController.verifyOTP
);

/**
 * @route   POST /api/v1/otp/resend
 * @desc    Resend OTP
 * @access  Public
 * @body    { phoneNumber: string, purpose?: string }
 */
router.post('/resend',
  otpRequestLimiter,
  phoneNumberValidation,
  purposeValidation,
  validateRequest,
  (req, res, next) => {
    logger.info(`OTP resend route hit from IP: ${req.ip}`, 'OTP_ROUTES');
    next();
  },
  otpController.resendOTP
);

/**
 * @route   GET /api/v1/otp/status/:phoneNumber
 * @desc    Get OTP status for a phone number
 * @access  Public
 * @params  phoneNumber: string
 */
router.get('/status/:phoneNumber',
  phoneParamValidation,
  validateRequest,
  (req, res, next) => {
    logger.info(`OTP status route hit from IP: ${req.ip}`, 'OTP_ROUTES');
    next();
  },
  otpController.getOTPStatus
);

/**
 * @route   GET /api/v1/otp/stats
 * @desc    Get OTP service statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/stats',
  // TODO: Add admin authentication middleware
  (req, res, next) => {
    logger.info(`OTP stats route hit from IP: ${req.ip}`, 'OTP_ROUTES');
    next();
  },
  otpController.getOTPStats
);

// Health check endpoint for OTP service
router.get('/health', (req, res) => {
  logger.debug('OTP health check requested', 'OTP_ROUTES');
  
  res.status(200).json({
    success: true,
    message: 'OTP service is healthy',
    timestamp: new Date().toISOString(),
    service: 'otp'
  });
});

module.exports = router;