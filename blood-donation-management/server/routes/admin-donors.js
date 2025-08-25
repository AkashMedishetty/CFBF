const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const logger = require('../utils/logger');

// GET /api/v1/admin/donors/all - Get all donors
router.get('/all', auth, adminOnly, async (req, res) => {
  try {
    logger.info('Admin requested all donors list', 'ADMIN_DONORS');
    
    // Fetch all users with role 'donor'
    const donors = await User.find({ role: 'donor' })
      .select('name fullName firstName email phoneNumber bloodType status isApproved createdAt updatedAt questionnaire questionnaireCompleted documents')
      .sort({ createdAt: -1 })
      .lean();

    // Transform the data to include questionnaire status
    const transformedDonors = donors.map(donor => ({
      ...donor,
      id: donor._id,
      questionnaireSubmitted: !!(donor.questionnaire || donor.questionnaireCompleted),
      isPending: donor.status === 'pending' || !donor.isApproved
    }));

    logger.success(`Retrieved ${transformedDonors.length} donors`, 'ADMIN_DONORS');

    res.json({
      success: true,
      data: {
        donors: transformedDonors,
        total: transformedDonors.length,
        stats: {
          total: transformedDonors.length,
          pending: transformedDonors.filter(d => d.isPending).length,
          approved: transformedDonors.filter(d => d.isApproved).length,
          withQuestionnaire: transformedDonors.filter(d => d.questionnaireSubmitted).length
        }
      }
    });

  } catch (error) {
    logger.error('Failed to fetch all donors', 'ADMIN_DONORS', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch donors',
        details: error.message
      }
    });
  }
});

// GET /api/v1/admin/donors/:id/questionnaire - Get donor questionnaire
router.get('/:id/questionnaire', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Admin requested questionnaire for donor ${id}`, 'ADMIN_DONORS');
    
    const donor = await User.findById(id)
      .select('name fullName firstName email questionnaire questionnaireSubmittedAt')
      .lean();

    if (!donor) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donor not found' }
      });
    }

    if (!donor.questionnaire) {
      return res.status(404).json({
        success: false,
        error: { message: 'No questionnaire found for this donor' }
      });
    }

    res.json({
      success: true,
      data: {
        questionnaire: donor.questionnaire?.data || donor.questionnaire,
        submittedAt: donor.questionnaireSubmittedAt || donor.questionnaire?.completedAt || donor.updatedAt,
        donor: {
          id: donor._id,
          name: donor.name || donor.fullName || donor.firstName,
          email: donor.email
        }
      }
    });

  } catch (error) {
    logger.error('Failed to fetch donor questionnaire', 'ADMIN_DONORS', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch questionnaire',
        details: error.message
      }
    });
  }
});

// PUT /api/v1/admin/donors/:id/approve - Approve a donor
router.put('/:id/approve', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Admin approving donor ${id}`, 'ADMIN_DONORS');
    
    const donor = await User.findByIdAndUpdate(
      id,
      { 
        status: 'active',
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: req.user._id
      },
      { new: true }
    ).select('-password');

    if (!donor) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donor not found' }
      });
    }

    logger.success(`Donor ${id} approved successfully`, 'ADMIN_DONORS');

    res.json({
      success: true,
      data: { donor },
      message: 'Donor approved successfully'
    });

  } catch (error) {
    logger.error('Failed to approve donor', 'ADMIN_DONORS', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to approve donor',
        details: error.message
      }
    });
  }
});

// PUT /api/v1/admin/donors/:id/reject - Reject a donor
router.put('/:id/reject', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    logger.info(`Admin rejecting donor ${id}`, 'ADMIN_DONORS');
    
    const donor = await User.findByIdAndUpdate(
      id,
      { 
        status: 'inactive',
        isApproved: false,
        rejectedAt: new Date(),
        rejectedBy: req.user._id,
        rejectionReason: reason
      },
      { new: true }
    ).select('-password');

    if (!donor) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donor not found' }
      });
    }

    logger.success(`Donor ${id} rejected successfully`, 'ADMIN_DONORS');

    res.json({
      success: true,
      data: { donor },
      message: 'Donor rejected successfully'
    });

  } catch (error) {
    logger.error('Failed to reject donor', 'ADMIN_DONORS', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to reject donor',
        details: error.message
      }
    });
  }
});

// PUT /api/v1/admin/donors/:id/suspend - Suspend a donor
router.put('/:id/suspend', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    logger.info(`Admin suspending donor ${id}`, 'ADMIN_DONORS');
    
    const donor = await User.findByIdAndUpdate(
      id,
      { 
        status: 'suspended',
        suspendedAt: new Date(),
        suspendedBy: req.user._id,
        suspensionReason: reason
      },
      { new: true }
    ).select('-password');

    if (!donor) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donor not found' }
      });
    }

    logger.success(`Donor ${id} suspended successfully`, 'ADMIN_DONORS');

    res.json({
      success: true,
      data: { donor },
      message: 'Donor suspended successfully'
    });

  } catch (error) {
    logger.error('Failed to suspend donor', 'ADMIN_DONORS', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to suspend donor',
        details: error.message
      }
    });
  }
});

// PUT /api/v1/admin/donors/:id/reactivate - Reactivate a donor
router.put('/:id/reactivate', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Admin reactivating donor ${id}`, 'ADMIN_DONORS');
    
    const donor = await User.findByIdAndUpdate(
      id,
      { 
        status: 'active',
        isApproved: true,
        reactivatedAt: new Date(),
        reactivatedBy: req.user._id,
        $unset: { 
          suspendedAt: 1, 
          suspendedBy: 1, 
          suspensionReason: 1,
          rejectedAt: 1,
          rejectedBy: 1,
          rejectionReason: 1
        }
      },
      { new: true }
    ).select('-password');

    if (!donor) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donor not found' }
      });
    }

    logger.success(`Donor ${id} reactivated successfully`, 'ADMIN_DONORS');

    res.json({
      success: true,
      data: { donor },
      message: 'Donor reactivated successfully'
    });

  } catch (error) {
    logger.error('Failed to reactivate donor', 'ADMIN_DONORS', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to reactivate donor',
        details: error.message
      }
    });
  }
});

// GET /api/v1/admin/donors/:id/details - Get detailed donor information
router.get('/:id/details', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Admin requesting details for donor ${id}`, 'ADMIN_DONORS');
    
    const donor = await User.findById(id)
      .select('-password')
      .lean();

    if (!donor) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donor not found' }
      });
    }

    // Get documents if available
    let documents = [];
    try {
      // Try to get documents from a documents collection if it exists
      const Document = require('../models/Document');
      documents = await Document.find({ userId: id }).lean();
    } catch (docError) {
      logger.debug('No documents model or documents found', 'ADMIN_DONORS');
    }

    logger.success(`Retrieved details for donor ${id}`, 'ADMIN_DONORS');

    res.json({
      success: true,
      data: {
        donor: {
          ...donor,
          id: donor._id
        },
        documents
      }
    });

  } catch (error) {
    logger.error('Failed to fetch donor details', 'ADMIN_DONORS', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch donor details',
        details: error.message
      }
    });
  }
});

module.exports = router;