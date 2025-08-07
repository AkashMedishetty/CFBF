const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donationId: {
    type: String,
    unique: true,
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest',
    required: false // Can be null for voluntary donations
  },
  donationType: {
    type: String,
    enum: ['whole_blood', 'platelets', 'plasma', 'double_red_cells'],
    default: 'whole_blood'
  },
  donationDate: {
    type: Date,
    required: true
  },
  scheduledDate: {
    type: Date,
    required: false
  },
  location: {
    hospital: {
      type: String,
      required: true
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  unitsDonated: {
    type: Number,
    default: 1,
    min: 0.5,
    max: 2
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'deferred', 'rejected'],
    default: 'scheduled'
  },
  preDonationChecks: {
    hemoglobin: {
      value: Number,
      unit: { type: String, default: 'g/dL' },
      passed: Boolean
    },
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
      passed: Boolean
    },
    pulse: {
      value: Number,
      passed: Boolean
    },
    temperature: {
      value: Number,
      unit: { type: String, default: 'F' },
      passed: Boolean
    },
    weight: {
      value: Number,
      unit: { type: String, default: 'lbs' },
      passed: Boolean
    },
    medicalHistory: {
      cleared: Boolean,
      notes: String
    },
    overallEligibility: {
      type: Boolean,
      default: false
    }
  },
  postDonationInfo: {
    actualUnits: Number,
    complications: [{
      type: String,
      severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
      description: String,
      resolved: Boolean
    }],
    recoveryNotes: String,
    nextEligibleDate: Date
  },
  certification: {
    certificateId: String,
    issued: Boolean,
    issuedAt: Date,
    qrCode: String,
    verificationUrl: String
  },
  followUp: {
    day1: {
      contacted: Boolean,
      contactedAt: Date,
      response: String,
      healthStatus: String
    },
    day3: {
      contacted: Boolean,
      contactedAt: Date,
      response: String,
      healthStatus: String
    },
    day7: {
      contacted: Boolean,
      contactedAt: Date,
      response: String,
      healthStatus: String
    }
  },
  staffInfo: {
    phlebotomist: {
      name: String,
      id: String,
      license: String
    },
    supervisor: {
      name: String,
      id: String
    },
    medicalOfficer: {
      name: String,
      id: String,
      signature: String
    }
  },
  qualityControl: {
    bagNumber: String,
    expirationDate: Date,
    testResults: [{
      test: String,
      result: String,
      date: Date,
      technician: String
    }],
    approved: Boolean,
    approvedBy: String,
    approvedAt: Date
  },
  notes: String,
  adminNotes: String,
  cancellationReason: String,
  deferralReason: String,
  metadata: {
    source: { type: String, default: 'web' }, // web, mobile, walk-in
    campaign: String,
    referralCode: String,
    firstTimeDonor: Boolean
  }
}, {
  timestamps: true
});

// Indexes for performance
donationSchema.index({ donorId: 1, donationDate: -1 });
donationSchema.index({ requestId: 1 });
donationSchema.index({ status: 1, donationDate: -1 });
donationSchema.index({ bloodType: 1, status: 1 });
donationSchema.index({ 'location.coordinates': '2dsphere' });
donationSchema.index({ donationId: 1 }, { unique: true });
donationSchema.index({ 'location.hospitalId': 1, donationDate: -1 });

// Pre-save middleware to generate donation ID
donationSchema.pre('save', function(next) {
  if (!this.donationId) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.donationId = `DON-${date}-${random}`;
  }
  next();
});

// Virtual for donation age
donationSchema.virtual('donationAge').get(function() {
  if (!this.donationDate) return null;
  const now = new Date();
  const diffTime = Math.abs(now - this.donationDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for next eligible date calculation
donationSchema.virtual('nextEligibleDate').get(function() {
  if (!this.donationDate || this.status !== 'completed') return null;
  
  const eligibilityPeriods = {
    whole_blood: 56, // 8 weeks
    platelets: 7,    // 1 week
    plasma: 28,      // 4 weeks
    double_red_cells: 112 // 16 weeks
  };
  
  const days = eligibilityPeriods[this.donationType] || 56;
  const nextDate = new Date(this.donationDate);
  nextDate.setDate(nextDate.getDate() + days);
  
  return nextDate;
});

// Instance method to mark as completed
donationSchema.methods.markCompleted = function(postDonationData = {}) {
  this.status = 'completed';
  this.postDonationInfo = {
    ...this.postDonationInfo,
    ...postDonationData,
    nextEligibleDate: this.nextEligibleDate
  };
  
  return this.save();
};

// Instance method to schedule follow-up
donationSchema.methods.scheduleFollowUp = function() {
  const followUpDates = {
    day1: new Date(this.donationDate.getTime() + 24 * 60 * 60 * 1000),
    day3: new Date(this.donationDate.getTime() + 3 * 24 * 60 * 60 * 1000),
    day7: new Date(this.donationDate.getTime() + 7 * 24 * 60 * 60 * 1000)
  };
  
  return followUpDates;
};

// Static method to get donor history
donationSchema.statics.getDonorHistory = function(donorId, limit = 10) {
  return this.find({ donorId })
    .sort({ donationDate: -1 })
    .limit(limit)
    .populate('requestId', 'requestId patient')
    .populate('location.hospitalId', 'name address')
    .lean();
};

// Static method to get donation statistics
donationSchema.statics.getStatistics = async function(timeRange = 30) {
  const since = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);
  
  const stats = await this.aggregate([
    {
      $match: {
        donationDate: { $gte: since },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalDonations: { $sum: 1 },
        totalUnits: { $sum: '$unitsDonated' },
        uniqueDonors: { $addToSet: '$donorId' },
        byBloodType: {
          $push: {
            bloodType: '$bloodType',
            units: '$unitsDonated'
          }
        }
      }
    },
    {
      $project: {
        totalDonations: 1,
        totalUnits: 1,
        uniqueDonors: { $size: '$uniqueDonors' },
        byBloodType: 1
      }
    }
  ]);
  
  return stats[0] || {
    totalDonations: 0,
    totalUnits: 0,
    uniqueDonors: 0,
    byBloodType: []
  };
};

// Static method to find eligible donors for next donation
donationSchema.statics.findEligibleForNextDonation = function(bloodType, location, radius = 25000) {
  const eligibilityDate = new Date();
  eligibilityDate.setDate(eligibilityDate.getDate() - 56); // 8 weeks ago
  
  return this.aggregate([
    {
      $match: {
        bloodType,
        status: 'completed',
        donationDate: { $lte: eligibilityDate }
      }
    },
    {
      $group: {
        _id: '$donorId',
        lastDonation: { $max: '$donationDate' }
      }
    },
    {
      $match: {
        lastDonation: { $lte: eligibilityDate }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'donor'
      }
    },
    {
      $unwind: '$donor'
    },
    {
      $match: {
        'donor.status': 'active',
        'donor.location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: location
            },
            $maxDistance: radius
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Donation', donationSchema);