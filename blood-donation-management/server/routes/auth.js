const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const jwtManager = require('../utils/jwt');
const passwordManager = require('../utils/password');
const logger = require('../utils/logger');
const { userRateLimit, auth } = require('../middleware/auth');
const { rateLimit } = require('express-rate-limit');

const router = express.Router();

// Rate limiting for validation endpoints
const validationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Validation schemas
const registerSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please enter a valid Indian phone number',
      'any.required': 'Phone number is required'
    }),
  
  email: Joi.string()
    .email()
    .optional(),
  
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required'
    }),
  
  profile: Joi.object({
    firstName: Joi.string().trim().max(50).required(),
    lastName: Joi.string().trim().max(50).required(),
    dateOfBirth: Joi.date().max('now').required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').required()
  }).required(),
  
  location: Joi.object({
    address: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required(),
    // Optional geocoordinates to store precise location
    coordinates: Joi.array()
      .length(2)
      .ordered(
        Joi.number().min(-180).max(180), // longitude
        Joi.number().min(-90).max(90)    // latitude
      )
      .optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional()
  }).required(),
  
  emergencyContact: Joi.object({
    name: Joi.string().trim().required(),
    relationship: Joi.string().trim().required(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required()
  }).required(),
  
  preferences: Joi.object({
    maxTravelDistance: Joi.number().min(1).max(100).default(15),
    notificationMethods: Joi.object({
      whatsapp: Joi.boolean().default(true),
      sms: Joi.boolean().default(false),
      email: Joi.boolean().default(false)
    }).default({
      whatsapp: true,
      sms: false,
      email: false
    })
  }).default({
    maxTravelDistance: 15,
    notificationMethods: {
      whatsapp: true,
      sms: false,
      email: false
    }
  }),
  
  referralCode: Joi.string().optional()
});

const loginSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
  
  password: Joi.string()
    .required()
});

const otpLoginSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
  
  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
});

// @route   POST /api/v1/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', userRateLimit(3, 15 * 60 * 1000), async (req, res) => {
  try {
    logger.api('POST', '/api/v1/auth/register', null, null, 'AUTH_ROUTES');
    logger.debug('User registration attempt', 'AUTH_ROUTES');
    
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      logger.warn(`Registration validation failed: ${error.details[0].message}`, 'AUTH_ROUTES');
      return res.status(400).json({
        success: false,
        error: {
          message: error.details[0].message,
          code: 'VALIDATION_ERROR',
          field: error.details[0].path[0]
        }
      });
    }

    const { phone, email, password, profile, location, emergencyContact, referralCode } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber: phone });
    if (existingUser) {
      logger.warn(`Registration failed: Phone ${phone} already exists`, 'AUTH_ROUTES');
      return res.status(409).json({
        success: false,
        error: {
          message: 'Phone number already registered',
          code: 'PHONE_EXISTS'
        }
      });
    }

    // Check email if provided
    if (email) {
      const existingEmail = await User.findOne({ email: email });
      if (existingEmail) {
        logger.warn(`Registration failed: Email ${email} already exists`, 'AUTH_ROUTES');
        return res.status(409).json({
          success: false,
          error: {
            message: 'Email already registered',
            code: 'EMAIL_EXISTS'
          }
        });
      }
    }

    // Validate password strength
    const passwordStrength = passwordManager.validatePasswordStrength(password);
    if (passwordStrength.score < 3) {
      logger.warn(`Registration failed: Weak password for ${phone}`, 'AUTH_ROUTES');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password is too weak',
          code: 'WEAK_PASSWORD',
          strength: passwordStrength
        }
      });
    }

    // Hash password
    const hashedPassword = await passwordManager.hashPassword(password);

    // Handle referral
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ 'referral.referralCode': referralCode });
      if (referrer) {
        referredBy = referrer._id;
        logger.info(`User ${phone} referred by ${referrer.phone}`, 'AUTH_ROUTES');
      } else {
        logger.warn(`Invalid referral code: ${referralCode}`, 'AUTH_ROUTES');
      }
    }

    // Create new user
    const userData = {
      name: `${profile.firstName} ${profile.lastName}`,
      phoneNumber: phone,
      email: email || undefined,
      password: hashedPassword,
      dateOfBirth: new Date(profile.dateOfBirth),
      gender: profile.gender,
      bloodType: profile.bloodType,
      weight: 60, // Default weight, should be collected in frontend
      address: {
        street: location.address,
        city: location.city,
        state: location.state,
        pincode: location.pincode,
        country: 'India'
      },
      location: (() => {
        // Prefer explicit array coordinates [lon, lat]
        if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
          return { type: 'Point', coordinates: location.coordinates };
        }
        // Accept latitude/longitude fields if provided
        if (typeof location?.longitude === 'number' && typeof location?.latitude === 'number') {
          return { type: 'Point', coordinates: [location.longitude, location.latitude] };
        }
        // Fallback default
        return { type: 'Point', coordinates: [77.2090, 28.6139] };
      })(),
      profile: profile,
      emergencyContact: {
        name: emergencyContact.name,
        relationship: emergencyContact.relationship,
        phoneNumber: emergencyContact.phone
      },
      preferences: value.preferences || {
        maxTravelDistance: 15,
        notificationMethods: {
          whatsapp: true,
          sms: false,
          email: false
        }
      },
      referral: {
        referredBy: referredBy || undefined,
        referralCode: undefined // Will be generated by pre-save hook
      }
    };

    const user = new User(userData);
    await user.save();

    // Update referrer's count
    if (referredBy) {
      await User.findByIdAndUpdate(referredBy, {
        $inc: { 'referral.referralCount': 1 }
      });
      logger.info(`Updated referral count for user: ${referredBy}`, 'AUTH_ROUTES');
    }

    // Generate tokens
    const tokenPayload = {
      userId: user._id,
      role: user.role,
      permissions: user.permissions
    };

    const accessToken = jwtManager.generateToken(tokenPayload);
    const refreshToken = jwtManager.generateRefreshToken(tokenPayload);

    logger.success(`User registered successfully: ${phone}`, 'AUTH_ROUTES');
    logger.auth('USER_REGISTERED', user._id, 'AUTH_ROUTES');

    // Return user data without sensitive information
    const userResponse = {
      id: user._id,
      phone: user.phoneNumber,
      email: user.email,
      profile: user.profile,
      role: user.role,
      status: user.status,
      whatsappVerified: user.whatsappVerified,
      referralCode: user.referral.referralCode
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: jwtManager.expiresIn
        }
      }
    });

  } catch (error) {
    logger.error('User registration failed', 'AUTH_ROUTES', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Registration failed',
        code: 'REGISTRATION_ERROR'
      }
    });
  }
});

// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post('/login', userRateLimit(5, 15 * 60 * 1000), async (req, res) => {
  try {
    logger.api('POST', '/api/v1/auth/login', null, null, 'AUTH_ROUTES');
    logger.debug('User login attempt', 'AUTH_ROUTES');

    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      logger.warn(`Login validation failed: ${error.details[0].message}`, 'AUTH_ROUTES');
      return res.status(400).json({
        success: false,
        error: {
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const { phone, password } = value;

    // Find user
    const user = await User.findOne({ phoneNumber: phone });
    if (!user) {
      logger.warn(`Login failed: User not found for phone ${phone}`, 'AUTH_ROUTES');
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid phone number or password',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      logger.warn(`Login failed: Account locked for phone ${phone}`, 'AUTH_ROUTES');
      return res.status(423).json({
        success: false,
        error: {
          message: 'Account temporarily locked due to too many failed login attempts',
          code: 'ACCOUNT_LOCKED',
          lockedUntil: user.loginAttempts.lockedUntil
        }
      });
    }

    // Verify password
    const isPasswordValid = await passwordManager.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Login failed: Invalid password for phone ${phone}`, 'AUTH_ROUTES');
      
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid phone number or password',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts.count > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokenPayload = {
      userId: user._id,
      role: user.role,
      permissions: user.permissions
    };

    const accessToken = jwtManager.generateToken(tokenPayload);
    const refreshToken = jwtManager.generateRefreshToken(tokenPayload);

    logger.success(`User logged in successfully: ${phone}`, 'AUTH_ROUTES');
    logger.auth('USER_LOGIN', user._id, 'AUTH_ROUTES');

    // Compute onboarding status - documents are now optional
    // const Document = require('../models/Document');
    // const docs = await Document.find({ userId: user._id }).select('type').lean();
    // const hasIdProof = docs.some(d => d.type === 'id_proof');
    // const hasAddressProof = docs.some(d => d.type === 'address_proof');
    const questionnaireDone = !!user.questionnaire?.completedAt;

    // Return user data without sensitive information
    const userResponse = {
      id: user._id,
      phone: user.phoneNumber,
      email: user.email,
      profile: user.profile,
      role: user.role,
      status: user.status,
      whatsappVerified: user.whatsappVerified,
      lastLogin: user.lastLogin,
      hasCompletedOnboarding: questionnaireDone // Only questionnaire required now
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: jwtManager.expiresIn
        }
      }
    });

  } catch (error) {
    logger.error('User login failed', 'AUTH_ROUTES', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Login failed',
        code: 'LOGIN_ERROR'
      }
    });
  }
});

// @route   POST /api/v1/auth/login-otp
// @desc    Login user with OTP
// @access  Public
router.post('/login-otp', userRateLimit(5, 15 * 60 * 1000), async (req, res) => {
  try {
    logger.api('POST', '/api/v1/auth/login-otp', null, null, 'AUTH_ROUTES');
    logger.debug('User OTP login attempt', 'AUTH_ROUTES');

    // Validate request body
    const { error, value } = otpLoginSchema.validate(req.body);
    if (error) {
      logger.warn(`OTP login validation failed: ${error.details[0].message}`, 'AUTH_ROUTES');
      return res.status(400).json({
        success: false,
        error: {
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const { phone, otp } = value;

    // Find user
    const user = await User.findOne({ phoneNumber: phone });
    if (!user) {
      logger.warn(`OTP login failed: User not found for phone ${phone}`, 'AUTH_ROUTES');
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid phone number',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      logger.warn(`OTP login failed: Account locked for phone ${phone}`, 'AUTH_ROUTES');
      return res.status(423).json({
        success: false,
        error: {
          message: 'Account temporarily locked due to too many failed login attempts',
          code: 'ACCOUNT_LOCKED',
          lockedUntil: user.loginAttempts.lockedUntil
        }
      });
    }

    // Verify OTP (assuming you have an OTP service)
    const otpService = require('../services/otpService');
    const otpVerification = otpService.verifyOTP(phone, otp);
    
    if (!otpVerification.success) {
      logger.warn(`OTP login failed: Invalid OTP for phone ${phone}`, 'AUTH_ROUTES');
      
      // Increment login attempts for failed OTP
      await user.incrementLoginAttempts();
      
      return res.status(401).json({
        success: false,
        error: {
          message: otpVerification.message || 'Invalid OTP',
          code: otpVerification.error || 'INVALID_OTP'
        }
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts.count > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokenPayload = {
      userId: user._id,
      role: user.role,
      permissions: user.permissions
    };

    const accessToken = jwtManager.generateToken(tokenPayload);
    const refreshToken = jwtManager.generateRefreshToken(tokenPayload);

    logger.success(`User logged in successfully via OTP: ${phone}`, 'AUTH_ROUTES');
    logger.auth('USER_OTP_LOGIN', user._id, 'AUTH_ROUTES');

    // Compute onboarding status - documents are now optional
    // const Document = require('../models/Document');
    // const docs = await Document.find({ userId: user._id }).select('type').lean();
    // const hasIdProof = docs.some(d => d.type === 'id_proof');
    // const hasAddressProof = docs.some(d => d.type === 'address_proof');
    const questionnaireDone = !!user.questionnaire?.completedAt;

    // Return user data without sensitive information
    const userResponse = {
      id: user._id,
      phone: user.phoneNumber,
      email: user.email,
      profile: user.profile,
      role: user.role,
      status: user.status,
      whatsappVerified: user.whatsappVerified,
      lastLogin: user.lastLogin,
      hasCompletedOnboarding: questionnaireDone // Only questionnaire required now
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: jwtManager.expiresIn
        }
      }
    });

  } catch (error) {
    logger.error('User OTP login failed', 'AUTH_ROUTES', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Login failed',
        code: 'LOGIN_ERROR'
      }
    });
  }
});

// @route   POST /api/v1/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    logger.api('POST', '/api/v1/auth/refresh', null, null, 'AUTH_ROUTES');
    
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      logger.warn('Refresh token not provided', 'AUTH_ROUTES');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Refresh token is required',
          code: 'REFRESH_TOKEN_REQUIRED'
        }
      });
    }

    // Generate new access token
    const newAccessToken = jwtManager.refreshAccessToken(refreshToken);

    logger.success('Access token refreshed successfully', 'AUTH_ROUTES');

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        expiresIn: jwtManager.expiresIn
      }
    });

  } catch (error) {
    logger.error('Token refresh failed', 'AUTH_ROUTES', error);
    
    let statusCode = 401;
    let errorCode = 'REFRESH_FAILED';
    
    if (error.message === 'Token expired') {
      errorCode = 'REFRESH_TOKEN_EXPIRED';
    } else if (error.message === 'Invalid refresh token') {
      errorCode = 'INVALID_REFRESH_TOKEN';
    }

    res.status(statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: errorCode
      }
    });
  }
});

// @route   POST /api/v1/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    logger.api('POST', '/api/v1/auth/logout', null, null, 'AUTH_ROUTES');
    logger.auth('USER_LOGOUT', req.user.id, 'AUTH_ROUTES');

    // In a production environment, you might want to:
    // 1. Add the token to a blacklist
    // 2. Store blacklisted tokens in Redis with expiration
    // 3. Check blacklist in authentication middleware

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout failed', 'AUTH_ROUTES', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Logout failed',
        code: 'LOGOUT_ERROR'
      }
    });
  }
});

// @route   GET /api/v1/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    logger.api('GET', '/api/v1/auth/me', null, null, 'AUTH_ROUTES');
    
    logger.debug('🔍 Getting current user profile', 'AUTH_ROUTES', {
      userId: req.user.id,
      userRole: req.user.role,
      userStatus: req.user.status,
      hasToken: !!req.token
    });
    
    const user = await User.findById(req.user.id).select('-password -passwordReset');
    
    if (!user) {
      logger.warn(`❌ User not found: ${req.user.id}`, 'AUTH_ROUTES', {
        requestUserId: req.user.id,
        requestUserRole: req.user.role
      });
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    logger.success(`✅ User profile retrieved: ${user.phoneNumber}`, 'AUTH_ROUTES', {
      userId: user._id,
      role: user.role,
      status: user.status,
      phone: user.phoneNumber
    });

    // Attach onboarding completion flag for convenience
    const Document = require('../models/Document');
    const docs = await Document.find({ userId: user._id }).select('type').lean();
    const hasIdProof = docs.some(d => d.type === 'id_proof');
    const hasAddressProof = docs.some(d => d.type === 'address_proof');
    const questionnaireDone = !!user.questionnaire?.completedAt;

    const responseUser = user.toObject();
    responseUser.hasCompletedOnboarding = hasIdProof && hasAddressProof && questionnaireDone;

    res.json({
      success: true,
      data: {
        user: responseUser
      }
    });

  } catch (error) {
    logger.error('Get user profile failed', 'AUTH_ROUTES', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user profile',
        code: 'PROFILE_ERROR'
      }
    });
  }
});

// @route   POST /api/v1/auth/check-email
// @desc    Check if email is available
// @access  Public
router.post('/check-email', validationLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email is required',
          code: 'EMAIL_REQUIRED'
        }
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid email format',
          code: 'INVALID_EMAIL'
        }
      });
    }
    
    // Check if email exists
    const existingUser = await User.findOne({ email });
    
    return res.status(200).json({
      success: true,
      available: !existingUser,
      message: existingUser ? 'Email is already registered' : 'Email is available'
    });
    
  } catch (error) {
    logger.error('Error checking email availability', 'AUTH_ROUTES', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Server error while checking email availability',
        code: 'SERVER_ERROR'
      }
    });
  }
});

// @route   POST /api/v1/auth/check-phone
// @desc    Check if phone number is available
// @access  Public
router.post('/check-phone', validationLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Phone number is required',
          code: 'PHONE_REQUIRED'
        }
      });
    }
    
    // Validate phone number format (Indian numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid phone number format. Please enter a 10-digit Indian mobile number.',
          code: 'INVALID_PHONE'
        }
      });
    }
    
    // Check if phone exists
    const existingUser = await User.findOne({ phoneNumber: phone });
    
    return res.status(200).json({
      success: true,
      available: !existingUser,
      message: existingUser ? 'Phone number is already registered' : 'Phone number is available'
    });
    
  } catch (error) {
    logger.error('Error checking phone availability', 'AUTH_ROUTES', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Server error while checking phone availability',
        code: 'SERVER_ERROR'
      }
    });
  }
});

// @route   POST /api/v1/auth/reset-password
// @desc    Reset user password with OTP verification
// @access  Public
router.post('/reset-password', userRateLimit(3, 15 * 60 * 1000), async (req, res) => {
  try {
    logger.api('POST', '/api/v1/auth/reset-password', null, null, 'AUTH_ROUTES');
    logger.debug('Password reset attempt', 'AUTH_ROUTES');

    const { phoneNumber, otp, newPassword } = req.body;

    // Validate input
    if (!phoneNumber || !otp || !newPassword) {
      logger.warn('Password reset validation failed: Missing required fields', 'AUTH_ROUTES');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Phone number, OTP, and new password are required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    // Validate phone number format
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      logger.warn(`Password reset failed: Invalid phone format ${phoneNumber}`, 'AUTH_ROUTES');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid phone number format',
          code: 'INVALID_PHONE'
        }
      });
    }

    // Validate password strength
    const passwordStrength = passwordManager.validatePasswordStrength(newPassword);
    if (passwordStrength.score < 3) {
      logger.warn(`Password reset failed: Weak password for ${phoneNumber}`, 'AUTH_ROUTES');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password is too weak',
          code: 'WEAK_PASSWORD',
          strength: passwordStrength
        }
      });
    }

    // Find user
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      logger.warn(`Password reset failed: User not found for phone ${phoneNumber}`, 'AUTH_ROUTES');
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Verify OTP
    const otpService = require('../services/otpService');
    const otpVerification = otpService.verifyOTP(phoneNumber, otp, 'password-reset');
    
    if (!otpVerification.success) {
      logger.warn(`Password reset failed: Invalid OTP for phone ${phoneNumber}`, 'AUTH_ROUTES');
      return res.status(401).json({
        success: false,
        error: {
          message: otpVerification.message || 'Invalid or expired OTP',
          code: otpVerification.error || 'INVALID_OTP'
        }
      });
    }

    // Hash new password
    const hashedPassword = await passwordManager.hashPassword(newPassword);

    // Update user password and clear any existing reset tokens
    user.password = hashedPassword;
    user.passwordReset = undefined; // Clear any existing reset tokens
    user.loginAttempts = undefined; // Reset login attempts
    await user.save();

    logger.success(`Password reset successful for phone: ${phoneNumber}`, 'AUTH_ROUTES');
    logger.auth('PASSWORD_RESET', user._id, 'AUTH_ROUTES');

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    logger.error('Password reset failed', 'AUTH_ROUTES', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Password reset failed',
        code: 'RESET_ERROR'
      }
    });
  }
});

module.exports = router;