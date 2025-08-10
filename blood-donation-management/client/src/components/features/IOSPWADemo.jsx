/**
 * iOS PWA Demo Component
 * Demonstrates iOS-specific PWA features and capabilities
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  Download, 
  Bell, 
  Search, 
  Mic, 
  Eye,
  Settings,
  Battery,
  Wifi,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

import iosPWAManager from '../../utils/iosPWAManager';

const IOSPWADemo = () => {
  const [capabilities, setCapabilities] = useState(null);
  const [installPromptShown, setInstallPromptShown] = useState(false);

  useEffect(() => {
    const caps = iosPWAManager.getIOSCapabilities();
    setCapabilities(caps);
  }, []);

  const handleShowInstallPrompt = () => {
    iosPWAManager.showIOSInstallPrompt();
    setInstallPromptShown(true);
  };

  const features = [
    {
      title: 'iOS-Specific Manifest',
      description: 'Optimized manifest configuration for iOS devices',
      icon: Settings,
      status: capabilities?.isIOS ? 'supported' : 'not-applicable',
      details: 'Includes iOS-specific icons, splash screens, and display modes'
    },
    {
      title: 'Apple Touch Icons',
      description: 'Complete set of Apple touch icons for all device sizes',
      icon: Smartphone,
      status: 'supported',
      details: 'Icons for iPhone, iPad, and Apple Watch in all required sizes'
    },
    {
      title: 'Status Bar Configuration',
      description: 'Dynamic status bar styling based on theme',
      icon: Battery,
      status: capabilities?.isIOS ? 'supported' : 'not-applicable',
      details: 'Automatic light/dark mode status bar with safe area support'
    },
    {
      title: 'Siri Shortcuts',
      description: 'Voice shortcuts for emergency requests and quick actions',
      icon: Mic,
      status: capabilities?.supportsShortcuts ? 'supported' : 'limited',
      details: 'iOS 12+ shortcuts for emergency requests, donor search, and profile access'
    },
    {
      title: 'Spotlight Search',
      description: 'App content searchable through iOS Spotlight',
      icon: Search,
      status: capabilities?.supportsSpotlight ? 'supported' : 'limited',
      details: 'Structured data and keywords for iOS search integration'
    },
    {
      title: 'App Badge Support',
      description: 'Notification badges on app icon',
      icon: Bell,
      status: capabilities?.supportsBadges ? 'supported' : 'limited',
      details: 'Automatic badge clearing and unread count display'
    },
    {
      title: 'Standalone Mode',
      description: 'Full-screen app experience without browser UI',
      icon: Eye,
      status: capabilities?.isStandalone ? 'active' : 'available',
      details: 'Native app-like experience with custom navigation'
    },
    {
      title: 'Add to Home Screen',
      description: 'Custom installation prompt for iOS users',
      icon: Download,
      status: capabilities?.isIOS && !capabilities?.isStandalone ? 'available' : 'not-needed',
      details: 'Step-by-step installation guide with visual instructions'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'supported':
      case 'active':
        return 'text-green-600';
      case 'available':
        return 'text-blue-600';
      case 'limited':
        return 'text-yellow-600';
      case 'not-applicable':
      case 'not-needed':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'supported':
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'available':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'limited':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'not-applicable':
      case 'not-needed':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!capabilities) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          iOS PWA Features
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Advanced iOS-specific PWA capabilities and optimizations for the best native app experience.
        </p>
      </div>

      {/* Device Information */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Device Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Smartphone className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h4 className="font-medium text-slate-900 dark:text-white">Platform</h4>
            </div>
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              {capabilities.isIOS ? 'iOS Device' : 'Non-iOS Device'}
            </p>
            {capabilities.version && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                iOS {capabilities.version.major}.{capabilities.version.minor}
              </p>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h4 className="font-medium text-slate-900 dark:text-white">Display Mode</h4>
            </div>
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              {capabilities.isStandalone ? 'Standalone' : 'Browser'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {capabilities.isStandalone ? 'Running as PWA' : 'Running in browser'}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Wifi className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h4 className="font-medium text-slate-900 dark:text-white">PWA Support</h4>
            </div>
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              {capabilities.isIOS ? 'iOS PWA' : 'Standard PWA'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {capabilities.isIOS ? 'iOS-optimized features' : 'Standard web features'}
            </p>
          </div>
        </div>
      </div>

      {/* Feature List */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          iOS PWA Features
        </h3>
        <div className="space-y-4">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg">
                  <IconComponent className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                      {feature.title}
                    </h4>
                    {getStatusIcon(feature.status)}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {feature.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {feature.details}
                  </p>
                  <div className="mt-2">
                    <span className={`text-xs font-medium ${getStatusColor(feature.status)}`}>
                      {feature.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Installation Demo */}
      {capabilities.isIOS && !capabilities.isStandalone && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Installation Demo
          </h3>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Install as PWA
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
                  Experience the full native app functionality by installing this PWA to your home screen.
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShowInstallPrompt}
                  disabled={installPromptShown}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {installPromptShown ? 'Install Prompt Shown' : 'Show Install Instructions'}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capabilities Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Capabilities Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className={`text-2xl font-bold ${capabilities.supportsNotifications ? 'text-green-600' : 'text-gray-400'}`}>
              {capabilities.supportsNotifications ? '✓' : '✗'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Notifications</p>
          </div>
          
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className={`text-2xl font-bold ${capabilities.supportsBadges ? 'text-green-600' : 'text-gray-400'}`}>
              {capabilities.supportsBadges ? '✓' : '✗'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">App Badges</p>
          </div>
          
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className={`text-2xl font-bold ${capabilities.supportsShortcuts ? 'text-green-600' : 'text-gray-400'}`}>
              {capabilities.supportsShortcuts ? '✓' : '✗'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Siri Shortcuts</p>
          </div>
          
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className={`text-2xl font-bold ${capabilities.supportsSpotlight ? 'text-green-600' : 'text-gray-400'}`}>
              {capabilities.supportsSpotlight ? '✓' : '✗'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Spotlight Search</p>
          </div>
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">iOS PWA Implementation:</p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-400">
              <li>• Automatic iOS device detection and feature initialization</li>
              <li>• Complete Apple touch icon set for all device sizes</li>
              <li>• Dynamic status bar styling with safe area support</li>
              <li>• iOS 12+ Siri Shortcuts integration for voice commands</li>
              <li>• Spotlight search optimization with structured data</li>
              <li>• Custom Add to Home Screen prompts with visual instructions</li>
              <li>• App lifecycle management with state restoration</li>
              <li>• iOS-specific event handling and keyboard management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IOSPWADemo;