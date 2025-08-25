const express = require('express');
const { body, param } = require('express-validator');
const rateLimit = require('express-rate-limit');

const otpController = require('../controllers/otpController');
const { validateRequest } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for OTP requests - Progressive limiting
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 OTP requests per 15 minutes per IP (increased for legitimate use)
  message: {
    success: false,
    error: 'TOO_MANY_OTP_REQUESTS',
    message: 'Too many OTP requests. Please wait 15 minutes before trying again.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const resetTime = new Date(Date.now() + 15 * 60 * 1000);
    logger.warn(`OTP rate limit exceeded for IP: ${req.ip}`, 'OTP_ROUTES');
    res.status(429).json({
      success: false,
      error: 'TOO_MANY_OTP_REQUESTS',
      message: `Too many OTP requests. Please wait until ${resetTime.toLocaleTimeString()} before trying again.`,
      retryAfter: 15 * 60,
      resetTime: resetTime.toISOString()
    });
  }
});

// Rate limiting for OTP verification - More lenient for legitimate attempts
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 verification attempts per 15 minutes per IP
  message: {
    success: false,
    error: 'TOO_MANY_VERIFY_ATTEMPTS',
    message: 'Too many verification attempts. Please wait before trying again.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const resetTime = new Date(Date.now() + 15 * 60 * 1000);
    logger.warn(`OTP verification rate limit exceeded for IP: ${req.ip}`, 'OTP_ROUTES');
    res.status(429).json({
      success: false,
      error: 'TOO_MANY_VERIFY_ATTEMPTS',
      message: `Too many verification attempts. Please wait until ${resetTime.toLocaleTimeString()} before trying again.`,
      retryAfter: 15 * 60,
      resetTime: resetTime.toISOString()
    });
  }
});

// Validation rules
const phoneNumberValidation = [
  body('phoneNumber')
    .optional()
    .isString()
    .withMessage('Phone number must be a string')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10-15 digits')
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Invalid phone number format')
];

const emailValidation = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
];

const targetValidation = [
  body()
    .custom((value) => {
      if (!value.phoneNumber && !value.email) {
        throw new Error('Either phone number or email is required');
      }
      if (value.phoneNumber && value.email) {
        throw new Error('Provide either phone number or email, not both');
      }
      return true;
    })
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
    .isIn(['registration', 'login', 'verification', 'password_reset', 'password-reset'])
    .withMessage('Invalid purpose. Must be one of: registration, login, verification, password_reset, password-reset')
];

const methodValidation = [
  body('method')
    .optional()
    .isIn(['whatsapp', 'email', 'auto'])
    .withMessage('Invalid method. Must be one of: whatsapp, email, auto')
];

const phoneParamValidation = [
  param('phoneNumber')
    .optional()
    .isString()
    .withMessage('Phone number must be a string')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10-15 digits')
];

/**
 * @route   POST /api/v1/otp/request
 * @desc    Request OTP for phone number or email verification
 * @access  Public
 * @body    { phoneNumber?: string, email?: string, purpose?: string, method?: string }
 */
router.post('/request',
  otpRequestLimiter,
  targetValidation,
  phoneNumberValidation,
  emailValidation,
  purposeValidation,
  methodValidation,
  validateRequest,
  (req, res, next) => {
    logger.info(`OTP request route hit from IP: ${req.ip}`, 'OTP_ROUTES');
    next();
  },
  otpController.requestOTP
);

/**
 * @route   POST /api/v1/otp/verify
 * @desc    Verify OTP for phone number or email
 * @access  Public
 * @body    { phoneNumber?: string, email?: string, otp: string, purpose?: string }
 */
router.post('/verify',
  otpVerifyLimiter,
  targetValidation,
  phoneNumberValidation,
  emailValidation,
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
 * @desc    Resend OTP for phone number or email
 * @access  Public
 * @body    { phoneNumber?: string, email?: string, purpose?: string, method?: string }
 */
router.post('/resend',
  otpRequestLimiter,
  targetValidation,
  phoneNumberValidation,
  emailValidation,
  purposeValidation,
  methodValidation,
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

/**
 * @route   POST /api/v1/otp/email/request
 * @desc    Request OTP for email verification
 * @access  Public
 * @body    { email: string, purpose?: string }
 */
router.post('/email/request',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('purpose')
      .optional()
      .isIn(['verification', 'registration', 'login', 'password-reset', 'password_reset'])
      .withMessage('Invalid purpose. Must be one of: verification, registration, login, password-reset, password_reset')
  ],
  validateRequest,
  (req, res, next) => {
    logger.info(`Email OTP request route hit from IP: ${req.ip}`, 'OTP_ROUTES');
    next();
  },
  otpController.requestEmailOTP
);

/**
 * @route   POST /api/v1/otp/email/verify
 * @desc    Verify email OTP
 * @access  Public
 * @body    { email: string, otp: string, purpose?: string }
 */
router.post('/email/verify',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('OTP must be a 6-digit number'),
    body('purpose')
      .optional()
      .isIn(['verification', 'registration', 'login', 'password-reset'])
      .withMessage('Invalid purpose')
  ],
  validateRequest,
  (req, res, next) => {
    logger.info(`Email OTP verification route hit from IP: ${req.ip}`, 'OTP_ROUTES');
    next();
  },
  otpController.verifyEmailOTP
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