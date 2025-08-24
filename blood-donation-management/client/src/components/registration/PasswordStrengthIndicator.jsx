import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const PasswordStrengthIndicator = ({ password, showDetails = true }) => {
  const requirements = [
    {
      id: 'length',
      label: 'At least 8 characters',
      test: (pwd) => pwd.length >= 8
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter',
      test: (pwd) => /[A-Z]/.test(pwd)
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter',
      test: (pwd) => /[a-z]/.test(pwd)
    },
    {
      id: 'number',
      label: 'One number',
      test: (pwd) => /\d/.test(pwd)
    },
    {
      id: 'special',
      label: 'One special character',
      test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    }
  ];

  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
    
    const passedRequirements = requirements.filter(req => req.test(password)).length;
    
    if (passedRequirements <= 1) {
      return { score: 1, label: 'Very Weak', color: 'bg-red-500' };
    } else if (passedRequirements === 2) {
      return { score: 2, label: 'Weak', color: 'bg-orange-500' };
    } else if (passedRequirements === 3) {
      return { score: 3, label: 'Fair', color: 'bg-yellow-500' };
    } else if (passedRequirements === 4) {
      return { score: 4, label: 'Good', color: 'bg-blue-500' };
    } else {
      return { score: 5, label: 'Strong', color: 'bg-green-500' };
    }
  };

  const strength = getPasswordStrength();

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Password Strength</span>
          <span className={`text-xs font-medium ${
            strength.score <= 2 ? 'text-red-600' :
            strength.score <= 3 ? 'text-yellow-600' :
            strength.score <= 4 ? 'text-blue-600' : 'text-green-600'
          }`}>
            {strength.label}
          </span>
        </div>
        
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <motion.div
              key={level}
              className={`h-1 flex-1 rounded-full ${
                level <= strength.score ? strength.color : 'bg-gray-200'
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: level <= strength.score ? 1 : 0 }}
              transition={{ duration: 0.3, delay: level * 0.1 }}
            />
          ))}
        </div>
      </div>

      {/* Requirements List */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="space-y-1"
        >
          {requirements.map((requirement) => {
            const isPassed = requirement.test(password);
            return (
              <motion.div
                key={requirement.id}
                className="flex items-center space-x-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  isPassed ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {isPassed ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <X className="w-3 h-3 text-gray-400" />
                  )}
                </div>
                <span className={`text-xs ${
                  isPassed ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {requirement.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;