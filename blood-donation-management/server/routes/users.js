const express = require('express');
const { body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

const userController = require('../controllers/userController');
const { validateRequest } = require('../middleware/validation');
const { createJoiValidator, endpointSchemas } = require('../middleware/joiValidation');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for user registration
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 registration attempts per 15 minutes per IP
  message: {
    success: false,
    error: 'TOO_MANY_REGISTRATION_ATTEMPTS',
    message: 'Too many registration attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Registration rate limit exceeded for IP: ${req.ip}`, 'USER_ROUTES');
    res.status(429).json({
      success: false,
      error: 'TOO_MANY_REGISTRATION_ATTEMPTS',
      message: 'Too many registration attempts. Please try again later.'
    });
  }
});

// Rate limiting for profile updates
const updateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 updates per 5 minutes per IP
  message: {
    success: false,
    error: 'TOO_MANY_UPDATE_ATTEMPTS',
    message: 'Too many profile update attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation schemas
const userIdValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

const phoneVerificationValidation = [
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
];

const searchValidation = [
  query('query')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2-100 characters'),
  
  query('bloodType')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood type'),
  
  query('status')
    .optional()
    .isIn(['pending', 'active', 'inactive', 'suspended', 'banned'])
    .withMessage('Invalid status'),
  
  query('location')
    .optional()
    .matches(/^-?\d+\.?\d*,-?\d+\.?\d*$/)
    .withMessage('Location must be in format: longitude,latitude'),
  
  query('radius')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Radius must be between 1-100 km'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100')
];

/**
 * @route   POST /api/v1/users/register
 * @desc    Register a new user
 * @access  Public
 * @body    User registration data
 */
router.post('/register',
  registrationLimiter,
  createJoiValidator(endpointSchemas.userRegistration),
  (req, res, next) => {
    logger.info(`User registration route hit from IP: ${req.ip}`, 'USER_ROUTES');
    next();
  },
  userController.registerUser
);

/**
 * @route   GET /api/v1/users/:userId
 * @desc    Get user profile
 * @access  Private
 * @params  userId: MongoDB ObjectId
 */
router.get('/:userId',
  userIdValidation,
  validateRequest,
  (req, res, next) => {
    logger.info(`User profile request for: ${req.params.userId}`, 'USER_ROUTES');
    next();
  },
  userController.getUserProfile
);

/**
 * @route   PUT /api/v1/users/:userId
 * @desc    Update user profile
 * @access  Private
 * @params  userId: MongoDB ObjectId
 * @body    Updated user data
 */
router.put('/:userId',
  updateLimiter,
  userIdValidation,
  createJoiValidator(endpointSchemas.userProfileUpdate),
  validateRequest,
  (req, res, next) => {
    logger.info(`User profile update for: ${req.params.userId}`, 'USER_ROUTES');
    next();
  },
  userController.updateUserProfile
);

/**
 * @route   POST /api/v1/users/:userId/verify-phone
 * @desc    Verify user phone number with OTP
 * @access  Private
 * @params  userId: MongoDB ObjectId
 * @body    { otp: string }
 */
router.post('/:userId/verify-phone',
  userIdValidation,
  phoneVerificationValidation,
  validateRequest,
  (req, res, next) => {
    logger.info(`Phone verification request for user: ${req.params.userId}`, 'USER_ROUTES');
    next();
  },
  userController.verifyPhoneNumber
);

/**
 * @route   GET /api/v1/users/:userId/stats
 * @desc    Get user statistics and analytics
 * @access  Private
 * @params  userId: MongoDB ObjectId
 */
router.get('/:userId/stats',
  userIdValidation,
  validateRequest,
  (req, res, next) => {
    logger.info(`User stats request for: ${req.params.userId}`, 'USER_ROUTES');
    next();
  },
  userController.getUserStats
);

/**
 * @route   GET /api/v1/users/search
 * @desc    Search users (admin only)
 * @access  Private (Admin)
 * @query   Various search parameters
 */
router.get('/search',
  // TODO: Add admin authentication middleware
  searchValidation,
  validateRequest,
  (req, res, next) => {
    logger.info(`User search request from admin`, 'USER_ROUTES');
    next();
  },
  userController.searchUsers
);

/**
 * @route   POST /api/v1/users/:userId/activate
 * @desc    Activate user account (admin only)
 * @access  Private (Admin)
 * @params  userId: MongoDB ObjectId
 */
router.post('/:userId/activate',
  // TODO: Add admin authentication middleware
  userIdValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      logger.info(`User activation request for: ${userId}`, 'USER_ROUTES');
      
      const User = require('../models/User');
      const auditLogger = require('../utils/auditLogger');
      
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          status: 'active',
          'verification.medicallyCleared': true,
          updatedBy: req.user?.id
        },
        { new: true }
      );
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }
      
      // Log admin action
      auditLogger.logUserAction({
        userId: req.user?.id || 'admin',
        userRole: 'admin',
        action: 'user_activation',
        resource: 'user_account',
        resourceId: userId,
        details: `User account activated by admin`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true
      });
      
      logger.success(`User activated successfully: ${userId}`, 'USER_ROUTES');
      
      res.status(200).json({
        success: true,
        message: 'User activated successfully',
        data: { user }
      });
      
    } catch (error) {
      logger.error('Error activating user', 'USER_ROUTES', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to activate user'
      });
    }
  }
);

/**
 * @route   POST /api/v1/users/:userId/deactivate
 * @desc    Deactivate user account (admin only)
 * @access  Private (Admin)
 * @params  userId: MongoDB ObjectId
 */
router.post('/:userId/deactivate',
  // TODO: Add admin authentication middleware
  userIdValidation,
  body('reason')
    .notEmpty()
    .withMessage('Deactivation reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10-500 characters'),
  validateRequest,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      
      logger.info(`User deactivation request for: ${userId}`, 'USER_ROUTES');
      
      const User = require('../models/User');
      const auditLogger = require('../utils/auditLogger');
      
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          status: 'inactive',
          isActive: false,
          'verification.medicallyCleared': false,
          updatedBy: req.user?.id
        },
        { new: true }
      );
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }
      
      // Log admin action
      auditLogger.logUserAction({
        userId: req.user?.id || 'admin',
        userRole: 'admin',
        action: 'user_deactivation',
        resource: 'user_account',
        resourceId: userId,
        details: `User account deactivated by admin. Reason: ${reason}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true,
        metadata: { reason }
      });
      
      logger.success(`User deactivated successfully: ${userId}`, 'USER_ROUTES');
      
      res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
        data: { user }
      });
      
    } catch (error) {
      logger.error('Error deactivating user', 'USER_ROUTES', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to deactivate user'
      });
    }
  }
);

// Health check endpoint for user service
router.get('/health', (req, res) => {
  logger.debug('User service health check requested', 'USER_ROUTES');
  
  res.status(200).json({
    success: true,
    message: 'User service is healthy',
    timestamp: new Date().toISOString(),
    service: 'users'
  });
});

module.exports = router;