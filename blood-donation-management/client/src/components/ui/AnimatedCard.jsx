import React from 'react';
import { motion } from 'framer-motion';
import logger from '../../utils/logger';
import animationSystem from '../../utils/animations';

const AnimatedCard = ({ 
  children, 
  variant = 'default',
  padding = 'md',
  hover = false,
  animationType = 'cardHover',
  className = '',
  onClick,
  ...props 
}) => {
  
  const handleClick = (e) => {
    if (onClick) {
      logger.ui('CLICK', 'AnimatedCard', { variant, padding, hover, animationType }, 'UI_ANIMATED_CARD');
      const startTime = performance.now();
      onClick(e);
      animationSystem.logAnimationPerformance('CardClick', startTime);
    }
  };

  // Base styles
  const baseStyles = 'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-all duration-200';
  
  // Variant styles
  const variants = {
    default: 'shadow-soft',
    elevated: 'shadow-medium',
    outlined: 'border-2 shadow-none',
    flat: 'shadow-none border-0 bg-slate-50 dark:bg-slate-900'
  };

  // Padding styles
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const cardClasses = `${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`;

  // Get animation configuration
  const animation = hover ? animationSystem.getAnimation('microInteractions', animationType) : {};
  const reducedMotionAnimation = animationSystem.getReducedMotionAnimation(animation);

  logger.debug(`AnimatedCard rendered with variant: ${variant}, padding: ${padding}, hover: ${hover}, animation: ${animationType}`, 'UI_ANIMATED_CARD');

  return (
    <motion.div
      className={cardClasses}
      onClick={handleClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      {...reducedMotionAnimation}
      onAnimationStart={() => hover && logger.ui('ANIMATION_START', 'AnimatedCard', { animationType }, 'UI_ANIMATED_CARD')}
      onAnimationComplete={() => hover && logger.ui('ANIMATION_COMPLETE', 'AnimatedCard', { animationType }, 'UI_ANIMATED_CARD')}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Animated sub-components
AnimatedCard.Header = ({ children, className = '', animationType = 'slideDown' }) => {
  logger.debug('AnimatedCard.Header rendered', 'UI_ANIMATED_CARD');
  
  const animation = animationSystem.getAnimation('pageTransitions', animationType);
  const reducedMotionAnimation = animationSystem.getReducedMotionAnimation(animation);

  return (
    <motion.div 
      className={`mb-4 ${className}`}
      {...reducedMotionAnimation}
    >
      {children}
    </motion.div>
  );
};

AnimatedCard.Body = ({ children, className = '', animationType = 'fadeIn' }) => {
  logger.debug('AnimatedCard.Body rendered', 'UI_ANIMATED_CARD');
  
  const animation = animationSystem.getAnimation('pageTransitions', animationType);
  const reducedMotionAnimation = animationSystem.getReducedMotionAnimation(animation);

  return (
    <motion.div 
      className={`${className}`}
      {...reducedMotionAnimation}
    >
      {children}
    </motion.div>
  );
};

AnimatedCard.Footer = ({ children, className = '', animationType = 'slideUp' }) => {
  logger.debug('AnimatedCard.Footer rendered', 'UI_ANIMATED_CARD');
  
  const animation = animationSystem.getAnimation('pageTransitions', animationType);
  const reducedMotionAnimation = animationSystem.getReducedMotionAnimation(animation);

  return (
    <motion.div 
      className={`mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 ${className}`}
      {...reducedMotionAnimation}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;