/**
 * Mobile Optimized Input Component
 * Provides mobile-friendly input with automatic keyboard optimization
 */

import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileOptimizedInput = ({
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  success,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setHasValue(value && value.length > 0);
  }, [value]);

  // Determine input type and attributes for mobile optimization
  const getInputProps = () => {
    const baseProps = {
      ref: inputRef,
      value: value || '',
      onChange: (e) => onChange(e.target.value),
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      placeholder: isFocused ? placeholder : '',
      disabled,
      required,
      className: `
        w-full px-4 py-3 text-base bg-white dark:bg-slate-800 border-2 rounded-lg
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-0
        ${error 
          ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400' 
          : success
          ? 'border-green-300 dark:border-green-600 focus:border-green-500 dark:focus:border-green-400'
          : 'border-slate-300 dark:border-dark-border focus:border-primary-500 dark:focus:border-primary-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        text-slate-900 dark:text-white
        placeholder-slate-400 dark:placeholder-slate-500
        ${className}
      `.trim(),
      ...props
    };

    // Mobile-specific optimizations
    switch (type) {
      case 'email':
        return {
          ...baseProps,
          type: 'email',
          inputMode: 'email',
          autoCapitalize: 'none',
          autoCorrect: 'off',
          spellCheck: false
        };
      
      case 'tel':
      case 'phone':
        return {
          ...baseProps,
          type: 'tel',
          inputMode: 'tel',
          autoCapitalize: 'none',
          autoCorrect: 'off'
        };
      
      case 'number':
        return {
          ...baseProps,
          type: 'number',
          inputMode: 'numeric',
          pattern: '[0-9]*'
        };
      
      case 'url':
        return {
          ...baseProps,
          type: 'url',
          inputMode: 'url',
          autoCapitalize: 'none',
          autoCorrect: 'off',
          spellCheck: false
        };
      
      case 'search':
        return {
          ...baseProps,
          type: 'search',
          inputMode: 'search',
          autoCapitalize: 'none'
        };
      
      case 'password':
        return {
          ...baseProps,
          type: showPassword ? 'text' : 'password',
          autoCapitalize: 'none',
          autoCorrect: 'off',
          spellCheck: false
        };
      
      default:
        return {
          ...baseProps,
          type: 'text'
        };
    }
  };

  const inputProps = getInputProps();

  return (
    <div className="relative">
      {/* Floating Label */}
      <div className="relative">
        <input {...inputProps} />
        
        {label && (
          <motion.label
            htmlFor={inputProps.id}
            className={`
              absolute left-4 pointer-events-none transition-all duration-200 ease-in-out
              ${isFocused || hasValue
                ? 'top-2 text-xs text-primary-600 dark:text-primary-400'
                : 'top-1/2 -translate-y-1/2 text-base text-slate-500 dark:text-slate-400'
              }
            `}
            animate={{
              y: isFocused || hasValue ? -8 : 0,
              scale: isFocused || hasValue ? 0.85 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </motion.label>
        )}

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }} // Touch target optimization
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}

        {/* Success/Error Icons */}
        {(success || error) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {success && <Check className="w-5 h-5 text-green-500" />}
            {error && <X className="w-5 h-5 text-red-500" />}
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {(error || success) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-2"
          >
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                <X className="w-4 h-4 mr-1" />
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                <Check className="w-4 h-4 mr-1" />
                {success}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Type Indicator (Development Mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-1 rounded">
          {inputProps.inputMode || inputProps.type}
        </div>
      )}
    </div>
  );
};

export default MobileOptimizedInput;