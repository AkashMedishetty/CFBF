const mongoose = require('mongoose');
const crypto = require('crypto');

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  hashedOtp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true,
    enum: [
      'registration',
      'login',
      'password_reset',
      'phone_verification',
      'account_recovery',
      'two_factor_auth',
      'emergency_access',
      'profile_update',
      'donation_confirmation'
    ]
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  metadata: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    requestId: String,
    sessionId: String,
    deviceFingerprint: String
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    index: { expireAfterSeconds: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: false // Using custom timestamp fields
});

// Indexes for performance and cleanup
otpSchema.index({ phoneNumber: 1, purpose: 1, createdAt: -1 });
otpSchema.index({ hashedOtp: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ isUsed: 1, isBlocked: 1 });

// Pre-save middleware to hash OTP
otpSchema.pre('save', function(next) {
  if (this.isModified('otp')) {
    this.hashedOtp = crypto
      .createHash('sha256')
      .update(this.otp + process.env.OTP_SALT || 'default_salt')
      .digest('hex');
  }
  next();
});

// Instance method to verify OTP
otpSchema.methods.verifyOTP = function(inputOtp) {
  if (this.isUsed) {
    throw new Error('OTP has already been used');
  }
  
  if (this.isBlocked) {
    throw new Error('OTP is blocked due to too many failed attempts');
  }
  
  if (this.expiresAt < new Date()) {
    throw new Error('OTP has expired');
  }
  
  const hashedInput = crypto
    .createHash('sha256')
    .update(inputOtp + process.env.OTP_SALT || 'default_salt')
    .digest('hex');
  
  if (hashedInput !== this.hashedOtp) {
    this.attempts += 1;
    
    if (this.attempts >= 3) {
      this.isBlocked = true;
    }
    
    this.save();
    throw new Error('Invalid OTP');
  }
  
  // Mark as used and verified
  this.isUsed = true;
  this.verifiedAt = new Date();
  this.save();
  
  return true;
};

// Static method to generate OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to create new OTP
otpSchema.statics.createOTP = async function(phoneNumber, purpose, metadata = {}) {
  // Invalidate any existing OTPs for this phone/purpose combination
  await this.updateMany(
    { 
      phoneNumber, 
      purpose, 
      isUsed: false,
      isBlocked: false,
      expiresAt: { $gt: new Date() }
    },
    { 
      isUsed: true,
      verifiedAt: new Date()
    }
  );
  
  const otp = this.generateOTP();
  
  const otpDoc = new this({
    phoneNumber,
    otp,
    purpose,
    metadata,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  });
  
  await otpDoc.save();
  
  return {
    otp,
    expiresAt: otpDoc.expiresAt,
    id: otpDoc._id
  };
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(phoneNumber, inputOtp, purpose) {
  const otpDoc = await this.findOne({
    phoneNumber,
    purpose,
    isUsed: false,
    isBlocked: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
  
  if (!otpDoc) {
    throw new Error('No valid OTP found');
  }
  
  return otpDoc.verifyOTP(inputOtp);
};

// Static method to check rate limiting
otpSchema.statics.checkRateLimit = async function(phoneNumber, purpose, timeWindow = 60, maxAttempts = 5) {
  const since = new Date(Date.now() - timeWindow * 60 * 1000);
  
  const recentAttempts = await this.countDocuments({
    phoneNumber,
    purpose,
    createdAt: { $gte: since }
  });
  
  if (recentAttempts >= maxAttempts) {
    throw new Error(`Too many OTP requests. Please wait ${timeWindow} minutes before trying again.`);
  }
  
  return true;
};

// Static method to cleanup expired OTPs
otpSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  
  return result.deletedCount;
};

// Virtual for time remaining
otpSchema.virtual('timeRemaining').get(function() {
  if (this.expiresAt < new Date()) {
    return 0;
  }
  
  return Math.max(0, Math.floor((this.expiresAt - new Date()) / 1000));
});

// Virtual for formatted expiry
otpSchema.virtual('formattedExpiry').get(function() {
  return this.expiresAt.toLocaleString();
});

module.exports = mongoose.model('OTP', otpSchema);