const logger = require('../utils/logger');

/**
 * Validation middleware factory
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const errors = validateObject(req.body, schema);
      
      if (errors.length > 0) {
        logger.warn('Validation failed', 'VALIDATION_MIDDLEWARE', { errors, body: req.body });
        
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors
        });
      }
      
      next();
    } catch (error) {
      logger.error('Error in validation middleware', 'VALIDATION_MIDDLEWARE', error);
      
      res.status(500).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Validation processing error'
      });
    }
  };
};

/**
 * Validate object against schema
 * @param {Object} obj - Object to validate
 * @param {Object} schema - Validation schema
 * @param {string} path - Current path (for nested validation)
 * @returns {Array} Array of validation errors
 */
function validateObject(obj, schema, path = '') {
  const errors = [];
  
  if (!obj || typeof obj !== 'object') {
    errors.push({
      field: path || 'root',
      message: 'Expected an object',
      value: obj
    });
    return errors;
  }
  
  // Check each field in schema
  for (const [key, rules] of Object.entries(schema)) {
    const fieldPath = path ? `${path}.${key}` : key;
    const value = obj[key];
    
    // Check if field is required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: fieldPath,
        message: 'This field is required',
        value: value
      });
      continue;
    }
    
    // Skip validation if field is not required and not provided
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }
    
    // Type validation
    if (rules.type && !validateType(value, rules.type)) {
      errors.push({
        field: fieldPath,
        message: `Expected type ${rules.type}, got ${typeof value}`,
        value: value
      });
      continue;
    }
    
    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push({
          field: fieldPath,
          message: `Minimum length is ${rules.minLength}`,
          value: value
        });
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push({
          field: fieldPath,
          message: `Maximum length is ${rules.maxLength}`,
          value: value
        });
      }
      
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push({
          field: fieldPath,
          message: 'Invalid format',
          value: value
        });
      }
      
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({
          field: fieldPath,
          message: `Must be one of: ${rules.enum.join(', ')}`,
          value: value
        });
      }
      
      if (rules.format) {
        const formatError = validateFormat(value, rules.format);
        if (formatError) {
          errors.push({
            field: fieldPath,
            message: formatError,
            value: value
          });
        }
      }
    }
    
    // Number validations
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push({
          field: fieldPath,
          message: `Minimum value is ${rules.min}`,
          value: value
        });
      }
      
      if (rules.max !== undefined && value > rules.max) {
        errors.push({
          field: fieldPath,
          message: `Maximum value is ${rules.max}`,
          value: value
        });
      }
    }
    
    // Array validations
    if (rules.type === 'array' && Array.isArray(value)) {
      if (rules.minItems && value.length < rules.minItems) {
        errors.push({
          field: fieldPath,
          message: `Minimum ${rules.minItems} items required`,
          value: value
        });
      }
      
      if (rules.maxItems && value.length > rules.maxItems) {
        errors.push({
          field: fieldPath,
          message: `Maximum ${rules.maxItems} items allowed`,
          value: value
        });
      }
      
      // Validate array items
      if (rules.items) {
        value.forEach((item, index) => {
          const itemErrors = validateType(item, rules.items.type) ? [] : [{
            field: `${fieldPath}[${index}]`,
            message: `Expected type ${rules.items.type}, got ${typeof item}`,
            value: item
          }];
          errors.push(...itemErrors);
        });
      }
    }
    
    // Object validations (nested)
    if (rules.type === 'object' && typeof value === 'object' && value !== null) {
      if (rules.properties) {
        const nestedErrors = validateObject(value, rules.properties, fieldPath);
        errors.push(...nestedErrors);
      }
    }
    
    // Handle nested objects without explicit type
    if (typeof rules === 'object' && !rules.type && !rules.required && typeof value === 'object' && value !== null) {
      const nestedErrors = validateObject(value, rules, fieldPath);
      errors.push(...nestedErrors);
    }
  }
  
  return errors;
}

/**
 * Validate value type
 * @param {*} value - Value to validate
 * @param {string} expectedType - Expected type
 * @returns {boolean} Is valid type
 */
function validateType(value, expectedType) {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'date':
      return value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)));
    default:
      return true;
  }
}

/**
 * Validate format
 * @param {string} value - Value to validate
 * @param {string} format - Format type
 * @returns {string|null} Error message or null if valid
 */
function validateFormat(value, format) {
  switch (format) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : 'Invalid email format';
      
    case 'phone':
      const phoneRegex = /^[6-9]\d{9}$/;
      return phoneRegex.test(value) ? null : 'Invalid phone number format';
      
    case 'url':
      try {
        new URL(value);
        return null;
      } catch {
        return 'Invalid URL format';
      }
      
    case 'date':
      const date = new Date(value);
      return !isNaN(date.getTime()) ? null : 'Invalid date format';
      
    case 'date-time':
      const dateTime = new Date(value);
      return !isNaN(dateTime.getTime()) ? null : 'Invalid date-time format';
      
    case 'uuid':
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value) ? null : 'Invalid UUID format';
      
    default:
      return null;
  }
}

/**
 * Validate query parameters
 * @param {Object} schema - Query parameter schema
 * @returns {Function} Express middleware function
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const errors = validateObject(req.query, schema, 'query');
      
      if (errors.length > 0) {
        logger.warn('Query validation failed', 'VALIDATION_MIDDLEWARE', { errors, query: req.query });
        
        return res.status(400).json({
          success: false,
          error: 'QUERY_VALIDATION_ERROR',
          message: 'Query parameter validation failed',
          details: errors
        });
      }
      
      next();
    } catch (error) {
      logger.error('Error in query validation middleware', 'VALIDATION_MIDDLEWARE', error);
      
      res.status(500).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Query validation processing error'
      });
    }
  };
};

/**
 * Validate URL parameters
 * @param {Object} schema - URL parameter schema
 * @returns {Function} Express middleware function
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const errors = validateObject(req.params, schema, 'params');
      
      if (errors.length > 0) {
        logger.warn('Params validation failed', 'VALIDATION_MIDDLEWARE', { errors, params: req.params });
        
        return res.status(400).json({
          success: false,
          error: 'PARAMS_VALIDATION_ERROR',
          message: 'URL parameter validation failed',
          details: errors
        });
      }
      
      next();
    } catch (error) {
      logger.error('Error in params validation middleware', 'VALIDATION_MIDDLEWARE', error);
      
      res.status(500).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Parameter validation processing error'
      });
    }
  };
};

/**
 * Sanitize input data
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
function sanitizeInput(data) {
  if (typeof data === 'string') {
    return data.trim();
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Sanitization middleware
 * @returns {Function} Express middleware function
 */
const sanitize = () => {
  return (req, res, next) => {
    try {
      if (req.body) {
        req.body = sanitizeInput(req.body);
      }
      
      if (req.query) {
        req.query = sanitizeInput(req.query);
      }
      
      if (req.params) {
        req.params = sanitizeInput(req.params);
      }
      
      next();
    } catch (error) {
      logger.error('Error in sanitization middleware', 'VALIDATION_MIDDLEWARE', error);
      
      res.status(500).json({
        success: false,
        error: 'SANITIZATION_ERROR',
        message: 'Input sanitization error'
      });
    }
  };
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
  sanitize,
  validateObject,
  validateType,
  validateFormat
};