const institutionService = require('../services/institutionService');
const logger = require('../utils/logger');

class InstitutionController {
  async registerInstitution(req, res) {
    try {
      const createdBy = req.user ? req.user.id : null;
      const institution = await institutionService.registerInstitution(req.body, createdBy);

      logger.info(`Institution registered: ${institution.name}`, 'INSTITUTION_CONTROLLER');

      res.status(201).json({
        success: true,
        data: {
          id: institution._id,
          name: institution.name,
          type: institution.type,
          verificationStatus: institution.verificationStatus,
          partnershipStatus: institution.partnershipStatus,
          registrationNumber: institution.registrationNumber
        },
        message: 'Institution registered successfully. Verification pending.',
        meta: {
          registeredAt: institution.createdAt,
          nextSteps: [
            'Document verification by admin team',
            'Partnership agreement review',
            'System integration setup'
          ]
        }
      });
    } catch (error) {
      logger.error('Error in registerInstitution', 'INSTITUTION_CONTROLLER', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: {
            code: 'INSTITUTION_EXISTS',
            message: error.message,
            details: 'Please use a different registration number or email address'
          }
        });
      }

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid institution data',
            details: Object.values(error.errors).map(err => err.message)
          }
        });
      }

      res.status(500).json({
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register institution',
          details: 'Please try again or contact support'
        }
      });
    }
  }

  async getInstitutionDirectory(req, res) {
    try {
      const result = await institutionService.getInstitutionDirectory(req.query);

      res.json({
        success: true,
        data: result.institutions,
        pagination: result.pagination,
        meta: {
          filters: req.query,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error in getInstitutionDirectory', 'INSTITUTION_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'DIRECTORY_FETCH_FAILED',
          message: 'Failed to fetch institution directory'
        }
      });
    }
  }

  async searchInstitutions(req, res) {
    try {
      const result = await institutionService.searchInstitutions(req.query);

      res.json({
        success: true,
        data: result.institutions,
        pagination: result.pagination,
        meta: {
          searchQuery: req.query.query,
          filters: req.query,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error in searchInstitutions', 'INSTITUTION_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to search institutions'
        }
      });
    }
  }

  async findNearbyInstitutions(req, res) {
    try {
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
          searchCenter: coordinates,
          maxDistance,
          count: institutions.length,
          filters
        }
      });
    } catch (error) {
      logger.error('Error in findNearbyInstitutions', 'INSTITUTION_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'NEARBY_SEARCH_FAILED',
          message: 'Failed to find nearby institutions'
        }
      });
    }
  }

  async getInstitutionProfile(req, res) {
    try {
      const { id } = req.params;
      const includeInventory = req.query.includeInventory === 'true';
      
      const institution = await institutionService.getInstitutionProfile(id, includeInventory);

      res.json({
        success: true,
        data: institution,
        meta: {
          includeInventory,
          fetchedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error in getInstitutionProfile', 'INSTITUTION_CONTROLLER', error);
      
      if (error.message === 'Institution not found') {
        return res.status(404).json({
          error: {
            code: 'INSTITUTION_NOT_FOUND',
            message: 'Institution not found',
            details: `No institution found with ID: ${req.params.id}`
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

  async updateInstitutionProfile(req, res) {
    try {
      const { id } = req.params;
      const updatedBy = req.user.id;
      
      const institution = await institutionService.updateInstitutionProfile(id, req.body, updatedBy);

      logger.info(`Institution profile updated: ${institution.name}`, 'INSTITUTION_CONTROLLER');

      res.json({
        success: true,
        data: institution,
        message: 'Institution profile updated successfully',
        meta: {
          updatedBy: req.user.name || req.user.email,
          updatedAt: institution.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error in updateInstitutionProfile', 'INSTITUTION_CONTROLLER', error);
      
      if (error.message === 'Institution not found') {
        return res.status(404).json({
          error: {
            code: 'INSTITUTION_NOT_FOUND',
            message: 'Institution not found'
          }
        });
      }

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: Object.values(error.errors).map(err => err.message)
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

  async verifyInstitution(req, res) {
    try {
      const { id } = req.params;
      const verifiedBy = req.user.id;
      
      const institution = await institutionService.verifyInstitution(id, req.body, verifiedBy);

      logger.info(`Institution verification updated: ${institution.name} - ${req.body.status}`, 'INSTITUTION_CONTROLLER');

      res.json({
        success: true,
        data: {
          id: institution._id,
          name: institution.name,
          verificationStatus: institution.verificationStatus,
          verificationDate: institution.verificationDate,
          partnershipStatus: institution.partnershipStatus
        },
        message: `Institution ${req.body.status} successfully`,
        meta: {
          verifiedBy: req.user.name || req.user.email,
          verificationNotes: req.body.notes
        }
      });
    } catch (error) {
      logger.error('Error in verifyInstitution', 'INSTITUTION_CONTROLLER', error);
      
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

  async getInstitutionStats(req, res) {
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
      logger.error('Error in getInstitutionStats', 'INSTITUTION_CONTROLLER', error);
      
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

  async rateInstitution(req, res) {
    try {
      const { id } = req.params;
      const { rating, review } = req.body;
      
      const reviewData = {
        userId: req.user.id,
        userName: req.user.name,
        rating,
        review,
        createdAt: new Date()
      };
      
      const institution = await institutionService.updateInstitutionRating(id, rating, reviewData);

      logger.info(`Institution rated: ${institution.name} - ${rating}/5`, 'INSTITUTION_CONTROLLER');

      res.json({
        success: true,
        data: {
          institutionId: id,
          institutionName: institution.name,
          newRating: institution.rating.average,
          ratingCount: institution.rating.count,
          userRating: rating
        },
        message: 'Rating submitted successfully',
        meta: {
          ratedBy: req.user.name || req.user.email,
          ratedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error in rateInstitution', 'INSTITUTION_CONTROLLER', error);
      
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

  async getInstitutionTypes(req, res) {
    try {
      const types = [
        {
          value: 'hospital',
          label: 'Hospital',
          description: 'General hospitals and medical centers',
          services: ['blood_collection', 'blood_testing', 'emergency_services', 'health_checkup']
        },
        {
          value: 'blood_bank',
          label: 'Blood Bank',
          description: 'Dedicated blood collection and storage facilities',
          services: ['blood_collection', 'blood_testing', 'blood_storage', 'blood_distribution']
        },
        {
          value: 'clinic',
          label: 'Clinic',
          description: 'Private clinics and healthcare centers',
          services: ['blood_collection', 'health_checkup', 'donor_counseling']
        },
        {
          value: 'medical_center',
          label: 'Medical Center',
          description: 'Multi-specialty medical centers',
          services: ['blood_collection', 'blood_testing', 'emergency_services', 'mobile_collection']
        },
        {
          value: 'ngo',
          label: 'NGO',
          description: 'Non-profit organizations involved in blood donation',
          services: ['mobile_collection', 'donor_counseling', 'emergency_services']
        }
      ];

      res.json({
        success: true,
        data: types
      });
    } catch (error) {
      logger.error('Error in getInstitutionTypes', 'INSTITUTION_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'TYPES_FETCH_FAILED',
          message: 'Failed to fetch institution types'
        }
      });
    }
  }

  async getInstitutionServices(req, res) {
    try {
      const services = [
        { value: 'blood_collection', label: 'Blood Collection', icon: 'droplet' },
        { value: 'blood_testing', label: 'Blood Testing', icon: 'test-tube' },
        { value: 'blood_storage', label: 'Blood Storage', icon: 'refrigerator' },
        { value: 'blood_distribution', label: 'Blood Distribution', icon: 'truck' },
        { value: 'platelet_donation', label: 'Platelet Donation', icon: 'circle-dot' },
        { value: 'plasma_donation', label: 'Plasma Donation', icon: 'beaker' },
        { value: 'emergency_services', label: 'Emergency Services', icon: 'siren' },
        { value: 'mobile_collection', label: 'Mobile Collection', icon: 'bus' },
        { value: 'donor_counseling', label: 'Donor Counseling', icon: 'user-check' },
        { value: 'health_checkup', label: 'Health Checkup', icon: 'stethoscope' }
      ];

      res.json({
        success: true,
        data: services
      });
    } catch (error) {
      logger.error('Error in getInstitutionServices', 'INSTITUTION_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'SERVICES_FETCH_FAILED',
          message: 'Failed to fetch institution services'
        }
      });
    }
  }
}

module.exports = new InstitutionController();