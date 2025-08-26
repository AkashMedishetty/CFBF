import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Shield, Users } from 'lucide-react';
import SimplifiedRegistrationForm from '../../components/registration/SimplifiedRegistrationForm';
import { featureFlags } from '../../utils/featureFlags';

const SimplifiedRegisterPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegistrationSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call for now since backend integration is disabled
      console.log('Registration data:', formData);
      
      // In a real implementation, this would call the API
      // const response = await authApi.register(formData);
      
      // Simulate success after 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, just show success and redirect to home
      alert('Registration successful! Welcome to Callforblood Foundation.');
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <div className="flex justify-center mb-4">
          <div className="bg-primary-100 p-3 rounded-full">
            <Heart className="w-8 h-8 text-primary-600 fill-current" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Join Callforblood Foundation
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          India's first privacy-protected blood donation platform. 
          Register now and help save lives with complete privacy protection.
        </p>
      </motion.div>

      {/* Privacy Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-4xl mx-auto mb-8"
      >
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Complete Privacy</h3>
            <p className="text-sm text-gray-600">Your details stay completely secure</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">3-Month Hiding</h3>
            <p className="text-sm text-gray-600">Auto-hidden after donation</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Heart className="w-6 h-6 text-purple-600 fill-current" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">100% Free</h3>
            <p className="text-sm text-gray-600">Always free, no hidden costs</p>
          </div>
        </div>
      </motion.div>

      {/* Registration Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <SimplifiedRegistrationForm
          onSubmit={handleRegistrationSubmit}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mt-4"
        >
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-center mt-8"
      >
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/signin')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Sign in here
          </button>
        </p>
        <p className="text-xs text-gray-400 mt-2">
          By registering, you agree to our privacy-first approach to blood donation
        </p>
      </motion.div>
    </div>
  );
};

export default SimplifiedRegisterPage;