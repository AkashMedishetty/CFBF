import React from 'react';
import { motion } from 'framer-motion';
import logger from '../../utils/logger';
import animationSystem from '../../utils/animations';

const AnimatedButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  animationType = 'buttonHover',
  onClick,
  className = '',
  type = 'button',
  ...props 
}) => {
  
  const handleClick = (e) => {
    logger.ui('CLICK', 'AnimatedButton', { variant, size, disabled, loading, animationType }, 'UI_ANIMATED_BUTTON');
    if (onClick && !disabled && !loading) {
      const startTime = performance.now();
      onClick(e);
      animationSystem.logAnimationPerformance('ButtonClick', startTime);
    }
  };

  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variant styles
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-sm',
    secondary: 'bg-secondary-100 hover:bg-secondary-200 text-secondary-900 focus:ring-secondary-500 border border-secondary-200',
    // Keep text color visible at all times; only add a subtle bg on hover
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-600/20 focus:ring-primary-500',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 focus:ring-slate-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-sm'
  };

  // Size styles
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const buttonClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  // Get animation configuration
  const animation = animationSystem.getAnimation('microInteractions', animationType);
  const reducedMotionAnimation = animationSystem.getReducedMotionAnimation(animation);

  logger.debug(`AnimatedButton rendered with variant: ${variant}, size: ${size}, animation: ${animationType}`, 'UI_ANIMATED_BUTTON');

  return (
    <motion.button
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      type={type}
      {...reducedMotionAnimation}
      onAnimationStart={() => logger.ui('ANIMATION_START', 'AnimatedButton', { animationType }, 'UI_ANIMATED_BUTTON')}
      onAnimationComplete={() => logger.ui('ANIMATION_COMPLETE', 'AnimatedButton', { animationType }, 'UI_ANIMATED_BUTTON')}
      {...props}
    >
      {loading && (
        <motion.svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          {...animationSystem.getAnimation('loadingStates', 'spinner')}
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
      )}
      {children}
    </motion.button>
  );
};

export default AnimatedButton;