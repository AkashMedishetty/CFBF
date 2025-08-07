const express = require('express');
const router = express.Router();
const institutionService = require('../services/institutionService');
const { auth } = require('../middleware/auth');
const { body, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Middleware to check admin permissions
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Admin access required'
      }
    });
  }
  next();
};

// Register new institution
router.post('/register',
  [
    body('name').notEmpty().withMessage('Institution name is required'),
    body('type').isIn(['hospital', 'blood_bank', 'clinic', 'medical_center', 'ngo']).withMessage('Invalid institution type'),
    body('registrationNumber').notEmpty().withMessage('Registration number is required'),
    body('licenseNumber').notEmpty().withMessage('License number is required'),
    body('contactInfo.email').isEmail().withMessage('Valid email is required'),
    body('contactInfo.phone').notEmpty().withMessage('Phone number is required'),
    body('address.street').notEmpty().withMessage('Street address is required'),
    body('address.city').notEmpty().withMessage('City is required'),
    body('address.state').notEmpty().withMessage('State is required'),
    body('address.pincode').matches(/^\d{6}$/).withMessage('Valid 6-digit pincode is required'),
    body('adminContact.name').notEmpty().withMessage('Admin contact name is required'),
    body('adminContact.email').isEmail().withMessage('Valid admin email is required'),
    body('adminContact.phone').notEmpty().withMessage('Admin phone is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid registration data',
            details: errors.array()
          }
        });
      }

      const createdBy = req.user ? req.user.id : null;
      const institution = await institutionService.registerInstitution(req.body, createdBy);

      res.status(201).json({
        success: true,
        data: {
          id: institution._id,
          name: institution.name,
          type: institution.type,
          verificationStatus: institution.verificationStatus,
          partnershipStatus: institution.partnershipStatus
        },
        message: 'Institution registered successfully. Verification pending.'
      });
    } catch (error) {
      logger.error('Error in institution registration', 'INSTITUTIONS_API', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: {
            code: 'INSTITUTION_EXISTS',
            message: error.message
          }
        });
      }

      res.status(500).json({
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register institution'
        }
      });
    }
  }
);

// Get institution directory (public)
router.get('/directory',
  [
    query('type').optional().isIn(['hospital', 'blood_bank', 'clinic', 'medical_center', 'ngo']),
    query('city').optional().isString(),
    query('state').optional().isString(),
    query('services').optional().isArray(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: errors.array()
          }
        });
      }

      const result = await institutionService.getInstitutionDirectory(req.query);

      res.json({
        success: true,
        data: result.institutions,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error fetching institution directory', 'INSTITUTIONS_API', error);
      res.status(500).json({
        error: {
          code: 'DIRECTORY_FETCH_FAILED',
          message: 'Failed to fetch institution directory'
        }
      });
    }
  }
);

// Search institutions
router.get('/search',
  [
    query('query').optional().isString(),
    query('type').optional().isIn(['hospital', 'blood_bank', 'clinic', 'medical_center', 'ngo']),
    query('city').optional().isString(),
    query('state').optional().isString(),
    query('services').optional().isArray(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid search parameters',
            details: errors.array()
          }
        });
      }

      const result = await institutionService.searchInstitutions(req.query);

      res.json({
        success: true,
        data: result.institutions,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error searching institutions', 'INSTITUTIONS_API', error);
      res.status(500).json({
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to search institutions'
        }
      });
    }
  }
);

// Find nearby institutions
router.get('/nearby',
  [
    query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    query('maxDistance').optional().isInt({ min: 1000, max: 100000 }),
    query('type').optional().isIn(['hospital', 'blood_bank', 'clinic', 'medical_center', 'ngo'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid location parameters',
            details: errors.array()
          }
        });
      }

      const coordinates = {
        latitude: parseFloat(req.query.latitude),
        longitude: parseFloat(req.query.longitude)
      };
      
      const maxDistance = parseInt(req.query.maxDistance) || 50000;
      const filters = {};
      
      if (req.query.type) {
        filters.type = req.query.type;
      }

      const institutions = await institutionService.findNearbyInstitutions(coordinates, maxDistance, filters);

      res.json({
        success: true,
        data: institutions,
        meta: {
          coordinates,
          maxDistance,
          count: institutions.length
        }
      });
    } catch (error) {
      logger.error('Error finding nearby institutions', 'INSTITUTIONS_API', error);
      res.status(500).json({
        error: {
          code: 'NEARBY_SEARCH_FAILED',
          message: 'Failed to find nearby institutions'
        }
      });
    }
  }
);

// Get institution profile
router.get('/:id',
  async (req, res) => {
    try {
      const { id } = req.params;
      const includeInventory = req.query.includeInventory === 'true';
      
      const institution = await institutionService.getInstitutionProfile(id, includeInventory);

      res.json({
        success: true,
        data: institution
      });
    } catch (error) {
      logger.error('Error fetching institution profile', 'INSTITUTIONS_API', error);
      
      if (error.message === 'Institution not found') {
        return res.status(404).json({
          error: {
            code: 'INSTITUTION_NOT_FOUND',
            message: 'Institution not found'
          }
        });
      }

      res.status(500).json({
        error: {
          code: 'PROFILE_FETCH_FAILED',
          message: 'Failed to fetch institution profile'
        }
      });
    }
  }
);

// Update institution profile (admin or institution owner)
router.put('/:id',
  auth,
  [
    body('name').optional().notEmpty().withMessage('Institution name cannot be empty'),
    body('contactInfo.email').optional().isEmail().withMessage('Valid email is required'),
    body('contactInfo.phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
    body('address.pincode').optional().matches(/^\d{6}$/).withMessage('Valid 6-digit pincode is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: errors.array()
          }
        });
      }

      const { id } = req.params;
      const updatedBy = req.user.id;
      
      const institution = await institutionService.updateInstitutionProfile(id, req.body, updatedBy);

      res.json({
        success: true,
        data: institution,
        message: 'Institution profile updated successfully'
      });
    } catch (error) {
      logger.error('Error updating institution profile', 'INSTITUTIONS_API', error);
      
      if (error.message === 'Institution not found') {
        return res.status(404).json({
          error: {
            code: 'INSTITUTION_NOT_FOUND',
            message: 'Institution not found'
          }
        });
      }

      res.status(500).json({
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update institution profile'
        }
      });
    }
  }
);

// Verify institution (admin only)
router.post('/:id/verify',
  auth,
  requireAdmin,
  [
    body('status').isIn(['verified', 'rejected', 'under_review']).withMessage('Invalid verification status'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid verification data',
            details: errors.array()
          }
        });
      }

      const { id } = req.params;
      const verifiedBy = req.user.id;
      
      const institution = await institutionService.verifyInstitution(id, req.body, verifiedBy);

      res.json({
        success: true,
        data: {
          id: institution._id,
          name: institution.name,
          verificationStatus: institution.verificationStatus,
          verificationDate: institution.verificationDate
        },
        message: 'Institution verification updated successfully'
      });
    } catch (error) {
      logger.error('Error verifying institution', 'INSTITUTIONS_API', error);
      
      if (error.message === 'Institution not found') {
        return res.status(404).json({
          error: {
            code: 'INSTITUTION_NOT_FOUND',
            message: 'Institution not found'
          }
        });
      }

      res.status(500).json({
        error: {
          code: 'VERIFICATION_FAILED',
          message: 'Failed to update institution verification'
        }
      });
    }
  }
);

// Get institution statistics
router.get('/:id/stats',
  auth,
  [
    query('timeRange').optional().isIn(['7d', '30d', '90d', '1y'])
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const timeRange = req.query.timeRange || '30d';
      
      const stats = await institutionService.getInstitutionStats(id, timeRange);

      res.json({
        success: true,
        data: stats,
        meta: {
          institutionId: id,
          timeRange,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error fetching institution stats', 'INSTITUTIONS_API', error);
      
      if (error.message === 'Institution not found') {
        return res.status(404).json({
          error: {
            code: 'INSTITUTION_NOT_FOUND',
            message: 'Institution not found'
          }
        });
      }

      res.status(500).json({
        error: {
          code: 'STATS_FETCH_FAILED',
          message: 'Failed to fetch institution statistics'
        }
      });
    }
  }
);

// Rate institution
router.post('/:id/rate',
  auth,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('review').optional().isString().withMessage('Review must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid rating data',
            details: errors.array()
          }
        });
      }

      const { id } = req.params;
      const { rating, review } = req.body;
      
      const reviewData = {
        userId: req.user.id,
        rating,
        review,
        createdAt: new Date()
      };
      
      const institution = await institutionService.updateInstitutionRating(id, rating, reviewData);

      res.json({
        success: true,
        data: {
          institutionId: id,
          newRating: institution.rating.average,
          ratingCount: institution.rating.count
        },
        message: 'Rating submitted successfully'
      });
    } catch (error) {
      logger.error('Error rating institution', 'INSTITUTIONS_API', error);
      
      if (error.message === 'Institution not found') {
        return res.status(404).json({
          error: {
            code: 'INSTITUTION_NOT_FOUND',
            message: 'Institution not found'
          }
        });
      }

      res.status(500).json({
        error: {
          code: 'RATING_FAILED',
          message: 'Failed to submit rating'
        }
      });
    }
  }
);

module.exports = router;