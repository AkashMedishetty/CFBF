const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const auditLogger = require('../utils/auditLogger');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('No valid authorization header provided', 'AUTH_MIDDLEWARE');
      return res.status(401).json({
        success: false,
        error: 'NO_TOKEN',
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id)
        .select('-password')
        .lean();

      if (!user) {
        logger.warn(`User not found for token: ${decoded.id}`, 'AUTH_MIDDLEWARE');
        return res.status(401).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Access denied. User not found.'
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        logger.warn(`Inactive user attempted access: ${user._id}`, 'AUTH_MIDDLEWARE');
        return res.status(401).json({
          success: false,
          error: 'USER_INACTIVE',
          message: 'Access denied. User account is inactive.'
        });
      }

      // Attach user to request
      req.user = user;
      req.token = token;

      // Log successful authentication
      logger.debug(`User authenticated: ${user._id} (${user.role})`, 'AUTH_MIDDLEWARE');

      next();

    } catch (tokenError) {
      logger.warn('Invalid token provided', 'AUTH_MIDDLEWARE', tokenError);
      
      // Log failed authentication attempt
      auditLogger.logSecurityEvent({
        event: 'invalid_token',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: 'Invalid JWT token provided',
        severity: 'medium',
        metadata: {
          tokenError: tokenError.message,
          requestPath: req.path,
          requestMethod: req.method
        }
      });

      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Access denied. Invalid token.'
      });
    }

  } catch (error) {
    logger.error('Error in authentication middleware', 'AUTH_MIDDLEWARE', error);
    
    res.status(500).json({
      success: false,
      error: 'AUTH_ERROR',
      message: 'Authentication processing error'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id)
        .select('-password')
        .lean();

      if (user && user.status === 'active') {
        req.user = user;
        req.token = token;
      }
    } catch (tokenError) {
      // Invalid token, but continue without user
      logger.debug('Invalid optional token provided', 'AUTH_MIDDLEWARE');
    }

    next();

  } catch (error) {
    logger.error('Error in optional authentication middleware', 'AUTH_MIDDLEWARE', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Role-based authorization middleware
 * @param {string|Array} roles - Required role(s)
 */
const authorize = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        });
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`Unauthorized access attempt: ${req.user._id} (${req.user.role}) to ${req.path}`, 'AUTH_MIDDLEWARE');
        
        // Log unauthorized access attempt
        auditLogger.logSecurityEvent({
          event: 'unauthorized_access',
          userId: req.user._id,
          userRole: req.user.role,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          details: `Attempted to access ${req.method} ${req.path} without proper authorization`,
          severity: 'high',
          metadata: {
            requiredRoles: allowedRoles,
            userRole: req.user.role,
            requestPath: req.path,
            requestMethod: req.method
          }
        });

        return res.status(403).json({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();

    } catch (error) {
      logger.error('Error in authorization middleware', 'AUTH_MIDDLEWARE', error);
      
      res.status(500).json({
        success: false,
        error: 'AUTHORIZATION_ERROR',
        message: 'Authorization processing error'
      });
    }
  };
};

/**
 * Admin-only authorization middleware
 */
const adminOnly = authorize('admin');

/**
 * Donor-only authorization middleware
 */
const donorOnly = authorize('donor');

/**
 * Hospital-only authorization middleware
 */
const hospitalOnly = authorize('hospital');

/**
 * Multi-role authorization middleware
 */
const adminOrHospital = authorize(['admin', 'hospital']);
const adminOrDonor = authorize(['admin', 'donor']);
const donorOrHospital = authorize(['donor', 'hospital']);

/**
 * Resource ownership middleware
 * Checks if user owns the resource or is admin
 * @param {string} resourceIdParam - Parameter name containing resource ID
 * @param {string} resourceModel - Mongoose model name
 * @param {string} ownerField - Field name that contains owner ID
 */
const checkResourceOwnership = (resourceIdParam, resourceModel, ownerField = 'createdBy') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        });
      }

      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: 'RESOURCE_ID_REQUIRED',
          message: 'Resource ID is required'
        });
      }

      // Dynamically require the model
      const Model = require(`../models/${resourceModel}`);
      const resource = await Model.findById(resourceId).lean();

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'RESOURCE_NOT_FOUND',
          message: 'Resource not found'
        });
      }

      // Check ownership
      const ownerId = resource[ownerField]?.toString();
      if (ownerId !== req.user._id.toString()) {
        logger.warn(`Unauthorized resource access: ${req.user._id} attempted to access ${resourceModel}:${resourceId}`, 'AUTH_MIDDLEWARE');
        
        return res.status(403).json({
          success: false,
          error: 'RESOURCE_ACCESS_DENIED',
          message: 'You do not have permission to access this resource'
        });
      }

      // Attach resource to request for use in controller
      req.resource = resource;
      next();

    } catch (error) {
      logger.error('Error in resource ownership middleware', 'AUTH_MIDDLEWARE', error);
      
      res.status(500).json({
        success: false,
        error: 'OWNERSHIP_CHECK_ERROR',
        message: 'Resource ownership check error'
      });
    }
  };
};

/**
 * Rate limiting by user
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 */
const userRateLimit = (maxRequests, windowMs) => {
  const userRequests = new Map();

  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(); // Skip rate limiting for unauthenticated requests
      }

      const userId = req.user._id.toString();
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get user's request history
      let requests = userRequests.get(userId) || [];
      
      // Remove old requests outside the window
      requests = requests.filter(timestamp => timestamp > windowStart);
      
      // Check if user has exceeded the limit
      if (requests.length >= maxRequests) {
        logger.warn(`User rate limit exceeded: ${userId}`, 'AUTH_MIDDLEWARE');
        
        return res.status(429).json({
          success: false,
          error: 'USER_RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      // Add current request
      requests.push(now);
      userRequests.set(userId, requests);

      next();

    } catch (error) {
      logger.error('Error in user rate limiting middleware', 'AUTH_MIDDLEWARE', error);
      next(); // Continue on error
    }
  };
};

/**
 * Session validation middleware
 * Checks if user session is still valid
 */
const validateSession = async (req, res, next) => {
  try {
    if (!req.user || !req.token) {
      return next();
    }

    // Check if user has been updated since token was issued
    const currentUser = await User.findById(req.user._id)
      .select('updatedAt status')
      .lean();

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User session invalid'
      });
    }

    if (currentUser.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'USER_INACTIVE',
        message: 'User account has been deactivated'
      });
    }

    // Decode token to check issue time
    const decoded = jwt.decode(req.token);
    const tokenIssuedAt = new Date(decoded.iat * 1000);
    
    // If user was updated after token was issued, require re-authentication
    if (currentUser.updatedAt > tokenIssuedAt) {
      logger.info(`User updated since token issued: ${req.user._id}`, 'AUTH_MIDDLEWARE');
      
      return res.status(401).json({
        success: false,
        error: 'SESSION_EXPIRED',
        message: 'Session expired. Please log in again.'
      });
    }

    next();

  } catch (error) {
    logger.error('Error in session validation middleware', 'AUTH_MIDDLEWARE', error);
    next(); // Continue on error
  }
};

module.exports = {
  auth,
  optionalAuth,
  authorize,
  adminOnly,
  donorOnly,
  hospitalOnly,
  adminOrHospital,
  adminOrDonor,
  donorOrHospital,
  checkResourceOwnership,
  userRateLimit,
  validateSession
};