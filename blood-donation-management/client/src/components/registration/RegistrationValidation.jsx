import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

const RegistrationValidation = ({ field, value, validationType, onValidationResult }) => {
  const [validationState, setValidationState] = useState({
    isValidating: false,
    isValid: null,
    message: null
  });

  useEffect(() => {
    if (!value) {
      setValidationState({
        isValidating: false,
        isValid: null,
        message: null
      });
      onValidationResult && onValidationResult(field, null);
      return;
    }

    validateField(value);
  }, [value, field, validationType]);

  const validateField = async (inputValue) => {
    setValidationState(prev => ({
      ...prev,
      isValidating: true
    }));

    try {
      let result = { isValid: true, message: null };

      switch (validationType) {
        case 'email':
          result = await validateEmail(inputValue);
          break;
        case 'phone':
          result = await validatePhone(inputValue);
          break;
        case 'password':
          result = validatePassword(inputValue);
          break;
        case 'name':
          result = validateName(inputValue);
          break;
        case 'age':
          result = validateAge(inputValue);
          break;
        default:
          result = { isValid: true, message: null };
      }

      setValidationState({
        isValidating: false,
        isValid: result.isValid,
        message: result.message
      });

      onValidationResult && onValidationResult(field, result);
    } catch (error) {
      setValidationState({
        isValidating: false,
        isValid: false,
        message: 'Validation failed. Please try again.'
      });
      onValidationResult && onValidationResult(field, { isValid: false, message: 'Validation failed' });
    }
  };

  const validateEmail = async (email) => {
    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Invalid email format' };
    }

    // Simulate API call to check if email is available
    // In real implementation, this would call the backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation - in real app this would check against database
    const unavailableEmails = ['test@example.com', 'admin@test.com'];
    if (unavailableEmails.includes(email.toLowerCase())) {
      return { isValid: false, message: 'This email is already registered' };
    }

    return { isValid: true, message: 'Email is available' };
  };

  const validatePhone = async (phone) => {
    // Indian phone number validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return { isValid: false, message: 'Invalid phone number format' };
    }

    // Simulate API call to check if phone is available
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock validation
    const unavailablePhones = ['9876543210', '8765432109'];
    if (unavailablePhones.includes(phone)) {
      return { isValid: false, message: 'This phone number is already registered' };
    }

    return { isValid: true, message: 'Phone number is available' };
  };

  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('One number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('One special character');
    }

    if (errors.length > 0) {
      return { 
        isValid: false, 
        message: `Password must have: ${errors.join(', ')}` 
      };
    }

    return { isValid: true, message: 'Strong password' };
  };

  const validateName = (name) => {
    const nameParts = name.trim().split(/\s+/);
    
    if (nameParts.length < 2) {
      return { isValid: false, message: 'Please enter both first and last name' };
    }
    
    if (nameParts.some(part => part.length < 2)) {
      return { isValid: false, message: 'Each name part must be at least 2 characters' };
    }
    
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return { isValid: false, message: 'Name can only contain letters and spaces' };
    }

    return { isValid: true, message: 'Valid name format' };
  };

  const validateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      return { isValid: false, message: 'Must be at least 18 years old to donate blood' };
    }
    
    if (age > 65) {
      return { isValid: false, message: 'Maximum age for blood donation is 65 years' };
    }

    return { isValid: true, message: `Age: ${age} years (eligible for donation)` };
  };

  const getValidationIcon = () => {
    if (validationState.isValidating) {
      return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    
    if (validationState.isValid === true) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    
    if (validationState.isValid === false) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    
    return null;
  };

  const getValidationColor = () => {
    if (validationState.isValidating) return 'text-blue-600';
    if (validationState.isValid === true) return 'text-green-600';
    if (validationState.isValid === false) return 'text-red-600';
    return 'text-gray-500';
  };

  if (!value || (!validationState.isValidating && validationState.isValid === null)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex items-center space-x-2 mt-1"
    >
      {getValidationIcon()}
      {validationState.message && (
        <span className={`text-sm ${getValidationColor()}`}>
          {validationState.message}
        </span>
      )}
    </motion.div>
  );
};

export default RegistrationValidation;