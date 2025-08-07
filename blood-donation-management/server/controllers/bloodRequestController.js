const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const auditLogger = require('../utils/auditLogger');

/**
 * Create a new blood request
 * @route POST /api/v1/blood-requests
 */
const createBloodRequest = async (req, res) => {
  try {
    const {
      requester,
      patient,
      request,
      location
    } = req.body;

    logger.info('Creating new blood request', 'BLOOD_REQUEST_CONTROLLER');

    // Validate required fields
    if (!requester?.name || !requester?.phoneNumber || !patient?.name || 
        !patient?.bloodType || !request?.urgency || !location?.hospital?.name) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Missing required fields for blood request'
      });
    }

    // Create blood request
    const bloodRequest = new BloodRequest({
      requester: {
        ...requester,
        userId: req.user?.id || null,
        isGuest: !req.user?.id
      },
      patient,
      request,
      location,
      createdBy: req.user?.id || null,
      status: 'pending'
    });

    await bloodRequest.save();

    // Log the request creation
    auditLogger.logUserAction({
      userId: req.user?.id || 'guest',
      userRole: req.user?.role || 'guest',
      action: 'create_blood_request',
      resource: 'blood_request',
      resourceId: bloodRequest._id,
      details: `Created ${request.urgency} blood request for ${patient.bloodType}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: {
        requestId: bloodRequest.requestId,
        bloodType: patient.bloodType,
        urgency: request.urgency,
        hospital: location.hospital.name
      }
    });

    logger.success(`Blood request created: ${bloodRequest.requestId}`, 'BLOOD_REQUEST_CONTROLLER');

    // Start donor matching process (async)
    setImmediate(() => {
      startDonorMatching(bloodRequest);
    });

    res.status(201).json({
      success: true,
      message: 'Blood request created successfully',
      data: {
        requestId: bloodRequest.requestId,
        bloodRequest: bloodRequest
      }
    });

  } catch (error) {
    logger.error('Error creating blood request', 'BLOOD_REQUEST_CONTROLLER', error);
    
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create blood request'
    });
  }
};

/**
 * Get blood request by ID
 * @route GET /api/v1/blood-requests/:requestId
 */
const getBloodRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const bloodRequest = await BloodRequest.findOne({ requestId })
      .populate('requester.userId', 'name email phoneNumber')
      .populate('matching.matchedDonors.donorId', 'name phoneNumber bloodType')
      .populate('createdBy', 'name email')
      .lean();

    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        error: 'REQUEST_NOT_FOUND',
        message: 'Blood request not found'
      });
    }

    // Check if user has permission to view this request
    const canView = req.user?.role === 'admin' || 
                   req.user?.id === bloodRequest.createdBy?._id?.toString() ||
                   req.user?.id === bloodRequest.requester?.userId?._id?.toString();

    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'You do not have permission to view this request'
      });
    }

    res.status(200).json({
      success: true,
      data: { bloodRequest }
    });

  } catch (error) {
    logger.error('Error fetching blood request', 'BLOOD_REQUEST_CONTROLLER', error);
    
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch blood request'
    });
  }
};

/**
 * Get all blood requests (with filters)
 * @route GET /api/v1/blood-requests
 */
const getBloodRequests = async (req, res) => {
  try {
    const {
      status,
      urgency,
      bloodType,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = {};
    
    if (status) filter.status = status;
    if (urgency) filter['request.urgency'] = urgency;
    if (bloodType) filter['patient.bloodType'] = bloodType;

    // For non-admin users, only show their own requests
    if (req.user?.role !== 'admin') {
      filter.$or = [
        { createdBy: req.user.id },
        { 'requester.userId': req.user.id }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [bloodRequests, totalCount] = await Promise.all([
      BloodRequest.find(filter)
        .populate('requester.userId', 'name email')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      BloodRequest.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        bloodRequests,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching blood requests', 'BLOOD_REQUEST_CONTROLLER', error);
    
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch blood requests'
    });
  }
};

/**
 * Update blood request status
 * @route PUT /api/v1/blood-requests/:requestId/status
 */
const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'active', 'matched', 'fulfilled', 'expired', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Invalid status value'
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
    const canUpdate = req.user?.role === 'admin' || 
                     req.user?.id === bloodRequest.createdBy?.toString();

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'You do not have permission to update this request'
      });
    }

    const oldStatus = bloodRequest.status;
    bloodRequest.status = status;
    bloodRequest.updatedBy = req.user.id;

    if (notes) {
      bloodRequest.verification.verificationNotes = notes;
    }

    await bloodRequest.save();

    // Log status change
    auditLogger.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'update_request_status',
      resource: 'blood_request',
      resourceId: bloodRequest._id,
      details: `Changed status from ${oldStatus} to ${status}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: {
        requestId: bloodRequest.requestId,
        oldStatus,
        newStatus: status,
        notes
      }
    });

    logger.success(`Blood request status updated: ${requestId} -> ${status}`, 'BLOOD_REQUEST_CONTROLLER');

    res.status(200).json({
      success: true,
      message: 'Request status updated successfully',
      data: { bloodRequest }
    });

  } catch (error) {
    logger.error('Error updating request status', 'BLOOD_REQUEST_CONTROLLER', error);
    
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update request status'
    });
  }
};

/**
 * Add donor response to blood request
 * @route POST /api/v1/blood-requests/:requestId/responses
 */
const addDonorResponse = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { response, notes } = req.body;

    if (!['yes', 'no', 'maybe'].includes(response)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_RESPONSE',
        message: 'Response must be yes, no, or maybe'
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

    // Check if request can still receive responses
    if (!bloodRequest.canReceiveNotifications()) {
      return res.status(400).json({
        success: false,
        error: 'REQUEST_CLOSED',
        message: 'This request is no longer accepting responses'
      });
    }

    // Calculate distance (simplified - in production use proper geospatial calculation)
    const distance = 10; // Placeholder

    await bloodRequest.addDonorResponse(req.user.id, response, distance);

    // Log donor response
    auditLogger.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'donor_response',
      resource: 'blood_request',
      resourceId: bloodRequest._id,
      details: `Donor responded: ${response}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: {
        requestId: bloodRequest.requestId,
        response,
        distance,
        notes
      }
    });

    logger.success(`Donor response recorded: ${requestId} -> ${response}`, 'BLOOD_REQUEST_CONTROLLER');

    res.status(200).json({
      success: true,
      message: 'Response recorded successfully',
      data: {
        response,
        requestId: bloodRequest.requestId
      }
    });

  } catch (error) {
    logger.error('Error adding donor response', 'BLOOD_REQUEST_CONTROLLER', error);
    
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to record response'
    });
  }
};

/**
 * Get active blood requests near location
 * @route GET /api/v1/blood-requests/nearby
 */
const getNearbyRequests = async (req, res) => {
  try {
    const { latitude, longitude, radius = 25 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'LOCATION_REQUIRED',
        message: 'Latitude and longitude are required'
      });
    }

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    const maxDistance = parseInt(radius) * 1000; // Convert km to meters

    const nearbyRequests = await BloodRequest.findNearLocation(coordinates, maxDistance)
      .populate('requester.userId', 'name')
      .select('-matching.matchedDonors -fulfillment.donorDetails')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        requests: nearbyRequests,
        count: nearbyRequests.length,
        searchRadius: radius
      }
    });

  } catch (error) {
    logger.error('Error fetching nearby requests', 'BLOOD_REQUEST_CONTROLLER', error);
    
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch nearby requests'
    });
  }
};

/**
 * Start donor matching process (internal function)
 * @param {Object} bloodRequest - Blood request object
 */
async function startDonorMatching(bloodRequest) {
  try {
    logger.info(`Starting donor matching for request: ${bloodRequest.requestId}`, 'BLOOD_REQUEST_CONTROLLER');

    // Use the donor matching service
    const donorMatchingService = require('../services/donorMatchingService');
    const result = await donorMatchingService.startMatching(bloodRequest);

    if (result.success) {
      logger.success(`Donor matching started successfully for request: ${bloodRequest.requestId}`, 'BLOOD_REQUEST_CONTROLLER');
    } else {
      logger.error(`Failed to start donor matching for request: ${bloodRequest.requestId}`, 'BLOOD_REQUEST_CONTROLLER');
    }

  } catch (error) {
    logger.error('Error in donor matching process', 'BLOOD_REQUEST_CONTROLLER', error);
  }
}

/**
 * Format blood request message
 * @param {Object} bloodRequest - Blood request object
 * @returns {string} Formatted message
 */
function formatBloodRequestMessage(bloodRequest) {
  const urgencyEmoji = {
    'critical': '🚨',
    'urgent': '⚡',
    'scheduled': '📅'
  };

  const emoji = urgencyEmoji[bloodRequest.request.urgency] || '🩸';

  return `${emoji} BLOOD DONATION REQUEST

Blood Type: ${bloodRequest.patient.bloodType}
Patient: ${bloodRequest.patient.name} (${bloodRequest.patient.age}y)
Condition: ${bloodRequest.patient.medicalCondition}
Hospital: ${bloodRequest.location.hospital.name}
Location: ${bloodRequest.location.hospital.address.city}
Contact: ${bloodRequest.location.hospital.contactNumber}

Urgency: ${bloodRequest.request.urgency.toUpperCase()}
Units Needed: ${bloodRequest.request.unitsNeeded}

Can you help save a life?
Reply YES to donate or NO if unavailable.

Call For Blood Foundation`;
}

module.exports = {
  createBloodRequest,
  getBloodRequest,
  getBloodRequests,
  updateRequestStatus,
  addDonorResponse,
  getNearbyRequests
};