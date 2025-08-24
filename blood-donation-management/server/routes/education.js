const express = require('express');
const router = express.Router();
const EducationalContent = require('../models/EducationalContent');
const FAQ = require('../models/FAQ');
const mockEducationService = require('../services/mockEducationService');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Helper function to check if database is connected
const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Get all published educational content
router.get('/content', async (req, res) => {
  try {
    const {
      category,
      type,
      difficulty,
      search,
      page = 1,
      limit = 12,
      sort = '-publishedAt'
    } = req.query;

    let result;

    if (isDatabaseConnected()) {
      // Use database
      const filter = { isPublished: true };
      
      if (category && category !== 'all') {
        filter.category = category;
      }
      
      if (type) {
        filter.type = type;
      }
      
      if (difficulty) {
        filter.difficulty = difficulty;
      }

      let query = EducationalContent.find(filter);

      if (search) {
        query = EducationalContent.find({
          ...filter,
          $text: { $search: search }
        });
      }

      query = query.sort(sort);
      const skip = (parseInt(page) - 1) * parseInt(limit);
      query = query.skip(skip).limit(parseInt(limit));

      const content = await query.populate('relatedContent', 'title slug type difficulty readingTime');
      const total = await EducationalContent.countDocuments(filter);

      result = {
        data: content,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      };
    } else {
      // Use mock service
      logger.warn('Database not connected, using mock data', 'EDUCATION');
      result = await mockEducationService.getContent({
        category,
        type,
        difficulty,
        search,
        page,
        limit,
        sort
      });
    }

    logger.info(`Retrieved ${result.data.length} educational content items`, 'EDUCATION');

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error fetching educational content', 'EDUCATION', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch educational content',
      error: error.message
    });
  }
});

// Get single educational content by slug
router.get('/content/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    let content;

    if (isDatabaseConnected()) {
      // Use database
      content = await EducationalContent.findOne({ 
        slug, 
        isPublished: true 
      }).populate('relatedContent', 'title slug type difficulty readingTime featuredImage');

      if (content) {
        await content.incrementViews();

        if (!content.relatedContent || content.relatedContent.length === 0) {
          const relatedContent = await EducationalContent.find({
            _id: { $ne: content._id },
            category: content.category,
            isPublished: true
          })
          .limit(3)
          .select('title slug type difficulty readingTime featuredImage');
          
          content.relatedContent = relatedContent;
        }
      }
    } else {
      // Use mock service
      logger.warn('Database not connected, using mock data', 'EDUCATION');
      content = await mockEducationService.getContentBySlug(slug);
    }

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Educational content not found'
      });
    }

    logger.info(`Retrieved educational content: ${content.title}`, 'EDUCATION');

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    logger.error('Error fetching educational content by slug', 'EDUCATION', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch educational content',
      error: error.message
    });
  }
});

// Track download
router.post('/content/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    let success = false;

    if (isDatabaseConnected()) {
      // Use database
      const content = await EducationalContent.findById(id);
      if (content) {
        await content.incrementDownloads();
        success = true;
        logger.info(`Download tracked for content: ${content.title}`, 'EDUCATION');
      }
    } else {
      // Use mock service
      logger.warn('Database not connected, using mock data', 'EDUCATION');
      success = await mockEducationService.incrementDownloads(id);
    }

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Educational content not found'
      });
    }

    res.json({
      success: true,
      message: 'Download tracked successfully'
    });
  } catch (error) {
    logger.error('Error tracking download', 'EDUCATION', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track download',
      error: error.message
    });
  }
});

// Get featured content
router.get('/featured', async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    
    let featuredContent;

    if (isDatabaseConnected()) {
      // Use database
     featuredContent = await EducationalContent.getFeatured(parseInt(limit));
    } else {
      // Use mock service
      logger.warn('Database not connected, using mock data', 'EDUCATION');
      featuredContent = await mockEducationService.getFeaturedContent(parseInt(limit));
    }

    logger.info(`Retrieved ${featuredContent.length} featured content items`, 'EDUCATION');

    res.json({
      success: true,
      data: featuredContent
    });
  } catch (error) {
    logger.error('Error fetching featured content', 'EDUCATION', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured content',
      error: error.message
    });
  }
});

// Get popular content
router.get('/popular', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    let popularContent;

    if (isDatabaseConnected()) {
      // Use database
     popularContent = await EducationalContent.getPopular(parseInt(limit));
    } else {
      // Use mock service
      logger.warn('Database not connected, using mock data', 'EDUCATION');
      popularContent = await mockEducationService.getPopularContent(parseInt(limit));
    }

    logger.info(`Retrieved ${popularContent.length} popular content items`, 'EDUCATION');

    res.json({
      success: true,
      data: popularContent
    });
  } catch (error) {
    logger.error('Error fetching popular content', 'EDUCATION', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular content',
      error: error.message
    });
  }
});

// Get content categories with counts
router.get('/categories', async (req, res) => {
  try {
    let categories;

    if (isDatabaseConnected()) {
      // Use database
      categories = await EducationalContent.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { category: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } }
      ]);
    } else {
      // Use mock service
      logger.warn('Database not connected, using mock data', 'EDUCATION');
      categories = await mockEducationService.getContentCategories();
    }

    logger.info(`Retrieved ${categories.length} content categories`, 'EDUCATION');

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Error fetching content categories', 'EDUCATION', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content categories',
      error: error.message
    });
  }
});

// Get all published FAQs
router.get('/faqs', async (req, res) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 20,
      sort = '-priority'
    } = req.query;

    let result;

    if (isDatabaseConnected()) {
      // Use database
      const filter = { isPublished: true };
      
      if (category && category !== 'all') {
        filter.category = category;
      }

      let query = FAQ.find(filter);

      if (search) {
        query = FAQ.find({
          ...filter,
          $text: { $search: search }
        });
      }

      query = query.sort(sort);
      const skip = (parseInt(page) - 1) * parseInt(limit);
      query = query.skip(skip).limit(parseInt(limit));

      const faqs = await query.populate('relatedFAQs', 'question category');
      const total = await FAQ.countDocuments(filter);

      result = {
        data: faqs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      };
    } else {
      // Use mock service
      logger.warn('Database not connected, using mock data', 'EDUCATION');
      result = await mockEducationService.getFAQs({
        category,
        search,
        page,
        limit,
        sort
      });
    }

    logger.info(`Retrieved ${result.data.length} FAQ items`, 'EDUCATION');

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error fetching FAQs', 'EDUCATION', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs',
      error: error.message
    });
  }
});

// Get single FAQ by ID
router.get('/faqs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let faq;

    if (isDatabaseConnected()) {
      // Use database
      faq = await FAQ.findOne({ 
        _id: id, 
        isPublished: true 
      }).populate('relatedFAQs', 'question category');

      if (faq) {
        await faq.incrementViews();
      }
    } else {
      // Use mock service
      logger.warn('Database not connected, using mock data', 'EDUCATION');
      faq = await mockEducationService.getFAQById(id);
    }

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    logger.info(`Retrieved FAQ: ${faq.question.substring(0, 50)}...`, 'EDUCATION');

    res.json({
      success: true,
      data: faq
    });
  } catch (error) {
    logger.error('Error fetching FAQ by ID', 'EDUCATION', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ',
      error: error.message
    });
  }
});

// Submit FAQ feedback
router.post('/faqs/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body;
    
    if (typeof helpful !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Helpful field must be a boolean'
      });
    }

    let success = false;

    if (isDatabaseConnected()) {
      // Use database
      const faq = await FAQ.findById(id);
      if (faq) {
        await faq.addHelpfulVote(helpful);
        success = true;
      }
    } else {
      // Use mock service
      logger.warn('Database not connected, using mock data', 'EDUCATION');
      success = await mockEducationService.addFAQFeedback(id, helpful);
    }

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    logger.info(`Feedback submitted for FAQ: ${helpful ? 'helpful' : 'not helpful'}`, 'EDUCATION');

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    logger.error('Error submitting FAQ feedback', 'EDUCATION', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

// Get FAQ categories with counts
router.get('/faqs/categories', async (req, res) => {
  try {
    let categories;

    if (isDatabaseConnected()) {
      // Use database
      categories = await FAQ.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { category: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } }
      ]);
    } else {
      // Use mock service
      logger.warn('Database not connected, using mock data', 'EDUCATION');
      categories = await mockEducationService.getFAQCategories();
    }

    logger.info(`Retrieved ${categories.length} FAQ categories`, 'EDUCATION');

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Error fetching FAQ categories', 'EDUCATION', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ categories',
      error: error.message
    });
  }
});

module.exports = router;