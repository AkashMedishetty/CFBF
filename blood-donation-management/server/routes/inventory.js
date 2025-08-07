const express = require('express');
const { body, param, query } = require('express-validator');
const inventoryController = require('../controllers/inventoryController');
const { auth, adminOnly, hospitalOnly } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const inventoryUpdateValidation = [
  body('bloodType')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood type'),
  
  body('unitsToAdd')
    .isInt({ min: 1 })
    .withMessage('Units to add must be a positive integer'),
  
  body('expirationDate')
    .isISO8601()
    .toDate()
    .withMessage('Invalid expiration date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
      return true;
    })
];

const inventoryConsumeValidation = [
  body('bloodType')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood type'),
  
  body('unitsToConsume')
    .isInt({ min: 1 })
    .withMessage('Units to consume must be a positive integer'),
  
  body('reason')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Reason must be between 3 and 200 characters')
];

const thresholdValidation = [
  body('bloodType')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood type'),
  
  body('threshold')
    .isInt({ min: 0, max: 100 })
    .withMessage('Threshold must be between 0 and 100')
];

const redistributionValidation = [
  body('fromHospitalId')
    .isMongoId()
    .withMessage('Invalid source hospital ID'),
  
  body('toHospitalId')
    .isMongoId()
    .withMessage('Invalid destination hospital ID'),
  
  body('bloodType')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood type'),
  
  body('units')
    .isInt({ min: 1 })
    .withMessage('Units must be a positive integer')
];

const hospitalIdValidation = [
  param('hospitalId')
    .isMongoId()
    .withMessage('Invalid hospital ID')
];

// Public routes
router.get('/availability', inventoryController.getBloodTypeAvailability);

// Protected routes (require authentication)
router.use(auth);

// Hospital admin routes
router.get('/:hospitalId', 
  hospitalIdValidation, 
  hospitalOnly, 
  inventoryController.getHospitalInventory
);

router.post('/:hospitalId/update', 
  hospitalIdValidation, 
  inventoryUpdateValidation, 
  hospitalOnly, 
  inventoryController.updateInventory
);

router.post('/:hospitalId/consume', 
  hospitalIdValidation, 
  inventoryConsumeValidation, 
  hospitalOnly, 
  inventoryController.consumeInventory
);

router.post('/:hospitalId/threshold', 
  hospitalIdValidation, 
  thresholdValidation, 
  hospitalOnly, 
  inventoryController.setMinimumThreshold
);

router.get('/:hospitalId/analytics', 
  hospitalIdValidation, 
  hospitalOnly, 
  inventoryController.getInventoryAnalytics
);

router.get('/:hospitalId/alerts', 
  hospitalIdValidation, 
  hospitalOnly, 
  inventoryController.getInventoryAlerts
);

// Admin only routes
router.get('/admin/low-inventory', 
  adminOnly, 
  inventoryController.getHospitalsWithLowInventory
);

router.get('/admin/expiry-alerts', 
  adminOnly, 
  inventoryController.getSystemWideExpiryAlerts
);

router.get('/admin/low-stock-alerts', 
  adminOnly, 
  inventoryController.getSystemWideLowStockAlerts
);

router.post('/admin/process-expired', 
  adminOnly, 
  inventoryController.processExpiredInventory
);

router.post('/admin/redistribute', 
  redistributionValidation, 
  adminOnly, 
  inventoryController.redistributeBlood
);

module.exports = router;