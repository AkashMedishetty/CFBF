import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PasswordInput = ({ 
  label = "Password", 
  value = "", 
  onChange, 
  error, 
  placeholder = "Enter your password",
  showStrengthIndicator = true,
  required = false,
  className = "",
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState({
    score: 0,
    level: 'Weak',
    validations: {
      minLength: false,
      hasLowercase: false,
      hasUppercase: false,
      hasNumbers: false,
      hasSymbols: false,
      noCommonPatterns: true
    },
    suggestions: []
  });

  // Password strength validation
  useEffect(() => {
    if (!value) {
      setStrength({
        score: 0,
        level: 'Weak',
        validations: {
          minLength: false,
          hasLowercase: false,
          hasUppercase: false,
          hasNumbers: false,
          hasSymbols: false,
          noCommonPatterns: true
        },
        suggestions: []
      });
      return;
    }

    const validations = {
      minLength: value.length >= 8,
      hasLowercase: /[a-z]/.test(value),
      hasUppercase: /[A-Z]/.test(value),
      hasNumbers: /\d/.test(value),
      hasSymbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(value),
      noCommonPatterns: !hasCommonPatterns(value)
    };

    const score = Object.values(validations).filter(Boolean).length;
    const maxScore = Object.keys(validations).length;
    
    const level = getStrengthLevel(score, maxScore);
    const suggestions = getPasswordSuggestions(validations);

    setStrength({
      score,
      level,
      validations,
      suggestions,
      percentage: Math.round((score / maxScore) * 100)
    });
  }, [value]);

  const hasCommonPatterns = (password) => {
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i,
      /welcome/i,
      /monkey/i,
      /dragon/i
    ];
    return commonPatterns.some(pattern => pattern.test(password));
  };

  const getStrengthLevel = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'Very Strong';
    if (percentage >= 75) return 'Strong';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Weak';
  };

  const getPasswordSuggestions = (validations) => {
    const suggestions = [];
    if (!validations.minLength) suggestions.push('Use at least 8 characters');
    if (!validations.hasLowercase) suggestions.push('Include lowercase letters (a-z)');
    if (!validations.hasUppercase) suggestions.push('Include uppercase letters (A-Z)');
    if (!validations.hasNumbers) suggestions.push('Include numbers (0-9)');
    if (!validations.hasSymbols) suggestions.push('Include special characters (!@#$%^&*)');
    if (!validations.noCommonPatterns) suggestions.push('Avoid common patterns like "123456" or "password"');
    return suggestions;
  };

  const getStrengthColor = () => {
    switch (strength.level) {
      case 'Very Strong': return 'text-green-600 dark:text-green-400';
      case 'Strong': return 'text-green-500 dark:text-green-400';
      case 'Good': return 'text-yellow-500 dark:text-yellow-400';
      case 'Fair': return 'text-orange-500 dark:text-orange-400';
      default: return 'text-red-500 dark:text-red-400';
    }
  };

  const getStrengthBarColor = () => {
    switch (strength.level) {
      case 'Very Strong': return 'bg-green-500';
      case 'Strong': return 'bg-green-400';
      case 'Good': return 'bg-yellow-400';
      case 'Fair': return 'bg-orange-400';
      default: return 'bg-red-400';
    }
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
            ${error 
              ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
            }
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

      {/* Password Strength Indicator */}
      {showStrengthIndicator && value && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          {/* Strength Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Password Strength
              </span>
              <span className={`text-xs font-medium ${getStrengthColor()}`}>
                {strength.level}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor()}`}
                initial={{ width: 0 }}
                animate={{ width: `${strength.percentage || 0}%` }}
              />
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(strength.validations).map(([key, isValid]) => {
              const labels = {
                minLength: '8+ characters',
                hasLowercase: 'Lowercase letter',
                hasUppercase: 'Uppercase letter',
                hasNumbers: 'Number',
                hasSymbols: 'Special character',
                noCommonPatterns: 'No common patterns'
              };

              return (
                <div
                  key={key}
                  className={`flex items-center space-x-1 ${
                    isValid ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isValid ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  <span>{labels[key]}</span>
                </div>
              );
            })}
          </div>

          {/* Suggestions */}
          <AnimatePresence>
            {strength.suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
              >
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Suggestions to improve your password:
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                  {strength.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-1">
                      <span className="text-yellow-500 mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default PasswordInput;