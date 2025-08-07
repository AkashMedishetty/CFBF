const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  // Request identification
  requestId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'BR' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
    }
  },

  // Requester information
  requester: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null for guest requests
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    phoneNumber: {
      type: String,
      required: true,
      match: /^[6-9]\d{9}$/
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    relationship: {
      type: String,
      required: true,
      enum: ['self', 'parent', 'spouse', 'child', 'sibling', 'relative', 'friend', 'other']
    },
    isGuest: {
      type: Boolean,
      default: false
    }
  },

  // Patient information
  patient: {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 120
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female', 'other']
    },
    bloodType: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    weight: {
      type: Number,
      min: 1,
      max: 300
    },
    medicalCondition: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    additionalNotes: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },

  // Request details
  request: {
    urgency: {
      type: String,
      required: true,
      enum: ['critical', 'urgent', 'scheduled'],
      default: 'urgent'
    },
    unitsNeeded: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 1
    },
    requiredBy: {
      type: Date,
      required: true,
      validate: {
        validator: function(date) {
          return date > new Date();
        },
        message: 'Required date must be in the future'
      }
    },
    bloodComponent: {
      type: String,
      enum: ['whole_blood', 'red_cells', 'platelets', 'plasma', 'cryoprecipitate'],
      default: 'whole_blood'
    },
    specialRequirements: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },

  // Location information
  location: {
    hospital: {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
      },
      address: {
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        pincode: { 
          type: String, 
          required: true, 
          match: /^\d{6}$/
        },
        country: { type: String, default: 'India' }
      },
      contactNumber: {
        type: String,
        required: true,
        match: /^[6-9]\d{9}$/
      },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
          validate: {
            validator: function(coords) {
              return coords.length === 2 && 
                     coords[0] >= -180 && coords[0] <= 180 && // longitude
                     coords[1] >= -90 && coords[1] <= 90;     // latitude
            },
            message: 'Invalid coordinates format'
          }
        }
      }
    },
    searchRadius: {
      type: Number,
      default: 15, // km
      min: 1,
      max: 100
    }
  },

  // Request status and lifecycle
  status: {
    type: String,
    enum: ['pending', 'active', 'matched', 'fulfilled', 'expired', 'cancelled'],
    default: 'pending'
  },

  // Matching and response tracking
  matching: {
    totalNotified: { type: Number, default: 0 },
    totalResponded: { type: Number, default: 0 },
    positiveResponses: { type: Number, default: 0 },
    matchedDonors: [{
      donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      respondedAt: { type: Date, default: Date.now },
      response: { type: String, enum: ['yes', 'no', 'maybe'] },
      distance: { type: Number }, // km
      status: { 
        type: String, 
        enum: ['responded', 'confirmed', 'donated', 'cancelled'],
        default: 'responded'
      },
      notes: { type: String, trim: true }
    }],
    lastNotificationSent: { type: Date },
    notificationRounds: { type: Number, default: 0 },
    currentRadius: { type: Number, default: 15 }
  },

  // Fulfillment tracking
  fulfillment: {
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    unitsCollected: { type: Number, default: 0 },
    donorDetails: [{
      donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      donatedAt: { type: Date },
      unitsContributed: { type: Number, default: 1 },
      donationCenter: { type: String },
      verificationStatus: { 
        type: String, 
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
      },
      certificateId: { type: String }
    }],
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true, maxlength: 500 },
      submittedAt: { type: Date }
    }
  },

  // Administrative fields
  verification: {
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    verificationNotes: { type: String, trim: true }
  },

  // Audit trail
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Auto-expiry
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // Auto-expire based on urgency
      const now = new Date();
      switch(this.request?.urgency) {
        case 'critical': return new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours
        case 'urgent': return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        case 'scheduled': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        default: return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
bloodRequestSchema.index({ 'location.hospital.coordinates': '2dsphere' });
bloodRequestSchema.index({ status: 1, createdAt: -1 });
bloodRequestSchema.index({ 'patient.bloodType': 1, status: 1 });
bloodRequestSchema.index({ requestId: 1 });
bloodRequestSchema.index({ 'requester.phoneNumber': 1 });
bloodRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for request age
bloodRequestSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60));
});

// Virtual for time remaining
bloodRequestSchema.virtual('timeRemaining').get(function() {
  const remaining = this.expiresAt.getTime() - Date.now();
  return Math.max(0, remaining);
});

// Virtual for urgency priority score
bloodRequestSchema.virtual('priorityScore').get(function() {
  const urgencyScores = { critical: 100, urgent: 50, scheduled: 10 };
  const ageBonus = Math.min(this.ageInHours * 2, 50); // Up to 50 bonus points for age
  const responseRatio = this.matching.totalNotified > 0 ? 
    (this.matching.positiveResponses / this.matching.totalNotified) * 20 : 0;
  
  return urgencyScores[this.request.urgency] + ageBonus - responseRatio;
});

// Pre-save middleware
bloodRequestSchema.pre('save', function(next) {
  // Set expiry based on urgency if not already set
  if (this.isNew && !this.expiresAt) {
    const now = new Date();
    switch(this.request.urgency) {
      case 'critical':
        this.expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);
        break;
      case 'urgent':
        this.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'scheduled':
        this.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
    }
  }

  // Update search radius based on notification rounds
  if (this.matching.notificationRounds > 0) {
    this.location.searchRadius = Math.min(
      this.location.searchRadius + (this.matching.notificationRounds * 10),
      100 // Max 100km radius
    );
  }

  next();
});

// Static methods
bloodRequestSchema.statics.findActiveRequests = function() {
  return this.find({
    status: { $in: ['pending', 'active', 'matched'] },
    expiresAt: { $gt: new Date() }
  }).sort({ 'request.urgency': -1, createdAt: 1 });
};

bloodRequestSchema.statics.findByBloodType = function(bloodType, radius = 25) {
  return this.find({
    'patient.bloodType': bloodType,
    status: { $in: ['pending', 'active'] },
    expiresAt: { $gt: new Date() }
  }).sort({ priorityScore: -1 });
};

bloodRequestSchema.statics.findNearLocation = function(coordinates, maxDistance = 25000) {
  return this.find({
    'location.hospital.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance // meters
      }
    },
    status: { $in: ['pending', 'active'] },
    expiresAt: { $gt: new Date() }
  });
};

// Instance methods
bloodRequestSchema.methods.addDonorResponse = function(donorId, response, distance) {
  const existingResponse = this.matching.matchedDonors.find(
    donor => donor.donorId.toString() === donorId.toString()
  );

  if (existingResponse) {
    existingResponse.response = response;
    existingResponse.respondedAt = new Date();
  } else {
    this.matching.matchedDonors.push({
      donorId,
      response,
      distance,
      respondedAt: new Date()
    });
  }

  this.matching.totalResponded += 1;
  if (response === 'yes') {
    this.matching.positiveResponses += 1;
  }

  return this.save();
};

bloodRequestSchema.methods.markAsFulfilled = function(donorDetails) {
  this.status = 'fulfilled';
  this.fulfillment.isCompleted = true;
  this.fulfillment.completedAt = new Date();
  this.fulfillment.unitsCollected = donorDetails.reduce((sum, donor) => sum + donor.unitsContributed, 0);
  this.fulfillment.donorDetails = donorDetails;

  return this.save();
};

bloodRequestSchema.methods.canReceiveNotifications = function() {
  return this.status === 'pending' || this.status === 'active';
};

bloodRequestSchema.methods.getCompatibleBloodTypes = function() {
  const compatibility = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal recipient
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-']
  };

  return compatibility[this.patient.bloodType] || [];
};

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);

module.exports = BloodRequest;