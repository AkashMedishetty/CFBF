const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['id_proof', 'address_proof', 'medical_certificate', 'photo'],
    index: true
  },
  filename: {
    type: String,
    required: true,
    unique: true
  },
  originalName: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false,
    index: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    exifData: mongoose.Schema.Types.Mixed,
    fileHash: String,
    scanResults: {
      virusScan: {
        status: {
          type: String,
          enum: ['pending', 'clean', 'infected', 'error'],
          default: 'pending'
        },
        scannedAt: Date,
        details: String
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for document URL
documentSchema.virtual('url').get(function() {
  return `/api/v1/documents/view/${this.filename}`;
});

// Virtual for file size in human readable format
documentSchema.virtual('formattedSize').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Index for efficient queries
documentSchema.index({ userId: 1, type: 1 });
documentSchema.index({ uploadedAt: -1 });
documentSchema.index({ verified: 1, uploadedAt: -1 });

// Static methods
documentSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ uploadedAt: -1 });
};

documentSchema.statics.findByUserAndType = function(userId, type) {
  return this.findOne({ userId, type }).sort({ uploadedAt: -1 });
};

documentSchema.statics.findUnverified = function() {
  return this.find({ verified: false }).populate('userId', 'name phoneNumber').sort({ uploadedAt: 1 });
};

// Instance methods
documentSchema.methods.markAsVerified = function(verifiedBy) {
  this.verified = true;
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  return this.save();
};

documentSchema.methods.reject = function(reason, rejectedBy) {
  this.verified = false;
  this.rejectionReason = reason;
  this.verifiedBy = rejectedBy;
  this.verifiedAt = new Date();
  return this.save();
};

// Pre-save middleware
documentSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate file hash for duplicate detection
    // In a real implementation, you would calculate the actual file hash
    this.metadata = this.metadata || {};
    this.metadata.fileHash = `hash_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
  next();
});

// Post-remove middleware to clean up files
documentSchema.post('remove', async function(doc) {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    const filePath = path.resolve(doc.path);
    await fs.unlink(filePath);
    console.log(`Cleaned up file: ${filePath}`);
  } catch (error) {
    console.error(`Failed to clean up file: ${doc.path}`, error);
  }
});

module.exports = mongoose.model('Document', documentSchema);