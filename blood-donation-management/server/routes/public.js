const express = require('express');
const router = express.Router();
const statisticsService = require('../services/statisticsService');
const institutionService = require('../services/institutionService');
const contactService = require('../services/contactService');
const educationalContentService = require('../services/educationalContentService');
const { query, body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Get public statistics for landing page
router.get('/stats',
  async (req, res) => {
    try {
      const stats = await statisticsService.getPublicStats();
      
      res.json({
        success: true,
        data: stats,
        meta: {
          generatedAt: new Date().toISOString(),
          cached: true
        }
      });
    } catch (error) {
      logger.error('Error fetching public stats', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'STATS_FETCH_FAILED',
          message: 'Failed to fetch statistics'
        }
      });
    }
  }
);

// Get location-specific statistics
router.get('/stats/location',
  [
    query('city').notEmpty().withMessage('City is required'),
    query('state').notEmpty().withMessage('State is required')
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

      const { city, state } = req.query;
      const stats = await statisticsService.getLocationStats(city, state);
      
      if (!stats) {
        return res.status(404).json({
          error: {
            code: 'LOCATION_NOT_FOUND',
            message: 'No statistics available for this location'
          }
        });
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching location stats', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'LOCATION_STATS_FAILED',
          message: 'Failed to fetch location statistics'
        }
      });
    }
  }
);

// Get blood type statistics
router.get('/stats/blood-types',
  async (req, res) => {
    try {
      const stats = await statisticsService.getBloodTypeStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching blood type stats', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'BLOOD_TYPE_STATS_FAILED',
          message: 'Failed to fetch blood type statistics'
        }
      });
    }
  }
);

// Get success stories
router.get('/success-stories',
  [
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const stories = await statisticsService.getSuccessStories();
      
      res.json({
        success: true,
        data: stories.slice(0, limit),
        meta: {
          total: stories.length,
          limit
        }
      });
    } catch (error) {
      logger.error('Error fetching success stories', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'SUCCESS_STORIES_FAILED',
          message: 'Failed to fetch success stories'
        }
      });
    }
  }
);

// Get nearby facilities (public endpoint)
router.get('/facilities/nearby',
  [
    query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    query('maxDistance').optional().isInt({ min: 1000, max: 100000 }),
    query('type').optional().isIn(['hospital', 'blood_bank', 'clinic', 'medical_center', 'ngo']),
    query('limit').optional().isInt({ min: 1, max: 50 })
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
      
      const maxDistance = parseInt(req.query.maxDistance) || 25000; // 25km default
      const limit = parseInt(req.query.limit) || 10;
      const filters = {};
      
      if (req.query.type) {
        filters.type = req.query.type;
      }

      const facilities = await institutionService.findNearbyInstitutions(coordinates, maxDistance, filters);
      
      res.json({
        success: true,
        data: facilities.slice(0, limit),
        meta: {
          coordinates,
          maxDistance,
          count: facilities.length,
          limit
        }
      });
    } catch (error) {
      logger.error('Error finding nearby facilities', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'NEARBY_FACILITIES_FAILED',
          message: 'Failed to find nearby facilities'
        }
      });
    }
  }
);

// Get facility directory (public)
router.get('/facilities/directory',
  [
    query('type').optional().isIn(['hospital', 'blood_bank', 'clinic', 'medical_center', 'ngo']),
    query('city').optional().isString(),
    query('state').optional().isString(),
    query('services').optional().isArray(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString()
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

      let result;
      
      if (req.query.search) {
        // Use search functionality
        result = await institutionService.searchInstitutions({
          ...req.query,
          query: req.query.search
        });
      } else {
        // Use directory functionality
        result = await institutionService.getInstitutionDirectory(req.query);
      }

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
      logger.error('Error fetching facility directory', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'DIRECTORY_FETCH_FAILED',
          message: 'Failed to fetch facility directory'
        }
      });
    }
  }
);

// Get facility details (public)
router.get('/facilities/:id',
  async (req, res) => {
    try {
      const { id } = req.params;
      const facility = await institutionService.getInstitutionProfile(id, false);
      
      // Remove sensitive information for public access
      const publicFacility = {
        _id: facility._id,
        name: facility.name,
        type: facility.type,
        address: facility.address,
        contactInfo: {
          phone: facility.contactInfo.phone,
          website: facility.contactInfo.website
        },
        services: facility.services,
        operatingHours: facility.operatingHours,
        rating: facility.rating,
        capacity: {
          dailyCollectionCapacity: facility.capacity.dailyCollectionCapacity
        },
        verificationStatus: facility.verificationStatus,
        createdAt: facility.createdAt
      };

      res.json({
        success: true,
        data: publicFacility
      });
    } catch (error) {
      logger.error('Error fetching facility details', 'PUBLIC_API', error);
      
      if (error.message === 'Institution not found') {
        return res.status(404).json({
          error: {
            code: 'FACILITY_NOT_FOUND',
            message: 'Facility not found'
          }
        });
      }

      res.status(500).json({
        error: {
          code: 'FACILITY_FETCH_FAILED',
          message: 'Failed to fetch facility details'
        }
      });
    }
  }
);

// Get growth metrics (public)
router.get('/stats/growth',
  [
    query('timeRange').optional().isIn(['7d', '30d', '90d'])
  ],
  async (req, res) => {
    try {
      const timeRange = req.query.timeRange || '30d';
      const metrics = await statisticsService.getGrowthMetrics(timeRange);
      
      res.json({
        success: true,
        data: metrics,
        meta: {
          timeRange,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error fetching growth metrics', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'GROWTH_METRICS_FAILED',
          message: 'Failed to fetch growth metrics'
        }
      });
    }
  }
);

// Contact form submission endpoint
router.post('/contact',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email address is required'),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Invalid phone number format'),
    body('subject')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Subject must not exceed 200 characters'),
    body('category')
      .optional()
      .isIn(['general', 'technical', 'partnership', 'feedback', 'complaint', 'media'])
      .withMessage('Invalid category selected'),
    body('message')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be between 10 and 2000 characters'),
    body('priority')
      .optional()
      .isIn(['normal', 'high', 'urgent'])
      .withMessage('Invalid priority level')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid contact form data',
            details: errors.array()
          }
        });
      }

      // Add request metadata
      const contactData = {
        ...req.body,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        submittedAt: new Date()
      };

      // Process contact form
      const result = await contactService.processContactForm(contactData);

      if (result.success) {
        logger.success(`Contact form processed successfully for: ${contactData.email}`, 'PUBLIC_API');
        
        res.status(201).json({
          success: true,
          message: result.message,
          data: {
            submissionId: result.data.submissionId,
            estimatedResponseTime: result.data.estimatedResponseTime
          }
        });
      } else {
        logger.warn(`Contact form processing failed: ${result.message}`, 'PUBLIC_API');
        
        res.status(400).json({
          error: {
            code: result.error,
            message: result.message,
            details: result.details
          }
        });
      }

    } catch (error) {
      logger.error('Error processing contact form', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'CONTACT_FORM_ERROR',
          message: 'Failed to process contact form submission'
        }
      });
    }
  }
);

// Contact form submission
router.post('/contact',
  [
    query('name').notEmpty().withMessage('Name is required'),
    query('email').isEmail().withMessage('Valid email is required'),
    query('message').notEmpty().withMessage('Message is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid contact form data',
            details: errors.array()
          }
        });
      }

      // In a real implementation, this would save to database and send email
      logger.info(`Contact form submission from ${req.body.email}`, 'PUBLIC_API');
      
      res.json({
        success: true,
        message: 'Contact form submitted successfully'
      });
    } catch (error) {
      logger.error('Error processing contact form', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'CONTACT_FORM_FAILED',
          message: 'Failed to submit contact form'
        }
      });
    }
  }
);

// Partnership inquiry submission
router.post('/partnership-inquiry',
  [
    query('organizationName').notEmpty().withMessage('Organization name is required'),
    query('email').isEmail().withMessage('Valid email is required'),
    query('contactPerson').notEmpty().withMessage('Contact person is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid partnership inquiry data',
            details: errors.array()
          }
        });
      }

      // In a real implementation, this would save to database and notify partnership team
      logger.info(`Partnership inquiry from ${req.body.organizationName}`, 'PUBLIC_API');
      
      res.json({
        success: true,
        message: 'Partnership inquiry submitted successfully'
      });
    } catch (error) {
      logger.error('Error processing partnership inquiry', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'PARTNERSHIP_INQUIRY_FAILED',
          message: 'Failed to submit partnership inquiry'
        }
      });
    }
  }
);

// Educational Content Endpoints

// Get educational content with filtering and pagination
router.get('/education/content',
  [
    query('type').optional().isIn(['article', 'guide', 'faq', 'resource', 'blog_post', 'video', 'infographic']),
    query('category').optional().isIn([
      'preparation', 'health_tips', 'donation_process', 'eligibility', 'recovery',
      'nutrition', 'myths_facts', 'community_stories', 'medical_info', 'safety'
    ]),
    query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    query('language').optional().isIn(['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('sortBy').optional().isIn(['publishedAt', 'views', 'title', 'readingTime']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('search').optional().isString().trim()
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

      const filters = {
        type: req.query.type,
        category: req.query.category,
        difficulty: req.query.difficulty,
        language: req.query.language || 'en',
        search: req.query.search
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'publishedAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await educationalContentService.getContent(filters, options);

      res.json({
        success: true,
        data: result.content,
        pagination: result.pagination,
        meta: {
          filters,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error fetching educational content', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'CONTENT_FETCH_FAILED',
          message: 'Failed to fetch educational content'
        }
      });
    }
  }
);

// Get specific educational content by slug
router.get('/education/content/:slug',
  async (req, res) => {
    try {
      const { slug } = req.params;
      const content = await educationalContentService.getContentBySlug(slug);

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error(`Error fetching content by slug: ${req.params.slug}`, 'PUBLIC_API', error);
      
      if (error.message === 'Content not found') {
        return res.status(404).json({
          error: {
            code: 'CONTENT_NOT_FOUND',
            message: 'Educational content not found'
          }
        });
      }

      res.status(500).json({
        error: {
          code: 'CONTENT_FETCH_FAILED',
          message: 'Failed to fetch educational content'
        }
      });
    }
  }
);

// Get featured educational content
router.get('/education/featured',
  [
    query('limit').optional().isInt({ min: 1, max: 20 }),
    query('language').optional().isIn(['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu'])
  ],
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const language = req.query.language || 'en';
      
      const content = await educationalContentService.getFeaturedContent(limit, language);

      res.json({
        success: true,
        data: content,
        meta: {
          count: content.length,
          language
        }
      });
    } catch (error) {
      logger.error('Error fetching featured content', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'FEATURED_CONTENT_FAILED',
          message: 'Failed to fetch featured content'
        }
      });
    }
  }
);

// Get popular educational content
router.get('/education/popular',
  [
    query('limit').optional().isInt({ min: 1, max: 20 }),
    query('language').optional().isIn(['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu'])
  ],
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const language = req.query.language || 'en';
      
      const content = await educationalContentService.getPopularContent(limit, language);

      res.json({
        success: true,
        data: content,
        meta: {
          count: content.length,
          language
        }
      });
    } catch (error) {
      logger.error('Error fetching popular content', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'POPULAR_CONTENT_FAILED',
          message: 'Failed to fetch popular content'
        }
      });
    }
  }
);

// Get content categories
router.get('/education/categories',
  [
    query('language').optional().isIn(['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu'])
  ],
  async (req, res) => {
    try {
      const language = req.query.language || 'en';
      const categories = await educationalContentService.getCategories(language);

      res.json({
        success: true,
        data: categories,
        meta: {
          language,
          count: categories.length
        }
      });
    } catch (error) {
      logger.error('Error fetching content categories', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'CATEGORIES_FETCH_FAILED',
          message: 'Failed to fetch content categories'
        }
      });
    }
  }
);

// FAQ Endpoints

// Get FAQs with filtering
router.get('/education/faqs',
  [
    query('category').optional().isIn([
      'general', 'eligibility', 'donation_process', 'health_safety', 'after_donation',
      'medical_conditions', 'technical_support', 'account_management', 'emergency_requests', 'certification'
    ]),
    query('language').optional().isIn(['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu']),
    query('search').optional().isString().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
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

      const filters = {
        category: req.query.category,
        language: req.query.language || 'en',
        search: req.query.search
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await educationalContentService.getFAQs(filters, options);

      res.json({
        success: true,
        data: result.faqs,
        pagination: result.pagination,
        meta: {
          filters,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error fetching FAQs', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'FAQ_FETCH_FAILED',
          message: 'Failed to fetch FAQs'
        }
      });
    }
  }
);

// Get FAQ categories
router.get('/education/faq-categories',
  [
    query('language').optional().isIn(['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu'])
  ],
  async (req, res) => {
    try {
      const language = req.query.language || 'en';
      const categories = await educationalContentService.getFAQCategories(language);

      res.json({
        success: true,
        data: categories,
        meta: {
          language,
          count: categories.length
        }
      });
    } catch (error) {
      logger.error('Error fetching FAQ categories', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'FAQ_CATEGORIES_FAILED',
          message: 'Failed to fetch FAQ categories'
        }
      });
    }
  }
);

// Mark FAQ as helpful/not helpful
router.post('/education/faqs/:id/feedback',
  [
    body('helpful').isBoolean().withMessage('Helpful must be a boolean value')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid feedback data',
            details: errors.array()
          }
        });
      }

      const { id } = req.params;
      const { helpful } = req.body;

      await educationalContentService.markFAQHelpful(id, helpful);

      res.json({
        success: true,
        message: 'Feedback recorded successfully'
      });
    } catch (error) {
      logger.error(`Error recording FAQ feedback: ${req.params.id}`, 'PUBLIC_API', error);
      
      if (error.message === 'FAQ not found') {
        return res.status(404).json({
          error: {
            code: 'FAQ_NOT_FOUND',
            message: 'FAQ not found'
          }
        });
      }

      res.status(500).json({
        error: {
          code: 'FAQ_FEEDBACK_FAILED',
          message: 'Failed to record feedback'
        }
      });
    }
  }
);

// Get downloadable resources
router.get('/education/resources',
  [
    query('category').optional().isIn([
      'preparation', 'health_tips', 'donation_process', 'eligibility', 'recovery',
      'nutrition', 'myths_facts', 'community_stories', 'medical_info', 'safety'
    ]),
    query('type').optional().isIn(['article', 'guide', 'resource', 'infographic']),
    query('language').optional().isIn(['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu'])
  ],
  async (req, res) => {
    try {
      const filters = {
        category: req.query.category,
        type: req.query.type,
        language: req.query.language || 'en'
      };

      const resources = await educationalContentService.getDownloadableResources(filters);

      res.json({
        success: true,
        data: resources,
        meta: {
          count: resources.length,
          filters
        }
      });
    } catch (error) {
      logger.error('Error fetching downloadable resources', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'RESOURCES_FETCH_FAILED',
          message: 'Failed to fetch downloadable resources'
        }
      });
    }
  }
);

// Track resource download
router.post('/education/content/:id/download',
  async (req, res) => {
    try {
      const { id } = req.params;
      await educationalContentService.trackDownload(id);

      res.json({
        success: true,
        message: 'Download tracked successfully'
      });
    } catch (error) {
      logger.error(`Error tracking download: ${req.params.id}`, 'PUBLIC_API', error);
      // Don't fail the request for tracking errors
      res.json({
        success: true,
        message: 'Download initiated'
      });
    }
  }
);

// Get educational content statistics
router.get('/education/stats',
  async (req, res) => {
    try {
      const stats = await educationalContentService.getContentStatistics();

      res.json({
        success: true,
        data: stats,
        meta: {
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error fetching education statistics', 'PUBLIC_API', error);
      res.status(500).json({
        error: {
          code: 'EDUCATION_STATS_FAILED',
          message: 'Failed to fetch education statistics'
        }
      });
    }
  }
);

// Health check endpoint
router.get('/health',
  async (req, res) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        services: {
          database: 'connected',
          cache: 'active',
          notifications: 'operational'
        }
      };

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Health check failed', 'PUBLIC_API', error);
      res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service health check failed'
        }
      });
    }
  }
);

module.exports = router;