const express = require('express');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');
const auditLogger = require('../utils/auditLogger');
const logger = require('../utils/logger');
const notificationService = require('../services/notificationService');

const router = express.Router();
const AuditLog = require('../models/AuditLog');
const BloodRequest = require('../models/BloodRequest');
const emailService = require('../services/emailService');
const NotificationSettings = require('../models/NotificationSettings');

// Rate limiting for admin actions
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    success: false,
    error: 'ADMIN_RATE_LIMIT',
    message: 'Too many admin requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @route   GET /api/v1/admin/donors/pending
 * @desc    Get all pending donor registrations
 * @access  Private (Admin only)
 */
router.get('/donors/pending', adminLimiter, async (req, res) => {
  try {
    logger.info('Admin requested pending donors list', 'ADMIN_ROUTES');

    const pendingDonors = await User.find({
      status: 'pending',
      role: 'donor'
    })
    .select('-password -__v')
    .sort({ createdAt: -1 })
    .lean();

    // Log admin action
    auditLogger.logUserAction({
      userId: req.user?.id || 'admin',
      userRole: 'admin',
      action: 'view_pending_donors',
      resource: 'donor_verification',
      details: `Viewed pending donors list (${pendingDonors.length} donors)`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: {
        donorCount: pendingDonors.length,
        requestId: req.requestId
      }
    });

    res.status(200).json({
      success: true,
      data: {
        donors: pendingDonors,
        count: pendingDonors.length
      }
    });

  } catch (error) {
    logger.error('Error fetching pending donors', 'ADMIN_ROUTES', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch pending donors'
    });
  }
});

/**
 * @route   POST /api/v1/admin/donors/:donorId/approve
 * @desc    Approve a pending donor registration
 * @access  Private (Admin only)
 */
router.post('/donors/:donorId/approve', adminLimiter, async (req, res) => {
  try {
    const { donorId } = req.params;
    const { notes } = req.body;

    logger.info(`Admin approving donor: ${donorId}`, 'ADMIN_ROUTES');

    // Find and update donor
    const donor = await User.findByIdAndUpdate(
      donorId,
      {
        status: 'active',
        'verification.medicallyCleared': true,
        'verification.verifiedBy': req.user?.id,
        'verification.verifiedAt': new Date(),
        'verification.verificationNotes': notes || 'Approved by admin',
        updatedBy: req.user?.id
      },
      { new: true }
    );

    if (!donor) {
      return res.status(404).json({
        success: false,
        error: 'DONOR_NOT_FOUND',
        message: 'Donor not found'
      });
    }

    // Notify donor via configured channels (push → email; escalate WhatsApp/SMS if enabled)
    try {
      await notificationService.sendNotification({
        userId: donor._id,
        phoneNumber: donor.phoneNumber,
        email: donor.email,
        type: 'registration_approved',
        priority: 'normal',
        channels: ['push', 'email'],
        message: `Hi ${donor.name}, your donor registration has been approved. Thank you for volunteering!`,
        metadata: { donorId: donor._id, approvedAt: new Date().toISOString() }
      });
      logger.success(`Approval notification sent to ${donor.phoneNumber}`, 'ADMIN_ROUTES');
    } catch (notificationError) {
      logger.warn('Failed to send approval notification', 'ADMIN_ROUTES', notificationError);
      // Don't fail the approval if notification fails
    }

    // Log admin action
    auditLogger.logUserAction({
      userId: req.user?.id || 'admin',
      userRole: 'admin',
      action: 'approve_donor',
      resource: 'donor_verification',
      resourceId: donorId,
      details: `Approved donor registration for ${donor.name}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: {
        donorName: donor.name,
        donorPhone: donor.phoneNumber,
        notes: notes || null,
        requestId: req.requestId
      }
    });

    logger.success(`Donor approved successfully: ${donorId}`, 'ADMIN_ROUTES');

    res.status(200).json({
      success: true,
      message: 'Donor approved successfully',
      data: { donor }
    });

  } catch (error) {
    logger.error('Error approving donor', 'ADMIN_ROUTES', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to approve donor'
    });
  }
});

/**
 * @route   POST /api/v1/admin/donors/:donorId/reject
 * @desc    Reject a pending donor registration
 * @access  Private (Admin only)
 */
router.post('/donors/:donorId/reject', adminLimiter, async (req, res) => {
  try {
    const { donorId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'REJECTION_REASON_REQUIRED',
        message: 'Rejection reason is required'
      });
    }

    logger.info(`Admin rejecting donor: ${donorId}`, 'ADMIN_ROUTES');

    // Find and update donor
    const donor = await User.findByIdAndUpdate(
      donorId,
      {
        status: 'rejected',
        'verification.medicallyCleared': false,
        'verification.verifiedBy': req.user?.id,
        'verification.verifiedAt': new Date(),
        'verification.verificationNotes': reason,
        updatedBy: req.user?.id
      },
      { new: true }
    );

    if (!donor) {
      return res.status(404).json({
        success: false,
        error: 'DONOR_NOT_FOUND',
        message: 'Donor not found'
      });
    }

    // Notify donor via configured channels
    try {
      await notificationService.sendNotification({
        userId: donor._id,
        phoneNumber: donor.phoneNumber,
        email: donor.email,
        type: 'registration_rejected',
        priority: 'normal',
        channels: ['push', 'email'],
        message: `Hi ${donor.name}, your donor registration could not be approved. Reason: ${reason}. You may update your details and reapply.`,
        metadata: { donorId: donor._id, rejectedAt: new Date().toISOString() }
      });
      logger.success(`Rejection notification sent to ${donor.phoneNumber}`, 'ADMIN_ROUTES');
    } catch (notificationError) {
      logger.warn('Failed to send rejection notification', 'ADMIN_ROUTES', notificationError);
      // Don't fail the rejection if notification fails
    }

    // Log admin action
    auditLogger.logUserAction({
      userId: req.user?.id || 'admin',
      userRole: 'admin',
      action: 'reject_donor',
      resource: 'donor_verification',
      resourceId: donorId,
      details: `Rejected donor registration for ${donor.name}. Reason: ${reason}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: {
        donorName: donor.name,
        donorPhone: donor.phoneNumber,
        rejectionReason: reason,
        requestId: req.requestId
      }
    });

    logger.success(`Donor rejected successfully: ${donorId}`, 'ADMIN_ROUTES');

    res.status(200).json({
      success: true,
      message: 'Donor rejected successfully',
      data: { donor }
    });

  } catch (error) {
    logger.error('Error rejecting donor', 'ADMIN_ROUTES', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to reject donor'
    });
  }
});

/**
 * @route   GET /api/v1/admin/donors/stats
 * @desc    Get donor verification statistics
 * @access  Private (Admin only)
 */
router.get('/donors/stats', adminLimiter, async (req, res) => {
  try {
    logger.info('Admin requested donor stats', 'ADMIN_ROUTES');

    const stats = await User.aggregate([
      {
        $match: { role: 'donor' }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      pending: 0,
      active: 0,
      rejected: 0,
      inactive: 0,
      total: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRegistrations = await User.countDocuments({
      role: 'donor',
      createdAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        stats: formattedStats,
        recentRegistrations
      }
    });

  } catch (error) {
    logger.error('Error fetching donor stats', 'ADMIN_ROUTES', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch donor statistics'
    });
  }
});

/**
 * @route   GET /api/v1/admin/donors/:donorId/details
 * @desc    Get detailed donor information for verification
 * @access  Private (Admin only)
 */
router.get('/donors/:donorId/details', adminLimiter, async (req, res) => {
  try {
    const { donorId } = req.params;

    logger.info(`Admin requested donor details: ${donorId}`, 'ADMIN_ROUTES');

    const donor = await User.findById(donorId)
      .select('-password -__v')
      .lean();

    if (!donor) {
      return res.status(404).json({
        success: false,
        error: 'DONOR_NOT_FOUND',
        message: 'Donor not found'
      });
    }

    // Log admin action
    auditLogger.logDataAccess({
      userId: req.user?.id || 'admin',
      userRole: 'admin',
      action: 'read',
      resource: 'donor_details',
      resourceId: donorId,
      sensitiveFields: ['name', 'email', 'address', 'phoneNumber', 'medicalInfo'],
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: {
        purpose: 'verification_review',
        requestId: req.requestId
      }
    });

    res.status(200).json({
      success: true,
      data: { donor }
    });

  } catch (error) {
    logger.error('Error fetching donor details', 'ADMIN_ROUTES', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch donor details'
    });
  }
});

/**
 * @route   POST /api/v1/admin/donors/bulk-approve
 * @desc    Bulk approve multiple donors
 * @access  Private (Admin only)
 */
router.post('/donors/bulk-approve', adminLimiter, async (req, res) => {
  try {
    const { donorIds, notes } = req.body;

    if (!donorIds || !Array.isArray(donorIds) || donorIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_DONOR_IDS',
        message: 'Valid donor IDs array is required'
      });
    }

    logger.info(`Admin bulk approving ${donorIds.length} donors`, 'ADMIN_ROUTES');

    // Update all donors
    const result = await User.updateMany(
      {
        _id: { $in: donorIds },
        status: 'pending',
        role: 'donor'
      },
      {
        status: 'active',
        'verification.medicallyCleared': true,
        'verification.verifiedBy': req.user?.id,
        'verification.verifiedAt': new Date(),
        'verification.verificationNotes': notes || 'Bulk approved by admin',
        updatedBy: req.user?.id
      }
    );

    // Get updated donors for notifications
    const approvedDonors = await User.find({
      _id: { $in: donorIds },
      status: 'active'
    }).select('name phoneNumber');

    // Send notifications (don't wait for completion)
    approvedDonors.forEach(async (donor) => {
      try {
        await notificationService.sendNotification({
          userId: donor._id,
          phoneNumber: donor.phoneNumber,
          type: 'registration_approved',
          priority: 'normal',
          channels: ['push', 'email'],
          message: `Hi ${donor.name}, your donor registration has been approved. Thank you for volunteering!`,
          metadata: { donorId: donor._id, approvedAt: new Date().toISOString() }
        });
      } catch (error) {
        logger.warn(`Failed to send notification to ${donor.phoneNumber}`, 'ADMIN_ROUTES', error);
      }
    });

    // Log admin action
    auditLogger.logUserAction({
      userId: req.user?.id || 'admin',
      userRole: 'admin',
      action: 'bulk_approve_donors',
      resource: 'donor_verification',
      details: `Bulk approved ${result.modifiedCount} donors`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: {
        donorIds,
        approvedCount: result.modifiedCount,
        notes: notes || null,
        requestId: req.requestId
      }
    });

    logger.success(`Bulk approved ${result.modifiedCount} donors`, 'ADMIN_ROUTES');

    res.status(200).json({
      success: true,
      message: `Successfully approved ${result.modifiedCount} donors`,
      data: {
        approvedCount: result.modifiedCount,
        totalRequested: donorIds.length
      }
    });

  } catch (error) {
    logger.error('Error in bulk approval', 'ADMIN_ROUTES', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to bulk approve donors'
    });
  }
});

// Health check endpoint for admin service
router.get('/health', (req, res) => {
  logger.debug('Admin service health check requested', 'ADMIN_ROUTES');
  
  res.status(200).json({
    success: true,
    message: 'Admin service is healthy',
    timestamp: new Date().toISOString(),
    service: 'admin'
  });
});

// Notification settings (admin)
router.get('/notifications/settings', adminLimiter, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ success: false, error: 'ACCESS_DENIED' });
    const settings = await NotificationSettings.getSettings();
    res.json({ success: true, data: settings });
  } catch (e) {
    logger.error('Failed to get notification settings', 'ADMIN_ROUTES', e);
    res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR' });
  }
});

router.put('/notifications/settings', adminLimiter, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ success: false, error: 'ACCESS_DENIED' });
    const allowedKeys = ['channelOrder','enableWhatsApp','enableSMS','escalateToWhatsAppOnPriority','escalateToSMSOnPriority','escalateAfterMs'];
    const payload = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => allowedKeys.includes(k)));
    const settings = await NotificationSettings.getSettings();
    Object.assign(settings, payload, { updatedBy: req.user.id });
    await settings.save();
    res.json({ success: true, data: settings });
  } catch (e) {
    logger.error('Failed to update notification settings', 'ADMIN_ROUTES', e);
    res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR' });
  }
});

/**
 * @route   GET /api/v1/admin/activity/recent
 * @desc    Get recent system activity for admin dashboard
 * @access  Private (Admin)
 */
router.get('/activity/recent', adminLimiter, async (req, res) => {
  try {
    const events = await AuditLog.getSystemStats(24);
    const recent = await AuditLog.find().sort({ timestamp: -1 }).limit(25).lean();
    res.status(200).json({ success: true, data: { events, recent } });
  } catch (error) {
    logger.error('Error fetching recent activity', 'ADMIN_ROUTES', error);
    res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR' });
  }
});

/**
 * @route   GET /api/v1/admin/requests/summary
 * @desc    Get blood request summary for admin dashboard map/cards
 * @access  Private (Admin)
 */
router.get('/requests/summary', adminLimiter, async (req, res) => {
  try {
    const summaryAgg = await BloodRequest.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $in: ['$status', ['pending','active','matched']] }, 1, 0] } },
          fulfilled: { $sum: { $cond: [{ $eq: ['$status', 'fulfilled'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$request.urgency', 'critical'] }, 1, 0] } }
        }
      }
    ]);

    const activeRequests = await BloodRequest.find({ status: { $in: ['pending','active','matched'] } })
      .select('patient.bloodType request.urgency status location.hospital.name location.hospital.coordinates expiresAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: {
        overview: {
          totalRequests: summaryAgg[0]?.total || 0,
          activeRequests: summaryAgg[0]?.active || 0,
          fulfilledRequests: summaryAgg[0]?.fulfilled || 0,
          criticalRequests: summaryAgg[0]?.critical || 0
        },
        activeRequests
      }
    });
  } catch (error) {
    logger.error('Error fetching requests summary', 'ADMIN_ROUTES', error);
    res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR' });
  }
});

module.exports = router;

/**
 * Email diagnostics and status
 */
// @route   GET /api/v1/admin/email/status
// @desc    Get email service configuration/status
// @access  Private (Admin)
router.get('/email/status', adminLimiter, async (req, res) => {
  try {
    const status = emailService.getStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    logger.error('Error fetching email status', 'ADMIN_ROUTES', error);
    res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR' });
  }
});

// @route   POST /api/v1/admin/email/test
// @desc    Send a test email to verify configuration
// @access  Private (Admin)
router.post('/email/test', adminLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'EMAIL_REQUIRED' });
    }
    const result = await emailService.testConfiguration(email);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('Error sending test email', 'ADMIN_ROUTES', error);
    res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR' });
  }
});