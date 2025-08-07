import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const Avatar = ({
  src,
  alt = '',
  size = 'md',
  fallback,
  className = '',
  onClick,
  status,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
    '3xl': 'w-24 h-24 text-3xl'
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4',
    '3xl': 'w-5 h-5'
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-slate-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  const baseClasses = `
    relative inline-flex items-center justify-center rounded-full
    bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400
    font-medium overflow-hidden transition-all duration-200
    ${sizes[size]}
    ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
    ${className}
  `;

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const renderContent = () => {
    if (src && !imageError) {
      return (
        <>
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full"
              />
            </div>
          )}
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </>
      );
    }

    if (fallback) {
      return (
        <span className="select-none">
          {typeof fallback === 'string' ? fallback.charAt(0).toUpperCase() : fallback}
        </span>
      );
    }

    return <User className="w-1/2 h-1/2" />;
  };

  const Component = onClick ? motion.button : motion.div;

  return (
    <div className="relative inline-block">
      <Component
        className={baseClasses}
        onClick={onClick}
        whileHover={onClick ? { scale: 1.05 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {renderContent()}
      </Component>

      {/* Status Indicator */}
      {status && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`
            absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-slate-900
            ${statusSizes[size]}
            ${statusColors[status] || statusColors.offline}
          `}
        />
      )}
    </div>
  );
};

export default Avatar;