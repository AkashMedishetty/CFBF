const express = require('express');
const { body, param, query } = require('express-validator');
const hospitalController = require('../controllers/hospitalController');
const { auth, adminOnly, hospitalOnly } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const hospitalRegistrationValidation = [
  body('hospitalData.name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Hospital name must be between 2 and 200 characters'),
  
  body('hospitalData.type')
    .isIn(['hospital', 'blood_bank', 'clinic', 'diagnostic_center'])
    .withMessage('Invalid hospital type'),
  
  body('hospitalData.registrationNumber')
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Registration number must be between 5 and 50 characters'),
  
  body('hospitalData.location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Location coordinates must be an array of [longitude, latitude]'),
  
  body('hospitalData.location.coordinates.*')
    .isFloat()
    .withMessage('Coordinates must be valid numbers'),
  
  body('hospitalData.address.street')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),
  
  body('hospitalData.address.city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('hospitalData.address.state')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  
  body('hospitalData.address.pincode')
    .matches(/^[0-9]{6}$/)
    .withMessage('Pincode must be a 6-digit number'),
  
  body('hospitalData.contactInfo.phone')
    .isMobilePhone('en-IN')
    .withMessage('Invalid phone number'),
  
  body('hospitalData.contactInfo.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  
  body('hospitalData.services')
    .isArray({ min: 1 })
    .withMessage('At least one service must be selected'),
  
  body('adminUserData.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Admin name must be between 2 and 100 characters'),
  
  body('adminUserData.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid admin email address'),
  
  body('adminUserData.phone')
    .isMobilePhone('en-IN')
    .withMessage('Invalid admin phone number'),
  
  body('adminUserData.password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character')
];

const hospitalUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Hospital name must be between 2 and 200 characters'),
  
  body('contactInfo.phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Invalid phone number'),
  
  body('contactInfo.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  
  body('services')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one service must be selected')
];

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
];

const inventoryConsumeValidation = [
  body('bloodType')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood type'),
  
  body('unitsToConsume')
    .isInt({ min: 1 })
    .withMessage('Units to consume must be a positive integer')
];

const ratingValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('review')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Review must not exceed 500 characters'),
  
  body('category')
    .optional()
    .isIn(['staff', 'facility', 'service', 'overall'])
    .withMessage('Invalid rating category')
];

const verificationValidation = [
  body('verificationStatus')
    .isIn(['verified', 'rejected', 'suspended'])
    .withMessage('Invalid verification status'),
  
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes must not exceed 1000 characters')
];

const hospitalIdValidation = [
  param('hospitalId')
    .isMongoId()
    .withMessage('Invalid hospital ID')
];

// Public routes
router.get('/metadata', hospitalController.getHospitalMetadata);
router.get('/search', hospitalController.searchHospitals);
router.get('/nearby', hospitalController.findNearbyHospitals);
router.get('/:hospitalId', hospitalIdValidation, hospitalController.getHospitalProfile);

// Registration route (public)
router.post('/register', hospitalRegistrationValidation, hospitalController.registerHospital);

// Protected routes (require authentication)
router.use(auth);

// Get current hospital profile for logged-in hospital admin
router.get('/me', 
  hospitalOnly,
  async (req, res) => {
    try {
      const hospital = await require('../models/Hospital').findOne({ adminUser: req.user.id })
        .populate('adminUser', 'name email phoneNumber')
        .lean();
      if (!hospital) {
        return res.status(404).json({ success: false, error: 'HOSPITAL_NOT_FOUND', message: 'No hospital found for this admin' });
      }
      res.json({ success: true, data: hospital });
    } catch (e) {
      res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR' });
    }
  }
);

// Hospital admin routes
router.put('/:hospitalId', 
  hospitalIdValidation, 
  hospitalUpdateValidation, 
  hospitalOnly, 
  hospitalController.updateHospitalProfile
);

router.post('/:hospitalId/inventory', 
  hospitalIdValidation, 
  inventoryUpdateValidation, 
  hospitalOnly, 
  hospitalController.updateInventory
);

router.post('/:hospitalId/inventory/consume', 
  hospitalIdValidation, 
  inventoryConsumeValidation, 
  hospitalOnly, 
  hospitalController.consumeInventory
);

router.get('/:hospitalId/analytics', 
  hospitalIdValidation, 
  hospitalOnly, 
  hospitalController.getHospitalAnalytics
);

// User routes (for ratings)
router.post('/:hospitalId/rating', 
  hospitalIdValidation, 
  ratingValidation, 
  hospitalController.addRating
);

// Admin only routes
router.get('/admin/pending-verifications', 
  adminOnly, 
  hospitalController.getPendingVerifications
);

router.post('/:hospitalId/verify', 
  hospitalIdValidation, 
  verificationValidation, 
  adminOnly, 
  hospitalController.verifyHospital
);

module.exports = router;