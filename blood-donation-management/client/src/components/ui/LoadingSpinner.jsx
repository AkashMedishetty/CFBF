import React from 'react';
import { motion } from 'framer-motion';
import logger from '../../utils/logger';
import animationSystem from '../../utils/animations';

const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'spinner',
  color = 'primary',
  className = '',
  text = '',
  ...props 
}) => {
  
  React.useEffect(() => {
    logger.componentMount('LoadingSpinner');
    
    return () => {
      logger.componentUnmount('LoadingSpinner');
    };
  }, [size, variant, color]);

  // Size configurations
  const sizes = {
    sm: { spinner: 'h-4 w-4', text: 'text-sm' },
    md: { spinner: 'h-6 w-6', text: 'text-base' },
    lg: { spinner: 'h-8 w-8', text: 'text-lg' },
    xl: { spinner: 'h-12 w-12', text: 'text-xl' }
  };

  // Color configurations
  const colors = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
    gray: 'text-gray-600',
    red: 'text-red-600',
    green: 'text-green-600'
  };

  const spinnerSize = sizes[size].spinner;
  const textSize = sizes[size].text;
  const spinnerColor = colors[color];

  // Get animation configuration
  const animation = animationSystem.getAnimation('loadingStates', variant);
  const reducedMotionAnimation = animationSystem.getReducedMotionAnimation(animation);

  logger.debug(`LoadingSpinner rendered with size: ${size}, variant: ${variant}, color: ${color}`);

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <motion.svg 
            className={`${spinnerSize} ${spinnerColor} ${className}`}
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
            {...reducedMotionAnimation}
            {...props}
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </motion.svg>
        );

      case 'dots':
        return (
          <div className={`flex space-x-1 ${className}`}>
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className={`${spinnerSize} ${spinnerColor} bg-current rounded-full`}
                {...reducedMotionAnimation}
                style={{
                  animationDelay: `${index * 0.2}s`
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <motion.div
            className={`${spinnerSize} ${spinnerColor} bg-current rounded-full ${className}`}
            {...reducedMotionAnimation}
            {...props}
          />
        );

      case 'skeleton':
        return (
          <motion.div
            className={`${spinnerSize} bg-gray-200 dark:bg-gray-700 rounded ${className}`}
            {...reducedMotionAnimation}
            {...props}
          />
        );

      default:
        return renderSpinner();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {renderSpinner()}
      {text && (
        <motion.p 
          className={`${textSize} ${spinnerColor} font-medium`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// Skeleton loader component
export const SkeletonLoader = ({ 
  lines = 3, 
  className = '',
  animated = true 
}) => {
  React.useEffect(() => {
    logger.componentMount('SkeletonLoader');
  }, [lines, animated]);

  const animation = animated ? animationSystem.getAnimation('loadingStates', 'skeleton') : {};
  const reducedMotionAnimation = animationSystem.getReducedMotionAnimation(animation);

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
          style={{ width: `${Math.random() * 40 + 60}%` }}
          {...reducedMotionAnimation}
        />
      ))}
    </div>
  );
};

// Progress bar component
export const ProgressBar = ({ 
  progress = 0, 
  className = '',
  animated = true,
  color = 'primary'
}) => {
  React.useEffect(() => {
    logger.componentMount('ProgressBar');
  }, [progress, animated, color]);

  const colors = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  };

  const barColor = colors[color];

  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 ${className}`}>
      <motion.div
        className={`h-2 ${barColor} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        transition={animated ? { duration: 0.5, ease: 'easeOut' } : { duration: 0 }}
      />
    </div>
  );
};

export default LoadingSpinner;