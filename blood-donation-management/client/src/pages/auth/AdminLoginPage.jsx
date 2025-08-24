import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, ArrowRight, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { authApi } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    logger.componentMount('AdminLoginPage');
    
    // Redirect if already authenticated as admin
    if (isAuthenticated && user?.role === 'admin') {
      logger.info('Admin already authenticated, redirecting to dashboard', 'ADMIN_LOGIN');
      navigate('/admin', { replace: true });
    }
    
    return () => {
      logger.componentUnmount('AdminLoginPage');
    };
  }, [isAuthenticated, user, navigate]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting) return;
    
    setErrors({});
    setIsSubmitting(true);
    
    try {
      logger.info('Admin login attempt', 'ADMIN_LOGIN', { phoneNumber: formData.phoneNumber });
      
      const loginResponse = await authApi.login({ 
        phone: formData.phoneNumber,
        password: formData.password
      });
      
      logger.debug('Admin login response received', 'ADMIN_LOGIN', {
        success: loginResponse.success,
        hasUser: !!loginResponse.data?.user,
        hasTokens: !!loginResponse.data?.tokens,
        userId: loginResponse.data?.user?.id,
        userRole: loginResponse.data?.user?.role,
        error: loginResponse.error
      });
      
      if (loginResponse.success) {
        const user = loginResponse.data?.user;
        const tokens = loginResponse.data?.tokens;
        
        // Verify user is admin
        if (user?.role !== 'admin') {
          logger.warn('Non-admin user attempted admin login', 'ADMIN_LOGIN', { 
            userId: user?.id,
            role: user?.role,
            phoneNumber: formData.phoneNumber
          });
          
          setErrors({ 
            submit: 'Access denied. This login is for administrators only.' 
          });
          setIsSubmitting(false);
          return;
        }
        
        logger.success('Admin login successful', 'ADMIN_LOGIN', { 
          userId: user._id,
          role: user.role,
          phoneNumber: formData.phoneNumber
        });
        
        // Update auth context
        const loginResult = await login(user, tokens);
        
        logger.debug('Admin auth context update result', 'ADMIN_LOGIN', {
          success: loginResult.success,
          error: loginResult.error
        });
        
        // Navigate to admin dashboard
        navigate('/admin', { 
          state: { 
            message: 'Welcome back, Administrator! You have been successfully signed in.',
            user: user,
            justLoggedIn: true
          },
          replace: true
        });
      } else {
        throw new Error(loginResponse.error?.message || loginResponse.message || 'Login failed');
      }
    } catch (error) {
      logger.error('Admin login error', 'ADMIN_LOGIN', error);
      
      // Provide specific error messages for common scenarios
      let errorMessage = 'Failed to sign in. Please check your credentials and try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid phone number or password. Please check your credentials.';
      } else if (error.response?.status === 423) {
        errorMessage = 'Account temporarily locked due to too many failed login attempts. Please try again later.';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      
      setErrors({ 
        submit: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Administrator Login
          </h1>
          <p className="text-lg text-slate-300">
            Secure access to system administration
          </p>
        </motion.div>

        {/* Admin Login Card */}
        <Card className="p-8 bg-slate-800 border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Administrator Phone Number
                <span className="text-red-400 ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="tel"
                  placeholder="Enter your admin phone number"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    handleInputChange('phoneNumber', value);
                  }}
                  className={`
                    block w-full pl-10 pr-4 py-3 border rounded-lg
                    focus:ring-2 focus:ring-red-500 focus:border-red-500
                    transition-colors duration-200
                    ${errors.phoneNumber 
                      ? 'border-red-500 bg-red-900/20 text-red-100' 
                      : 'border-slate-600 bg-slate-700 text-white'
                    }
                    placeholder-slate-400
                  `}
                  required
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              {errors.phoneNumber && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-400"
                >
                  {errors.phoneNumber}
                </motion.p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Administrator Password
                <span className="text-red-400 ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your admin password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`
                    block w-full pl-10 pr-12 py-3 border rounded-lg
                    focus:ring-2 focus:ring-red-500 focus:border-red-500
                    transition-colors duration-200
                    ${errors.password 
                      ? 'border-red-500 bg-red-900/20 text-red-100' 
                      : 'border-slate-600 bg-slate-700 text-white'
                    }
                    placeholder-slate-400
                  `}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-400"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500 flex items-center justify-center space-x-2"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              <Shield className="h-4 w-4" />
              <span>Access Admin Panel</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            {/* Error Message */}
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-900/20 border border-red-500 rounded-lg flex items-start space-x-2"
              >
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-300">
                  {errors.submit}
                </span>
              </motion.div>
            )}
          </form>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg"
          >
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-100">
                  Security Notice
                </h3>
                <p className="text-xs text-yellow-200 mt-1">
                  This is a secure administrator login. All login attempts are logged and monitored. 
                  Only authorized personnel should access this page.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <div className="mt-6 text-center space-y-2">
            <div>
              <Link
                to="/login"
                className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                Not an admin? Regular Login →
              </Link>
            </div>
            <div>
              <Link
                to="/"
                className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
              >
                ← Back to Public Site
              </Link>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center text-xs text-slate-500"
        >
          <p>CallforBlood Foundation - Administrator Portal</p>
          <p className="mt-1">Unauthorized access is prohibited and will be prosecuted.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLoginPage;