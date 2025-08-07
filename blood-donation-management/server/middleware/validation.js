const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Middleware to validate request data using express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array();
    
    logger.warn(`Validation failed for ${req.method} ${req.originalUrl}`, 'VALIDATION');
    logger.debug(`Validation errors: ${JSON.stringify(errorDetails)}`, 'VALIDATION');
    logger.debug(`Request body: ${JSON.stringify(req.body)}`, 'VALIDATION');
    logger.debug(`Request params: ${JSON.stringify(req.params)}`, 'VALIDATION');
    logger.debug(`Request query: ${JSON.stringify(req.query)}`, 'VALIDATION');
    
    // Format errors for better readability
    const formattedErrors = errorDetails.map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));
    
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: formattedErrors,
      timestamp: new Date().toISOString()
    });
  }
  
  logger.debug(`Validation passed for ${req.method} ${req.originalUrl}`, 'VALIDATION');
  next();
};

/**
 * Custom validation function for phone numbers
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidPhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid Indian mobile number (with country code)
  const indianMobileRegex = /^91[6-9]\d{9}$/;
  
  // Check if it's a valid international number (basic check)
  const internationalRegex = /^\d{10,15}$/;
  
  return indianMobileRegex.test(cleaned) || internationalRegex.test(cleaned);
};

/**
 * Custom validation function for OTP
 * @param {string} otp - OTP to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidOTP = (otp) => {
  if (!otp || typeof otp !== 'string') {
    return false;
  }
  
  // OTP should be exactly 6 digits
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
};

/**
 * Custom validation function for email
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Custom validation function for blood type
 * @param {string} bloodType - Blood type to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidBloodType = (bloodType) => {
  if (!bloodType || typeof bloodType !== 'string') {
    return false;
  }
  
  const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  return validBloodTypes.includes(bloodType.toUpperCase());
};

/**
 * Custom validation function for date of birth
 * @param {string} dateOfBirth - Date of birth to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) {
    return false;
  }
  
  const date = new Date(dateOfBirth);
  const now = new Date();
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return false;
  }
  
  // Check if date is not in the future
  if (date > now) {
    return false;
  }
  
  // Check if person is at least 18 years old
  const age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    return age - 1 >= 18;
  }
  
  return age >= 18;
};

/**
 * Sanitize input to prevent XSS and injection attacks
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') {
    return input;
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes that could break SQL
    .replace(/[&]/g, '&amp;') // Escape ampersands
    .substring(0, 1000); // Limit length to prevent buffer overflow
};

/**
 * Middleware to sanitize request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    }
  }
  
  if (req.params && typeof req.params === 'object') {
    for (const key in req.params) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeInput(req.params[key]);
      }
    }
  }
  
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeInput(req.query[key]);
      }
    }
  }
  
  logger.debug('Request sanitized', 'VALIDATION');
  next();
};

module.exports = {
  validateRequest,
  sanitizeRequest,
  isValidPhoneNumber,
  isValidOTP,
  isValidEmail,
  isValidBloodType,
  isValidDateOfBirth,
  sanitizeInput
};