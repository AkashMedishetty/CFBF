/**
 * GuestEmergencyRequest Component
 * Streamlined emergency request form for guest users with minimal required information
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  AlertTriangle,
  Share2,
  Copy,
  MessageCircle,
  Mail,
  CheckCircle,
  Info
} from 'lucide-react';

import MobileOptimizedInput from '../ui/MobileOptimizedInput';
import TouchOptimizedForm from '../ui/TouchOptimizedForm';

const GuestEmergencyRequest = ({ onSubmit, onTrackingGenerated }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setIsSubmitting] = useState(false);
  const [trackingId, setTrackingId] = useState(null);
  const [formData, setFormData] = useState({
    // Patient Information
    patientName: '',
    bloodType: '',
    unitsNeeded: '1',
    urgencyLevel: 'urgent',
    
    // Contact Information
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    
    // Location Information
    hospitalName: '',
    hospitalAddress: '',
    city: '',
    
    // Additional Information
    medicalCondition: '',
    additionalNotes: ''
  });
  const [location, setLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const bloodTypes = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];

  const urgencyLevels = [
    { value: 'critical', label: 'Critical (Within 2 hours)', color: 'text-red-600', bgColor: 'bg-red-50' },
    { value: 'urgent', label: 'Urgent (Within 6 hours)', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { value: 'scheduled', label: 'Scheduled (Within 24 hours)', color: 'text-blue-600', bgColor: 'bg-blue-50' }
  ];

  const formSteps = [
    {
      title: 'Patient Details',
      description: 'Basic information about the patient',
      icon: User,
      fields: ['patientName', 'bloodType', 'unitsNeeded', 'urgencyLevel']
    },
    {
      title: 'Contact Information',
      description: 'How we can reach you',
      icon: Phone,
      fields: ['contactName', 'contactPhone', 'contactEmail']
    },
    {
      title: 'Hospital Location',
      description: 'Where the blood is needed',
      icon: MapPin,
      fields: ['hospitalName', 'hospitalAddress', 'city']
    },
    {
      title: 'Additional Details',
      description: 'Any additional information',
      icon: Info,
      fields: ['medicalCondition', 'additionalNotes']
    }
  ];

  // Get user's current location with high accuracy and fallback
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsGettingLocation(true);
    
    try {
      let position;
      
      try {
        // First attempt with high accuracy
        position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          });
        });
      } catch (highAccuracyError) {
        console.warn('High accuracy location failed, trying fallback:', highAccuracyError);
        
        // Fallback with lower accuracy
        position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 600000 // 10 minutes
          });
        });
      }

      const { latitude, longitude, accuracy } = position.coords;
      setLocation({ lat: latitude, lng: longitude, accuracy });
      
      console.log(`Location obtained with accuracy: ${accuracy}m`);
      
      // Try to get address from coordinates (reverse geocoding)
      // Note: Using free Nominatim API instead of OpenCage which requires API key
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&countrycodes=in`
        );
        const data = await response.json();
        
        if (data && data.display_name) {
          const address = data.display_name;
          const city = data.address?.city || data.address?.town || data.address?.village;
          
          setFormData(prev => ({
            ...prev,
            hospitalAddress: prev.hospitalAddress || address,
            city: prev.city || city
          }));
        }
      } catch (error) {
        console.log('Reverse geocoding failed:', error);
      }
      
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Unable to get your location. Please check your location settings and enter the hospital address manually.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate tracking ID
      const generatedTrackingId = `ER${Date.now().toString().slice(-8)}`;
      
      // Prepare submission data
      const submissionData = {
        ...formData,
        trackingId: generatedTrackingId,
        location: location,
        submittedAt: new Date().toISOString(),
        source: 'guest_request',
        status: 'pending'
      };

      // Submit the request
      await onSubmit?.(submissionData);
      
      // Set tracking ID for display
      setTrackingId(generatedTrackingId);
      onTrackingGenerated?.(generatedTrackingId);
      
    } catch (error) {
      console.error('Error submitting emergency request:', error);
      alert('Failed to submit emergency request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Share emergency request
  const shareEmergencyRequest = async (method) => {
    const shareText = `🚨 URGENT: ${formData.bloodType} blood needed for ${formData.patientName} at ${formData.hospitalName}. Please help or share! Tracking ID: ${trackingId}`;
    const shareUrl = `${window.location.origin}/emergency/track/${trackingId}`;

    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        break;
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_self');
        break;
      case 'email':
        window.open(`mailto:?subject=Urgent Blood Request&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`, '_self');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareText + ' ' + shareUrl);
          alert('Emergency request details copied to clipboard!');
        } catch (error) {
          console.error('Failed to copy:', error);
        }
        break;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Urgent Blood Request',
              text: shareText,
              url: shareUrl
            });
          } catch (error) {
            console.log('Share cancelled or failed:', error);
          }
        }
        break;
    }
  };

  // Render form step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <MobileOptimizedInput
              type="text"
              label="Patient Name"
              value={formData.patientName}
              onChange={(value) => handleInputChange('patientName', value)}
              placeholder="Enter patient's full name"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Blood Type Required *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {bloodTypes.map((type) => (
                  <motion.button
                    key={type}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleInputChange('bloodType', type)}
                    className={`p-3 rounded-lg border-2 font-medium transition-colors touch-manipulation ${
                      formData.bloodType === type
                        ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        : 'border-slate-300 dark:border-dark-border hover:border-slate-400 dark:hover:border-dark-border-light'
                    }`}
                  >
                    {type}
                  </motion.button>
                ))}
              </div>
            </div>

            <MobileOptimizedInput
              type="number"
              label="Units Needed"
              value={formData.unitsNeeded}
              onChange={(value) => handleInputChange('unitsNeeded', value)}
              placeholder="Number of units"
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Urgency Level *
              </label>
              <div className="space-y-2">
                {urgencyLevels.map((level) => (
                  <motion.button
                    key={level.value}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleInputChange('urgencyLevel', level.value)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors touch-manipulation ${
                      formData.urgencyLevel === level.value
                        ? `border-red-500 ${level.bgColor} ${level.color}`
                        : 'border-slate-300 dark:border-dark-border hover:border-slate-400 dark:hover:border-dark-border-light'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">{level.label}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <MobileOptimizedInput
              type="text"
              label="Your Name"
              value={formData.contactName}
              onChange={(value) => handleInputChange('contactName', value)}
              placeholder="Enter your full name"
              required
            />
            
            <MobileOptimizedInput
              type="tel"
              label="Phone Number"
              value={formData.contactPhone}
              onChange={(value) => handleInputChange('contactPhone', value)}
              placeholder="Enter your phone number"
              required
            />
            
            <MobileOptimizedInput
              type="email"
              label="Email Address (Optional)"
              value={formData.contactEmail}
              onChange={(value) => handleInputChange('contactEmail', value)}
              placeholder="Enter your email address"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <MobileOptimizedInput
              type="text"
              label="Hospital Name"
              value={formData.hospitalName}
              onChange={(value) => handleInputChange('hospitalName', value)}
              placeholder="Enter hospital name"
              required
            />
            
            <div className="space-y-2">
              <MobileOptimizedInput
                type="text"
                label="Hospital Address"
                value={formData.hospitalAddress}
                onChange={(value) => handleInputChange('hospitalAddress', value)}
                placeholder="Enter hospital address"
                required
              />
              
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors touch-manipulation disabled:opacity-50"
              >
                {isGettingLocation ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Getting Location...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span>Use Current Location</span>
                  </>
                )}
              </motion.button>
            </div>
            
            <MobileOptimizedInput
              type="text"
              label="City"
              value={formData.city}
              onChange={(value) => handleInputChange('city', value)}
              placeholder="Enter city name"
              required
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <MobileOptimizedInput
              type="text"
              label="Medical Condition (Optional)"
              value={formData.medicalCondition}
              onChange={(value) => handleInputChange('medicalCondition', value)}
              placeholder="Brief description of medical condition"
            />
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                placeholder="Any additional information that might help donors..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-slate-300 dark:border-dark-border rounded-xl focus:border-red-500 dark:focus:border-red-400 focus:outline-none transition-colors bg-white dark:bg-dark-bg-secondary text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // If tracking ID is generated, show success screen
  if (trackingId) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Emergency Request Submitted!
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Your request has been sent to nearby donors. We'll notify you as soon as someone responds.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Tracking ID
            </h3>
            <div className="flex items-center justify-center space-x-2 p-3 bg-white dark:bg-dark-bg-tertiary rounded-lg border-2 border-dashed border-slate-300 dark:border-dark-border">
              <span className="text-2xl font-mono font-bold text-red-600 dark:text-red-400">
                {trackingId}
              </span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => shareEmergencyRequest('copy')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors touch-manipulation"
                aria-label="Copy tracking ID"
              >
                <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </motion.button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Save this ID to track your request status
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Share to Get More Help
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => shareEmergencyRequest('whatsapp')}
                className="flex items-center justify-center space-x-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors touch-manipulation"
              >
                <MessageCircle className="w-5 h-5" />
                <span>WhatsApp</span>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => shareEmergencyRequest('sms')}
                className="flex items-center justify-center space-x-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors touch-manipulation"
              >
                <Phone className="w-5 h-5" />
                <span>SMS</span>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => shareEmergencyRequest('email')}
                className="flex items-center justify-center space-x-2 p-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors touch-manipulation"
              >
                <Mail className="w-5 h-5" />
                <span>Email</span>
              </motion.button>
              
              {navigator.share && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => shareEmergencyRequest('native')}
                  className="flex items-center justify-center space-x-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors touch-manipulation"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </motion.button>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="space-y-1 text-blue-700 dark:text-blue-400">
                  <li>• Nearby donors will be notified immediately</li>
                  <li>• You'll receive updates via phone/SMS</li>
                  <li>• Hospital will be contacted when donors respond</li>
                  <li>• Track progress using your tracking ID</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Emergency Blood Request
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Quick request for urgent blood needs
            </p>
          </div>
        </div>

        {/* Emergency Hotline */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-300">
                  Need immediate help?
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  Call our 24/7 emergency hotline
                </p>
              </div>
            </div>
            <motion.a
              href="tel:+91-911-BLOOD"
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors touch-manipulation"
            >
              Call Now
            </motion.a>
          </div>
        </div>
      </div>

      <TouchOptimizedForm
        multiStep={true}
        steps={formSteps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onSubmit={handleSubmit}
      >
        {renderStepContent()}
      </TouchOptimizedForm>
    </div>
  );
};

export default GuestEmergencyRequest;