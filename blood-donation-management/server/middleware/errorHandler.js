const logger = require('../utils/logger');
const auditLogger = require('../utils/auditLogger');

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error caught by global handler', 'ERROR_HANDLER', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      statusCode: 404,
      message,
      code: 'RESOURCE_NOT_FOUND'
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value for field: ${field}`;
    error = {
      statusCode: 400,
      message,
      code: 'DUPLICATE_FIELD'
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      statusCode: 400,
      message,
      code: 'VALIDATION_ERROR'
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      statusCode: 400,
      message: 'File too large',
      code: 'FILE_TOO_LARGE'
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      statusCode: 400,
      message: 'Unexpected file field',
      code: 'UNEXPECTED_FILE'
    };
  }

  // Rate limiting errors
  if (err.type === 'entity.too.large') {
    error = {
      statusCode: 413,
      message: 'Request entity too large',
      code: 'ENTITY_TOO_LARGE'
    };
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    error = {
      statusCode: 403,
      message: 'CORS policy violation',
      code: 'CORS_ERROR'
    };
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    error = {
      statusCode: 503,
      message: 'Database connection error',
      code: 'DATABASE_ERROR'
    };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const code = error.code || 'INTERNAL_SERVER_ERROR';

  // Log security-related errors
  if (statusCode === 401 || statusCode === 403) {
    auditLogger.logSecurityEvent({
      event: 'authentication_error',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: `${statusCode} error: ${message}`,
      severity: statusCode === 401 ? 'medium' : 'high',
      metadata: {
        path: req.path,
        method: req.method,
        errorCode: code,
        userId: req.user?.id || null
      }
    });
  }

  // Log system errors
  if (statusCode >= 500) {
    auditLogger.logSystemEvent({
      event: 'system_error',
      service: 'error_handler',
      details: `${statusCode} error: ${message}`,
      success: false,
      metadata: {
        path: req.path,
        method: req.method,
        errorCode: code,
        stack: err.stack,
        userId: req.user?.id || null
      }
    });
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: code,
    message: message
  };

  // Add additional error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = error;
  }

  // Add request ID if available
  if (req.requestId) {
    errorResponse.requestId = req.requestId;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;