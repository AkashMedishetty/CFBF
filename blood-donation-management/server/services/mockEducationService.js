const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class MockEducationService {
  constructor() {
    this.mockDataPath = path.join(__dirname, '../data/mockEducationalContent.json');
    this.mockData = null;
    this.loadMockData();
  }

  loadMockData() {
    try {
      const rawData = fs.readFileSync(this.mockDataPath, 'utf8');
      this.mockData = JSON.parse(rawData);
      logger.info('Mock educational content data loaded successfully', 'MOCK_SERVICE');
    } catch (error) {
      logger.error('Failed to load mock educational content data', 'MOCK_SERVICE', error);
      this.mockData = { content: [], faqs: [] };
    }
  }

  // Educational Content Methods
  async getContent(filters = {}) {
    try {
      let content = [...this.mockData.content];
      
      // Apply filters
      if (filters.category && filters.category !== 'all') {
        content = content.filter(item => item.category === filters.category);
      }
      
      if (filters.type) {
        content = content.filter(item => item.type === filters.type);
      }
      
      if (filters.difficulty) {
        content = content.filter(item => item.difficulty === filters.difficulty);
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        content = content.filter(item => 
          item.title.toLowerCase().includes(searchTerm) ||
          item.excerpt.toLowerCase().includes(searchTerm) ||
          item.content.toLowerCase().includes(searchTerm) ||
          item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }
      
      // Apply sorting
      if (filters.sort === '-views') {
        content.sort((a, b) => b.views - a.views);
      } else if (filters.sort === '-publishedAt') {
        content.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      }
      
      // Apply pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 12;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedContent = content.slice(startIndex, endIndex);
      
      return {
        data: paginatedContent,
        pagination: {
          page,
          limit,
          total: content.length,
          pages: Math.ceil(content.length / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting mock content', 'MOCK_SERVICE', error);
      throw error;
    }
  }

  async getContentBySlug(slug) {
    try {
      const content = this.mockData.content.find(item => item.slug === slug);
      if (!content) {
        return null;
      }
      
      // Simulate view increment
      content.views += 1;
      
      // Add related content (same category, different article)
      const relatedContent = this.mockData.content
        .filter(item => item.category === content.category && item._id !== content._id)
        .slice(0, 3)
        .map(item => ({
          _id: item._id,
          title: item.title,
          slug: item.slug,
          type: item.type,
          difficulty: item.difficulty,
          readingTime: item.readingTime,
          featuredImage: item.featuredImage
        }));
      
      return {
        ...content,
        relatedContent
      };
    } catch (error) {
      logger.error('Error getting mock content by slug', 'MOCK_SERVICE', error);
      throw error;
    }
  }

  async getFeaturedContent(limit = 3) {
    try {
      const featuredContent = this.mockData.content
        .filter(item => item.isFeatured && item.isPublished)
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, limit);
      
      return featuredContent;
    } catch (error) {
      logger.error('Error getting mock featured content', 'MOCK_SERVICE', error);
      throw error;
    }
  }

  async getPopularContent(limit = 5) {
    try {
      const popularContent = this.mockData.content
        .filter(item => item.isPublished)
        .sort((a, b) => b.views - a.views)
        .slice(0, limit)
        .map(item => ({
          _id: item._id,
          title: item.title,
          views: item.views,
          slug: item.slug,
          type: item.type
        }));
      
      return popularContent;
    } catch (error) {
      logger.error('Error getting mock popular content', 'MOCK_SERVICE', error);
      throw error;
    }
  }

  async getContentCategories() {
    try {
      const categories = {};
      
      this.mockData.content
        .filter(item => item.isPublished)
        .forEach(item => {
          if (categories[item.category]) {
            categories[item.category]++;
          } else {
            categories[item.category] = 1;
          }
        });
      
      const categoryArray = Object.entries(categories)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
      
      return categoryArray;
    } catch (error) {
      logger.error('Error getting mock content categories', 'MOCK_SERVICE', error);
      throw error;
    }
  }

  async incrementDownloads(contentId) {
    try {
      const content = this.mockData.content.find(item => item._id === contentId);
      if (content) {
        content.downloadCount += 1;
        logger.info(`Download count incremented for content: ${content.title}`, 'MOCK_SERVICE');
      }
      return true;
    } catch (error) {
      logger.error('Error incrementing mock downloads', 'MOCK_SERVICE', error);
      throw error;
    }
  }

  // FAQ Methods
  async getFAQs(filters = {}) {
    try {
      let faqs = [...this.mockData.faqs];
      
      // Apply filters
      if (filters.category && filters.category !== 'all') {
        faqs = faqs.filter(item => item.category === filters.category);
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        faqs = faqs.filter(item => 
          item.question.toLowerCase().includes(searchTerm) ||
          item.answer.toLowerCase().includes(searchTerm) ||
          item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }
      
      // Apply sorting
      if (filters.sort === '-priority') {
        faqs.sort((a, b) => b.priority - a.priority);
      }
      
      // Apply pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedFAQs = faqs.slice(startIndex, endIndex);
      
      return {
        data: paginatedFAQs,
        pagination: {
          page,
          limit,
          total: faqs.length,
          pages: Math.ceil(faqs.length / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting mock FAQs', 'MOCK_SERVICE', error);
      throw error;
    }
  }

  async getFAQById(id) {
    try {
      const faq = this.mockData.faqs.find(item => item._id === id);
      if (!faq) {
        return null;
      }
      
      // Simulate view increment
      faq.views += 1;
      
      return faq;
    } catch (error) {
      logger.error('Error getting mock FAQ by ID', 'MOCK_SERVICE', error);
      throw error;
    }
  }

  async addFAQFeedback(faqId, isHelpful) {
    try {
      const faq = this.mockData.faqs.find(item => item._id === faqId);
      if (faq) {
        if (isHelpful) {
          faq.helpfulVotes.positive += 1;
        } else {
          faq.helpfulVotes.negative += 1;
        }
        logger.info(`FAQ feedback added: ${isHelpful ? 'helpful' : 'not helpful'}`, 'MOCK_SERVICE');
      }
      return true;
    } catch (error) {
      logger.error('Error adding mock FAQ feedback', 'MOCK_SERVICE', error);
      throw error;
    }
  }

  async getFAQCategories() {
    try {
      const categories = {};
      
      this.mockData.faqs
        .filter(item => item.isPublished)
        .forEach(item => {
          if (categories[item.category]) {
            categories[item.category]++;
          } else {
            categories[item.category] = 1;
          }
        });
      
      const categoryArray = Object.entries(categories)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
      
      return categoryArray;
    } catch (error) {
      logger.error('Error getting mock FAQ categories', 'MOCK_SERVICE', error);
      throw error;
    }
  }
}

module.exports = new MockEducationService();