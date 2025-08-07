const User = require('../models/User');
const otpService = require('../services/otpService');
const whatsappService = require('../services/whatsappService');
const encryptionService = require('../utils/encryption');
const auditLogger = require('../utils/auditLogger');
const logger = require('../utils/logger');

/**
 * Register a new user
 */
const registerUser = async (req, res) => {
  try {
    const userData = req.body;
    
    logger.info(`User registration attempt for: ${otpService.maskPhoneNumber(userData.phoneNumber)}`, 'USER_CONTROLLER');

    // Validate phone number format
    const phoneValidation = whatsappService.validatePhoneNumber(userData.phoneNumber);
    if (!phoneValidation.valid) {
      logger.warn(`Invalid phone number format in registration: ${otpService.maskPhoneNumber(userData.phoneNumber)}`, 'USER_CONTROLLER');
      return res.status(400).json({
        success: false,
        error: 'INVALID_PHONE_NUMBER',
        message: phoneValidation.message
      });
    }

    const formattedPhone = phoneValidation.formatted;

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber: formattedPhone });
    if (existingUser) {
      logger.warn(`Registration attempt with existing phone number: ${otpService.maskPhoneNumber(formattedPhone)}`, 'USER_CONTROLLER');
      return res.status(409).json({
        success: false,
        error: 'USER_ALREADY_EXISTS',
        message: 'A user with this phone number already exists'
      });
    }

    // Check if email is provided and already exists
    if (userData.email) {
      const existingEmailUser = await User.findOne({ email: userData.email.toLowerCase() });
      if (existingEmailUser) {
        logger.warn(`Registration attempt with existing email: ${userData.email}`, 'USER_CONTROLLER');
        return res.status(409).json({
          success: false,
          error: 'EMAIL_ALREADY_EXISTS',
          message: 'A user with this email already exists'
        });
      }
    }

    // Encrypt sensitive data
    const encryptedUserData = encryptionService.encryptPII({
      name: userData.name,
      email: userData.email,
      address: userData.address,
      emergencyContact: userData.emergencyContact
    });

    // Create user object
    const newUser = new User({
      ...userData,
      phoneNumber: formattedPhone,
      name: encryptedUserData.name,
      email: encryptedUserData.email,
      address: {
        ...userData.address,
        street: encryptedUserData.address?.street || userData.address?.street
      },
      emergencyContact: encryptedUserData.emergencyContact,
      status: 'pending',
      verification: {
        phoneVerified: false,
        emailVerified: false,
        documentsVerified: false,
        medicallyCleared: false
      }
    });

    // Save user
    const savedUser = await newUser.save();

    // Log user registration
    auditLogger.logUserAction({
      userId: savedUser._id.toString(),
      userRole: 'donor',
      action: 'user_registration',
      resource: 'user_profile',
      resourceId: savedUser._id.toString(),
      details: 'New user registered successfully',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: {
        phoneNumber: otpService.maskPhoneNumber(formattedPhone),
        bloodType: userData.bloodType,
        registrationMethod: 'web'
      }
    });

    logger.success(`User registered successfully: ${otpService.maskPhoneNumber(formattedPhone)}`, 'USER_CONTROLLER');

    // Return user data (sensitive fields will be filtered by toJSON transform)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: savedUser,
        nextStep: 'phone_verification'
      }
    });

  } catch (error) {
    logger.error('Error in user registration', 'USER_CONTROLLER', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'User data validation failed',
        details: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_FIELD',
        message: `${field} already exists`,
        field
      });
    }

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal error occurred during registration'
    });
  }
};

/**
 * Get user profile
 */
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    logger.info(`Profile request for user: ${userId}`, 'USER_CONTROLLER');

    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`Profile request for non-existent user: ${userId}`, 'USER_CONTROLLER');
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Decrypt sensitive data for display
    const decryptedUser = {
      ...user.toObject(),
      name: encryptionService.decryptPII({ name: user.name }).name,
      email: user.email ? encryptionService.decryptPII({ email: user.email }).email : null,
      address: user.address ? {
        ...user.address,
        street: encryptionService.decryptPII({ address: { street: user.address.street } }).address?.street
      } : null,
      emergencyContact: user.emergencyContact ? 
        encryptionService.decryptPII({ emergencyContact: user.emergencyContact }).emergencyContact : null
    };

    // Log profile access
    auditLogger.logDataAccess({
      userId: req.user?.id || userId,
      userRole: req.user?.role || 'user',
      action: 'read',
      resource: 'user_profile',
      resourceId: userId,
      sensitiveFields: ['name', 'email', 'address', 'phoneNumber'],
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.status(200).json({
      success: true,
      data: {
        user: decryptedUser
      }
    });

  } catch (error) {
    logger.error('Error fetching user profile', 'USER_CONTROLLER', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal error occurred while fetching profile'
    });
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    logger.info(`Profile update request for user: ${userId}`, 'USER_CONTROLLER');

    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`Profile update for non-existent user: ${userId}`, 'USER_CONTROLLER');
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Track which fields are being updated
    const updatedFields = Object.keys(updateData);
    const sensitiveFields = ['name', 'email', 'address', 'emergencyContact'];
    const updatedSensitiveFields = updatedFields.filter(field => sensitiveFields.includes(field));

    // Encrypt sensitive data if being updated
    if (updatedSensitiveFields.length > 0) {
      const fieldsToEncrypt = {};
      updatedSensitiveFields.forEach(field => {
        if (updateData[field]) {
          fieldsToEncrypt[field] = updateData[field];
        }
      });
      
      const encryptedData = encryptionService.encryptPII(fieldsToEncrypt);
      
      // Replace with encrypted versions
      Object.keys(encryptedData).forEach(field => {
        updateData[field] = encryptedData[field];
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        ...updateData,
        updatedBy: req.user?.id
      },
      { 
        new: true, 
        runValidators: true 
      }
    );

    // Log profile update
    auditLogger.logDataAccess({
      userId: req.user?.id || userId,
      userRole: req.user?.role || 'user',
      action: 'update',
      resource: 'user_profile',
      resourceId: userId,
      sensitiveFields: updatedSensitiveFields,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: {
        updatedFields,
        updateCount: updatedFields.length
      }
    });

    logger.success(`Profile updated successfully for user: ${userId}`, 'USER_CONTROLLER');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    logger.error('Error updating user profile', 'USER_CONTROLLER', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Profile update validation failed',
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal error occurred while updating profile'
    });
  }
};

/**
 * Verify user phone number
 */
const verifyPhoneNumber = async (req, res) => {
  try {
    const { userId } = req.params;
    const { otp } = req.body;
    
    logger.info(`Phone verification request for user: ${userId}`, 'USER_CONTROLLER');

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Verify OTP
    const verificationResult = otpService.verifyOTP(user.phoneNumber, otp);
    
    if (verificationResult.success) {
      // Update user verification status
      user.verification.phoneVerified = true;
      user.verification.verifiedAt = new Date();
      
      // Keep status as pending until admin approval
      // Status will only change to 'active' after admin verification
      
      await user.save();

      // Log phone verification
      auditLogger.logUserAction({
        userId: userId,
        userRole: 'donor',
        action: 'phone_verification',
        resource: 'user_verification',
        resourceId: userId,
        details: 'Phone number verified successfully',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true
      });

      logger.success(`Phone verified successfully for user: ${userId}`, 'USER_CONTROLLER');

      res.status(200).json({
        success: true,
        message: 'Phone number verified successfully',
        data: {
          user: user,
          nextStep: user.status === 'active' ? 'complete' : 'document_upload'
        }
      });
    } else {
      logger.warn(`Phone verification failed for user: ${userId}`, 'USER_CONTROLLER');
      
      res.status(400).json({
        success: false,
        error: verificationResult.error,
        message: verificationResult.message,
        data: {
          remainingAttempts: verificationResult.remainingAttempts || 0
        }
      });
    }

  } catch (error) {
    logger.error('Error in phone verification', 'USER_CONTROLLER', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal error occurred during phone verification'
    });
  }
};

/**
 * Get user statistics
 */
const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    logger.info(`Stats request for user: ${userId}`, 'USER_CONTROLLER');

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    const stats = {
      profile: {
        completionPercentage: calculateProfileCompletion(user),
        verificationStatus: user.verification,
        accountStatus: user.status
      },
      donations: user.donationStats,
      eligibility: {
        canDonate: user.isEligibleForDonation,
        lastDonationDate: user.medicalInfo.lastDonationDate,
        nextEligibleDate: user.medicalInfo.lastDonationDate ? 
          new Date(user.medicalInfo.lastDonationDate.getTime() + (90 * 24 * 60 * 60 * 1000)) : null
      },
      activity: {
        lastActiveAt: user.stats.lastActiveAt,
        responseRate: user.stats.responseRate,
        averageResponseTime: user.stats.averageResponseTime
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error fetching user stats', 'USER_CONTROLLER', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal error occurred while fetching stats'
    });
  }
};

/**
 * Search users (admin only)
 */
const searchUsers = async (req, res) => {
  try {
    const {
      query,
      bloodType,
      status,
      location,
      radius = 15,
      page = 1,
      limit = 20
    } = req.query;

    logger.info(`User search request by admin: ${req.user?.id}`, 'USER_CONTROLLER');

    const searchCriteria = {};

    // Text search
    if (query) {
      searchCriteria.$or = [
        { name: { $regex: query, $options: 'i' } },
        { phoneNumber: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ];
    }

    // Blood type filter
    if (bloodType) {
      searchCriteria.bloodType = bloodType;
    }

    // Status filter
    if (status) {
      searchCriteria.status = status;
    }

    // Location-based search
    if (location) {
      const [longitude, latitude] = location.split(',').map(Number);
      searchCriteria.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    const skip = (page - 1) * limit;
    
    const [users, totalCount] = await Promise.all([
      User.find(searchCriteria)
        .select('-documents -medicalInfo.medications -medicalInfo.conditions')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(searchCriteria)
    ]);

    // Log admin search
    auditLogger.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'admin_user_search',
      resource: 'user_directory',
      details: `Searched users with criteria: ${JSON.stringify(searchCriteria)}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: {
        resultCount: users.length,
        totalCount,
        searchCriteria
      }
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / limit),
          totalCount
        }
      }
    });

  } catch (error) {
    logger.error('Error in user search', 'USER_CONTROLLER', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal error occurred during search'
    });
  }
};

/**
 * Helper function to calculate profile completion percentage
 */
function calculateProfileCompletion(user) {
  const requiredFields = [
    'name', 'phoneNumber', 'email', 'dateOfBirth', 'gender', 
    'bloodType', 'weight', 'address', 'location'
  ];
  
  const optionalFields = [
    'height', 'emergencyContact', 'medicalInfo.conditions', 
    'medicalInfo.medications', 'preferences'
  ];
  
  let completedRequired = 0;
  let completedOptional = 0;
  
  // Check required fields
  requiredFields.forEach(field => {
    if (getNestedValue(user, field)) {
      completedRequired++;
    }
  });
  
  // Check optional fields
  optionalFields.forEach(field => {
    if (getNestedValue(user, field)) {
      completedOptional++;
    }
  });
  
  // Required fields are worth 80%, optional fields 20%
  const requiredPercentage = (completedRequired / requiredFields.length) * 80;
  const optionalPercentage = (completedOptional / optionalFields.length) * 20;
  
  return Math.round(requiredPercentage + optionalPercentage);
}

/**
 * Helper function to get nested object values
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined && current[key] !== null ? current[key] : null;
  }, obj);
}

module.exports = {
  registerUser,
  getUserProfile,
  updateUserProfile,
  verifyPhoneNumber,
  getUserStats,
  searchUsers
};