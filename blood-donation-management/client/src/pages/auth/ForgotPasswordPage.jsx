import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, ArrowRight, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import OTPModal from '../../components/ui/OTPModal';
import { authApi } from '../../utils/api';
import logger from '../../utils/logger';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'success'

  useEffect(() => {
    logger.componentMount('ForgotPasswordPage');
    return () => {
      logger.componentUnmount('ForgotPasswordPage');
    };
  }, []);

  const validatePhoneNumber = (number) => {
    if (!number) return 'Phone number is required';
    if (!/^\d{10}$/.test(number)) return 'Please enter a valid 10-digit phone number';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) {
      setErrors({ phone: phoneError });
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting) return;
    
    setErrors({});
    setIsSubmitting(true);
    
    try {
      logger.info('Requesting password reset OTP', 'FORGOT_PASSWORD', { phoneNumber });
      
      // Check if phone number exists in the system
      const phoneCheckResponse = await authApi.checkPhoneAvailability(phoneNumber);
      
      if (phoneCheckResponse.available) {
        // Phone number is not registered
        setErrors({ 
          phone: 'This phone number is not registered. Please check your number or register for a new account.' 
        });
        setIsSubmitting(false);
        return;
      }
      
      // Phone number exists, proceed with OTP
      setShowOTPModal(true);
      setStep('otp');
    } catch (error) {
      logger.error('Error requesting password reset', 'FORGOT_PASSWORD', error);
      setErrors({ 
        submit: error.response?.data?.error?.message || error.message || 'An error occurred. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPSuccess = async (data) => {
    try {
      logger.success('OTP verification successful for password reset', 'FORGOT_PASSWORD', { 
        phoneNumber,
        hasData: !!data,
        hasOtp: !!data.otp
      });
      
      // Navigate to reset password page with OTP data
      navigate('/reset-password', { 
        state: { 
          phoneNumber,
          otp: data.otp,
          fromForgotPassword: true
        },
        replace: true
      });
      
    } catch (error) {
      logger.error('Error after OTP verification', 'FORGOT_PASSWORD', error);
      setErrors({ 
        submit: 'Verification successful but encountered an error. Please try again.' 
      });
    }
  };

  const handleOTPError = (error) => {
    logger.error('OTP verification failed for password reset', 'FORGOT_PASSWORD', { 
      error: error.message,
      phoneNumber,
      remainingAttempts: error.remainingAttempts 
    });
    
    setErrors({ 
      otp: error.message || 'OTP verification failed',
      remainingAttempts: error.remainingAttempts
    });
  };

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
            Forgot Password?
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Don't worry, we'll help you reset it
          </p>
        </motion.div>

        {/* Forgot Password Card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number Input */}
            <div>
              <Input
                label="Phone Number"
                icon={Phone}
                type="tel"
                placeholder="Enter your registered phone number"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhoneNumber(value);
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                error={errors.phone}
                required
                autoFocus
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                We'll send you a verification code to reset your password
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full flex items-center justify-center space-x-2"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              <span>Send Reset Code</span>
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

          {/* Sign Up Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              >
                Register here
              </Link>
            </p>
          </div>
        </Card>
      </div>

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        phoneNumber={phoneNumber}
        purpose="password-reset"
        onVerificationSuccess={handleOTPSuccess}
        onVerificationError={handleOTPError}
        autoRequest={true}
        title="Verify Your Identity"
        description="Enter the verification code sent to your phone to proceed with password reset"
      />
    </div>
  );
};

export default ForgotPasswordPage;