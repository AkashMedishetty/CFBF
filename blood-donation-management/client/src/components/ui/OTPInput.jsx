import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import logger from '../../utils/logger';

const OTPInput = ({
  length = 6,
  value = '',
  onChange,
  onComplete,
  disabled = false,
  error = '',
  success = '',
  autoFocus = true,
  className = ''
}) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    logger.componentMount('OTPInput', { length, autoFocus, disabled });
    
    // Initialize refs array
    inputRefs.current = inputRefs.current.slice(0, length);
    
    // Auto-focus first input if enabled
    if (autoFocus && !disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    
    return () => {
      logger.componentUnmount('OTPInput');
    };
  }, [length, autoFocus, disabled]);

  useEffect(() => {
    // Update internal state when value prop changes
    if (value !== otp.join('')) {
      const newOtp = value.split('').slice(0, length);
      while (newOtp.length < length) {
        newOtp.push('');
      }
      setOtp(newOtp);
      logger.debug(`OTP value updated from props: ${value}`, 'OTP_INPUT');
    }
  }, [value, length, otp]);

  useEffect(() => {
    // Call onChange when OTP changes
    const otpString = otp.join('');
    if (onChange) {
      onChange(otpString);
    }
    
    // Call onComplete when OTP is fully entered
    if (otpString.length === length && onComplete) {
      logger.ui('COMPLETE', 'OTPInput', { otp: otpString }, 'OTP_INPUT');
      onComplete(otpString);
    }
  }, [otp, onChange, onComplete, length]);

  const handleChange = useCallback((index, value) => {
    // Only allow numeric input
    if (!/^\d*$/.test(value)) {
      logger.debug(`Non-numeric input rejected: ${value}`, 'OTP_INPUT');
      return;
    }

    setOtp(prevOtp => {
      const newOtp = [...prevOtp];
      newOtp[index] = value.slice(-1); // Take only the last character
      
      logger.ui('CHANGE', 'OTPInput', { index, value: value.slice(-1) }, 'OTP_INPUT');

      // Auto-focus next input
      if (value && index < length - 1) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 0);
      }
      
      return newOtp;
    });
  }, [length]);

  const handleKeyDown = useCallback((index, e) => {
    logger.ui('KEYDOWN', 'OTPInput', { index, key: e.key }, 'OTP_INPUT');

    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current input is empty, move to previous input
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 0);
      } else {
        // Clear current input
        setOtp(prevOtp => {
          const newOtp = [...prevOtp];
          newOtp[index] = '';
          return newOtp;
        });
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      const otpString = otp.join('');
      if (otpString.length === length && onComplete) {
        logger.ui('ENTER_COMPLETE', 'OTPInput', { otp: otpString }, 'OTP_INPUT');
        onComplete(otpString);
      }
    }
  }, [otp, length, onComplete]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    const pastedOtp = pastedData.replace(/\D/g, '').slice(0, length);
    
    logger.ui('PASTE', 'OTPInput', { pastedData: pastedOtp }, 'OTP_INPUT');

    if (pastedOtp) {
      const newOtp = Array(length).fill('');
      for (let i = 0; i < pastedOtp.length; i++) {
        newOtp[i] = pastedOtp[i];
      }
      setOtp(newOtp);

      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtp.findIndex(digit => !digit);
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
      setTimeout(() => {
        inputRefs.current[focusIndex]?.focus();
      }, 0);
    }
  }, [length]);

  const handleFocus = useCallback((index) => {
    logger.ui('FOCUS', 'OTPInput', { index }, 'OTP_INPUT');
    // Select all text when focusing
    inputRefs.current[index]?.select();
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.05
      }
    }
  };

  const inputVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    }
  };

  // Dynamic styles based on state
  const getInputStyles = (index) => {
    let baseStyles = 'w-12 h-12 text-center text-xl font-semibold border-2 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    if (disabled) {
      baseStyles += ' opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-700';
    } else if (error) {
      baseStyles += ' border-red-500 focus:ring-red-500 focus:border-red-500';
    } else if (success) {
      baseStyles += ' border-green-500 focus:ring-green-500 focus:border-green-500';
    } else if (otp[index]) {
      baseStyles += ' border-primary-500 focus:ring-primary-500 focus:border-primary-500';
    } else {
      baseStyles += ' border-slate-300 dark:border-slate-600 focus:ring-primary-500 focus:border-primary-500';
    }

    return baseStyles;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex justify-center space-x-3"
      >
        {otp.map((digit, index) => (
          <motion.input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            variants={inputVariants}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            disabled={disabled}
            className={getInputStyles(index)}
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </motion.div>

      {/* Error/Success Message */}
      {(error || success) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {success}
            </p>
          )}
        </motion.div>
      )}

      {/* Helper text */}
      <div className="text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter the {length}-digit code sent to your phone
        </p>
      </div>
    </div>
  );
};

export default OTPInput;