const express = require('express');
const rateLimit = require('express-rate-limit');

const {
  createBloodRequest,
  getBloodRequest,
  getBloodRequests,
  updateRequestStatus,
  addDonorResponse,
  getNearbyRequests,
  getDonorMatches
} = require('../controllers/bloodRequestController');

const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for blood request creation
const createRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes per IP
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many blood requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for general requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation schemas
const bloodRequestSchema = {
  requester: {
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    phoneNumber: { type: 'string', required: true, pattern: /^[6-9]\d{9}$/ },
    email: { type: 'string', required: false, format: 'email' },
    relationship: { 
      type: 'string', 
      required: true, 
      enum: ['self', 'parent', 'spouse', 'child', 'sibling', 'relative', 'friend', 'other'] 
    }
  },
  patient: {
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    age: { type: 'number', required: true, min: 0, max: 120 },
    gender: { type: 'string', required: true, enum: ['male', 'female', 'other'] },
    bloodType: { 
      type: 'string', 
      required: true, 
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] 
    },
    weight: { type: 'number', required: false, min: 1, max: 300 },
    medicalCondition: { type: 'string', required: true, minLength: 5, maxLength: 500 },
    additionalNotes: { type: 'string', required: false, maxLength: 1000 }
  },
  request: {
    urgency: { type: 'string', required: true, enum: ['critical', 'urgent', 'scheduled'] },
    unitsNeeded: { type: 'number', required: true, min: 1, max: 10 },
    requiredBy: { type: 'string', required: true, format: 'date-time' },
    bloodComponent: { 
      type: 'string', 
      required: false, 
      enum: ['whole_blood', 'red_cells', 'platelets', 'plasma', 'cryoprecipitate'] 
    },
    specialRequirements: { type: 'string', required: false, maxLength: 500 }
  },
  location: {
    hospital: {
      name: { type: 'string', required: true, minLength: 2, maxLength: 200 },
      address: {
        street: { type: 'string', required: true, minLength: 5, maxLength: 200 },
        city: { type: 'string', required: true, minLength: 2, maxLength: 100 },
        state: { type: 'string', required: true, minLength: 2, maxLength: 100 },
        pincode: { type: 'string', required: true, pattern: /^\d{6}$/ },
        country: { type: 'string', required: false, default: 'India' }
      },
      contactNumber: { type: 'string', required: true, pattern: /^[6-9]\d{9}$/ },
      coordinates: {
        type: { type: 'string', required: true, enum: ['Point'] },
        coordinates: { 
          type: 'array', 
          required: true, 
          items: { type: 'number' },
          minItems: 2,
          maxItems: 2
        }
      }
    },
    searchRadius: { type: 'number', required: false, min: 1, max: 100, default: 15 }
  }
};

const donorResponseSchema = {
  response: { type: 'string', required: true, enum: ['yes', 'no', 'maybe'] },
  notes: { type: 'string', required: false, maxLength: 500 }
};

const statusUpdateSchema = {
  status: { 
    type: 'string', 
    required: true, 
    enum: ['pending', 'active', 'matched', 'fulfilled', 'expired', 'cancelled'] 
  },
  notes: { type: 'string', required: false, maxLength: 1000 }
};

/**
 * @route   POST /api/v1/blood-requests
 * @desc    Create a new blood request
 * @access  Public (with rate limiting)
 */
router.post('/', 
  createRequestLimiter,
  validate(bloodRequestSchema),
  createBloodRequest
);

/**
 * @route   GET /api/v1/blood-requests
 * @desc    Get all blood requests (with filters)
 * @access  Private
 */
router.get('/', 
  generalLimiter,
  auth,
  getBloodRequests
);

/**
 * @route   GET /api/v1/blood-requests/nearby
 * @desc    Get nearby blood requests
 * @access  Private
 */
router.get('/nearby',
  generalLimiter,
  auth,
  getNearbyRequests
);

/**
 * @route   GET /api/v1/blood-requests/:requestId
 * @desc    Get blood request by ID
 * @access  Private
 */
router.get('/:requestId',
  generalLimiter,
  auth,
  getBloodRequest
);

/**
 * @route   GET /api/v1/blood-requests/:requestId/matches
 * @desc    Get suggested donor matches for a blood request
 * @access  Private (Admin or Request Owner)
 */
router.get('/:requestId/matches',
  generalLimiter,
  auth,
  getDonorMatches
);

/**
 * @route   PUT /api/v1/blood-requests/:requestId/status
 * @desc    Update blood request status
 * @access  Private (Admin or Request Owner)
 */
router.put('/:requestId/status',
  generalLimiter,
  auth,
  validate(statusUpdateSchema),
  updateRequestStatus
);

/**
 * @route   POST /api/v1/blood-requests/:requestId/responses
 * @desc    Add donor response to blood request
 * @access  Private (Donors only)
 */
router.post('/:requestId/responses',
  generalLimiter,
  auth,
  validate(donorResponseSchema),
  addDonorResponse
);

/**
 * @route   GET /api/v1/blood-requests/:requestId/responses
 * @desc    Get all responses for a blood request
 * @access  Private (Admin or Request Owner)
 */
router.get('/:requestId/responses', 
  generalLimiter,
  auth,
  async (req, res) => {
    try {
      const { requestId } = req.params;

      const bloodRequest = await BloodRequest.findOne({ requestId })
        .populate('matching.matchedDonors.donorId', 'name phoneNumber bloodType')
        .select('matching.matchedDonors requestId status')
        .lean();

      if (!bloodRequest) {
        return res.status(404).json({
          success: false,
          error: 'REQUEST_NOT_FOUND',
          message: 'Blood request not found'
        });
      }

      // Check permissions
      const canView = req.user?.role === 'admin' || 
                     req.user?.id === bloodRequest.createdBy?.toString();

      if (!canView) {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'You do not have permission to view responses'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          requestId: bloodRequest.requestId,
          responses: bloodRequest.matching.matchedDonors,
          totalResponses: bloodRequest.matching.matchedDonors.length,
          positiveResponses: bloodRequest.matching.matchedDonors.filter(r => r.response === 'yes').length
        }
      });

    } catch (error) {
      logger.error('Error fetching blood request responses', 'BLOOD_REQUEST_ROUTES', error);
      
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch responses'
      });
    }
  }
);

/**
 * @route   POST /api/v1/blood-requests/:requestId/fulfill
 * @desc    Mark blood request as fulfilled
 * @access  Private (Admin or Request Owner)
 */
router.post('/:requestId/fulfill',
  generalLimiter,
  auth,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const { donorDetails, feedback } = req.body;

      if (!donorDetails || !Array.isArray(donorDetails) || donorDetails.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'DONOR_DETAILS_REQUIRED',
          message: 'Donor details are required to fulfill request'
        });
      }

      const bloodRequest = await BloodRequest.findOne({ requestId });
      if (!bloodRequest) {
        return res.status(404).json({
          success: false,
          error: 'REQUEST_NOT_FOUND',
          message: 'Blood request not found'
        });
      }

      // Check permissions
      const canFulfill = req.user?.role === 'admin' || 
                        req.user?.id === bloodRequest.createdBy?.toString();

      if (!canFulfill) {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'You do not have permission to fulfill this request'
        });
      }

      // Mark as fulfilled
      await bloodRequest.markAsFulfilled(donorDetails);

      // Add feedback if provided
      if (feedback) {
        bloodRequest.fulfillment.feedback = {
          ...feedback,
          submittedAt: new Date()
        };
        await bloodRequest.save();
      }

      logger.success(`Blood request fulfilled: ${requestId}`, 'BLOOD_REQUEST_ROUTES');

      res.status(200).json({
        success: true,
        message: 'Blood request marked as fulfilled',
        data: {
          requestId: bloodRequest.requestId,
          unitsCollected: bloodRequest.fulfillment.unitsCollected,
          completedAt: bloodRequest.fulfillment.completedAt
        }
      });

    } catch (error) {
      logger.error('Error fulfilling blood request', 'BLOOD_REQUEST_ROUTES', error);
      
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fulfill request'
      });
    }
  }
);

/**
 * @route   GET /api/v1/blood-requests/stats/summary
 * @desc    Get blood request statistics
 * @access  Private (Admin only)
 */
router.get('/stats/summary',
  generalLimiter,
  auth,
  async (req, res) => {
    try {
      // Check admin permission
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Admin access required'
        });
      }

      const stats = await BloodRequest.aggregate([
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            pendingRequests: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            activeRequests: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            fulfilledRequests: {
              $sum: { $cond: [{ $eq: ['$status', 'fulfilled'] }, 1, 0] }
            },
            criticalRequests: {
              $sum: { $cond: [{ $eq: ['$request.urgency', 'critical'] }, 1, 0] }
            },
            urgentRequests: {
              $sum: { $cond: [{ $eq: ['$request.urgency', 'urgent'] }, 1, 0] }
            },
            scheduledRequests: {
              $sum: { $cond: [{ $eq: ['$request.urgency', 'scheduled'] }, 1, 0] }
            }
          }
        }
      ]);

      const bloodTypeStats = await BloodRequest.aggregate([
        {
          $group: {
            _id: '$patient.bloodType',
            count: { $sum: 1 },
            fulfilled: {
              $sum: { $cond: [{ $eq: ['$status', 'fulfilled'] }, 1, 0] }
            }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      const recentRequests = await BloodRequest.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('requestId patient.bloodType request.urgency status createdAt location.hospital.name')
        .lean();

      res.status(200).json({
        success: true,
        data: {
          summary: stats[0] || {
            totalRequests: 0,
            pendingRequests: 0,
            activeRequests: 0,
            fulfilledRequests: 0,
            criticalRequests: 0,
            urgentRequests: 0,
            scheduledRequests: 0
          },
          bloodTypeStats,
          recentRequests
        }
      });

    } catch (error) {
      logger.error('Error fetching blood request statistics', 'BLOOD_REQUEST_ROUTES', error);
      
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch statistics'
      });
    }
  }
);

// Health check endpoint
router.get('/health', (req, res) => {
  logger.debug('Blood request service health check requested', 'BLOOD_REQUEST_ROUTES');
  
  res.status(200).json({
    success: true,
    message: 'Blood request service is healthy',
    timestamp: new Date().toISOString(),
    service: 'blood_requests'
  });
});

module.exports = router;