const Hospital = require('../models/Hospital');
const logger = require('../utils/logger');

/**
 * Middleware to verify hospital admin access
 * Ensures the authenticated user is the admin of the hospital being accessed
 */
const hospitalAuth = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const userId = req.user.id;

    // Check if user is a system admin (they can access any hospital)
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      return next();
    }

    // Check if user is a hospital admin
    if (req.user.role !== 'hospital_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Hospital admin role required.'
      });
    }

    // Find the hospital and verify the user is its admin
    const hospital = await Hospital.findById(hospitalId);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    if (hospital.adminUser.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to manage this hospital.'
      });
    }

    // Check if hospital is active
    if (!hospital.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Hospital account is inactive'
      });
    }

    // Add hospital to request object for use in controllers
    req.hospital = hospital;
    
    next();
  } catch (error) {
    logger.error('Error in hospital auth middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = hospitalAuth;