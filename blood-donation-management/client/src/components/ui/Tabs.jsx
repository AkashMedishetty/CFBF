import React from 'react';
import { motion } from 'framer-motion';
import logger from '../../utils/logger';

const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const handleTabClick = (tabId) => {
    logger.ui('CLICK', 'Tab', { tabId, previousTab: activeTab }, 'TABS');
    onChange(tabId);
  };

  const variants = {
    default: {
      container: 'border-b border-slate-200 dark:border-slate-700',
      tab: 'px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200',
      activeTab: 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400',
      indicator: 'absolute bottom-0 left-0 h-0.5 bg-primary-600 dark:bg-primary-400'
    },
    pills: {
      container: 'bg-slate-100 dark:bg-slate-800 rounded-lg p-1',
      tab: 'px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md transition-all duration-200 relative',
      activeTab: 'text-white',
      indicator: 'absolute inset-0 bg-primary-600 dark:bg-primary-500 rounded-md'
    },
    buttons: {
      container: 'flex space-x-2',
      tab: 'px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-200',
      activeTab: 'text-white bg-primary-600 dark:bg-primary-500 border-primary-600 dark:border-primary-500',
      indicator: null
    }
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3'
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <div className={`${currentVariant.container} ${className}`}>
      <div className={variant === 'buttons' ? currentVariant.container : 'flex relative'}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                ${currentVariant.tab}
                ${isActive ? currentVariant.activeTab : ''}
                ${sizes[size]}
                relative flex items-center space-x-2
              `}
              whileHover={{ y: variant === 'default' ? -1 : 0 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              {/* Background indicator for pills variant */}
              {variant === 'pills' && isActive && currentVariant.indicator && (
                <motion.div
                  layoutId="activeTab"
                  className={currentVariant.indicator}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              {/* Tab content */}
              <div className="relative z-10 flex items-center space-x-2">
                {Icon && <Icon className="h-4 w-4" />}
                <span>{tab.label}</span>
              </div>
              
              {/* Badge for tab count */}
              {tab.count !== undefined && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`
                    ml-2 px-2 py-0.5 text-xs rounded-full
                    ${isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }
                  `}
                >
                  {tab.count}
                </motion.span>
              )}
            </motion.button>
          );
        })}
        
        {/* Bottom border indicator for default variant */}
        {variant === 'default' && (
          <motion.div
            className="absolute bottom-0 h-0.5 bg-primary-600 dark:bg-primary-400"
            layoutId="tabIndicator"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            style={{
              left: `${(tabs.findIndex(tab => tab.id === activeTab) / tabs.length) * 100}%`,
              width: `${100 / tabs.length}%`
            }}
          />
        )}
      </div>
    </div>
  );
};

// Individual Tab components for more granular control
const TabList = ({ children, className = '', ...props }) => {
  return (
    <div className={`flex border-b border-slate-200 dark:border-slate-700 ${className}`} {...props}>
      {children}
    </div>
  );
};

const Tab = ({ 
  children, 
  isActive = false, 
  onClick, 
  className = '',
  disabled = false,
  ...props 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2
        ${isActive 
          ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400' 
          : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

const TabPanels = ({ children, className = '', ...props }) => {
  return (
    <div className={`mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

const TabPanel = ({ children, isActive = false, className = '', ...props }) => {
  if (!isActive) return null;
  
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
};

export default Tabs;
export { TabList, Tab, TabPanels, TabPanel };