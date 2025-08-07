const hospitalService = require('../services/hospitalService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class HospitalController {
  /**
   * Register a new hospital
   */
  async registerHospital(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { hospitalData, adminUserData } = req.body;

      const result = await hospitalService.registerHospital(hospitalData, adminUserData);

      res.status(201).json({
        success: true,
        message: 'Hospital registered successfully. Verification email sent.',
        data: result
      });
    } catch (error) {
      logger.error('Error in registerHospital:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to register hospital'
      });
    }
  }

  /**
   * Get hospital profile
   */
  async getHospitalProfile(req, res) {
    try {
      const { hospitalId } = req.params;
      const includeInventory = req.query.includeInventory !== 'false';

      const hospital = await hospitalService.getHospitalById(hospitalId, includeInventory);

      res.json({
        success: true,
        data: hospital
      });
    } catch (error) {
      logger.error('Error in getHospitalProfile:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Hospital not found'
      });
    }
  }

  /**
   * Update hospital profile
   */
  async updateHospitalProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { hospitalId } = req.params;
      const updateData = req.body;
      const adminUserId = req.user.id;

      const hospital = await hospitalService.updateHospitalProfile(hospitalId, updateData, adminUserId);

      res.json({
        success: true,
        message: 'Hospital profile updated successfully',
        data: hospital
      });
    } catch (error) {
      logger.error('Error in updateHospitalProfile:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update hospital profile'
      });
    }
  }

  /**
   * Find nearby hospitals
   */
  async findNearbyHospitals(req, res) {
    try {
      const { longitude, latitude, maxDistance, type, services, minRating, hasInventory } = req.query;

      if (!longitude || !latitude) {
        return res.status(400).json({
          success: false,
          message: 'Longitude and latitude are required'
        });
      }

      const filters = {};
      if (type) filters.type = type;
      if (services) filters.services = services.split(',');
      if (minRating) filters.minRating = parseFloat(minRating);
      if (hasInventory === 'true') filters.hasInventory = true;

      const hospitals = await hospitalService.findNearbyHospitals(
        parseFloat(longitude),
        parseFloat(latitude),
        maxDistance ? parseInt(maxDistance) : 10000,
        filters
      );

      res.json({
        success: true,
        data: hospitals,
        count: hospitals.length
      });
    } catch (error) {
      logger.error('Error in findNearbyHospitals:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to find nearby hospitals'
      });
    }
  }

  /**
   * Search hospitals
   */
  async searchHospitals(req, res) {
    try {
      const { q, type, services, minRating, city, state, page = 1, limit = 20 } = req.query;

      const filters = {};
      if (type) filters.type = type;
      if (services) filters.services = { $in: services.split(',') };
      if (minRating) filters.averageRating = { $gte: parseFloat(minRating) };
      if (city) filters['address.city'] = new RegExp(city, 'i');
      if (state) filters['address.state'] = new RegExp(state, 'i');

      const result = await hospitalService.searchHospitals(
        q,
        filters,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: result.hospitals,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error in searchHospitals:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search hospitals'
      });
    }
  }

  /**
   * Update blood inventory
   */
  async updateInventory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { hospitalId } = req.params;
      const { bloodType, unitsToAdd, expirationDate } = req.body;
      const adminUserId = req.user.id;

      const hospital = await hospitalService.updateInventory(
        hospitalId,
        bloodType,
        unitsToAdd,
        new Date(expirationDate),
        adminUserId
      );

      res.json({
        success: true,
        message: 'Inventory updated successfully',
        data: {
          inventory: hospital.inventory,
          lastUpdated: hospital.lastInventoryUpdate
        }
      });
    } catch (error) {
      logger.error('Error in updateInventory:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update inventory'
      });
    }
  }

  /**
   * Consume blood inventory
   */
  async consumeInventory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { hospitalId } = req.params;
      const { bloodType, unitsToConsume } = req.body;
      const adminUserId = req.user.id;

      const hospital = await hospitalService.consumeInventory(
        hospitalId,
        bloodType,
        unitsToConsume,
        adminUserId
      );

      res.json({
        success: true,
        message: 'Inventory consumed successfully',
        data: {
          inventory: hospital.inventory,
          lastUpdated: hospital.lastInventoryUpdate
        }
      });
    } catch (error) {
      logger.error('Error in consumeInventory:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to consume inventory'
      });
    }
  }

  /**
   * Add rating and review
   */
  async addRating(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { hospitalId } = req.params;
      const { rating, review, category = 'overall' } = req.body;
      const userId = req.user.id;

      const hospital = await hospitalService.addRating(hospitalId, userId, rating, review, category);

      res.json({
        success: true,
        message: 'Rating added successfully',
        data: {
          averageRating: hospital.averageRating,
          totalRatings: hospital.totalRatings
        }
      });
    } catch (error) {
      logger.error('Error in addRating:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to add rating'
      });
    }
  }

  /**
   * Get hospital analytics (for hospital admins)
   */
  async getHospitalAnalytics(req, res) {
    try {
      const { hospitalId } = req.params;
      const { timeRange = '30d' } = req.query;

      const analytics = await hospitalService.getHospitalAnalytics(hospitalId, timeRange);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error in getHospitalAnalytics:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get hospital analytics'
      });
    }
  }

  /**
   * Verify hospital (admin only)
   */
  async verifyHospital(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { hospitalId } = req.params;
      const { verificationStatus, adminNotes } = req.body;

      const hospital = await hospitalService.verifyHospital(hospitalId, verificationStatus, adminNotes);

      res.json({
        success: true,
        message: `Hospital ${verificationStatus} successfully`,
        data: hospital
      });
    } catch (error) {
      logger.error('Error in verifyHospital:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to verify hospital'
      });
    }
  }

  /**
   * Get hospitals pending verification (admin only)
   */
  async getPendingVerifications(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const result = await hospitalService.getPendingVerifications(
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: result.hospitals,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error in getPendingVerifications:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get pending verifications'
      });
    }
  }

  /**
   * Get hospital types and services (for dropdowns)
   */
  async getHospitalMetadata(req, res) {
    try {
      const metadata = {
        types: [
          { value: 'hospital', label: 'Hospital' },
          { value: 'blood_bank', label: 'Blood Bank' },
          { value: 'clinic', label: 'Clinic' },
          { value: 'diagnostic_center', label: 'Diagnostic Center' }
        ],
        services: [
          { value: 'blood_donation', label: 'Blood Donation' },
          { value: 'blood_testing', label: 'Blood Testing' },
          { value: 'blood_storage', label: 'Blood Storage' },
          { value: 'platelet_donation', label: 'Platelet Donation' },
          { value: 'plasma_donation', label: 'Plasma Donation' },
          { value: 'emergency_services', label: 'Emergency Services' },
          { value: 'mobile_blood_drive', label: 'Mobile Blood Drive' },
          { value: 'blood_component_separation', label: 'Blood Component Separation' },
          { value: 'cross_matching', label: 'Cross Matching' },
          { value: 'blood_screening', label: 'Blood Screening' }
        ],
        bloodTypes: [
          'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
        ]
      };

      res.json({
        success: true,
        data: metadata
      });
    } catch (error) {
      logger.error('Error in getHospitalMetadata:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get hospital metadata'
      });
    }
  }
}

module.exports = new HospitalController();