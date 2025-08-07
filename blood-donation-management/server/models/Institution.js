const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Institution name is required'],
    trim: true,
    maxlength: [200, 'Institution name cannot exceed 200 characters']
  },
  type: {
    type: String,
    required: [true, 'Institution type is required'],
    enum: ['hospital', 'blood_bank', 'clinic', 'medical_center', 'ngo'],
    index: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    trim: true
  },
  
  // Contact Information
  contactInfo: {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[+]?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid phone number']
    },
    alternatePhone: {
      type: String,
      trim: true,
      match: [/^[+]?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid alternate phone number']
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
    }
  },

  // Address Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      index: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      default: 'India',
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },

  // Administrative Information
  adminContact: {
    name: {
      type: String,
      required: [true, 'Admin contact name is required'],
      trim: true
    },
    designation: {
      type: String,
      required: [true, 'Admin designation is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid admin email']
    },
    phone: {
      type: String,
      required: [true, 'Admin phone is required'],
      trim: true,
      match: [/^[+]?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid admin phone number']
    }
  },

  // Operational Information
  operatingHours: {
    monday: { start: String, end: String, closed: { type: Boolean, default: false } },
    tuesday: { start: String, end: String, closed: { type: Boolean, default: false } },
    wednesday: { start: String, end: String, closed: { type: Boolean, default: false } },
    thursday: { start: String, end: String, closed: { type: Boolean, default: false } },
    friday: { start: String, end: String, closed: { type: Boolean, default: false } },
    saturday: { start: String, end: String, closed: { type: Boolean, default: false } },
    sunday: { start: String, end: String, closed: { type: Boolean, default: true } }
  },

  services: [{
    type: String,
    enum: [
      'blood_collection',
      'blood_testing',
      'blood_storage',
      'blood_distribution',
      'platelet_donation',
      'plasma_donation',
      'emergency_services',
      'mobile_collection',
      'donor_counseling',
      'health_checkup'
    ]
  }],

  // Capacity and Infrastructure
  capacity: {
    dailyCollectionCapacity: {
      type: Number,
      min: [1, 'Daily collection capacity must be at least 1'],
      default: 50
    },
    storageCapacity: {
      type: Number,
      min: [1, 'Storage capacity must be at least 1'],
      default: 100
    },
    staffCount: {
      type: Number,
      min: [1, 'Staff count must be at least 1'],
      default: 5
    },
    bedsCount: {
      type: Number,
      min: [1, 'Beds count must be at least 1'],
      default: 10
    }
  },

  // Verification and Status
  verificationStatus: {
    type: String,
    enum: ['pending', 'under_review', 'verified', 'rejected', 'suspended'],
    default: 'pending',
    index: true
  },
  verificationDate: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationNotes: String,

  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['license', 'registration', 'accreditation', 'insurance', 'other'],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
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

  // Rating and Reviews
  rating: {
    average: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0
    },
    count: {
      type: Number,
      min: [0, 'Rating count cannot be negative'],
      default: 0
    }
  },

  // Partnership Information
  partnershipStatus: {
    type: String,
    enum: ['inquiry', 'under_review', 'active', 'inactive', 'terminated'],
    default: 'inquiry',
    index: true
  },
  partnershipDate: Date,
  partnershipNotes: String,

  // Inventory Management (for blood banks)
  inventoryEnabled: {
    type: Boolean,
    default: false
  },
  inventorySettings: {
    autoAlerts: {
      type: Boolean,
      default: true
    },
    lowStockThreshold: {
      type: Number,
      min: [1, 'Low stock threshold must be at least 1'],
      default: 10
    },
    expiryAlertDays: {
      type: Number,
      min: [1, 'Expiry alert days must be at least 1'],
      default: 7
    }
  },

  // Activity Tracking
  stats: {
    totalDonationsReceived: {
      type: Number,
      default: 0,
      min: [0, 'Total donations cannot be negative']
    },
    totalRequestsFulfilled: {
      type: Number,
      default: 0,
      min: [0, 'Total requests fulfilled cannot be negative']
    },
    averageResponseTime: {
      type: Number,
      default: 0,
      min: [0, 'Average response time cannot be negative']
    },
    lastActivityDate: Date
  },

  // System Fields
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active',
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
institutionSchema.index({ 'address.city': 1, 'address.state': 1 });
institutionSchema.index({ 'address.coordinates': '2dsphere' });
institutionSchema.index({ type: 1, verificationStatus: 1 });
institutionSchema.index({ partnershipStatus: 1, status: 1 });
institutionSchema.index({ 'contactInfo.email': 1 });
institutionSchema.index({ registrationNumber: 1 });

// Virtual for full address
institutionSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} - ${this.address.pincode}`;
});

// Virtual for contact display
institutionSchema.virtual('primaryContact').get(function() {
  return {
    email: this.contactInfo.email,
    phone: this.contactInfo.phone,
    website: this.contactInfo.website
  };
});

// Virtual for operational status
institutionSchema.virtual('isOperational').get(function() {
  return this.status === 'active' && this.verificationStatus === 'verified';
});

// Pre-save middleware
institutionSchema.pre('save', function(next) {
  // Update lastActivityDate when stats change
  if (this.isModified('stats')) {
    this.stats.lastActivityDate = new Date();
  }
  
  // Set verification date when status changes to verified
  if (this.isModified('verificationStatus') && this.verificationStatus === 'verified' && !this.verificationDate) {
    this.verificationDate = new Date();
  }
  
  // Set partnership date when status changes to active
  if (this.isModified('partnershipStatus') && this.partnershipStatus === 'active' && !this.partnershipDate) {
    this.partnershipDate = new Date();
  }
  
  next();
});

// Static methods
institutionSchema.statics.findNearby = function(coordinates, maxDistance = 50000) {
  return this.find({
    'address.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.longitude, coordinates.latitude]
        },
        $maxDistance: maxDistance
      }
    },
    status: 'active',
    verificationStatus: 'verified'
  });
};

institutionSchema.statics.findByType = function(type, filters = {}) {
  return this.find({
    type,
    status: 'active',
    verificationStatus: 'verified',
    ...filters
  });
};

// Instance methods
institutionSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

institutionSchema.methods.incrementStats = function(field, value = 1) {
  this.stats[field] = (this.stats[field] || 0) + value;
  this.stats.lastActivityDate = new Date();
  return this.save();
};

institutionSchema.methods.isOpenNow = function() {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const currentTime = now.toTimeString().slice(0, 5);
  
  const todayHours = this.operatingHours[dayName];
  if (!todayHours || todayHours.closed) {
    return false;
  }
  
  return currentTime >= todayHours.start && currentTime <= todayHours.end;
};

const Institution = mongoose.model('Institution', institutionSchema);

module.exports = Institution;