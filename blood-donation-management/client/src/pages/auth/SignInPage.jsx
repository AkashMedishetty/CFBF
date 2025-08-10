import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, ArrowRight, AlertCircle, Lock, MessageSquare, Key } from 'lucide-react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Card from '../../components/ui/Card';
import OTPModal from '../../components/ui/OTPModal';
import { authApi } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

const SignInPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' or 'password'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    logger.componentMount('SignInPage');
    return () => {
      logger.componentUnmount('SignInPage');
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
      if (loginMethod === 'otp') {
        logger.info('Opening OTP modal for login', 'SIGN_IN', { phoneNumber });
        // Just open the modal - let it handle the OTP request
        setShowOTPModal(true);
        setIsSubmitting(false);
      } else {
        // Password-based login
        if (!password) {
          setErrors({ password: 'Password is required' });
          setIsSubmitting(false);
          return;
        }

        logger.info('Attempting password login', 'SIGN_IN', { phoneNumber });
        
        const loginResponse = await authApi.login({ 
          phone: phoneNumber,
          password: password
        });
        
        logger.debug('Password login response received', 'SIGN_IN', {
          success: loginResponse.success,
          hasUser: !!loginResponse.data?.user,
          hasTokens: !!loginResponse.data?.tokens,
          userId: loginResponse.data?.user?.id,
          error: loginResponse.error
        });
        
        if (loginResponse.success) {
          logger.success('Password login successful', 'SIGN_IN', { 
            userId: loginResponse.data?.user?._id,
            isAdmin: loginResponse.data?.user?.isAdmin 
          });
          
          const user = loginResponse.data?.user;
          const tokens = loginResponse.data?.tokens;
          
          // Update auth context
          const loginResult = await login(user, tokens);
          
          logger.debug('Auth context update result', 'SIGN_IN', {
            success: loginResult.success,
            error: loginResult.error
          });
          
          // Check if user has completed onboarding
          const hasCompletedOnboarding = user?.hasCompletedOnboarding;
          
          // Determine redirect path
          let redirectPath = '/donor/dashboard';
          let message = 'Welcome back! You have been successfully signed in.';
          
          if (user?.role === 'admin') {
            redirectPath = '/admin';
          } else if (!hasCompletedOnboarding) {
            redirectPath = '/donor/onboarding';
            message = 'Welcome! Please complete your profile to continue.';
          }
          
          logger.info('Navigating after password login', 'SIGN_IN', { redirectPath });
          
          navigate(redirectPath, { 
            state: { 
              message,
              user: user,
              justLoggedIn: true
            },
            replace: true
          });
        } else {
          throw new Error(loginResponse.error?.message || loginResponse.message || 'Login failed');
        }
      }
    } catch (error) {
      logger.error('Login error', 'SIGN_IN', error);
      setErrors({ 
        submit: error.response?.data?.error?.message || error.message || 'Failed to sign in. Please try again.' 
      });
    } finally {
      if (loginMethod === 'password') {
        setIsSubmitting(false);
      }
    }
  };

  const handleOTPSuccess = async (data) => {
    try {
      logger.info('🎉 OTP verification successful', 'SIGN_IN', { 
        phoneNumber,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : 'null',
        hasOtp: !!data.otp
      });
      
      // Use the OTP code for login since OTP verification was successful
      logger.info('🔐 Using OTP for login', 'SIGN_IN', {
        phone: phoneNumber,
        otpLength: data.otp?.length,
        otpPreview: data.otp ? data.otp.substring(0, 3) + '***' : 'null'
      });
      
      const loginResponse = await authApi.loginWithOTP({ 
        phone: phoneNumber,
        otp: data.otp // Use the OTP code from verification
      });
      
      logger.debug('📡 Login response received', 'SIGN_IN', {
        success: loginResponse.success,
        hasUser: !!loginResponse.data?.user,
        hasTokens: !!loginResponse.data?.tokens,
        userId: loginResponse.data?.user?.id,
        error: loginResponse.error
      });
      
      if (loginResponse.success) {
        logger.success('Login successful', 'SIGN_IN', { 
          userId: loginResponse.data?.user?._id,
          isAdmin: loginResponse.data?.user?.isAdmin 
        });
        
        const user = loginResponse.data?.user;
        const tokens = loginResponse.data?.tokens;
        
        logger.debug('📋 Preparing to update auth context', 'SIGN_IN', {
          hasUser: !!user,
          userId: user?.id,
          userRole: user?.role,
          userStatus: user?.status,
          hasTokens: !!tokens,
          hasAccessToken: !!tokens?.accessToken,
          accessTokenLength: tokens?.accessToken?.length
        });
        
        // Update auth context
        const loginResult = await login(user, tokens);
        
        logger.debug('🔄 Auth context update result', 'SIGN_IN', {
          success: loginResult.success,
          error: loginResult.error
        });
        
        // Check if user has completed onboarding
        const hasCompletedOnboarding = user?.hasCompletedOnboarding;
        
        // Determine redirect path
        let redirectPath = '/donor/dashboard';
        let message = 'Welcome back! You have been successfully signed in.';
        
        if (user?.role === 'admin') {
          redirectPath = '/admin';
        } else if (!hasCompletedOnboarding) {
          redirectPath = '/donor/onboarding';
          message = 'Welcome! Please complete your profile to continue.';
        }
        
        logger.info('Navigating after login', 'SIGN_IN', { redirectPath });
        
        // Add a small delay to allow the modal to close smoothly
        setTimeout(() => {
          navigate(redirectPath, { 
            state: { 
              message,
              user: user,
              justVerified: true
            },
            replace: true
          });
        }, 500);
      } else {
        throw new Error(loginResponse.error?.message || loginResponse.message || 'Login failed');
      }
    } catch (error) {
      logger.error('Login error', 'SIGN_IN', error);
      setErrors({ 
        submit: error.response?.data?.error?.message || error.message || 'Failed to sign in. Please try again.' 
      });
      setShowOTPModal(false);
    }
  };

  const handleOTPError = (error) => {
    logger.error('OTP verification failed', 'SIGN_IN', { 
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
            Welcome Back
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Sign in to your account to continue
          </p>
        </motion.div>

        {/* Sign In Card */}
        <Card className="p-8">
          {/* Login Method Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('otp');
                  setErrors({});
                  setPassword('');
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  loginMethod === 'otp'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>OTP Login</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setErrors({});
                  setShowOTPModal(false);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  loginMethod === 'password'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Key className="h-4 w-4" />
                <span>Password Login</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number Input */}
            <div>
              <Input
                label="Phone Number"
                icon={Phone}
                type="tel"
                placeholder="Enter your 10-digit number"
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
              {loginMethod === 'otp' && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  We'll send you a verification code via WhatsApp
                </p>
              )}
            </div>

            {/* Password Input (only for password login) */}
            {loginMethod === 'password' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={(value) => {
                    setPassword(value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  error={errors.password}
                  placeholder="Enter your password"
                  showStrengthIndicator={false}
                  required
                />
                <div className="mt-2 text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full flex items-center justify-center space-x-2"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {loginMethod === 'otp' ? (
                <>
                  <MessageSquare className="h-4 w-4" />
                  <span>Continue with OTP</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Sign In with Password</span>
                </>
              )}
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

          {/* Sign Up Link */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              >
                Register here
              </Link>
            </p>
            
            {/* Admin Login Link */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Administrator?{' '}
                <Link
                  to="/admin/login"
                  className="font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                  Admin Login
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        phoneNumber={phoneNumber}
        purpose="login"
        onVerificationSuccess={handleOTPSuccess}
        onVerificationError={handleOTPError}
        autoRequest={true}
      />
    </div>
  );
};

export default SignInPage;
