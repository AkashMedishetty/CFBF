const inventoryService = require('../services/inventoryService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class InventoryController {
  /**
   * Get hospital inventory
   */
  async getHospitalInventory(req, res) {
    try {
      const { hospitalId } = req.params;

      const inventory = await inventoryService.getHospitalInventory(hospitalId);

      res.json({
        success: true,
        data: inventory
      });
    } catch (error) {
      logger.error('Error in getHospitalInventory:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Failed to fetch inventory'
      });
    }
  }

  /**
   * Update inventory
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

      const inventory = await inventoryService.updateInventory(
        hospitalId,
        bloodType,
        unitsToAdd,
        expirationDate,
        adminUserId
      );

      res.json({
        success: true,
        message: 'Inventory updated successfully',
        data: inventory
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
   * Consume inventory
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
      const { bloodType, unitsToConsume, reason } = req.body;
      const adminUserId = req.user.id;

      const inventory = await inventoryService.consumeInventory(
        hospitalId,
        bloodType,
        unitsToConsume,
        reason,
        adminUserId
      );

      res.json({
        success: true,
        message: 'Inventory consumed successfully',
        data: inventory
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
   * Set minimum threshold
   */
  async setMinimumThreshold(req, res) {
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
      const { bloodType, threshold } = req.body;
      const adminUserId = req.user.id;

      const inventory = await inventoryService.setMinimumThreshold(
        hospitalId,
        bloodType,
        threshold,
        adminUserId
      );

      res.json({
        success: true,
        message: 'Minimum threshold updated successfully',
        data: inventory
      });
    } catch (error) {
      logger.error('Error in setMinimumThreshold:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to set minimum threshold'
      });
    }
  }

  /**
   * Get inventory analytics
   */
  async getInventoryAnalytics(req, res) {
    try {
      const { hospitalId } = req.params;
      const { timeRange = '30d' } = req.query;

      const analytics = await inventoryService.getInventoryAnalytics(hospitalId, timeRange);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error in getInventoryAnalytics:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get inventory analytics'
      });
    }
  }

  /**
   * Get hospitals with low inventory (admin only)
   */
  async getHospitalsWithLowInventory(req, res) {
    try {
      const { bloodType, latitude, longitude, radius } = req.query;

      if (!bloodType) {
        return res.status(400).json({
          success: false,
          message: 'Blood type is required'
        });
      }

      let location = null;
      if (latitude && longitude) {
        location = {
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };
      }

      const hospitals = await inventoryService.getHospitalsWithLowInventory(
        bloodType,
        location,
        radius ? parseInt(radius) : 50000
      );

      res.json({
        success: true,
        data: hospitals,
        count: hospitals.length
      });
    } catch (error) {
      logger.error('Error in getHospitalsWithLowInventory:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get hospitals with low inventory'
      });
    }
  }

  /**
   * Redistribute blood between hospitals (admin only)
   */
  async redistributeBlood(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { fromHospitalId, toHospitalId, bloodType, units } = req.body;
      const adminUserId = req.user.id;

      const result = await inventoryService.redistributeBlood(
        fromHospitalId,
        toHospitalId,
        bloodType,
        units,
        adminUserId
      );

      res.json({
        success: true,
        message: 'Blood redistributed successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error in redistributeBlood:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to redistribute blood'
      });
    }
  }

  /**
   * Get inventory alerts for a hospital
   */
  async getInventoryAlerts(req, res) {
    try {
      const { hospitalId } = req.params;

      const inventory = await inventoryService.getHospitalInventory(hospitalId);

      res.json({
        success: true,
        data: {
          alerts: inventory.alerts,
          alertCount: inventory.alerts.lowStock.length + inventory.alerts.expiringSoon.length
        }
      });
    } catch (error) {
      logger.error('Error in getInventoryAlerts:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get inventory alerts'
      });
    }
  }

  /**
   * Get blood type availability across all hospitals (public)
   */
  async getBloodTypeAvailability(req, res) {
    try {
      const { latitude, longitude, radius = 50000 } = req.query;

      // This would typically aggregate data from all hospitals
      // For now, returning mock data
      const availability = {
        'A+': { hospitals: 15, totalUnits: 245, averageUnits: 16.3 },
        'A-': { hospitals: 12, totalUnits: 89, averageUnits: 7.4 },
        'B+': { hospitals: 18, totalUnits: 198, averageUnits: 11.0 },
        'B-': { hospitals: 8, totalUnits: 45, averageUnits: 5.6 },
        'AB+': { hospitals: 10, totalUnits: 67, averageUnits: 6.7 },
        'AB-': { hospitals: 5, totalUnits: 23, averageUnits: 4.6 },
        'O+': { hospitals: 20, totalUnits: 312, averageUnits: 15.6 },
        'O-': { hospitals: 14, totalUnits: 156, averageUnits: 11.1 }
      };

      res.json({
        success: true,
        data: availability,
        location: latitude && longitude ? { latitude, longitude, radius } : null
      });
    } catch (error) {
      logger.error('Error in getBloodTypeAvailability:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get blood type availability'
      });
    }
  }

  /**
   * Get system-wide expiry alerts (admin only)
   */
  async getSystemWideExpiryAlerts(req, res) {
    try {
      const alerts = await inventoryService.getSystemWideExpiryAlerts();

      res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      logger.error('Error in getSystemWideExpiryAlerts:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get system-wide expiry alerts'
      });
    }
  }

  /**
   * Get system-wide low stock alerts (admin only)
   */
  async getSystemWideLowStockAlerts(req, res) {
    try {
      const alerts = await inventoryService.getSystemWideLowStockAlerts();

      res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      logger.error('Error in getSystemWideLowStockAlerts:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get system-wide low stock alerts'
      });
    }
  }

  /**
   * Process expired inventory (admin only - typically run as cron job)
   */
  async processExpiredInventory(req, res) {
    try {
      const result = await inventoryService.processExpiredInventory();

      res.json({
        success: true,
        message: 'Expired inventory processed successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error in processExpiredInventory:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process expired inventory'
      });
    }
  }
}

module.exports = new InventoryController();