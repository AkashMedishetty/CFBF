const mongoose = require('mongoose');
const logger = require('../utils/logger');

const educationalContentSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    trim: true,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  
  // Content Classification
  type: {
    type: String,
    required: [true, 'Content type is required'],
    enum: {
      values: ['article', 'guide', 'faq', 'resource', 'blog_post', 'video', 'infographic'],
      message: 'Invalid content type'
    }
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
        'preparation', 'health_tips', 'donation_process', 'eligibility', 
        'recovery', 'nutrition', 'myths_facts', 'community_stories', 
        'medical_info', 'safety'
      ],
      message: 'Invalid category'
    }
  },
  
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'or', 'pa', 'as']
  },
  
  // Content Metadata
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  readingTime: {
    type: Number,
    min: [1, 'Reading time must be at least 1 minute'],
    max: [120, 'Reading time cannot exceed 120 minutes']
  },
  
  // Author Information
  author: {
    name: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
      maxlength: [100, 'Author name cannot exceed 100 characters']
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Author bio cannot exceed 500 characters']
    },
    avatar: {
      type: String,
      trim: true
    },
    credentials: {
      type: String,
      trim: true,
      maxlength: [200, 'Credentials cannot exceed 200 characters']
    }
  },
  
  // Media
  featuredImage: {
    url: {
      type: String,
      trim: true
    },
    alt: {
      type: String,
      trim: true,
      maxlength: [200, 'Alt text cannot exceed 200 characters']
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [300, 'Caption cannot exceed 300 characters']
    }
  },
  
  images: [{
    url: {
      type: String,
      required: true,
      trim: true
    },
    alt: {
      type: String,
      trim: true,
      maxlength: [200, 'Alt text cannot exceed 200 characters']
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [300, 'Caption cannot exceed 300 characters']
    }
  }],
  
  // Downloadable Resources
  downloadableFiles: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'File name cannot exceed 200 characters']
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'image', 'video', 'audio']
    },
    size: {
      type: Number, // in bytes
      min: 0
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'File description cannot exceed 300 characters']
    }
  }],
  
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
    },
    keywords: [{
      type: String,
      trim: true,
      maxlength: [50, 'Keyword cannot exceed 50 characters']
    }]
  },
  
  // Publishing
  isPublished: {
    type: Boolean,
    default: false
  },
  
  publishedAt: {
    type: Date
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Engagement
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  shares: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Related Content
  relatedContent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EducationalContent'
  }],
  
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
  
  // Content Status
  status: {
    type: String,
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft'
  },
  
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Review notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
educationalContentSchema.index({ slug: 1 }, { unique: true });
educationalContentSchema.index({ category: 1, isPublished: 1 });
educationalContentSchema.index({ type: 1, isPublished: 1 });
educationalContentSchema.index({ tags: 1 });
educationalContentSchema.index({ publishedAt: -1 });
educationalContentSchema.index({ views: -1 });
educationalContentSchema.index({ isFeatured: 1, isPublished: 1 });
educationalContentSchema.index({ 
  title: 'text', 
  excerpt: 'text', 
  content: 'text', 
  tags: 'text' 
}, {
  weights: {
    title: 10,
    excerpt: 5,
    tags: 3,
    content: 1
  }
});

// Virtual fields
educationalContentSchema.virtual('url').get(function() {
  return `/education/${this.slug}`;
});

educationalContentSchema.virtual('readingTimeText').get(function() {
  if (!this.readingTime) return '';
  return this.readingTime === 1 ? '1 min read' : `${this.readingTime} mins read`;
});

educationalContentSchema.virtual('isRecent').get(function() {
  if (!this.publishedAt) return false;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.publishedAt > oneWeekAgo;
});

// Pre-save middleware
educationalContentSchema.pre('save', function(next) {
  // Auto-generate slug from title if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  
  // Set publishedAt when publishing
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Calculate reading time if not provided
  if (!this.readingTime && this.content) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }
  
  // Auto-generate SEO fields if not provided
  if (!this.seo.metaTitle && this.title) {
    this.seo.metaTitle = this.title.substring(0, 60);
  }
  
  if (!this.seo.metaDescription && this.excerpt) {
    this.seo.metaDescription = this.excerpt.substring(0, 160);
  }
  
  next();
});

// Instance methods
educationalContentSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

educationalContentSchema.methods.incrementDownloads = function() {
  this.downloadCount += 1;
  return this.save();
};

educationalContentSchema.methods.incrementLikes = function() {
  this.likes += 1;
  return this.save();
};

educationalContentSchema.methods.incrementShares = function() {
  this.shares += 1;
  return this.save();
};

educationalContentSchema.methods.publish = function() {
  this.isPublished = true;
  this.publishedAt = new Date();
  this.status = 'published';
  return this.save();
};

educationalContentSchema.methods.unpublish = function() {
  this.isPublished = false;
  this.status = 'draft';
  return this.save();
};

// Static methods
educationalContentSchema.statics.getByCategory = function(category, limit = 10) {
  return this.find({
    category,
    isPublished: true
  })
  .sort({ publishedAt: -1 })
  .limit(limit)
  .populate('relatedContent', 'title slug type category featuredImage');
};

educationalContentSchema.statics.getPopular = function(limit = 10) {
  return this.find({ isPublished: true })
    .sort({ views: -1, publishedAt: -1 })
    .limit(limit)
    .select('title slug type category featuredImage readingTime views publishedAt author');
};

educationalContentSchema.statics.getFeatured = function(limit = 5) {
  return this.find({
    isFeatured: true,
    isPublished: true
  })
  .sort({ publishedAt: -1 })
  .limit(limit)
  .populate('relatedContent', 'title slug type category featuredImage');
};

educationalContentSchema.statics.searchContent = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    isPublished: true,
    ...filters
  };
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, publishedAt: -1 });
};

educationalContentSchema.statics.getContentStats = function() {
  return this.aggregate([
    {
      $match: { isPublished: true }
    },
    {
      $group: {
        _id: null,
        totalContent: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalDownloads: { $sum: '$downloadCount' },
        totalLikes: { $sum: '$likes' },
        totalShares: { $sum: '$shares' },
        avgReadingTime: { $avg: '$readingTime' }
      }
    }
  ]);
};

const EducationalContent = mongoose.model('EducationalContent', educationalContentSchema);

module.exports = EducationalContent;