const Joi = require('joi');
const logger = require('../utils/logger');
const auditLogger = require('../utils/auditLogger');

/**
 * Enhanced validation schemas using Joi
 */
const validationSchemas = {
  // Phone number validation
  phoneNumber: Joi.string()
    .pattern(/^[+]?[\d\s\-\(\)]+$/)
    .min(10)
    .max(15)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must contain only digits, spaces, hyphens, and parentheses',
      'string.min': 'Phone number must be at least 10 digits',
      'string.max': 'Phone number cannot exceed 15 digits',
      'any.required': 'Phone number is required'
    }),

  // OTP validation
  otp: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'OTP must be exactly 6 digits',
      'any.required': 'OTP is required'
    }),

  // Email validation
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(254)
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email address is too long'
    }),

  // Name validation
  name: Joi.string()
    .pattern(/^[a-zA-Z\s\-'\.]+$/)
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.pattern.base': 'Name must contain only letters, spaces, hyphens, apostrophes, and periods',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),

  // Blood type validation
  bloodType: Joi.string()
    .valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    .required()
    .messages({
      'any.only': 'Blood type must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-',
      'any.required': 'Blood type is required'
    }),

  // Age validation
  age: Joi.number()
    .integer()
    .min(18)
    .max(65)
    .required()
    .messages({
      'number.base': 'Age must be a number',
      'number.integer': 'Age must be a whole number',
      'number.min': 'Age must be at least 18',
      'number.max': 'Age cannot exceed 65',
      'any.required': 'Age is required'
    }),

  // Gender validation
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .required()
    .messages({
      'any.only': 'Gender must be one of: male, female, other',
      'any.required': 'Gender is required'
    }),

  // Weight validation (for donors)
  weight: Joi.number()
    .min(45)
    .max(200)
    .required()
    .messages({
      'number.base': 'Weight must be a number',
      'number.min': 'Weight must be at least 45 kg',
      'number.max': 'Weight cannot exceed 200 kg',
      'any.required': 'Weight is required'
    }),

  // Address validation
  address: Joi.string()
    .min(10)
    .max(500)
    .trim()
    .required()
    .messages({
      'string.min': 'Address must be at least 10 characters',
      'string.max': 'Address cannot exceed 500 characters',
      'any.required': 'Address is required'
    }),

  // Location coordinates validation
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).required(),

  // Medical conditions validation
  medicalConditions: Joi.array()
    .items(Joi.string().max(100))
    .max(20)
    .default([])
    .messages({
      'array.max': 'Cannot have more than 20 medical conditions',
      'string.max': 'Each medical condition cannot exceed 100 characters'
    }),

  // Medications validation
  medications: Joi.array()
    .items(Joi.string().max(100))
    .max(50)
    .default([])
    .messages({
      'array.max': 'Cannot have more than 50 medications',
      'string.max': 'Each medication cannot exceed 100 characters'
    }),

  // Date validation
  date: Joi.date()
    .iso()
    .max('now')
    .messages({
      'date.base': 'Please provide a valid date',
      'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
      'date.max': 'Date cannot be in the future'
    }),

  // Future date validation (for appointments)
  futureDate: Joi.date()
    .iso()
    .min('now')
    .messages({
      'date.base': 'Please provide a valid date',
      'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
      'date.min': 'Date must be in the future'
    }),

  // Urgency level validation
  urgency: Joi.string()
    .valid('critical', 'urgent', 'scheduled')
    .required()
    .messages({
      'any.only': 'Urgency must be one of: critical, urgent, scheduled',
      'any.required': 'Urgency level is required'
    }),

  // Units needed validation
  unitsNeeded: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .required()
    .messages({
      'number.base': 'Units needed must be a number',
      'number.integer': 'Units needed must be a whole number',
      'number.min': 'At least 1 unit is required',
      'number.max': 'Cannot request more than 10 units',
      'any.required': 'Units needed is required'
    }),

  // Purpose validation (for OTP)
  purpose: Joi.string()
    .valid('registration', 'login', 'verification', 'password_reset')
    .default('verification')
    .messages({
      'any.only': 'Purpose must be one of: registration, login, verification, password_reset'
    }),

  // Hospital/facility name validation
  hospitalName: Joi.string()
    .min(2)
    .max(200)
    .trim()
    .required()
    .messages({
      'string.min': 'Hospital name must be at least 2 characters',
      'string.max': 'Hospital name cannot exceed 200 characters',
      'any.required': 'Hospital name is required'
    }),

  // Notes/comments validation
  notes: Joi.string()
    .max(1000)
    .trim()
    .allow('')
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    }),

  // File upload validation
  file: Joi.object({
    filename: Joi.string().required(),
    mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/jpg', 'application/pdf').required(),
    size: Joi.number().max(5 * 1024 * 1024).required() // 5MB max
  }).messages({
    'any.only': 'File must be JPEG, PNG, or PDF format',
    'number.max': 'File size cannot exceed 5MB'
  })
};

/**
 * Composite validation schemas for different endpoints
 */
const endpointSchemas = {
  // OTP request validation
  otpRequest: Joi.object({
    phoneNumber: validationSchemas.phoneNumber,
    purpose: validationSchemas.purpose
  }),

  // OTP verification validation
  otpVerify: Joi.object({
    phoneNumber: validationSchemas.phoneNumber,
    otp: validationSchemas.otp
  }),

  // User registration validation
  userRegistration: Joi.object({
    name: validationSchemas.name,
    phoneNumber: validationSchemas.phoneNumber,
    email: validationSchemas.email.optional(),
    age: validationSchemas.age,
    gender: validationSchemas.gender,
    bloodType: validationSchemas.bloodType,
    weight: validationSchemas.weight,
    address: validationSchemas.address,
    location: validationSchemas.coordinates,
    emergencyContact: validationSchemas.phoneNumber.optional(),
    medicalConditions: validationSchemas.medicalConditions,
    medications: validationSchemas.medications
  }),

  // User profile update validation
  userProfileUpdate: Joi.object({
    name: validationSchemas.name.optional(),
    email: validationSchemas.email.optional(),
    age: validationSchemas.age.optional(),
    gender: validationSchemas.gender.optional(),
    weight: validationSchemas.weight.optional(),
    address: validationSchemas.address.optional(),
    location: validationSchemas.coordinates.optional(),
    emergencyContact: validationSchemas.phoneNumber.optional(),
    medicalConditions: validationSchemas.medicalConditions,
    medications: validationSchemas.medications
  }).min(1), // At least one field must be provided

  // Blood request validation
  bloodRequest: Joi.object({
    patientName: validationSchemas.name,
    patientAge: validationSchemas.age,
    bloodType: validationSchemas.bloodType,
    urgency: validationSchemas.urgency,
    unitsNeeded: validationSchemas.unitsNeeded,
    hospitalName: validationSchemas.hospitalName,
    location: validationSchemas.coordinates,
    address: validationSchemas.address,
    requiredBy: validationSchemas.futureDate,
    medicalCondition: validationSchemas.notes,
    contactNumber: validationSchemas.phoneNumber,
    requesterName: validationSchemas.name,
    relation: Joi.string().max(50).required()
  }),

  // Guest blood request validation (simplified)
  guestBloodRequest: Joi.object({
    patientName: validationSchemas.name,
    bloodType: validationSchemas.bloodType,
    urgency: validationSchemas.urgency,
    unitsNeeded: validationSchemas.unitsNeeded,
    hospitalName: validationSchemas.hospitalName,
    location: validationSchemas.coordinates,
    contactNumber: validationSchemas.phoneNumber,
    requesterName: validationSchemas.name
  }),

  // Donation record validation
  donationRecord: Joi.object({
    donorId: Joi.string().required(),
    requestId: Joi.string().optional(),
    donationDate: validationSchemas.date,
    hospitalName: validationSchemas.hospitalName,
    location: validationSchemas.coordinates,
    unitsDonated: Joi.number().integer().min(1).max(2).required(),
    preDonationChecks: Joi.object({
      hemoglobin: Joi.number().min(8).max(20).required(),
      bloodPressure: Joi.string().pattern(/^\d{2,3}\/\d{2,3}$/).required(),
      weight: validationSchemas.weight,
      temperature: Joi.number().min(35).max(42).required(),
      medicalClearance: Joi.boolean().required()
    }).required(),
    notes: validationSchemas.notes
  })
};

/**
 * Create Joi validation middleware
 * @param {Object} schema - Joi schema to validate against
 * @param {string} source - Source of data ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
const createJoiValidator = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      
      // Validate data against schema
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false, // Return all errors
        stripUnknown: true, // Remove unknown fields
        convert: true // Convert types when possible
      });

      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
          type: detail.type
        }));

        logger.warn(`Joi validation failed for ${req.method} ${req.originalUrl}`, 'JOI_VALIDATION');
        logger.debug(`Validation errors: ${JSON.stringify(validationErrors)}`, 'JOI_VALIDATION');

        // Log validation failure for audit
        auditLogger.logSecurityEvent({
          userId: req.user?.id || 'anonymous',
          action: 'validation_failure',
          resource: req.originalUrl,
          severity: 'low',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          details: `Input validation failed: ${validationErrors.length} errors`,
          metadata: {
            errors: validationErrors,
            source,
            endpoint: req.originalUrl
          }
        });

        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
      }

      // Replace original data with validated and sanitized data
      req[source] = value;
      
      logger.debug(`Joi validation passed for ${req.method} ${req.originalUrl}`, 'JOI_VALIDATION');
      next();

    } catch (validationError) {
      logger.error('Joi validation middleware error', 'JOI_VALIDATION', validationError);
      
      return res.status(500).json({
        success: false,
        error: 'VALIDATION_SYSTEM_ERROR',
        message: 'Validation system error occurred',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Sanitize input data to prevent XSS and injection attacks
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return data
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .substring(0, 10000); // Limit length
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item));
  }
  
  if (data && typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Input sanitization middleware
 */
const sanitizeInputMiddleware = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeInput(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeInput(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeInput(req.params);
    }
    
    logger.debug('Input sanitization completed', 'SANITIZATION');
    next();
    
  } catch (error) {
    logger.error('Input sanitization error', 'SANITIZATION', error);
    
    return res.status(500).json({
      success: false,
      error: 'SANITIZATION_ERROR',
      message: 'Input sanitization failed',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Rate limiting validation
 * @param {Object} limits - Rate limit configuration
 * @returns {Function} Express middleware function
 */
const createRateLimitValidator = (limits) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const identifier = req.ip + (req.user?.id || '');
    const now = Date.now();
    const windowStart = now - limits.windowMs;
    
    // Clean old requests
    if (requests.has(identifier)) {
      const userRequests = requests.get(identifier).filter(time => time > windowStart);
      requests.set(identifier, userRequests);
    } else {
      requests.set(identifier, []);
    }
    
    const userRequests = requests.get(identifier);
    
    if (userRequests.length >= limits.max) {
      logger.warn(`Rate limit exceeded for ${identifier}`, 'RATE_LIMIT');
      
      // Log rate limit violation
      auditLogger.logSecurityEvent({
        userId: req.user?.id || 'anonymous',
        action: 'rate_limit_exceeded',
        resource: req.originalUrl,
        severity: 'medium',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: `Rate limit exceeded: ${userRequests.length} requests in ${limits.windowMs}ms`,
        metadata: {
          requestCount: userRequests.length,
          windowMs: limits.windowMs,
          maxRequests: limits.max
        }
      });
      
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(limits.windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }
    
    // Add current request
    userRequests.push(now);
    requests.set(identifier, userRequests);
    
    next();
  };
};

module.exports = {
  validationSchemas,
  endpointSchemas,
  createJoiValidator,
  sanitizeInput,
  sanitizeInputMiddleware,
  createRateLimitValidator
};