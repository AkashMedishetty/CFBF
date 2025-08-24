import React from 'react';
import { motion } from 'framer-motion';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-all duration-200';
  
  const variants = {
    default: 'bg-slate-100 text-slate-800 dark:bg-dark-bg-secondary dark:text-slate-200',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300',
    secondary: 'bg-slate-100 text-slate-600 dark:bg-dark-bg-secondary dark:text-slate-400',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
    pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300'
  };
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  const classes = `
    ${baseClasses}
    ${variants[variant] || variants.default}
    ${sizes[size]}
    ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
    ${className}
  `;

  const Component = onClick ? motion.button : motion.span;

  return (
    <Component
      className={classes}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {children}
    </Component>
  );
};

// BadgeGroup component for grouping multiple badges
const BadgeGroup = ({ children, className = '', spacing = 'gap-2', ...props }) => {
  return (
    <div className={`flex flex-wrap items-center ${spacing} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Badge;
export { BadgeGroup };