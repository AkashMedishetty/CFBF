import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import logger from '../../utils/logger';

const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error = '',
  disabled = false,
  required = false,
  icon: Icon,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  const handleToggle = () => {
    if (disabled) return;
    
    logger.ui('TOGGLE', 'Select', { isOpen: !isOpen }, 'SELECT');
    setIsOpen(!isOpen);
    
    if (!isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleSelect = (option) => {
    logger.ui('SELECT', 'Option', { value: option.value, label: option.label }, 'SELECT');
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter' && filteredOptions.length === 1) {
      handleSelect(filteredOptions[0]);
    }
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <motion.button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`
            relative w-full px-4 py-3 text-left bg-white dark:bg-dark-bg-secondary border rounded-lg
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
            ${error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-slate-300 dark:border-slate-600 focus:ring-primary-500 focus:border-primary-500'
            }
            ${disabled 
              ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-700' 
              : 'hover:border-slate-400 dark:hover:border-slate-500'
            }
            ${Icon ? 'pl-12' : ''}
          `}
          whileTap={disabled ? {} : { scale: 0.995 }}
        >
          {Icon && (
            <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          )}
          
          <span className={`block truncate ${
            selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
          }`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          
          <ChevronDown 
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-2 bg-white dark:bg-dark-bg-secondary border border-slate-300 dark:border-dark-border rounded-lg shadow-lg max-h-60 overflow-hidden"
            >
              {/* Search Input */}
              {options.length > 5 && (
                <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search options..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}

              {/* Options List */}
              <div className="max-h-48 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={`
                        w-full px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700
                        transition-colors duration-150 flex items-center justify-between
                        ${value === option.value ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-slate-900 dark:text-white'}
                      `}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ x: 4 }}
                    >
                      <span className="truncate">{option.label}</span>
                      {value === option.value && (
                        <Check className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0 ml-2" />
                      )}
                    </motion.button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                    No options found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default Select;