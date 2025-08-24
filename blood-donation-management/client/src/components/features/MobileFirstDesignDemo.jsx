/**
 * MobileFirstDesignDemo Component
 * Demonstrates mobile-first responsive design enhancements
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  MapPin, 
  Hand as Touch,
  Keyboard,
  CheckCircle,
  Info
} from 'lucide-react';

import MobileOptimizedInput from '../ui/MobileOptimizedInput';
import TouchOptimizedForm from '../ui/TouchOptimizedForm';
import MobileFriendlyMap from '../ui/MobileFriendlyMap';
import CameraUpload from '../ui/CameraUpload';

const MobileFirstDesignDemo = () => {
  const [activeDemo, setActiveDemo] = useState('forms');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    name: '',
    password: ''
  });
  const [currentStep, setCurrentStep] = useState(0);


  const demos = [
    { id: 'forms', name: 'Optimized Forms', icon: Keyboard },
    { id: 'touch', name: 'Touch Interactions', icon: Touch },
    { id: 'maps', name: 'Mobile Maps', icon: MapPin },
    { id: 'camera', name: 'Camera Upload', icon: Camera }
  ];

  const formSteps = [
    {
      title: 'Personal Information',
      description: 'Enter your basic details',
      fields: ['name', 'email']
    },
    {
      title: 'Contact Details',
      description: 'Provide your contact information',
      fields: ['phone']
    },
    {
      title: 'Security',
      description: 'Set up your account security',
      fields: ['password']
    }
  ];

  const improvements = [
    {
      title: 'Mobile-Optimized Input Types',
      description: 'Automatic keyboard switching for email, phone, number inputs',
      status: 'completed',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Touch-Friendly Form Controls',
      description: 'Larger touch targets, swipe navigation, floating labels',
      status: 'completed',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Gesture-Based Interactions',
      description: 'Swipe gestures for navigation, pinch-to-zoom for maps',
      status: 'completed',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Camera Integration',
      description: 'Native camera access with image optimization and compression',
      status: 'completed',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Location-Aware Maps',
      description: 'GPS integration, touch-optimized map controls, directions',
      status: 'completed',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Performance Optimized',
      description: 'Image compression, lazy loading, smooth 60fps animations',
      status: 'completed',
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ];

  const features = [
    {
      title: 'Automatic Keyboard Optimization',
      description: 'Email inputs show email keyboard, phone inputs show numeric keypad',
      icon: Info,
      color: 'text-blue-600'
    },
    {
      title: 'Touch Target Optimization',
      description: 'All interactive elements meet 44px minimum size requirement',
      icon: Info,
      color: 'text-blue-600'
    },
    {
      title: 'Gesture Recognition',
      description: 'Swipe, pinch, and tap gestures for intuitive navigation',
      icon: Info,
      color: 'text-blue-600'
    },
    {
      title: 'Image Optimization',
      description: 'Automatic compression and resizing for faster uploads',
      icon: Info,
      color: 'text-blue-600'
    }
  ];

  const mapMarkers = [
    {
      lat: 40.7128,
      lng: -74.0060,
      title: 'NYC Blood Bank',
      address: '123 Main St, New York, NY',
      phone: '+1-555-0123',
      description: 'Main blood donation center'
    },
    {
      lat: 40.7589,
      lng: -73.9851,
      title: 'Central Hospital',
      address: '456 Central Ave, New York, NY',
      phone: '+1-555-0456',
      description: 'Emergency blood services'
    }
  ];

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    alert('Form submitted successfully!');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageCapture = (image) => {
    console.log('Image captured:', image);
    alert(`Image captured: ${image.name} (${(image.blob.size / 1024).toFixed(1)}KB)`);
  };

  const handleImageUpload = (images) => {
    console.log('Images uploaded:', images);
    const imageList = Array.isArray(images) ? images : [images];
    alert(`${imageList.length} image(s) uploaded successfully!`);
  };

  const renderDemo = () => {
    switch (activeDemo) {
      case 'forms':
        return (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                Mobile-Optimized Form Inputs
              </h4>
              <div className="space-y-4">
                <MobileOptimizedInput
                  type="email"
                  label="Email Address"
                  value={formData.email}
                  onChange={(value) => handleInputChange('email', value)}
                  placeholder="Enter your email"
                />
                <MobileOptimizedInput
                  type="tel"
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(value) => handleInputChange('phone', value)}
                  placeholder="Enter phone number"
                />
                <MobileOptimizedInput
                  type="password"
                  label="Password"
                  value={formData.password}
                  onChange={(value) => handleInputChange('password', value)}
                  placeholder="Enter password"
                />
              </div>
            </div>
          </div>
        );

      case 'touch':
        return (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                Multi-Step Form with Swipe Navigation
              </h4>
              <TouchOptimizedForm
                multiStep={true}
                steps={formSteps}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                onSubmit={handleFormSubmit}
              >
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <MobileOptimizedInput
                      type="text"
                      label="Full Name"
                      value={formData.name}
                      onChange={(value) => handleInputChange('name', value)}
                      required
                    />
                    <MobileOptimizedInput
                      type="email"
                      label="Email Address"
                      value={formData.email}
                      onChange={(value) => handleInputChange('email', value)}
                      required
                    />
                  </div>
                )}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <MobileOptimizedInput
                      type="tel"
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(value) => handleInputChange('phone', value)}
                      required
                    />
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <MobileOptimizedInput
                      type="password"
                      label="Password"
                      value={formData.password}
                      onChange={(value) => handleInputChange('password', value)}
                      required
                    />
                  </div>
                )}
              </TouchOptimizedForm>
            </div>
          </div>
        );

      case 'maps':
        return (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                Touch-Optimized Map with Location Services
              </h4>
              <MobileFriendlyMap
                center={{ lat: 40.7128, lng: -74.0060 }}
                zoom={12}
                markers={mapMarkers}
                height="300px"
                onMarkerClick={(marker) => {
                  console.log('Marker clicked:', marker);
                }}
              />
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Try pinching to zoom, tapping markers for info, and using the location button.
              </p>
            </div>
          </div>
        );

      case 'camera':
        return (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                Camera Integration with Image Optimization
              </h4>
              <CameraUpload
                onImageCapture={handleImageCapture}
                onImageUpload={handleImageUpload}
                maxFileSize={5 * 1024 * 1024} // 5MB
                maxWidth={1920}
                maxHeight={1080}
                quality={0.8}
                multiple={true}
              />
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Images are automatically optimized and compressed for faster uploads.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Mobile-First Responsive Design Enhancements
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Comprehensive mobile optimizations including form inputs, touch interactions, maps, and camera integration.
        </p>
      </div>

      {/* Demo Selector */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          Interactive Demos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {demos.map((demo) => {
            const IconComponent = demo.icon;
            return (
              <motion.button
                key={demo.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveDemo(demo.id)}
                className={`flex flex-col items-center space-y-2 p-4 rounded-lg border transition-colors touch-manipulation ${
                  activeDemo === demo.id
                    ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-400'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-dark-bg-secondary dark:border-dark-border dark:text-slate-300 dark:hover:bg-dark-bg-tertiary'
                }`}
              >
                <IconComponent className="w-6 h-6" />
                <span className="text-sm font-medium text-center">{demo.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Demo Content */}
      <div className="mb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDemo}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderDemo()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Improvements List */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Completed Improvements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {improvements.map((improvement, index) => {
            const IconComponent = improvement.icon;
            return (
              <motion.div
                key={improvement.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <IconComponent className={`w-5 h-5 mt-0.5 ${improvement.color}`} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                    {improvement.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {improvement.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Features List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Key Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (improvements.length * 0.1) + (index * 0.1) }}
                className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <IconComponent className={`w-5 h-5 mt-0.5 ${feature.color}`} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Technical Implementation */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          Technical Implementation
        </h3>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Automatic input type and keyboard optimization for mobile devices</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Touch gesture recognition with swipe navigation and pinch-to-zoom</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Native camera API integration with image compression and optimization</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>GPS location services with touch-optimized map controls</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>44px minimum touch targets for accessibility compliance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Smooth 60fps animations with hardware acceleration</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileFirstDesignDemo;