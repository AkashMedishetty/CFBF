import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, ArrowRight, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PasswordInput from '../../components/ui/PasswordInput';
import PasswordConfirmInput from '../../components/ui/PasswordConfirmInput';
import { authApi } from '../../utils/api';
import logger from '../../utils/logger';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get data from navigation state
  const { phoneNumber, otp, fromForgotPassword } = location.state || {};

  useEffect(() => {
    logger.componentMount('ResetPasswordPage');
    
    // Redirect if required data is missing
    if (!phoneNumber || !otp || !fromForgotPassword) {
      logger.warn('Missing required data for password reset', 'RESET_PASSWORD', {
        hasPhoneNumber: !!phoneNumber,
        hasOtp: !!otp,
        fromForgotPassword
      });
      navigate('/forgot-password', { replace: true });
      return;
    }
    
    return () => {
      logger.componentUnmount('ResetPasswordPage');
    };
  }, [phoneNumber, otp, fromForgotPassword, navigate]);

  const validatePasswords = () => {
    const newErrors = {};
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting) return;
    
    setErrors({});
    setIsSubmitting(true);
    
    try {
      logger.info('Attempting password reset', 'RESET_PASSWORD', { phoneNumber });
      
      // Call password reset API
      const resetResponse = await authApi.resetPassword({
        phoneNumber,
        otp,
        newPassword: password
      });
      
      logger.debug('Password reset response received', 'RESET_PASSWORD', {
        success: resetResponse.success,
        message: resetResponse.message
      });
      
      if (resetResponse.success) {
        logger.success('Password reset successful', 'RESET_PASSWORD', { phoneNumber });
        setIsSuccess(true);
        
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Password reset successful! Please sign in with your new password.',
              phoneNumber: phoneNumber
            },
            replace: true
          });
        }, 3000);
      } else {
        throw new Error(resetResponse.error?.message || resetResponse.message || 'Password reset failed');
      }
    } catch (error) {
      logger.error('Password reset error', 'RESET_PASSWORD', error);
      setErrors({ 
        submit: error.response?.data?.error?.message || error.message || 'Failed to reset password. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Card className="p-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Password Reset Successful!
              </h1>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              
              <Button
                onClick={() => navigate('/login', { 
                  state: { 
                    message: 'Password reset successful! Please sign in with your new password.',
                    phoneNumber: phoneNumber
                  },
                  replace: true
                })}
                className="w-full"
              >
                Continue to Sign In
              </Button>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                Redirecting automatically in 3 seconds...
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Reset Your Password
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Create a new secure password for your account
          </p>
          {phoneNumber && (
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              For account: {phoneNumber}
            </p>
          )}
        </motion.div>

        {/* Reset Password Card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Input */}
            <PasswordInput
              label="New Password"
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              error={errors.password}
              placeholder="Enter your new password"
              showStrengthIndicator={true}
              required
              autoFocus
            />

            {/* Confirm Password Input */}
            <PasswordConfirmInput
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              error={errors.confirmPassword}
              placeholder="Confirm your new password"
              originalPassword={password}
              required
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full flex items-center justify-center space-x-2"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              <Lock className="h-4 w-4" />
              <span>Reset Password</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            {/* Error Message */}
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2"
              >
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  {errors.submit}
                </span>
              </motion.div>
            )}
          </form>

          {/* Back to Sign In Link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </Card>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
        >
          <div className="flex items-start space-x-2">
            <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Security Tips
              </h3>
              <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                <li>• Use a unique password that you don't use elsewhere</li>
                <li>• Include uppercase, lowercase, numbers, and symbols</li>
                <li>• Avoid common words or personal information</li>
                <li>• Consider using a password manager</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;