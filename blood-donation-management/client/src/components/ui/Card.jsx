import React from 'react';
import { motion } from 'framer-motion';
import logger from '../../utils/logger';

const Card = ({ 
  children, 
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  onClick,
  ...props 
}) => {
  
  const handleClick = (e) => {
    if (onClick) {
      logger.ui('CLICK', 'Card', { variant, padding, hover }, 'UI_CARD');
      onClick(e);
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

  // Hover styles
  const hoverStyles = hover ? 'hover:shadow-strong hover:-translate-y-1 cursor-pointer' : '';

  const cardClasses = `${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`;

  logger.debug(`Card rendered with variant: ${variant}, padding: ${padding}, hover: ${hover}`, 'UI_CARD');

  const CardComponent = onClick ? motion.div : 'div';
  const motionProps = onClick ? {
    whileHover: { y: -2 },
    whileTap: { scale: 0.98 }
  } : {};

  return (
    <CardComponent
      className={cardClasses}
      onClick={handleClick}
      {...motionProps}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

// Card sub-components
Card.Header = ({ children, className = '' }) => {
  logger.debug('Card.Header rendered', 'UI_CARD');
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
};

Card.Body = ({ children, className = '' }) => {
  logger.debug('Card.Body rendered', 'UI_CARD');
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
};

Card.Footer = ({ children, className = '' }) => {
  logger.debug('Card.Footer rendered', 'UI_CARD');
  return (
    <div className={`mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 ${className}`}>
      {children}
    </div>
  );
};

export default Card;