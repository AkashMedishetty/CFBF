import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Droplet, 
  Weight, 
  Users, 
  Shield,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import OTPModal from '../../components/ui/OTPModal';
import { authApi } from '../../utils/api';
import logger from '../../utils/logger';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    phoneNumber: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    weight: '',
    height: '',
    
    // Address Information
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    
    // Location coordinates (will be set via geolocation or address)
    location: {
      type: 'Point',
      coordinates: []
    },
    
    // Emergency Contact
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: ''
    },
    
    // Medical Information
    medicalInfo: {
      conditions: [],
      medications: [],
      allergies: []
    },
    
    // Preferences
    preferences: {
      maxTravelDistance: 15,
      notificationMethods: {
        whatsapp: true,
        sms: false,
        email: false
      }
    }
  });

  useEffect(() => {
    logger.componentMount('RegisterPage');
    
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              type: 'Point',
              coordinates: [position.coords.longitude, position.coords.latitude]
            }
          }));
          logger.info('User location obtained', 'REGISTER_PAGE');
        },
        (error) => {
          logger.warn('Failed to get user location', 'REGISTER_PAGE', error);
        }
      );
    }
    
    return () => {
      logger.componentUnmount('RegisterPage');
    };
  }, []);

  const steps = [
    {
      id: 1,
      title: 'Personal Information',
      description: 'Tell us about yourself',
      icon: User,
      fields: ['name', 'phoneNumber', 'email', 'dateOfBirth', 'gender']
    },
    {
      id: 2,
      title: 'Medical Details',
      description: 'Your health information',
      icon: Droplet,
      fields: ['bloodType', 'weight', 'height']
    },
    {
      id: 3,
      title: 'Location & Contact',
      description: 'Where can we reach you?',
      icon: MapPin,
      fields: ['address', 'emergencyContact']
    },
    {
      id: 4,
      title: 'Preferences',
      description: 'Customize your experience',
      icon: Shield,
      fields: ['preferences']
    }
  ];

  const bloodTypes = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  const relationshipOptions = [
    { value: 'parent', label: 'Parent' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'child', label: 'Child' },
    { value: 'friend', label: 'Friend' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateStep = (step) => {
    const stepErrors = {};
    const currentStepFields = steps[step - 1].fields;
    
    currentStepFields.forEach(field => {
      if (field === 'address') {
        if (!formData.address.street.trim()) {
          stepErrors['address.street'] = 'Street address is required';
        }
        if (!formData.address.city.trim()) {
          stepErrors['address.city'] = 'City is required';
        }
        if (!formData.address.state.trim()) {
          stepErrors['address.state'] = 'State is required';
        }
        if (!formData.address.pincode.trim()) {
          stepErrors['address.pincode'] = 'Pincode is required';
        } else if (!/^\d{6}$/.test(formData.address.pincode)) {
          stepErrors['address.pincode'] = 'Invalid pincode format';
        }
      } else if (field === 'emergencyContact') {
        if (!formData.emergencyContact.name.trim()) {
          stepErrors['emergencyContact.name'] = 'Emergency contact name is required';
        }
        if (!formData.emergencyContact.relationship) {
          stepErrors['emergencyContact.relationship'] = 'Relationship is required';
        }
        if (!formData.emergencyContact.phoneNumber.trim()) {
          stepErrors['emergencyContact.phoneNumber'] = 'Emergency contact phone is required';
        } else if (!/^[6-9]\d{9}$/.test(formData.emergencyContact.phoneNumber)) {
          stepErrors['emergencyContact.phoneNumber'] = 'Invalid phone number format';
        }
      } else if (field === 'preferences') {
        // Preferences are optional, no validation needed
      } else {
        // Regular field validation
        if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
          stepErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        }
        
        // Specific validations
        if (field === 'phoneNumber' && formData[field] && !/^[6-9]\d{9}$/.test(formData[field])) {
          stepErrors[field] = 'Invalid phone number format';
        }
        if (field === 'email' && formData[field] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field])) {
          stepErrors[field] = 'Invalid email format';
        }
        if (field === 'weight' && formData[field] && (formData[field] < 45 || formData[field] > 200)) {
          stepErrors[field] = 'Weight must be between 45-200 kg';
        }
        if (field === 'height' && formData[field] && (formData[field] < 120 || formData[field] > 250)) {
          stepErrors[field] = 'Height must be between 120-250 cm';
        }
      }
    });
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    logger.ui('CLICK', 'NextStep', { currentStep }, 'REGISTER_PAGE');
    
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    logger.ui('CLICK', 'PreviousStep', { currentStep }, 'REGISTER_PAGE');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    logger.ui('CLICK', 'SubmitRegistration', null, 'REGISTER_PAGE');
    
    if (!validateStep(currentStep)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const data = await authApi.register(formData);
      
      if (data.success) {
        logger.success('User registration successful', 'REGISTER_PAGE');
        setShowOTPModal(true);
      } else {
        logger.error('Registration failed', 'REGISTER_PAGE');
        setErrors({ submit: data.message || 'Registration failed' });
      }
    } catch (error) {
      logger.error('Network error during registration', 'REGISTER_PAGE', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSuccess = (data) => {
    logger.success('Phone verification successful', 'REGISTER_PAGE');
    navigate('/donor/onboarding', { 
      state: { 
        message: 'Phone verified! Please complete your donor profile.',
        user: data.user,
        step: 'documents'
      }
    });
  };

  const handleOTPError = (error) => {
    logger.error('Phone verification failed', 'REGISTER_PAGE', error);
    setErrors({ otp: error.message || 'Phone verification failed' });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Input
              label="Full Name"
              icon={User}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              placeholder="Enter your full name"
              required
            />
            
            <Input
              label="Phone Number"
              icon={Phone}
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              error={errors.phoneNumber}
              placeholder="10-digit mobile number"
              required
            />
            
            <Input
              label="Email Address"
              icon={Mail}
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
              placeholder="your.email@example.com"
            />
            
            <Input
              label="Date of Birth"
              icon={Calendar}
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              error={errors.dateOfBirth}
              required
            />
            
            <Select
              label="Gender"
              icon={Users}
              value={formData.gender}
              onChange={(value) => handleInputChange('gender', value)}
              options={genderOptions}
              error={errors.gender}
              placeholder="Select your gender"
              required
            />
          </motion.div>
        );
        
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Select
              label="Blood Type"
              icon={Droplet}
              value={formData.bloodType}
              onChange={(value) => handleInputChange('bloodType', value)}
              options={bloodTypes}
              error={errors.bloodType}
              placeholder="Select your blood type"
              required
            />
            
            <Input
              label="Weight (kg)"
              icon={Weight}
              type="number"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              error={errors.weight}
              placeholder="Your weight in kilograms"
              min="45"
              max="200"
              required
            />
            
            <Input
              label="Height (cm)"
              type="number"
              value={formData.height}
              onChange={(e) => handleInputChange('height', e.target.value)}
              error={errors.height}
              placeholder="Your height in centimeters (optional)"
              min="120"
              max="250"
            />
          </motion.div>
        );
        
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Address</h4>
              
              <Input
                label="Street Address"
                icon={MapPin}
                value={formData.address.street}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
                error={errors['address.street']}
                placeholder="House number, street name"
                required
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  error={errors['address.city']}
                  placeholder="City"
                  required
                />
                
                <Input
                  label="State"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  error={errors['address.state']}
                  placeholder="State"
                  required
                />
              </div>
              
              <Input
                label="Pincode"
                value={formData.address.pincode}
                onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                error={errors['address.pincode']}
                placeholder="6-digit pincode"
                maxLength="6"
                required
              />
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Emergency Contact</h4>
              
              <Input
                label="Contact Name"
                value={formData.emergencyContact.name}
                onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                error={errors['emergencyContact.name']}
                placeholder="Emergency contact name"
                required
              />
              
              <Select
                label="Relationship"
                value={formData.emergencyContact.relationship}
                onChange={(value) => handleInputChange('emergencyContact.relationship', value)}
                options={relationshipOptions}
                error={errors['emergencyContact.relationship']}
                placeholder="Select relationship"
                required
              />
              
              <Input
                label="Phone Number"
                icon={Phone}
                type="tel"
                value={formData.emergencyContact.phoneNumber}
                onChange={(e) => handleInputChange('emergencyContact.phoneNumber', e.target.value)}
                error={errors['emergencyContact.phoneNumber']}
                placeholder="10-digit mobile number"
                required
              />
            </div>
          </motion.div>
        );
        
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Donation Preferences</h4>
              
              <Input
                label="Maximum Travel Distance (km)"
                type="number"
                value={formData.preferences.maxTravelDistance}
                onChange={(e) => handleInputChange('preferences.maxTravelDistance', e.target.value)}
                placeholder="How far are you willing to travel?"
                min="1"
                max="100"
              />
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Notification Preferences
                </label>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.preferences.notificationMethods.whatsapp}
                      onChange={(e) => handleInputChange('preferences.notificationMethods.whatsapp', e.target.checked)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">WhatsApp notifications</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.preferences.notificationMethods.sms}
                      onChange={(e) => handleInputChange('preferences.notificationMethods.sms', e.target.checked)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">SMS notifications</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.preferences.notificationMethods.email}
                      onChange={(e) => handleInputChange('preferences.notificationMethods.email', e.target.checked)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Email notifications</span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Join Our Life-Saving Community
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Register as a blood donor and help save lives in your community
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <motion.div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : isActive
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : 'bg-white border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-600'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </motion.div>
                    <div className="mt-2 text-center">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Form Card */}
        <Card className="p-8">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
          
          {/* Error Display */}
          {errors.submit && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2"
            >
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">{errors.submit}</span>
            </motion.div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            {currentStep < steps.length ? (
              <Button
                onClick={handleNext}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={isLoading}
                className="flex items-center space-x-2"
              >
                <span>Complete Registration</span>
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>

        {/* OTP Modal */}
        <OTPModal
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          phoneNumber={formData.phoneNumber}
          purpose="registration"
          onVerificationSuccess={handleOTPSuccess}
          onVerificationError={handleOTPError}
        />
      </div>
    </div>
  );
};

export default RegisterPage;