const EducationalContent = require('../models/EducationalContent');
const FAQ = require('../models/FAQ');
const logger = require('../utils/logger');

class EducationalContentService {
  // Get all published content with pagination and filters
  async getContent(filters = {}, options = {}) {
    try {
      const {
        type,
        category,
        tags,
        language = 'en',
        difficulty,
        author,
        search
      } = filters;

      const {
        page = 1,
        limit = 10,
        sortBy = 'publishedAt',
        sortOrder = 'desc'
      } = options;

      // Build query
      const query = {
        isPublished: true,
        language
      };

      if (type) query.type = type;
      if (category) query.category = category;
      if (difficulty) query.difficulty = difficulty;
      if (author) query['author.name'] = new RegExp(author, 'i');
      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      // Add search functionality
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const [content, total] = await Promise.all([
        EducationalContent.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate('relatedContent', 'title slug type category featuredImage readingTime')
          .lean(),
        EducationalContent.countDocuments(query)
      ]);

      return {
        content,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching educational content', 'EDUCATION_SERVICE', error);
      throw new Error('Failed to fetch educational content');
    }
  }

  // Get content by slug
  async getContentBySlug(slug, incrementViews = true) {
    try {
      const content = await EducationalContent.findOne({
        slug,
        isPublished: true
      }).populate('relatedContent', 'title slug type category featuredImage readingTime');

      if (!content) {
        throw new Error('Content not found');
      }

      // Increment views if requested
      if (incrementViews) {
        await content.incrementViews();
      }

      return content;
    } catch (error) {
      logger.error(`Error fetching content by slug: ${slug}`, 'EDUCATION_SERVICE', error);
      throw error;
    }
  }

  // Get content by category
  async getContentByCategory(category, limit = 10, language = 'en') {
    try {
      return await EducationalContent.getByCategory(category, limit);
    } catch (error) {
      logger.error(`Error fetching content by category: ${category}`, 'EDUCATION_SERVICE', error);
      throw new Error('Failed to fetch content by category');
    }
  }

  // Get featured content
  async getFeaturedContent(limit = 5, language = 'en') {
    try {
      return await EducationalContent.find({
        isFeatured: true,
        isPublished: true,
        language
      })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .populate('relatedContent', 'title slug type category featuredImage');
    } catch (error) {
      logger.error('Error fetching featured content', 'EDUCATION_SERVICE', error);
      throw new Error('Failed to fetch featured content');
    }
  }

  // Get popular content (by views)
  async getPopularContent(limit = 10, language = 'en') {
    try {
      return await EducationalContent.find({
        isPublished: true,
        language
      })
      .sort({ views: -1, publishedAt: -1 })
      .limit(limit)
      .select('title slug type category featuredImage readingTime views publishedAt author');
    } catch (error) {
      logger.error('Error fetching popular content', 'EDUCATION_SERVICE', error);
      throw new Error('Failed to fetch popular content');
    }
  }

  // Get recent content
  async getRecentContent(limit = 10, language = 'en') {
    try {
      return await EducationalContent.find({
        isPublished: true,
        language
      })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select('title slug type category featuredImage readingTime publishedAt author');
    } catch (error) {
      logger.error('Error fetching recent content', 'EDUCATION_SERVICE', error);
      throw new Error('Failed to fetch recent content');
    }
  }

  // Get content categories with counts
  async getCategories(language = 'en') {
    try {
      const categories = await EducationalContent.aggregate([
        {
          $match: {
            isPublished: true,
            language
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            latestContent: { $first: '$$ROOT' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      return categories.map(cat => ({
        category: cat._id,
        count: cat.count,
        latestTitle: cat.latestContent.title,
        latestSlug: cat.latestContent.slug
      }));
    } catch (error) {
      logger.error('Error fetching content categories', 'EDUCATION_SERVICE', error);
      throw new Error('Failed to fetch content categories');
    }
  }

  // Get all FAQs with filtering
  async getFAQs(filters = {}, options = {}) {
    try {
      const {
        category,
        language = 'en',
        search
      } = filters;

      const {
        page = 1,
        limit = 20
      } = options;

      let query = {
        isPublished: true,
        language
      };

      if (category && category !== 'all') {
        query.category = category;
      }

      if (search) {
        query.$or = [
          { question: { $regex: search, $options: 'i' } },
          { answer: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      const skip = (page - 1) * limit;

      const [faqs, total] = await Promise.all([
        FAQ.find(query)
          .sort({ priority: -1, helpful: -1 })
          .skip(skip)
          .limit(limit)
          .populate('relatedFAQs', 'question category')
          .lean(),
        FAQ.countDocuments(query)
      ]);

      return {
        faqs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching FAQs', 'EDUCATION_SERVICE', error);
      throw new Error('Failed to fetch FAQs');
    }
  }

  // Get FAQ categories with counts
  async getFAQCategories(language = 'en') {
    try {
      const categories = await FAQ.aggregate([
        {
          $match: {
            isPublished: true,
            language
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      return categories.map(cat => ({
        category: cat._id,
        count: cat.count
      }));
    } catch (error) {
      logger.error('Error fetching FAQ categories', 'EDUCATION_SERVICE', error);
      throw new Error('Failed to fetch FAQ categories');
    }
  }

  // Mark FAQ as helpful/not helpful
  async markFAQHelpful(faqId, isHelpful = true) {
    try {
      const faq = await FAQ.findById(faqId);
      if (!faq) {
        throw new Error('FAQ not found');
      }

      await faq.markHelpful(isHelpful);
      return faq;
    } catch (error) {
      logger.error(`Error marking FAQ as helpful: ${faqId}`, 'EDUCATION_SERVICE', error);
      throw error;
    }
  }

  // Get downloadable resources
  async getDownloadableResources(filters = {}) {
    try {
      const {
        category,
        type,
        language = 'en'
      } = filters;

      const query = {
        isPublished: true,
        language,
        'downloadableFiles.0': { $exists: true } // Has at least one downloadable file
      };

      if (category) query.category = category;
      if (type) query.type = type;

      const resources = await EducationalContent.find(query)
        .sort({ publishedAt: -1 })
        .select('title slug category downloadableFiles featuredImage author publishedAt downloadCount')
        .lean();

      return resources;
    } catch (error) {
      logger.error('Error fetching downloadable resources', 'EDUCATION_SERVICE', error);
      throw new Error('Failed to fetch downloadable resources');
    }
  }

  // Track download
  async trackDownload(contentId) {
    try {
      await EducationalContent.findByIdAndUpdate(
        contentId,
        { $inc: { downloadCount: 1 } }
      );
    } catch (error) {
      logger.error(`Error tracking download for content: ${contentId}`, 'EDUCATION_SERVICE', error);
      // Don't throw error for tracking failures
    }
  }

  // Get content statistics
  async getContentStatistics() {
    try {
      const [
        totalContent,
        totalFAQs,
        totalViews,
        totalDownloads,
        contentByCategory,
        popularContent
      ] = await Promise.all([
        EducationalContent.countDocuments({ isPublished: true }),
        FAQ.countDocuments({ isPublished: true }),
        EducationalContent.aggregate([
          { $match: { isPublished: true } },
          { $group: { _id: null, total: { $sum: '$views' } } }
        ]),
        EducationalContent.aggregate([
          { $match: { isPublished: true } },
          { $group: { _id: null, total: { $sum: '$downloadCount' } } }
        ]),
        EducationalContent.aggregate([
          { $match: { isPublished: true } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        EducationalContent.find({ isPublished: true })
          .sort({ views: -1 })
          .limit(5)
          .select('title views category')
      ]);

      return {
        totalContent,
        totalFAQs,
        totalViews: totalViews[0]?.total || 0,
        totalDownloads: totalDownloads[0]?.total || 0,
        contentByCategory,
        popularContent
      };
    } catch (error) {
      logger.error('Error fetching content statistics', 'EDUCATION_SERVICE', error);
      throw new Error('Failed to fetch content statistics');
    }
  }
}

module.exports = new EducationalContentService();