const logger = require('../utils/logger');

/**
 * Security configuration constants and settings
 */
const SecurityConfig = {
  // Encryption settings
  ENCRYPTION: {
    ALGORITHM: 'aes-256-gcm',
    KEY_LENGTH: 32, // 256 bits
    IV_LENGTH: 16,  // 128 bits
    TAG_LENGTH: 16, // 128 bits
    SALT_ROUNDS: 12 // bcrypt rounds
  },

  // JWT settings
  JWT: {
    ALGORITHM: 'HS256',
    EXPIRES_IN: '24h',
    REFRESH_EXPIRES_IN: '7d',
    ISSUER: 'call-for-blood-foundation',
    AUDIENCE: 'bdms-users'
  },

  // Rate limiting settings
  RATE_LIMITS: {
    GLOBAL: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // requests per window
    },
    AUTH: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5 // login attempts per window
    },
    OTP: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5 // OTP requests per window
    },
    API: {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60 // API calls per minute
    }
  },

  // Session settings
  SESSION: {
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    SECURE: process.env.NODE_ENV === 'production',
    HTTP_ONLY: true,
    SAME_SITE: 'strict'
  },

  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: true,
    FORBIDDEN_PATTERNS: [
      'password',
      '123456',
      'qwerty',
      'admin',
      'user'
    ]
  },

  // File upload settings
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf'
    ],
    UPLOAD_PATH: './uploads/',
    VIRUS_SCAN: process.env.NODE_ENV === 'production'
  },

  // Input validation settings
  INPUT_VALIDATION: {
    MAX_STRING_LENGTH: 10000,
    MAX_ARRAY_LENGTH: 1000,
    MAX_OBJECT_DEPTH: 10,
    SANITIZE_HTML: true,
    STRIP_UNKNOWN: true
  },

  // Audit logging settings
  AUDIT: {
    RETENTION_DAYS: 90,
    MAX_LOGS_MEMORY: 10000,
    LOG_SENSITIVE_DATA: false,
    ALERT_THRESHOLDS: {
      FAILED_LOGINS: 5,
      SUSPICIOUS_ACTIVITY: 10,
      RATE_LIMIT_VIOLATIONS: 3
    }
  },

  // Security headers
  SECURITY_HEADERS: {
    HSTS_MAX_AGE: 31536000, // 1 year
    CSP_DIRECTIVES: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.whatsapp.com", "https://graph.facebook.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },

  // IP and geographic restrictions
  ACCESS_CONTROL: {
    BLOCKED_COUNTRIES: [], // ISO country codes to block
    ALLOWED_IPS: [], // Whitelist of IP addresses
    BLOCKED_IPS: [], // Blacklist of IP addresses
    MAX_REQUESTS_PER_IP: 1000, // Per day
    GEO_BLOCKING_ENABLED: false
  },

  // Data classification
  DATA_CLASSIFICATION: {
    PUBLIC: ['name', 'bloodType', 'location'],
    INTERNAL: ['email', 'age', 'gender'],
    CONFIDENTIAL: ['phone', 'address', 'emergencyContact'],
    RESTRICTED: ['medicalConditions', 'medications', 'nationalId'],
    TOP_SECRET: ['password', 'tokens', 'keys']
  },

  // Compliance settings
  COMPLIANCE: {
    HIPAA_ENABLED: true,
    GDPR_ENABLED: true,
    DATA_RETENTION_DAYS: 2555, // 7 years
    CONSENT_REQUIRED: true,
    RIGHT_TO_ERASURE: true,
    DATA_PORTABILITY: true
  },

  // Monitoring and alerting
  MONITORING: {
    HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
    PERFORMANCE_THRESHOLD: 2000, // 2 seconds
    ERROR_THRESHOLD: 5, // errors per minute
    ALERT_CHANNELS: ['email', 'slack', 'webhook'],
    METRICS_RETENTION: 30 // days
  },

  // Environment-specific settings
  ENVIRONMENT: {
    DEVELOPMENT: {
      DEBUG_MODE: true,
      VERBOSE_LOGGING: true,
      MOCK_EXTERNAL_APIS: true,
      SKIP_RATE_LIMITING: false
    },
    PRODUCTION: {
      DEBUG_MODE: false,
      VERBOSE_LOGGING: false,
      MOCK_EXTERNAL_APIS: false,
      SKIP_RATE_LIMITING: false,
      REQUIRE_HTTPS: true,
      STRICT_TRANSPORT_SECURITY: true
    }
  }
};

/**
 * Get environment-specific security configuration
 * @param {string} environment - Environment name (development, production)
 * @returns {Object} Security configuration
 */
function getSecurityConfig(environment = process.env.NODE_ENV || 'development') {
  const baseConfig = { ...SecurityConfig };
  const envConfig = SecurityConfig.ENVIRONMENT[environment.toUpperCase()] || {};
  
  // Merge environment-specific settings
  Object.assign(baseConfig, envConfig);
  
  logger.info(`Security configuration loaded for environment: ${environment}`, 'SECURITY_CONFIG');
  
  return baseConfig;
}

/**
 * Validate security configuration
 * @param {Object} config - Security configuration to validate
 * @returns {Object} Validation result
 */
function validateSecurityConfig(config) {
  const errors = [];
  const warnings = [];

  // Check required environment variables
  const requiredEnvVars = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'NODE_ENV'
  ];

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  });

  // Check JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters long');
  }

  // Check encryption key
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length < 44) {
    warnings.push('ENCRYPTION_KEY should be at least 44 characters long (base64 encoded 32 bytes)');
  }

  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.MONGODB_ATLAS_URI) {
      warnings.push('Consider using MongoDB Atlas for production');
    }
    
    if (!process.env.WHATSAPP_TOKEN) {
      errors.push('WhatsApp token is required for production');
    }
    
    if (!process.env.SSL_CERT_PATH || !process.env.SSL_KEY_PATH) {
      warnings.push('SSL certificates not configured for production');
    }
  }

  const isValid = errors.length === 0;
  
  if (errors.length > 0) {
    logger.error('Security configuration validation failed', 'SECURITY_CONFIG');
    errors.forEach(error => logger.error(error, 'SECURITY_CONFIG'));
  }
  
  if (warnings.length > 0) {
    logger.warn('Security configuration warnings', 'SECURITY_CONFIG');
    warnings.forEach(warning => logger.warn(warning, 'SECURITY_CONFIG'));
  }
  
  if (isValid) {
    logger.success('Security configuration validation passed', 'SECURITY_CONFIG');
  }

  return {
    valid: isValid,
    errors,
    warnings,
    score: Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5))
  };
}

/**
 * Get security recommendations based on current configuration
 * @returns {Array} Array of security recommendations
 */
function getSecurityRecommendations() {
  const recommendations = [];
  
  // Environment-based recommendations
  if (process.env.NODE_ENV === 'production') {
    recommendations.push({
      category: 'Infrastructure',
      priority: 'high',
      title: 'Enable HTTPS',
      description: 'Ensure all traffic is encrypted using TLS 1.3',
      implemented: !!process.env.SSL_CERT_PATH
    });
    
    recommendations.push({
      category: 'Database',
      priority: 'high',
      title: 'Use MongoDB Atlas',
      description: 'Use managed MongoDB with built-in security features',
      implemented: !!process.env.MONGODB_ATLAS_URI
    });
  }
  
  recommendations.push({
    category: 'Authentication',
    priority: 'high',
    title: 'Strong JWT Secret',
    description: 'Use a cryptographically secure JWT secret (32+ characters)',
    implemented: process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
  });
  
  recommendations.push({
    category: 'Encryption',
    priority: 'high',
    title: 'Data Encryption at Rest',
    description: 'Encrypt sensitive data using AES-256',
    implemented: !!process.env.ENCRYPTION_KEY
  });
  
  recommendations.push({
    category: 'Monitoring',
    priority: 'medium',
    title: 'Security Monitoring',
    description: 'Implement comprehensive audit logging and monitoring',
    implemented: true // Our audit logger is implemented
  });
  
  recommendations.push({
    category: 'Compliance',
    priority: 'medium',
    title: 'HIPAA Compliance',
    description: 'Ensure healthcare data protection compliance',
    implemented: SecurityConfig.COMPLIANCE.HIPAA_ENABLED
  });

  return recommendations;
}

module.exports = {
  SecurityConfig,
  getSecurityConfig,
  validateSecurityConfig,
  getSecurityRecommendations
};