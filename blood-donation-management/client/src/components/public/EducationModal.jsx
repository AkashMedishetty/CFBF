import React from 'react';
import {
  BookOpen,
  Clock,
  User,
  Eye,
  Tag,
  Share2,
  Bookmark
} from 'lucide-react';
import Modal from '../common/Modal';

const EducationModal = ({ isOpen, onClose, content }) => {
  if (!content) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'guide': return BookOpen;
      case 'article': return BookOpen;
      case 'blog_post': return BookOpen;
      default: return BookOpen;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const TypeIcon = getTypeIcon(content.type);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header Section */}
        <div className="mb-6">
          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center">
              <TypeIcon className="w-4 h-4 mr-1" />
              <span className="capitalize">{content.type?.replace('_', ' ')}</span>
            </div>
            
            {content.readingTime && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{content.readingTime} min read</span>
              </div>
            )}
            
            {content.views && (
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                <span>{content.views} views</span>
              </div>
            )}
            
            {content.difficulty && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(content.difficulty)}`}>
                {content.difficulty}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {content.title}
          </h1>

          {/* Author and Date */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              {content.author && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <User className="w-4 h-4 mr-2" />
                  <span className="font-medium">{content.author.name}</span>
                  {content.author.title && (
                    <span className="ml-2 text-gray-500">{content.author.title}</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors">
                <Bookmark className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="max-w-none">
          {/* Excerpt/Summary */}
          {content.excerpt && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
              <p className="text-red-800 dark:text-red-200 font-medium italic text-base leading-relaxed">
                {content.excerpt}
              </p>
            </div>
          )}

          {/* Main Content */}
          <div className="text-gray-700 dark:text-gray-300">
            {content.content ? (
              <div 
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content.content }} 
              />
            ) : (
              <article className="space-y-6">
                <div className="text-base leading-relaxed space-y-4">
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    About {content.title}
                  </p>
                  <p className="leading-7">
                    This comprehensive guide provides detailed information about {content.title.toLowerCase()}. 
                    Our expert-reviewed content ensures you have access to the most current and accurate 
                    information for your blood donation journey.
                  </p>
                  <p className="leading-7">
                    Whether you're a first-time donor or looking to refresh your knowledge, this guide 
                    covers everything you need to know with clear explanations and practical advice.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 my-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-red-600" />
                    Key Topics Covered
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Important preparation steps</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">What to expect during the process</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Safety guidelines and best practices</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recovery and aftercare instructions</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Common questions and concerns</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expert tips and recommendations</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Why This Information Matters
                  </h3>
                  <p className="leading-7">
                    Being well-informed about the blood donation process helps ensure a safe, comfortable, 
                    and successful donation experience. This guide empowers you with the knowledge needed 
                    to make informed decisions and feel confident throughout your donation journey.
                  </p>
                  <p className="leading-7">
                    Our content is regularly updated by medical professionals and donation specialists 
                    to reflect the latest guidelines and best practices in blood donation.
                  </p>
                </div>
              </article>
            )}
          </div>
        </div>

        {/* Tags Section */}
        {content.tags && content.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {content.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900 dark:hover:text-red-200 transition-colors cursor-pointer"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center">
              <Bookmark className="w-4 h-4 mr-2" />
              Save for Later
            </button>
            <button className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center">
              <Share2 className="w-4 h-4 mr-2" />
              Share Article
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EducationModal;