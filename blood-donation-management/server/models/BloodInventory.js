const mongoose = require('mongoose');

const bloodInventorySchema = new mongoose.Schema({
  // Institution Reference
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: [true, 'Institution reference is required'],
    index: true
  },

  // Blood Type Information
  bloodType: {
    type: String,
    required: [true, 'Blood type is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    index: true
  },

  // Inventory Details
  totalUnits: {
    type: Number,
    required: [true, 'Total units is required'],
    min: [0, 'Total units cannot be negative'],
    default: 0
  },
  availableUnits: {
    type: Number,
    required: [true, 'Available units is required'],
    min: [0, 'Available units cannot be negative'],
    default: 0
  },
  reservedUnits: {
    type: Number,
    min: [0, 'Reserved units cannot be negative'],
    default: 0
  },
  expiredUnits: {
    type: Number,
    min: [0, 'Expired units cannot be negative'],
    default: 0
  },

  // Thresholds and Alerts
  minimumThreshold: {
    type: Number,
    required: [true, 'Minimum threshold is required'],
    min: [1, 'Minimum threshold must be at least 1'],
    default: 10
  },
  criticalThreshold: {
    type: Number,
    required: [true, 'Critical threshold is required'],
    min: [1, 'Critical threshold must be at least 1'],
    default: 5
  },

  // Status and Alerts
  status: {
    type: String,
    enum: ['adequate', 'low', 'critical', 'out_of_stock'],
    default: 'adequate',
    index: true
  },
  lastAlertSent: Date,
  alertFrequency: {
    type: Number,
    default: 24, // hours
    min: [1, 'Alert frequency must be at least 1 hour']
  },

  // Batch Tracking
  batches: [{
    batchId: {
      type: String,
      required: true
    },
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation'
    },
    units: {
      type: Number,
      required: true,
      min: [1, 'Batch units must be at least 1']
    },
    collectionDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'used', 'expired', 'discarded'],
      default: 'available'
    },
    reservedFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest'
    },
    usedDate: Date,
    notes: String
  }],

  // Statistics
  stats: {
    totalReceived: {
      type: Number,
      default: 0,
      min: [0, 'Total received cannot be negative']
    },
    totalIssued: {
      type: Number,
      default: 0,
      min: [0, 'Total issued cannot be negative']
    },
    totalExpired: {
      type: Number,
      default: 0,
      min: [0, 'Total expired cannot be negative']
    },
    averageTurnover: {
      type: Number,
      default: 0,
      min: [0, 'Average turnover cannot be negative']
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // System Fields
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  autoUpdateEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
bloodInventorySchema.index({ institution: 1, bloodType: 1 }, { unique: true });
bloodInventorySchema.index({ status: 1, bloodType: 1 });
bloodInventorySchema.index({ 'batches.expiryDate': 1 });
bloodInventorySchema.index({ 'batches.status': 1 });

// Virtual for inventory health
bloodInventorySchema.virtual('inventoryHealth').get(function() {
  const percentage = (this.availableUnits / this.minimumThreshold) * 100;
  
  if (percentage >= 100) return 'healthy';
  if (percentage >= 50) return 'moderate';
  if (percentage >= 25) return 'low';
  return 'critical';
});

// Virtual for expiring soon count
bloodInventorySchema.virtual('expiringSoon').get(function() {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  return this.batches.filter(batch => 
    batch.status === 'available' && 
    batch.expiryDate <= sevenDaysFromNow
  ).length;
});

// Virtual for oldest batch
bloodInventorySchema.virtual('oldestBatch').get(function() {
  const availableBatches = this.batches
    .filter(batch => batch.status === 'available')
    .sort((a, b) => a.collectionDate - b.collectionDate);
  
  return availableBatches.length > 0 ? availableBatches[0] : null;
});

// Pre-save middleware to update status
bloodInventorySchema.pre('save', function(next) {
  // Update status based on available units
  if (this.availableUnits === 0) {
    this.status = 'out_of_stock';
  } else if (this.availableUnits <= this.criticalThreshold) {
    this.status = 'critical';
  } else if (this.availableUnits <= this.minimumThreshold) {
    this.status = 'low';
  } else {
    this.status = 'adequate';
  }

  // Update stats timestamp
  if (this.isModified('availableUnits') || this.isModified('totalUnits')) {
    this.stats.lastUpdated = new Date();
  }

  // Validate that available + reserved + expired <= total
  const accountedUnits = this.availableUnits + this.reservedUnits + this.expiredUnits;
  if (accountedUnits > this.totalUnits) {
    return next(new Error('Available + Reserved + Expired units cannot exceed total units'));
  }

  next();
});

// Static methods
bloodInventorySchema.statics.findLowStock = function(institutionId = null) {
  const query = {
    status: { $in: ['low', 'critical', 'out_of_stock'] }
  };
  
  if (institutionId) {
    query.institution = institutionId;
  }
  
  return this.find(query).populate('institution', 'name type address.city');
};

bloodInventorySchema.statics.findExpiringSoon = function(days = 7, institutionId = null) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  const query = {
    'batches.expiryDate': { $lte: expiryDate },
    'batches.status': 'available'
  };
  
  if (institutionId) {
    query.institution = institutionId;
  }
  
  return this.find(query).populate('institution', 'name type address.city');
};

bloodInventorySchema.statics.getInventorySummary = function(institutionId) {
  return this.aggregate([
    { $match: { institution: mongoose.Types.ObjectId(institutionId) } },
    {
      $group: {
        _id: null,
        totalUnits: { $sum: '$totalUnits' },
        availableUnits: { $sum: '$availableUnits' },
        reservedUnits: { $sum: '$reservedUnits' },
        expiredUnits: { $sum: '$expiredUnits' },
        bloodTypes: { $push: { type: '$bloodType', available: '$availableUnits', status: '$status' } }
      }
    }
  ]);
};

// Instance methods
bloodInventorySchema.methods.addBatch = function(batchData) {
  const batch = {
    batchId: batchData.batchId || `BATCH_${Date.now()}`,
    donationId: batchData.donationId,
    units: batchData.units,
    collectionDate: batchData.collectionDate || new Date(),
    expiryDate: batchData.expiryDate,
    status: 'available'
  };
  
  this.batches.push(batch);
  this.totalUnits += batch.units;
  this.availableUnits += batch.units;
  this.stats.totalReceived += batch.units;
  
  return this.save();
};

bloodInventorySchema.methods.reserveUnits = function(units, requestId) {
  if (this.availableUnits < units) {
    throw new Error('Insufficient available units');
  }
  
  // Find available batches (FIFO - First In, First Out)
  const availableBatches = this.batches
    .filter(batch => batch.status === 'available')
    .sort((a, b) => a.collectionDate - b.collectionDate);
  
  let unitsToReserve = units;
  const reservedBatches = [];
  
  for (const batch of availableBatches) {
    if (unitsToReserve <= 0) break;
    
    const unitsFromBatch = Math.min(batch.units, unitsToReserve);
    
    if (unitsFromBatch === batch.units) {
      // Reserve entire batch
      batch.status = 'reserved';
      batch.reservedFor = requestId;
      reservedBatches.push({ batchId: batch.batchId, units: unitsFromBatch });
    } else {
      // Split batch
      const newBatch = {
        batchId: `${batch.batchId}_SPLIT_${Date.now()}`,
        donationId: batch.donationId,
        units: unitsFromBatch,
        collectionDate: batch.collectionDate,
        expiryDate: batch.expiryDate,
        status: 'reserved',
        reservedFor: requestId
      };
      
      batch.units -= unitsFromBatch;
      this.batches.push(newBatch);
      reservedBatches.push({ batchId: newBatch.batchId, units: unitsFromBatch });
    }
    
    unitsToReserve -= unitsFromBatch;
  }
  
  this.availableUnits -= units;
  this.reservedUnits += units;
  
  return this.save().then(() => reservedBatches);
};

bloodInventorySchema.methods.issueUnits = function(units, requestId) {
  // Find reserved batches for this request
  const reservedBatches = this.batches.filter(batch => 
    batch.status === 'reserved' && 
    batch.reservedFor && 
    batch.reservedFor.toString() === requestId.toString()
  );
  
  let unitsToIssue = units;
  const issuedBatches = [];
  
  for (const batch of reservedBatches) {
    if (unitsToIssue <= 0) break;
    
    const unitsFromBatch = Math.min(batch.units, unitsToIssue);
    
    batch.status = 'used';
    batch.usedDate = new Date();
    issuedBatches.push({ batchId: batch.batchId, units: unitsFromBatch });
    
    unitsToIssue -= unitsFromBatch;
  }
  
  this.reservedUnits -= units;
  this.totalUnits -= units;
  this.stats.totalIssued += units;
  
  return this.save().then(() => issuedBatches);
};

bloodInventorySchema.methods.markExpired = function() {
  const now = new Date();
  let expiredCount = 0;
  
  this.batches.forEach(batch => {
    if (batch.status === 'available' && batch.expiryDate <= now) {
      batch.status = 'expired';
      this.availableUnits -= batch.units;
      this.expiredUnits += batch.units;
      this.stats.totalExpired += batch.units;
      expiredCount += batch.units;
    }
  });
  
  if (expiredCount > 0) {
    return this.save().then(() => expiredCount);
  }
  
  return Promise.resolve(0);
};

bloodInventorySchema.methods.needsAlert = function() {
  if (this.status === 'adequate') return false;
  
  if (!this.lastAlertSent) return true;
  
  const hoursSinceLastAlert = (Date.now() - this.lastAlertSent.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastAlert >= this.alertFrequency;
};

const BloodInventory = mongoose.model('BloodInventory', bloodInventorySchema);

module.exports = BloodInventory;