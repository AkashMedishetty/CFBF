import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, 
  Users, 
  Heart, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Send,
  FileText,
  Globe,
  Award,
  TrendingUp,
  Handshake
} from 'lucide-react';
import logger from '../../utils/logger';

const PartnershipInquiry = () => {
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: '',
    contactPerson: '',
    designation: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    partnershipType: '',
    currentCapacity: '',
    expectedVolume: '',
    services: [],
    experience: '',
    certifications: '',
    message: '',
    agreeToTerms: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const organizationTypes = [
    { value: 'hospital', label: 'Hospital' },
    { value: 'blood_bank', label: 'Blood Bank' },
    { value: 'clinic', label: 'Clinic' },
    { value: 'medical_center', label: 'Medical Center' },
    { value: 'ngo', label: 'NGO' },
    { value: 'government', label: 'Government Institution' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'educational', label: 'Educational Institution' }
  ];

  const partnershipTypes = [
    { value: 'blood_collection', label: 'Blood Collection Partner' },
    { value: 'distribution', label: 'Blood Distribution Partner' },
    { value: 'technology', label: 'Technology Integration' },
    { value: 'awareness', label: 'Awareness Campaign Partner' },
    { value: 'funding', label: 'Funding Partner' },
    { value: 'research', label: 'Research Collaboration' },
    { value: 'training', label: 'Training & Education' },
    { value: 'other', label: 'Other' }
  ];

  const availableServices = [
    'Blood Collection',
    'Blood Testing',
    'Blood Storage',
    'Blood Distribution',
    'Platelet Donation',
    'Plasma Donation',
    'Emergency Services',
    'Mobile Collection',
    'Donor Counseling',
    'Health Checkup'
  ];

  const benefits = [
    {
      icon: Users,
      title: 'Access to Donor Network',
      description: 'Connect with our verified network of 15,000+ active blood donors',
      color: 'text-blue-600'
    },
    {
      icon: Shield,
      title: 'Quality Assurance',
      description: 'Benefit from our rigorous donor verification and health screening processes',
      color: 'text-green-600'
    },
    {
      icon: TrendingUp,
      title: 'Increased Efficiency',
      description: 'Streamline operations with our technology-driven matching algorithms',
      color: 'text-purple-600'
    },
    {
      icon: Award,
      title: 'Brand Recognition',
      description: 'Gain recognition as a trusted healthcare partner in our network',
      color: 'text-yellow-600'
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.organizationName || !formData.email || !formData.contactPerson || !formData.agreeToTerms) {
      logger.warning('Please fill in all required fields and agree to terms', 'PARTNERSHIP_INQUIRY');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/v1/public/partnership-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitStatus('success');
        logger.success('Partnership inquiry submitted successfully!', 'PARTNERSHIP_INQUIRY');
      } else {
        throw new Error('Failed to submit inquiry');
      }
    } catch (error) {
      setSubmitStatus('error');
      logger.error('Failed to submit partnership inquiry', 'PARTNERSHIP_INQUIRY', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Partner with Us
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
              Join our mission to save lives. Partner with BDMS to expand your impact 
              and connect with a network of healthcare heroes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Partnership Benefits
            </h2>
            <p className="text-xl text-gray-600">
              Discover how partnering with BDMS can enhance your organization's impact
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Form */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Partnership Inquiry Form
            </h2>
            <p className="text-xl text-gray-600">
              Tell us about your organization and how you'd like to collaborate
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">Partnership inquiry submitted successfully!</p>
                  <p className="text-green-700 text-sm">Our partnership team will review your application and contact you within 3-5 business days.</p>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="text-red-800 font-medium">Failed to submit inquiry</p>
                  <p className="text-red-700 text-sm">Please try again or contact us directly at partnerships@callforblood.org</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Organization Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="w-6 h-6 mr-2 text-blue-600" />
                  Organization Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => handleInputChange('organizationName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter organization name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Type *
                    </label>
                    <select
                      value={formData.organizationType}
                      onChange={(e) => handleInputChange('organizationType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select organization type</option>
                      {organizationTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-6 h-6 mr-2 text-green-600" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter contact person name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation *
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => handleInputChange('designation', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Director, Manager"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Address Information
                </h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter state"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter pincode"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Partnership Details */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Handshake className="w-6 h-6 mr-2 text-purple-600" />
                  Partnership Details
                </h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partnership Type *
                  </label>
                  <select
                    value={formData.partnershipType}
                    onChange={(e) => handleInputChange('partnershipType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select partnership type</option>
                    {partnershipTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Services You Can Provide
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableServices.map(service => (
                      <label key={service} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service)}
                          onChange={() => handleServiceToggle(service)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Capacity
                    </label>
                    <input
                      type="text"
                      value={formData.currentCapacity}
                      onChange={(e) => handleInputChange('currentCapacity', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 100 donations/month"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Volume
                    </label>
                    <input
                      type="text"
                      value={formData.expectedVolume}
                      onChange={(e) => handleInputChange('expectedVolume', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 200 donations/month"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Additional Information
                </h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience in Healthcare/Blood Donation
                  </label>
                  <textarea
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your organization's experience..."
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certifications & Accreditations
                  </label>
                  <textarea
                    value={formData.certifications}
                    onChange={(e) => handleInputChange('certifications', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="List relevant certifications..."
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us more about your partnership goals and how you'd like to collaborate..."
                  />
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="border-t border-gray-200 pt-6">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and 
                    <a href="/privacy" className="text-blue-600 hover:underline ml-1">Privacy Policy</a>. 
                    I understand that this inquiry will be reviewed by the BDMS partnership team.
                  </span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.agreeToTerms}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Submit Partnership Inquiry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PartnershipInquiry;