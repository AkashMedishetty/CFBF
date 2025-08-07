const mongoose = require('mongoose');

const contactInfoSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  emergencyContact: {
    type: String,
    trim: true
  }
});

const operatingHoursSchema = new mongoose.Schema({
  monday: {
    open: String,
    close: String,
    is24Hours: { type: Boolean, default: false }
  },
  tuesday: {
    open: String,
    close: String,
    is24Hours: { type: Boolean, default: false }
  },
  wednesday: {
    open: String,
    close: String,
    is24Hours: { type: Boolean, default: false }
  },
  thursday: {
    open: String,
    close: String,
    is24Hours: { type: Boolean, default: false }
  },
  friday: {
    open: String,
    close: String,
    is24Hours: { type: Boolean, default: false }
  },
  saturday: {
    open: String,
    close: String,
    is24Hours: { type: Boolean, default: false }
  },
  sunday: {
    open: String,
    close: String,
    is24Hours: { type: Boolean, default: false }
  }
});

const bloodInventorySchema = new mongoose.Schema({
  bloodType: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  unitsAvailable: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  expirationDates: [{
    type: Date,
    required: true
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  minimumThreshold: {
    type: Number,
    required: true,
    min: 0,
    default: 5
  }
});

const ratingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['staff', 'facility', 'service', 'overall'],
    default: 'overall'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  type: {
    type: String,
    required: true,
    enum: ['hospital', 'blood_bank', 'clinic', 'diagnostic_center'],
    default: 'hospital'
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && 
                 coords[1] >= -90 && coords[1] <= 90;
        },
        message: 'Invalid coordinates format'
      }
    }
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: /^[0-9]{6}$/
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'India'
    }
  },
  contactInfo: {
    type: contactInfoSchema,
    required: true
  },
  operatingHours: {
    type: operatingHoursSchema,
    required: true
  },
  services: [{
    type: String,
    enum: [
      'blood_donation',
      'blood_testing',
      'blood_storage',
      'platelet_donation',
      'plasma_donation',
      'emergency_services',
      'mobile_blood_drive',
      'blood_component_separation',
      'cross_matching',
      'blood_screening'
    ]
  }],
  inventory: [bloodInventorySchema],
  ratings: [ratingSchema],
  certifications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    issuedBy: {
      type: String,
      required: true,
      trim: true
    },
    issuedDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date
    },
    certificateNumber: {
      type: String,
      trim: true
    }
  }],
  adminUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'suspended'],
    default: 'pending'
  },
  verificationDocuments: [{
    type: {
      type: String,
      required: true,
      enum: ['license', 'registration', 'accreditation', 'insurance', 'other']
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastInventoryUpdate: {
    type: Date,
    default: Date.now
  },
  totalDonationsReceived: {
    type: Number,
    default: 0
  },
  totalRequestsFulfilled: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based queries
hospitalSchema.index({ location: '2dsphere' });

// Create text index for search functionality
hospitalSchema.index({
  name: 'text',
  'address.city': 'text',
  'address.state': 'text',
  services: 'text'
});

// Create compound indexes for efficient queries
hospitalSchema.index({ type: 1, verificationStatus: 1, isActive: 1 });
hospitalSchema.index({ 'address.city': 1, type: 1 });
hospitalSchema.index({ averageRating: -1, totalRatings: -1 });

// Virtual for full address
hospitalSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} - ${this.address.pincode}`;
});

// Virtual for current operating status
hospitalSchema.virtual('isCurrentlyOpen').get(function() {
  const now = new Date();
  const currentDay = now.toLocaleLowerCase().substring(0, 3);
  const currentTime = now.toTimeString().substring(0, 5);
  
  const todayHours = this.operatingHours[currentDay];
  if (!todayHours) return false;
  
  if (todayHours.is24Hours) return true;
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
});

// Virtual for low inventory alerts
hospitalSchema.virtual('lowInventoryAlerts').get(function() {
  return this.inventory.filter(item => item.unitsAvailable <= item.minimumThreshold);
});

// Pre-save middleware to update average rating
hospitalSchema.pre('save', function(next) {
  if (this.ratings && this.ratings.length > 0) {
    const totalRating = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
    this.averageRating = totalRating / this.ratings.length;
    this.totalRatings = this.ratings.length;
  }
  next();
});

// Method to add or update blood inventory
hospitalSchema.methods.updateInventory = function(bloodType, unitsToAdd, expirationDate) {
  const existingInventory = this.inventory.find(item => item.bloodType === bloodType);
  
  if (existingInventory) {
    existingInventory.unitsAvailable += unitsToAdd;
    existingInventory.expirationDates.push(expirationDate);
    existingInventory.lastUpdated = new Date();
  } else {
    this.inventory.push({
      bloodType,
      unitsAvailable: unitsToAdd,
      expirationDates: [expirationDate],
      lastUpdated: new Date()
    });
  }
  
  this.lastInventoryUpdate = new Date();
  return this.save();
};

// Method to consume blood inventory
hospitalSchema.methods.consumeInventory = function(bloodType, unitsToConsume) {
  const inventory = this.inventory.find(item => item.bloodType === bloodType);
  
  if (!inventory || inventory.unitsAvailable < unitsToConsume) {
    throw new Error('Insufficient inventory');
  }
  
  inventory.unitsAvailable -= unitsToConsume;
  inventory.lastUpdated = new Date();
  this.lastInventoryUpdate = new Date();
  
  return this.save();
};

// Method to add rating
hospitalSchema.methods.addRating = function(userId, rating, review, category = 'overall') {
  // Remove existing rating from same user for same category
  this.ratings = this.ratings.filter(r => 
    !(r.userId.toString() === userId.toString() && r.category === category)
  );
  
  this.ratings.push({
    userId,
    rating,
    review,
    category,
    createdAt: new Date()
  });
  
  return this.save();
};

// Static method to find nearby hospitals
hospitalSchema.statics.findNearby = function(longitude, latitude, maxDistance = 10000, type = null) {
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true,
    verificationStatus: 'verified'
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query);
};

// Static method to search hospitals
hospitalSchema.statics.searchHospitals = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    isActive: true,
    verificationStatus: 'verified',
    ...filters
  };
  
  return this.find(query, { score: { $meta: 'textScore' } })
             .sort({ score: { $meta: 'textScore' } });
};

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;