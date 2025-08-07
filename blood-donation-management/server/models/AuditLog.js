const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Some events may not have a user
  },
  event: {
    type: String,
    required: true,
    enum: [
      'user_registration',
      'user_login',
      'user_logout',
      'profile_update',
      'blood_request_created',
      'blood_request_updated',
      'donation_scheduled',
      'donation_completed',
      'notification_sent',
      'admin_action',
      'security_event',
      'system_event',
      'data_export',
      'data_import',
      'password_change',
      'account_deactivation',
      'account_reactivation',
      'permission_change',
      'bulk_operation',
      'api_access',
      'file_upload',
      'file_download',
      'search_performed',
      'report_generated'
    ]
  },
  action: {
    type: String,
    required: true
  },
  resource: {
    type: String, // e.g., 'User', 'BloodRequest', 'Donation'
    required: false
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Flexible object for event-specific data
    required: false
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    required: false
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['security', 'user_activity', 'system', 'data', 'admin', 'api'],
    default: 'user_activity'
  },
  sessionId: {
    type: String,
    required: false
  },
  requestId: {
    type: String,
    required: false
  },
  duration: {
    type: Number, // Duration in milliseconds
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false, // We use custom timestamp field
  collection: 'auditlogs'
});

// Indexes for performance
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ event: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
auditLogSchema.index({ category: 1, severity: 1, timestamp: -1 });
auditLogSchema.index({ ipAddress: 1, timestamp: -1 });
auditLogSchema.index({ success: 1, timestamp: -1 });

// TTL index to automatically delete old logs (90 days)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Static method to log events
auditLogSchema.statics.logEvent = function(eventData) {
  const auditLog = new this({
    ...eventData,
    timestamp: new Date()
  });
  
  return auditLog.save().catch(err => {
    console.error('Failed to save audit log:', err);
  });
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Static method to get security events
auditLogSchema.statics.getSecurityEvents = function(timeRange = 24) {
  const since = new Date(Date.now() - timeRange * 60 * 60 * 1000);
  
  return this.find({
    category: 'security',
    timestamp: { $gte: since }
  })
  .sort({ timestamp: -1 })
  .lean();
};

// Static method to get system statistics
auditLogSchema.statics.getSystemStats = function(timeRange = 24) {
  const since = new Date(Date.now() - timeRange * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: since }
      }
    },
    {
      $group: {
        _id: {
          event: '$event',
          success: '$success'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);