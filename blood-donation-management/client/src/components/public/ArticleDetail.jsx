import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Calendar, 
  Eye, 
  Share2, 
  Download,
  Tag,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { educationApi } from '../../utils/api';

const ArticleDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticle();
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const data = await educationApi.getContentBySlug(slug);
      
      if (data.success) {
        setArticle(data.data);
        setRelatedArticles(data.data.relatedContent || []);
      } else {
        setError('Article not found');
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  const handleDownload = async (fileUrl, fileName) => {
    try {
      // Track download
      await fetch(`/api/public/education/content/${article._id}/download`, {
        method: 'POST',
      });
      
      // Trigger download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatContent = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6 mt-8">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-6">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">$1</h3>')
      .replace(/^\*\*(.*)\*\*/gim, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
      .replace(/^\* (.*$)/gim, '<li class="text-gray-700 dark:text-gray-300 mb-2">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="text-gray-700 dark:text-gray-300 mb-2">$1</li>')
      .replace(/\n\n/g, '</p><p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">')
      .replace(/\n/g, '<br>');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Article Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/education')}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Education Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/education')}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Education Hub
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(article.difficulty)}`}>
                {article.difficulty}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {article.type.replace('_', ' ')}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Eye className="w-4 h-4 mr-1" />
                {article.views} views
              </div>
              <button
                onClick={handleShare}
                className="inline-flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
        >
          {/* Featured Image */}
          {article.featuredImage && (
            <div className="h-64 md:h-80 bg-gradient-to-r from-red-500 to-red-600 relative">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            </div>
          )}

          <div className="p-8">
            {/* Article Header */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {article.title}
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {article.excerpt}
              </p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {article.author.name}
                    </span>
                    <span className="ml-2">{article.author.title}</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(article.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {article.readingTime} min read
                </div>
              </div>
              
              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Article Content */}
            <div 
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ 
                __html: `<p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">${formatContent(article.content)}</p>` 
              }}
            />

            {/* Downloadable Files */}
            {article.downloadableFiles && article.downloadableFiles.length > 0 && (
              <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  Downloadable Resources
                </h3>
                <div className="space-y-3">
                  {article.downloadableFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center">
                        <Download className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {file.description}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {file.type.toUpperCase()} • {(file.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(file.url, file.name)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Author Bio */}
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {article.author.name}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {article.author.title}
                  </p>
                  {article.author.credentials && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {article.author.credentials}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <motion.div
                  key={related._id}
                  whileHover={{ y: -2 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/education/article/${related.slug}`)}
                >
                  {related.featuredImage && (
                    <div className="h-32 bg-gradient-to-r from-red-500 to-red-600"></div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {related.type.replace('_', ' ')}
                      <span className="mx-2">•</span>
                      <Clock className="w-4 h-4 mr-1" />
                      {related.readingTime} min
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {related.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(related.difficulty)}`}>
                        {related.difficulty}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ArticleDetail;