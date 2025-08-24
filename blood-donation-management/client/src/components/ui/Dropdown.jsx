import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import logger from '../../utils/logger';
import animationSystem from '../../utils/animations';

const Dropdown = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error = '',
  success = '',
  className = '',
  label = '',
  required = false,
  searchable = false,
  multiple = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    logger.componentMount('Dropdown', { 
      optionsCount: options.length, 
      searchable, 
      multiple 
    });
    
    return () => {
      logger.componentUnmount('Dropdown');
    };
  }, [multiple, options.length, searchable]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        logger.ui('CLICK_OUTSIDE', 'Dropdown', null, 'UI_DROPDOWN');
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = () => {
    if (disabled) return;
    
    const newState = !isOpen;
    logger.ui('TOGGLE', 'Dropdown', { from: isOpen, to: newState }, 'UI_DROPDOWN');
    setIsOpen(newState);
    
    if (!newState) {
      setSearchTerm('');
    }
  };

  const handleOptionSelect = (option) => {
    logger.ui('SELECT', 'Dropdown', { option: option.value }, 'UI_DROPDOWN');
    
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter(v => v !== option.value)
        : [...currentValues, option.value];
      onChange?.(newValues);
    } else {
      onChange?.(option.value);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const filteredOptions = searchable && searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const getDisplayValue = () => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      if (value.length === 1) {
        const option = options.find(opt => opt.value === value[0]);
        return option?.label || value[0];
      }
      return `${value.length} selected`;
    }
    
    const selectedOption = options.find(opt => opt.value === value);
    return selectedOption?.label || placeholder;
  };

  const isSelected = (optionValue) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  // Styles
  const triggerClasses = `
    w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 
    text-slate-900 dark:text-slate-100 transition-all duration-200 
    focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer
    ${error 
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
      : success 
        ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
        : 'border-slate-300 dark:border-slate-600 focus:ring-primary-500 focus:border-primary-500'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-700' : ''}
    ${className}
  `;

  // Animation configurations
  const dropdownAnimation = animationSystem.getReducedMotionAnimation({
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 },
    transition: { duration: 0.15, ease: 'easeOut' }
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
          error 
            ? 'text-red-700 dark:text-red-400' 
            : success 
              ? 'text-green-700 dark:text-green-400'
              : 'text-slate-700 dark:text-slate-300'
        }`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger */}
      <div
        className={triggerClasses}
        onClick={handleToggle}
        {...props}
      >
        <div className="flex items-center justify-between">
          <span className={`truncate ${!value || (Array.isArray(value) && value.length === 0) ? 'text-slate-500 dark:text-slate-400' : ''}`}>
            {getDisplayValue()}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </motion.div>
        </div>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-strong max-h-60 overflow-hidden"
            {...dropdownAnimation}
            onAnimationStart={() => logger.ui('ANIMATION_START', 'DropdownMenu', null, 'UI_DROPDOWN')}
            onAnimationComplete={() => logger.ui('ANIMATION_COMPLETE', 'DropdownMenu', null, 'UI_DROPDOWN')}
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    logger.ui('SEARCH', 'Dropdown', { term: e.target.value }, 'UI_DROPDOWN');
                  }}
                  className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            )}

            {/* Options */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                  {searchTerm ? 'No options found' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <motion.div
                    key={option.value}
                    className={`px-3 py-2 cursor-pointer transition-colors duration-150 flex items-center justify-between ${
                      isSelected(option.value)
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => handleOptionSelect(option)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected(option.value) && (
                      <Check className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0 ml-2" />
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error/Success Message */}
      {(error || success) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-1 text-sm ${
            error ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          }`}
        >
          {error || success}
        </motion.div>
      )}
    </div>
  );
};

export default Dropdown;