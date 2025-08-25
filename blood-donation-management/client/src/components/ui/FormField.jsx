import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const FormField = ({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  success,
  hint,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  children,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success);

  const getInputClasses = () => {
    let classes = `
      w-full px-3 py-2 border rounded-lg transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-1
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
      dark:bg-dark-bg-secondary dark:border-dark-border dark:text-white
      dark:disabled:bg-gray-800 dark:disabled:text-gray-400
      ${inputClassName}
    `;

    if (hasError) {
      classes += ' border-red-300 focus:border-red-500 focus:ring-red-500';
    } else if (hasSuccess) {
      classes += ' border-green-300 focus:border-green-500 focus:ring-green-500';
    } else if (isFocused) {
      classes += ' border-primary-500 focus:border-primary-500 focus:ring-primary-500';
    } else {
      classes += ' border-gray-300 focus:border-primary-500 focus:ring-primary-500';
    }

    return classes;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {children ? (
          children
        ) : (
          <input
            type={inputType}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={getInputClasses()}
            {...props}
          />
        )}

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Success Icon */}
        {hasSuccess && !hasError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
        )}

        {/* Error Icon */}
        {hasError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>

      {/* Messages */}
      <AnimatePresence mode="wait">
        {(error || success || hint) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-1"
          >
            {/* Error Message */}
            {error && (
              <div className="flex items-start space-x-1">
                <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Success Message */}
            {success && !error && (
              <div className="flex items-start space-x-1">
                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  {success}
                </p>
              </div>
            )}

            {/* Hint Message */}
            {hint && !error && !success && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {hint}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Textarea variant
export const TextareaField = ({ rows = 4, ...props }) => {
  return (
    <FormField {...props}>
      <textarea
        rows={rows}
        value={props.value}
        onChange={props.onChange}
        onFocus={() => {}}
        onBlur={props.onBlur}
        placeholder={props.placeholder}
        disabled={props.disabled}
        className={`
          w-full px-3 py-2 border rounded-lg transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-1
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          dark:bg-dark-bg-secondary dark:border-dark-border dark:text-white
          dark:disabled:bg-gray-800 dark:disabled:text-gray-400
          resize-vertical min-h-[100px]
          ${props.error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
            : props.success
            ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }
          ${props.inputClassName || ''}
        `}
      />
    </FormField>
  );
};

// Select variant
export const SelectField = ({ options = [], ...props }) => {
  return (
    <FormField {...props}>
      <select
        value={props.value}
        onChange={props.onChange}
        onFocus={() => {}}
        onBlur={props.onBlur}
        disabled={props.disabled}
        className={`
          w-full px-3 py-2 border rounded-lg transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-1
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          dark:bg-dark-bg-secondary dark:border-dark-border dark:text-white
          dark:disabled:bg-gray-800 dark:disabled:text-gray-400
          ${props.error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
            : props.success
            ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }
          ${props.inputClassName || ''}
        `}
      >
        {props.placeholder && (
          <option value="" disabled>
            {props.placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};

export default FormField;