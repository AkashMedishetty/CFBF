import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Heart, Droplet } from 'lucide-react';

const Loading = ({ 
  size = 'md', 
  variant = 'spinner', 
  message = '', 
  fullScreen = false,
  overlay = false,
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      case 'xl':
        return 'w-12 h-12';
      case 'md':
      default:
        return 'w-6 h-6';
    }
  };

  const getSpinner = () => {
    const sizeClass = getSizeClasses();
    
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-primary-600 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <motion.div
            className={`${sizeClass} bg-primary-600 rounded-full`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity
            }}
          />
        );
      
      case 'heart':
        return (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity
            }}
          >
            <Heart className={`${sizeClass} text-red-500 fill-current`} />
          </motion.div>
        );
      
      case 'blood':
        return (
          <motion.div
            animate={{
              y: [0, -4, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity
            }}
          >
            <Droplet className={`${sizeClass} text-red-600 fill-current`} />
          </motion.div>
        );
      
      case 'spinner':
      default:
        return (
          <Loader2 className={`${sizeClass} text-primary-600 animate-spin`} />
        );
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {getSpinner()}
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-xs"
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-dark-bg flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-80 dark:bg-dark-bg dark:bg-opacity-80 flex items-center justify-center z-10">
        {content}
      </div>
    );
  }

  return content;
};

// Skeleton loading component for content placeholders
export const Skeleton = ({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '',
  animate = true 
}) => {
  const baseClasses = `bg-gray-200 dark:bg-gray-700 rounded ${width} ${height} ${className}`;
  
  if (animate) {
    return (
      <motion.div
        className={baseClasses}
        animate={{
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    );
  }
  
  return <div className={baseClasses} />;
};

// Card skeleton for loading cards
export const CardSkeleton = ({ lines = 3, showAvatar = false }) => {
  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-6 space-y-4">
      {showAvatar && (
        <div className="flex items-center space-x-3">
          <Skeleton width="w-10" height="h-10" className="rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton width="w-1/3" height="h-4" />
            <Skeleton width="w-1/4" height="h-3" />
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i}
            width={i === lines - 1 ? 'w-2/3' : 'w-full'}
            height="h-4"
          />
        ))}
      </div>
    </div>
  );
};

// Table skeleton for loading tables
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width="w-20" height="h-4" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                width={colIndex === 0 ? 'w-32' : 'w-16'} 
                height="h-4" 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Loading;