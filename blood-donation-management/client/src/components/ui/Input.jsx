import React, { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const Input = forwardRef(({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder = '',
  error = '',
  disabled = false,
  required = false,
  icon: Icon,
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <motion.label
          className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
            error 
              ? 'text-red-600 dark:text-red-400' 
              : isFocused 
                ? 'text-primary-600 dark:text-primary-400' 
                : 'text-slate-700 dark:text-slate-300'
          }`}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </motion.label>
      )}
      
      <div className="relative">
        {Icon && (
          <Icon className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-200 ${
            error 
              ? 'text-red-400' 
              : isFocused 
                ? 'text-primary-500' 
                : 'text-slate-400'
          }`} />
        )}
        
        <motion.input
          ref={ref}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-lg
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
            placeholder-slate-400 dark:placeholder-slate-500
            text-slate-900 dark:text-white
            ${error 
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
              : 'border-slate-300 dark:border-slate-600 focus:ring-primary-500 focus:border-primary-500'
            }
            ${disabled 
              ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-700' 
              : 'hover:border-slate-400 dark:hover:border-slate-500'
            }
            ${Icon ? 'pl-12' : ''}
            ${isPassword ? 'pr-12' : ''}
          `}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.15 }}
          {...props}
        />
        
        {isPassword && (
          <motion.button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </motion.button>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center space-x-2 text-red-600 dark:text-red-400"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </motion.div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;