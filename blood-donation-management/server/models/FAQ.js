const mongoose = require('mongoose');
const logger = require('../utils/logger');

const faqSchema = new mongoose.Schema({
  // Basic Information
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters']
  },
  
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true,
    maxlength: [2000, 'Answer cannot exceed 2000 characters']
  },
  
  // Classification
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
        'eligibility', 'donation_process', 'preparation', 'recovery', 
        'health_tips', 'safety', 'medical_info', 'myths_facts', 
        'general', 'technical'
      ],
      message: 'Invalid FAQ category'
    }
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'or', 'pa', 'as']
  },
  
  // Priority and Ordering
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  order: {
    type: Number,
    default: 0
  },
  
  // Publishing
  isPublished: {
    type: Boolean,
    default: false
  },
  
  publishedAt: {
    type: Date
  },
  
  // Engagement Metrics
  helpful: {
    type: Number,
    default: 0,
    min: 0
  },
  
  notHelpful: {
    type: Number,
    default: 0,
    min: 0
  },
  
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Related FAQs
  relatedFAQs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ'
  }],
  
  // Additional Information
  source: {
    type: String,
    trim: true,
    maxlength: [200, 'Source cannot exceed 200 characters']
  },
  
  lastReviewed: {
    type: Date,
    default: Date.now
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  status: {
    type: String,
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft'
  },
  
  // SEO
  seo: {
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
faqSchema.index({ category: 1, isPublished: 1 });
faqSchema.index({ priority: -1, helpful: -1 });
faqSchema.index({ tags: 1 });
faqSchema.index({ publishedAt: -1 });
faqSchema.index({ 
  question: 'text', 
  answer: 'text', 
  tags: 'text' 
}, {
  weights: {
    question: 10,
    tags: 5,
    answer: 1
  }
});

// Virtual fields
faqSchema.virtual('helpfulnessRatio').get(function() {
  const total = this.helpful + this.notHelpful;
  if (total === 0) return 0;
  return (this.helpful / total) * 100;
});

faqSchema.virtual('totalFeedback').get(function() {
  return this.helpful + this.notHelpful;
});

faqSchema.virtual('isPopular').get(function() {
  return this.views > 100 || this.helpful > 10;
});

faqSchema.virtual('needsReview').get(function() {
  if (!this.lastReviewed) return true;
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
  return this.lastReviewed < sixMonthsAgo;
});

// Pre-save middleware
faqSchema.pre('save', function(next) {
  // Set publishedAt when publishing
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Auto-generate SEO fields if not provided
  if (!this.seo.metaTitle && this.question) {
    this.seo.metaTitle = this.question.substring(0, 60);
  }
  
  if (!this.seo.metaDescription && this.answer) {
    this.seo.metaDescription = this.answer.substring(0, 160);
  }
  
  next();
});

// Instance methods
faqSchema.methods.markHelpful = function(isHelpful = true) {
  if (isHelpful) {
    this.helpful += 1;
  } else {
    this.notHelpful += 1;
  }
  return this.save();
};

faqSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

faqSchema.methods.publish = function() {
  this.isPublished = true;
  this.publishedAt = new Date();
  this.status = 'published';
  return this.save();
};

faqSchema.methods.unpublish = function() {
  this.isPublished = false;
  this.status = 'draft';
  return this.save();
};

faqSchema.methods.markReviewed = function(reviewerId) {
  this.lastReviewed = new Date();
  this.reviewedBy = reviewerId;
  return this.save();
};

// Static methods
faqSchema.statics.getByCategory = function(category, limit = 20) {
  return this.find({
    category,
    isPublished: true
  })
  .sort({ priority: -1, helpful: -1 })
  .limit(limit)
  .populate('relatedFAQs', 'question category');
};

faqSchema.statics.getPopular = function(limit = 10) {
  return this.find({ isPublished: true })
    .sort({ helpful: -1, views: -1 })
    .limit(limit)
    .select('question category helpful views');
};

faqSchema.statics.searchFAQs = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    isPublished: true,
    ...filters
  };
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, helpful: -1 });
};

faqSchema.statics.getFAQStats = function() {
  return this.aggregate([
    {
      $match: { isPublished: true }
    },
    {
      $group: {
        _id: null,
        totalFAQs: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalHelpful: { $sum: '$helpful' },
        totalNotHelpful: { $sum: '$notHelpful' },
        avgHelpfulnessRatio: { 
          $avg: { 
            $cond: [
              { $eq: [{ $add: ['$helpful', '$notHelpful'] }, 0] },
              0,
              { $multiply: [{ $divide: ['$helpful', { $add: ['$helpful', '$notHelpful'] }] }, 100] }
            ]
          }
        }
      }
    }
  ]);
};

faqSchema.statics.getCategoryStats = function() {
  return this.aggregate([
    {
      $match: { isPublished: true }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalHelpful: { $sum: '$helpful' },
        avgHelpfulnessRatio: { 
          $avg: { 
            $cond: [
              { $eq: [{ $add: ['$helpful', '$notHelpful'] }, 0] },
              0,
              { $multiply: [{ $divide: ['$helpful', { $add: ['$helpful', '$notHelpful'] }] }, 100] }
            ]
          }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

faqSchema.statics.getNeedsReview = function() {
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
  return this.find({
    isPublished: true,
    $or: [
      { lastReviewed: { $lt: sixMonthsAgo } },
      { lastReviewed: { $exists: false } }
    ]
  })
  .sort({ lastReviewed: 1 })
  .select('question category lastReviewed');
};

const FAQ = mongoose.model('FAQ', faqSchema);

module.exports = FAQ;