/**
 * ResponsiveNavigationDemo Component
 * Demonstrates the improved responsive navigation features
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Menu, 
  X, 
  Heart,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

const ResponsiveNavigationDemo = () => {
  const [selectedDevice, setSelectedDevice] = useState('mobile');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const devices = [
    { id: 'mobile', name: 'Mobile', icon: Smartphone, width: '375px', height: '667px' },
    { id: 'tablet', name: 'Tablet', icon: Tablet, width: '768px', height: '1024px' },
    { id: 'desktop', name: 'Desktop', icon: Monitor, width: '1200px', height: '800px' }
  ];

  const improvements = [
    {
      title: 'Fixed Grid Layout Issues',
      description: 'Replaced problematic grid-cols-[auto,1fr,auto] with flexible flexbox layout',
      status: 'completed',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Enhanced Mobile Menu Animations',
      description: 'Added smooth slide animations with staggered item reveals and better easing',
      status: 'completed',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Improved Touch Targets',
      description: 'Increased button sizes to 44px minimum for thumb-friendly navigation',
      status: 'completed',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Consistent Button Styling',
      description: 'Standardized button sizes, spacing, and hover states across all screen sizes',
      status: 'completed',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'One-Handed Mobile Optimization',
      description: 'Positioned important actions in thumb-friendly zones with safe area support',
      status: 'completed',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Responsive Text Handling',
      description: 'Added text truncation and responsive sizing for better mobile display',
      status: 'completed',
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ];

  const features = [
    {
      title: 'Touch-Optimized Interactions',
      description: 'All interactive elements have proper touch targets and feedback',
      icon: Info,
      color: 'text-blue-600'
    },
    {
      title: 'Smooth Animations',
      description: 'Respects user motion preferences with smooth, performant animations',
      icon: Info,
      color: 'text-blue-600'
    },
    {
      title: 'Accessibility Enhanced',
      description: 'Improved focus states, ARIA labels, and keyboard navigation',
      icon: Info,
      color: 'text-blue-600'
    },
    {
      title: 'Safe Area Support',
      description: 'Handles device notches and safe areas for modern mobile devices',
      icon: Info,
      color: 'text-blue-600'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Responsive Navigation Improvements
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Comprehensive fixes for header responsive design issues, mobile menu animations, and touch optimization.
        </p>
      </div>

      {/* Device Selector */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          Preview Device
        </h3>
        <div className="flex flex-wrap gap-2">
          {devices.map((device) => {
            const IconComponent = device.icon;
            return (
              <button
                key={device.id}
                onClick={() => setSelectedDevice(device.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  selectedDevice === device.id
                    ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-400'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{device.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Device Preview */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          Navigation Preview
        </h3>
        <div className="flex justify-center">
          <div 
            className="border-2 border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800"
            style={{
              width: devices.find(d => d.id === selectedDevice)?.width,
              maxWidth: '100%',
              height: '200px'
            }}
          >
            {/* Mock Header */}
            <div className="bg-white dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border p-4">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white fill-current" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Callforblood Foundation
                    </span>
                    {selectedDevice !== 'mobile' && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Foundation
                      </span>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                {selectedDevice === 'desktop' ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex space-x-2">
                      {['Home', 'About', 'Contact'].map((item) => (
                        <span key={item} className="px-2 py-1 text-sm text-slate-700 dark:text-slate-300">
                          {item}
                        </span>
                      ))}
                    </div>
                    <button className="px-3 py-1 bg-primary-600 text-white text-sm rounded">
                      Sign In
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {showMobileMenu ? (
                      <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    )}
                  </button>
                )}
              </div>

              {/* Mobile Menu */}
              {showMobileMenu && selectedDevice !== 'desktop' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4"
                >
                  {['Home', 'About', 'Contact', 'Emergency'].map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300">{item}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
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
          Enhanced Features
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

      {/* Technical Details */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          Technical Implementation
        </h3>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Replaced CSS Grid with Flexbox for better responsive behavior</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Added Framer Motion animations with staggered reveals</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Implemented 44px minimum touch targets for mobile</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Added safe area inset support for modern devices</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Enhanced accessibility with proper ARIA labels and focus management</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Optimized for one-handed mobile usage with thumb-friendly positioning</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveNavigationDemo;