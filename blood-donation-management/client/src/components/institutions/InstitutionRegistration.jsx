import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Upload,
  X
} from 'lucide-react';
import logger from '../../utils/logger';

const InstitutionRegistration = ({ onRegistrationComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    type: '',
    registrationNumber: '',
    licenseNumber: '',
    
    // Contact Information
    contactInfo: {
      email: '',
      phone: '',
      alternatePhone: '',
      website: ''
    },
    
    // Address Information
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    
    // Admin Contact
    adminContact: {
      name: '',
      designation: '',
      email: '',
      phone: ''
    },
    
    // Services and Capacity
    services: [],
    capacity: {
      dailyCollectionCapacity: 50,
      storageCapacity: 100,
      staffCount: 5,
      bedsCount: 10
    },
    
    // Operating Hours
    operatingHours: {
      monday: { start: '09:00', end: '17:00', closed: false },
      tuesday: { start: '09:00', end: '17:00', closed: false },
      wednesday: { start: '09:00', end: '17:00', closed: false },
      thursday: { start: '09:00', end: '17:00', closed: false },
      friday: { start: '09:00', end: '17:00', closed: false },
      saturday: { start: '09:00', end: '13:00', closed: false },
      sunday: { start: '', end: '', closed: true }
    },
    
    // Documents
    documents: [],
    
    // Inventory Settings (for blood banks)
    inventoryEnabled: false,
    inventorySettings: {
      autoAlerts: true,
      lowStockThreshold: 10,
      expiryAlertDays: 7
    }
  });

  const institutionTypes = [
    { value: 'hospital', label: 'Hospital', description: 'General hospitals and medical centers' },
    { value: 'blood_bank', label: 'Blood Bank', description: 'Dedicated blood collection and storage facilities' },
    { value: 'clinic', label: 'Clinic', description: 'Private clinics and healthcare centers' },
    { value: 'medical_center', label: 'Medical Center', description: 'Multi-specialty medical centers' },
    { value: 'ngo', label: 'NGO', description: 'Non-profit organizations involved in blood donation' }
  ];

  const availableServices = [
    { value: 'blood_collection', label: 'Blood Collection' },
    { value: 'blood_testing', label: 'Blood Testing' },
    { value: 'blood_storage', label: 'Blood Storage' },
    { value: 'blood_distribution', label: 'Blood Distribution' },
    { value: 'platelet_donation', label: 'Platelet Donation' },
    { value: 'plasma_donation', label: 'Plasma Donation' },
    { value: 'emergency_services', label: 'Emergency Services' },
    { value: 'mobile_collection', label: 'Mobile Collection' },
    { value: 'donor_counseling', label: 'Donor Counseling' },
    { value: 'health_checkup', label: 'Health Checkup' }
  ];

  const steps = [
    { id: 1, title: 'Basic Information', icon: Building2 },
    { id: 2, title: 'Contact & Address', icon: MapPin },
    { id: 3, title: 'Admin Contact', icon: User },
    { id: 4, title: 'Services & Capacity', icon: FileText },
    { id: 5, title: 'Documents & Review', icon: CheckCircle }
  ];

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleServiceToggle = (serviceValue) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceValue)
        ? prev.services.filter(s => s !== serviceValue)
        : [...prev.services, serviceValue]
    }));
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.name && formData.type && formData.registrationNumber && formData.licenseNumber;
      case 2:
        return formData.contactInfo.email && formData.contactInfo.phone && 
               formData.address.street && formData.address.city && 
               formData.address.state && formData.address.pincode;
      case 3:
        return formData.adminContact.name && formData.adminContact.email && 
               formData.adminContact.phone && formData.adminContact.designation;
      case 4:
        return formData.services.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      logger.warning('Please fill in all required fields', 'INSTITUTION_REGISTRATION');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      logger.warning('Please complete all required fields', 'INSTITUTION_REGISTRATION');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/institutions/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Registration failed');
      }

      const result = await response.json();
      logger.success('Institution registered successfully!', 'INSTITUTION_REGISTRATION');
      
      if (onRegistrationComplete) {
        onRegistrationComplete(result.data);
      }
    } catch (error) {
      logger.error('Registration failed', 'INSTITUTION_REGISTRATION', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange(null, 'name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter institution name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {institutionTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.type === type.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleInputChange(null, 'type', type.value)}
                  >
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number *
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => handleInputChange(null, 'registrationNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter registration number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number *
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange(null, 'licenseNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter license number"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.contactInfo.phone}
                  onChange={(e) => handleInputChange('contactInfo', 'phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactInfo.alternatePhone}
                  onChange={(e) => handleInputChange('contactInfo', 'alternatePhone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter alternate phone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.contactInfo.website}
                  onChange={(e) => handleInputChange('contactInfo', 'website', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <textarea
                value={formData.address.street}
                onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter complete street address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter state"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode *
                </label>
                <input
                  type="text"
                  value={formData.address.pincode}
                  onChange={(e) => handleInputChange('address', 'pincode', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter pincode"
                  maxLength={6}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Name *
                </label>
                <input
                  type="text"
                  value={formData.adminContact.name}
                  onChange={(e) => handleInputChange('adminContact', 'name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter admin name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designation *
                </label>
                <input
                  type="text"
                  value={formData.adminContact.designation}
                  onChange={(e) => handleInputChange('adminContact', 'designation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Medical Director, Administrator"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email *
                </label>
                <input
                  type="email"
                  value={formData.adminContact.email}
                  onChange={(e) => handleInputChange('adminContact', 'email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter admin email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Phone *
                </label>
                <input
                  type="tel"
                  value={formData.adminContact.phone}
                  onChange={(e) => handleInputChange('adminContact', 'phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter admin phone"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Services Offered *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableServices.map((service) => (
                  <div
                    key={service.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.services.includes(service.value)
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleServiceToggle(service.value)}
                  >
                    <div className="font-medium text-gray-900">{service.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Capacity Information
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Daily Collection Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.capacity.dailyCollectionCapacity}
                    onChange={(e) => handleInputChange('capacity', 'dailyCollectionCapacity', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Storage Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.capacity.storageCapacity}
                    onChange={(e) => handleInputChange('capacity', 'storageCapacity', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Staff Count
                  </label>
                  <input
                    type="number"
                    value={formData.capacity.staffCount}
                    onChange={(e) => handleInputChange('capacity', 'staffCount', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Beds Count
                  </label>
                  <input
                    type="number"
                    value={formData.capacity.bedsCount}
                    onChange={(e) => handleInputChange('capacity', 'bedsCount', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {formData.type === 'blood_bank' && (
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.inventoryEnabled}
                    onChange={(e) => handleInputChange(null, 'inventoryEnabled', e.target.checked)}
                    className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable Inventory Management
                  </span>
                </label>
                <p className="text-sm text-gray-600 mt-2">
                  This will enable real-time blood inventory tracking and automated alerts.
                </p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">Review Your Information</h3>
                  <p className="text-blue-800 text-sm">
                    Please review all the information you've provided. Once submitted, your application will be reviewed by our team within 2-3 business days.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Institution Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{formData.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">{institutionTypes.find(t => t.value === formData.type)?.label}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Registration:</span>
                    <span className="ml-2 font-medium">{formData.registrationNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">License:</span>
                    <span className="ml-2 font-medium">{formData.licenseNumber}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{formData.contactInfo.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium">{formData.contactInfo.phone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Address:</span>
                    <span className="ml-2 font-medium">
                      {formData.address.street}, {formData.address.city}, {formData.address.state} - {formData.address.pincode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Services</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.services.map(service => (
                    <span key={service} className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                      {availableServices.find(s => s.value === service)?.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Institution Registration</h1>
          <p className="text-red-100 mt-2">Join our network of healthcare partners</p>
        </div>

        {/* Progress Steps */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-red-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="px-8 py-8">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={!validateStep(currentStep)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !validateStep(5)}
              className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Submit Registration</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstitutionRegistration;