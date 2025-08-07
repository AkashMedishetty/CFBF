const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
    match: [/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters']
  },
  
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^[+]?[\d\s\-\(\)]+$/, 'Invalid phone number format']
  },
  
  email: {
    type: String,
    unique: true,
    sparse: true, // Allow null but enforce uniqueness when present
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(date) {
        const age = Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        return age >= 18 && age <= 65;
      },
      message: 'Age must be between 18 and 65 years'
    }
  },
  
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: {
      values: ['male', 'female', 'other'],
      message: 'Gender must be male, female, or other'
    }
  },
  
  bloodType: {
    type: String,
    required: [true, 'Blood type is required'],
    enum: {
      values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      message: 'Invalid blood type'
    }
  },
  
  // Physical Information
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [45, 'Weight must be at least 45 kg'],
    max: [200, 'Weight cannot exceed 200 kg']
  },
  
  height: {
    type: Number,
    min: [120, 'Height must be at least 120 cm'],
    max: [250, 'Height cannot exceed 250 cm']
  },
  
  // Location Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [200, 'Street address too long']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City name too long']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [100, 'State name too long']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^\d{6}$/, 'Invalid pincode format']
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    }
  },
  
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates format'
      }
    }
  },
  
  // Medical Information
  medicalInfo: {
    conditions: [{
      type: String,
      trim: true,
      maxlength: [100, 'Medical condition description too long']
    }],
    
    medications: [{
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Medication name too long']
      },
      dosage: {
        type: String,
        trim: true,
        maxlength: [50, 'Dosage description too long']
      },
      frequency: {
        type: String,
        trim: true,
        maxlength: [50, 'Frequency description too long']
      }
    }],
    
    allergies: [{
      type: String,
      trim: true,
      maxlength: [100, 'Allergy description too long']
    }],
    
    lastDonationDate: {
      type: Date,
      validate: {
        validator: function(date) {
          return !date || date <= new Date();
        },
        message: 'Last donation date cannot be in the future'
      }
    },
    
    eligibleForDonation: {
      type: Boolean,
      default: true
    },
    
    eligibilityNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Eligibility notes too long']
    }
  },
  
  // Contact Information
  emergencyContact: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Emergency contact name too long']
    },
    relationship: {
      type: String,
      trim: true,
      maxlength: [50, 'Relationship description too long']
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^[+]?[\d\s\-\(\)]+$/, 'Invalid emergency contact phone number']
    }
  },
  
  // Donor Preferences
  preferences: {
    availableHours: {
      start: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
      },
      end: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
      }
    },
    
    maxTravelDistance: {
      type: Number,
      default: 15,
      min: [1, 'Travel distance must be at least 1 km'],
      max: [100, 'Travel distance cannot exceed 100 km']
    },
    
    notificationMethods: {
      whatsapp: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      email: {
        type: Boolean,
        default: false
      }
    },
    
    donationFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'biannually', 'annually', 'as_needed'],
      default: 'as_needed'
    }
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended', 'banned'],
    default: 'pending'
  },
  
  role: {
    type: String,
    enum: ['donor', 'admin', 'hospital'],
    default: 'donor'
  },
  
  permissions: [{
    type: String,
    enum: ['read:donors', 'write:donors', 'read:requests', 'write:requests', 'admin:all']
  }],
  
  whatsappVerified: {
    type: Boolean,
    default: false
  },
  
  lastLogin: {
    type: Date
  },
  
  verification: {
    phoneVerified: {
      type: Boolean,
      default: false
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    documentsVerified: {
      type: Boolean,
      default: false
    },
    medicallyCleared: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Verification notes too long']
    }
  },
  
  // Login Security
  loginAttempts: {
    count: {
      type: Number,
      default: 0
    },
    lockedUntil: Date
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['id_proof', 'address_proof', 'medical_certificate', 'photo'],
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  
  // Statistics
  stats: {
    totalDonations: {
      type: Number,
      default: 0,
      min: 0
    },
    totalUnitsContributed: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    responseRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageResponseTime: {
      type: Number, // in minutes
      default: 0,
      min: 0
    }
  },
  
  // System Fields
  role: {
    type: String,
    enum: ['donor', 'admin', 'hospital', 'moderator'],
    default: 'donor'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLoginAt: Date,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Profile Information (for compatibility with auth routes)
  profile: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: String,
    bloodType: String
  },
  
  // Referral System
  referral: {
    referralCode: {
      type: String,
      unique: true,
      sparse: true
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    referralCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive fields from JSON output
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ location: '2dsphere' }); // Geospatial index
userSchema.index({ bloodType: 1, status: 1, isActive: 1 }); // Compound index for donor matching
userSchema.index({ 'stats.lastActiveAt': -1 }); // For active donor queries
userSchema.index({ createdAt: -1 }); // For recent registrations
// phoneNumber and email uniqueness is already defined in schema, no need for separate indexes

// Virtual fields
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  return Math.floor((Date.now() - this.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
});

userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street, city, state, pincode, country } = this.address;
  return `${street}, ${city}, ${state} ${pincode}, ${country}`;
});

userSchema.virtual('isEligibleForDonation').get(function() {
  if (!this.medicalInfo.eligibleForDonation) return false;
  if (this.status !== 'active') return false;
  if (!this.verification.phoneVerified || !this.verification.documentsVerified) return false;
  
  // Check last donation date (minimum 3 months gap)
  if (this.medicalInfo.lastDonationDate) {
    const daysSinceLastDonation = (Date.now() - this.medicalInfo.lastDonationDate.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceLastDonation < 90) return false; // 3 months = 90 days
  }
  
  return true;
});

userSchema.virtual('donationStats').get(function() {
  return {
    totalDonations: this.stats.totalDonations,
    totalUnitsContributed: this.stats.totalUnitsContributed,
    averageUnitsPerDonation: this.stats.totalDonations > 0 ? 
      (this.stats.totalUnitsContributed / this.stats.totalDonations).toFixed(1) : 0,
    responseRate: this.stats.responseRate,
    averageResponseTime: this.stats.averageResponseTime
  };
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  try {
    // Update lastActiveAt when user data is modified
    if (this.isModified() && !this.isModified('stats.lastActiveAt')) {
      this.stats.lastActiveAt = new Date();
    }
    
    // Log user updates
    if (this.isModified() && !this.isNew) {
      logger.info(`User profile updated: ${this.phoneNumber}`, 'USER_MODEL');
    }
    
    next();
  } catch (error) {
    logger.error('Error in user pre-save middleware', 'USER_MODEL', error);
    next(error);
  }
});

// Post-save middleware
userSchema.post('save', function(doc) {
  logger.info(`User saved: ${doc.phoneNumber} (${doc.status})`, 'USER_MODEL');
});

// Instance methods
userSchema.methods.isAccountLocked = function() {
  return this.loginAttempts && this.loginAttempts.lockedUntil && this.loginAttempts.lockedUntil > Date.now();
};

userSchema.methods.incrementLoginAttempts = function() {
  // Initialize loginAttempts if it doesn't exist
  if (!this.loginAttempts) {
    this.loginAttempts = { count: 0, lockedUntil: null };
  }
  
  this.loginAttempts.count += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.loginAttempts.count >= 5) {
    this.loginAttempts.lockedUntil = Date.now() + (30 * 60 * 1000); // 30 minutes
  }
  
  return this.save();
};

userSchema.methods.resetLoginAttempts = function() {
  if (this.loginAttempts) {
    this.loginAttempts.count = 0;
    this.loginAttempts.lockedUntil = null;
  }
  return this.save();
};

userSchema.methods.updateLastActive = function() {
  this.stats.lastActiveAt = new Date();
  return this.save();
};

userSchema.methods.incrementDonationCount = function(units = 1) {
  this.stats.totalDonations += 1;
  this.stats.totalUnitsContributed += units;
  this.medicalInfo.lastDonationDate = new Date();
  return this.save();
};

userSchema.methods.updateResponseStats = function(responseTimeMinutes) {
  // Update average response time using exponential moving average
  const alpha = 0.3; // Smoothing factor
  if (this.stats.averageResponseTime === 0) {
    this.stats.averageResponseTime = responseTimeMinutes;
  } else {
    this.stats.averageResponseTime = 
      (alpha * responseTimeMinutes) + ((1 - alpha) * this.stats.averageResponseTime);
  }
  
  return this.save();
};

userSchema.methods.canDonateBloodType = function(requestedBloodType) {
  const compatibilityMatrix = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal donor
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+'] // Universal recipient (can only donate to AB+)
  };
  
  return compatibilityMatrix[this.bloodType]?.includes(requestedBloodType) || false;
};

userSchema.methods.getDistanceFrom = function(coordinates) {
  if (!this.location || !this.location.coordinates || !coordinates) return null;
  
  const [lon1, lat1] = this.location.coordinates;
  const [lon2, lat2] = coordinates;
  
  // Haversine formula
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Generate referral code if not exists
  if (!this.referral || !this.referral.referralCode) {
    if (!this.referral) this.referral = {};
    this.referral.referralCode = Math.random().toString(36).substr(2, 8).toUpperCase();
  }
  
  // Populate profile fields from main fields for compatibility
  if (!this.profile) this.profile = {};
  if (!this.profile.firstName && this.name) {
    const nameParts = this.name.split(' ');
    this.profile.firstName = nameParts[0];
    this.profile.lastName = nameParts.slice(1).join(' ') || '';
  }
  if (this.dateOfBirth) this.profile.dateOfBirth = this.dateOfBirth;
  if (this.gender) this.profile.gender = this.gender;
  if (this.bloodType) this.profile.bloodType = this.bloodType;
  
  next();
});

// Static methods
userSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phoneNumber: phone });
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email });
};

userSchema.statics.findEligibleDonors = function(bloodType, coordinates, maxDistance = 15) {
  return this.find({
    status: 'active',
    isActive: true,
    'verification.phoneVerified': true,
    'verification.documentsVerified': true,
    'medicalInfo.eligibleForDonation': true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    }
  }).where('bloodType').in(this.getCompatibleDonorTypes(bloodType));
};

userSchema.statics.getCompatibleDonorTypes = function(requestedBloodType) {
  const donorCompatibility = {
    'O-': ['O-'], // Can only receive from O-
    'O+': ['O-', 'O+'],
    'A-': ['O-', 'A-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'B-': ['O-', 'B-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] // Universal recipient
  };
  
  return donorCompatibility[requestedBloodType] || [];
};

userSchema.statics.getActiveStats = function() {
  return this.aggregate([
    {
      $match: {
        isActive: true,
        status: 'active'
      }
    },
    {
      $group: {
        _id: null,
        totalDonors: { $sum: 1 },
        totalDonations: { $sum: '$stats.totalDonations' },
        totalUnitsContributed: { $sum: '$stats.totalUnitsContributed' },
        averageResponseTime: { $avg: '$stats.averageResponseTime' },
        bloodTypeDistribution: {
          $push: '$bloodType'
        }
      }
    }
  ]);
};

const User = mongoose.model('User', userSchema);

module.exports = User;