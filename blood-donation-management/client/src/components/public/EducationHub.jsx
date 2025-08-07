import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  Download,
  Clock,
  User,
  Tag,
  ChevronRight,
  Star,
  TrendingUp,
  Eye,
  Heart,
  Calendar
} from 'lucide-react';
import { educationApi } from '../../utils/api';
import logger from '../../utils/logger';

const EducationHub = () => {
  const [activeTab, setActiveTab] = useState('articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [content, setContent] = useState([]);
  const [faqs, setFAQs] = useState([]);
  const [featuredContent, setFeaturedContent] = useState([]);
  const [popularContent, setPopularContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'articles', label: 'Articles & Guides', icon: BookOpen },
    { id: 'faqs', label: 'FAQs', icon: Search },
    { id: 'resources', label: 'Resources', icon: Download }
  ];

  const categoryLabels = {
    all: 'All Categories',
    preparation: 'Donation Preparation',
    health_tips: 'Health Tips',
    donation_process: 'Donation Process',
    eligibility: 'Eligibility',
    recovery: 'Recovery & Care',
    nutrition: 'Nutrition',
    myths_facts: 'Myths & Facts',
    community_stories: 'Community Stories',
    medical_info: 'Medical Information',
    safety: 'Safety'
  };

  useEffect(() => {
    fetchContent();
    fetchFeaturedContent();
    fetchPopularContent();
    fetchCategories();
  }, [activeTab, selectedCategory, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        limit: 12
      };

      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const data = await educationApi.getContent(params);

      if (data.success) {
        setContent(data.data);
      } else {
        setError('Failed to load content');
      }
    } catch (error) {
      logger.error('Error fetching content:', 'EDUCATION_HUB', error);
      setError('Failed to connect to server. Using demo content.');
      // Set some demo content for development
      setContent([
        {
          _id: '1',
          title: 'Complete Guide to Blood Donation Preparation',
          excerpt: 'Learn everything you need to know about preparing for blood donation.',
          type: 'guide',
          difficulty: 'beginner',
          readingTime: 8,
          views: 1250,
          author: { name: 'Dr. Sarah Johnson' },
          tags: ['preparation', 'safety', 'health']
        },
        {
          _id: '2',
          title: 'Nutrition Tips for Blood Donors',
          excerpt: 'Essential nutrition guidelines for blood donors.',
          type: 'article',
          difficulty: 'beginner',
          readingTime: 6,
          views: 890,
          author: { name: 'Lisa Chen' },
          tags: ['nutrition', 'iron', 'health']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        limit: 20
      };

      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const data = await educationApi.getFAQs(params);

      if (data.success) {
        setFAQs(data.data);
      } else {
        setError('Failed to load FAQs');
      }
    } catch (error) {
      logger.error('Error fetching FAQs:', 'EDUCATION_HUB', error);
      setError('Failed to connect to server. Using demo FAQs.');
      // Set some demo FAQs for development
      setFAQs([
        {
          _id: '1',
          question: 'Who can donate blood?',
          answer: 'Generally, healthy individuals aged 18-65 who weigh at least 50kg can donate blood.',
          category: 'eligibility',
          tags: ['eligibility', 'age', 'weight']
        },
        {
          _id: '2',
          question: 'How often can I donate blood?',
          answer: 'You can donate whole blood every 56 days (8 weeks).',
          category: 'donation_process',
          tags: ['frequency', 'donation']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedContent = async () => {
    try {
      const data = await educationApi.getFeaturedContent(3);

      if (data.success) {
        setFeaturedContent(data.data);
      }
    } catch (error) {
      logger.error('Error fetching featured content:', 'EDUCATION_HUB', error);
      // Set demo featured content
      setFeaturedContent([
        {
          _id: '1',
          title: 'Complete Guide to Blood Donation Preparation',
          excerpt: 'Learn everything you need to know about preparing for blood donation.',
          type: 'guide',
          difficulty: 'beginner',
          readingTime: 8,
          author: { name: 'Dr. Sarah Johnson' },
          featuredImage: null
        }
      ]);
    }
  };

  const fetchPopularContent = async () => {
    try {
      const data = await educationApi.getPopularContent(5);

      if (data.success) {
        setPopularContent(data.data);
      }
    } catch (error) {
      logger.error('Error fetching popular content:', 'EDUCATION_HUB', error);
      // Set demo popular content
      setPopularContent([
        {
          _id: '1',
          title: 'Complete Guide to Blood Donation Preparation',
          views: 1250,
          slug: 'complete-guide-to-blood-donation-preparation',
          type: 'guide'
        },
        {
          _id: '2',
          title: 'Nutrition Tips for Blood Donors',
          views: 890,
          slug: 'nutrition-tips-for-blood-donors',
          type: 'article'
        }
      ]);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await educationApi.getCategories();

      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      logger.error('Error fetching categories:', 'EDUCATION_HUB', error);
      // Set demo categories
      setCategories([
        { category: 'preparation', count: 5 },
        { category: 'nutrition', count: 3 },
        { category: 'eligibility', count: 4 },
        { category: 'safety', count: 2 }
      ]);
    }
  };

  useEffect(() => {
    if (activeTab === 'faqs') {
      fetchFAQs();
    } else {
      fetchContent();
    }
  }, [activeTab, selectedCategory, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is triggered by useEffect when searchQuery changes
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'guide': return BookOpen;
      case 'article': return BookOpen;
      case 'blog_post': return BookOpen;
      case 'resource': return Download;
      default: return BookOpen;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 text-white py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Education Hub
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-red-100 mb-8 max-w-3xl mx-auto"
            >
              Learn everything about blood donation, from preparation to recovery.
              Get expert advice, debunk myths, and become a confident donor.
            </motion.p>

            {/* Search Bar */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search articles, guides, and FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white focus:ring-opacity-50 text-lg"
                />
              </div>
            </motion.form>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Browse Content</h3>
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                        ? 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === key
                      ? 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    {label}
                    {categories.find(cat => cat.category === key) && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({categories.find(cat => cat.category === key).count})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Content */}
            {popularContent.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-red-600" />
                  Popular Content
                </h3>
                <div className="space-y-3">
                  {popularContent.map((item) => (
                    <div key={item._id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.title}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <Eye className="w-3 h-3 mr-1" />
                          {item.views} views
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Content */}
            {featuredContent.length > 0 && activeTab === 'articles' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Star className="w-6 h-6 mr-2 text-yellow-500" />
                  Featured Content
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featuredContent.map((item) => {
                    const TypeIcon = getTypeIcon(item.type);
                    return (
                      <motion.div
                        key={item._id}
                        whileHover={{ y: -5 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        {item.featuredImage && (
                          <div className="h-48 bg-gradient-to-r from-red-500 to-red-600 relative">
                            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                            <div className="absolute bottom-4 left-4 right-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(item.difficulty)}`}>
                                {item.difficulty}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <TypeIcon className="w-4 h-4 mr-1" />
                            {item.type.replace('_', ' ')}
                            <span className="mx-2">•</span>
                            <Clock className="w-4 h-4 mr-1" />
                            {item.readingTime} min read
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                            {item.excerpt}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <User className="w-4 h-4 mr-1" />
                              {item.author.name}
                            </div>
                            <button className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center">
                              Read More
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Content Grid */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                  ))}
                </motion.div>
              ) : activeTab === 'articles' ? (
                <motion.div
                  key="articles"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {content.map((item) => {
                    const TypeIcon = getTypeIcon(item.type);
                    return (
                      <motion.div
                        key={item._id}
                        whileHover={{ y: -2 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <TypeIcon className="w-4 h-4 mr-1" />
                              {item.type.replace('_', ' ')}
                              <span className="mx-2">•</span>
                              <Clock className="w-4 h-4 mr-1" />
                              {item.readingTime} min
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(item.difficulty)}`}>
                              {item.difficulty}
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {item.title}
                          </h3>

                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                            {item.excerpt}
                          </p>

                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {item.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                >
                                  <Tag className="w-3 h-3 mr-1" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <User className="w-4 h-4 mr-1" />
                              {item.author.name}
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Eye className="w-4 h-4 mr-1" />
                                {item.views}
                              </div>
                              <button className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center">
                                Read More
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : activeTab === 'faqs' ? (
                <motion.div
                  key="faqs"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {faqs.map((faq, index) => (
                    <FAQItem key={faq._id} faq={faq} index={index} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="resources"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {content.filter(item => item.downloadableFiles && item.downloadableFiles.length > 0).map((item) => (
                    <ResourceCard key={item._id} resource={item} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            {!loading && ((activeTab === 'articles' && content.length === 0) || (activeTab === 'faqs' && faqs.length === 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No content found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try adjusting your search or category filters.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// FAQ Item Component
const FAQItem = ({ faq, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [helpful, setHelpful] = useState(null);

  const handleFeedback = async (isHelpful) => {
    try {
      await educationApi.submitFAQFeedback(faq._id, isHelpful);
      setHelpful(isHelpful);
    } catch (error) {
      logger.error('Error submitting feedback:', 'EDUCATION_HUB', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white pr-4">
            {faq.question}
          </h3>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4">
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {faq.answer}
                </p>

                {faq.tags && faq.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {faq.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Was this helpful?
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleFeedback(true)}
                      className={`p-2 rounded-lg transition-colors ${helpful === true
                        ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900'
                        }`}
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleFeedback(false)}
                      className={`p-2 rounded-lg transition-colors ${helpful === false
                        ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                        : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900'
                        }`}
                    >
                      <Heart className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Resource Card Component
const ResourceCard = ({ resource }) => {
  const handleDownload = async (fileUrl, contentId) => {
    try {
      // Track download
      await educationApi.trackDownload(contentId);

      // Trigger download
      window.open(fileUrl, '_blank');
    } catch (error) {
      logger.error('Error downloading resource:', 'EDUCATION_HUB', error);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Download className="w-4 h-4 mr-1" />
            {resource.downloadableFiles.length} file{resource.downloadableFiles.length > 1 ? 's' : ''}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {resource.downloadCount} downloads
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {resource.title}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          {resource.excerpt}
        </p>

        <div className="space-y-2">
          {resource.downloadableFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center">
                <Download className="w-4 h-4 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {file.type.toUpperCase()} • {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(file.url, resource._id)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Download
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <User className="w-4 h-4 mr-1" />
            {resource.author.name}
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date(resource.publishedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EducationHub;