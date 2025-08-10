import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const PasswordConfirmInput = ({ 
  label = "Confirm Password", 
  value = "", 
  onChange, 
  error, 
  placeholder = "Confirm your password",
  originalPassword = "",
  required = false,
  className = "",
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isMatching, setIsMatching] = useState(null);

  // Check if passwords match
  useEffect(() => {
    if (!value || !originalPassword) {
      setIsMatching(null);
      return;
    }
    
    setIsMatching(value === originalPassword);
  }, [value, originalPassword]);

  const getMatchingColor = () => {
    if (isMatching === null) return 'text-slate-500 dark:text-slate-400';
    return isMatching 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  const getInputBorderColor = () => {
    if (error) return 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20';
    if (isMatching === true) return 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20';
    if (isMatching === false) return 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20';
    return 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-slate-400" />
        </div>
        
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-12 py-3 border rounded-lg
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            transition-colors duration-200
            ${getInputBorderColor()}
            text-slate-900 dark:text-white
            placeholder-slate-500 dark:placeholder-slate-400
          `}
          {...props}
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>

        {/* Matching Status Icon */}
        {value && originalPassword && (
          <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none">
            {isMatching ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.p>
      )}

      {/* Password Match Status */}
      {value && originalPassword && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center space-x-1 text-xs ${getMatchingColor()}`}
        >
          {isMatching ? (
            <>
              <Check className="h-3 w-3" />
              <span>Passwords match</span>
            </>
          ) : (
            <>
              <X className="h-3 w-3" />
              <span>Passwords do not match</span>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default PasswordConfirmInput;