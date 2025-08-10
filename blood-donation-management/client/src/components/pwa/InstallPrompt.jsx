import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor, Zap, Wifi, Bell } from 'lucide-react';

import Button from '../ui/Button';
import Card from '../ui/Card';
import pwaInstallManager from '../../utils/pwaInstallManager';
import logger from '../../utils/logger';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStep, setInstallStep] = useState('prompt'); // 'prompt', 'installing', 'success'
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');

    // Listen for install events
    const handleInstallEvent = (event, data) => {
      logger.debug('Install event received', 'INSTALL_PROMPT', { event, data });
      
      switch (event) {
        case 'installable':
          // Show prompt after a delay to avoid being intrusive
          setTimeout(() => {
            setShowPrompt(true);
          }, 10000); // 10 seconds
          break;
          
        case 'accepted':
          setInstallStep('installing');
          setIsInstalling(true);
          break;
          
        case 'installed':
          setInstallStep('success');
          setTimeout(() => {
            setShowPrompt(false);
          }, 3000);
          break;
          
        case 'dismissed':
          setShowPrompt(false);
          break;
      }
    };

    pwaInstallManager.onInstall(handleInstallEvent);

    return () => {
      pwaInstallManager.removeOnInstall(handleInstallEvent);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const success = await pwaInstallManager.triggerInstall();
      
      if (!success) {
        setIsInstalling(false);
        // Show manual install instructions for iOS or other browsers
        if (deviceType === 'mobile' && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          setInstallStep('ios-instructions');
        }
      }
    } catch (error) {
      logger.error('Install failed', 'INSTALL_PROMPT', error);
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    logger.info('Install prompt dismissed by user', 'INSTALL_PROMPT');
  };

  const renderPromptContent = () => {
    switch (installStep) {
      case 'installing':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Download className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </motion.div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Installing Call For Blood...
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Please wait while we set up the app on your device
            </p>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Download className="h-8 w-8 text-green-600 dark:text-green-400" />
              </motion.div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Successfully Installed!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Call For Blood is now available on your device
            </p>
          </motion.div>
        );

      case 'ios-instructions':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-4"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Install on iOS
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Follow these steps to install Call For Blood on your iPhone or iPad
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Tap the Share button
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Look for the square with an arrow pointing up in Safari's toolbar
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Select "Add to Home Screen"
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Scroll down in the share menu to find this option
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Tap "Add"
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    The app will be added to your home screen
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button
                onClick={handleDismiss}
                className="flex-1"
              >
                Got It
              </Button>
            </div>
          </motion.div>
        );

      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-4"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {deviceType === 'mobile' ? (
                  <Smartphone className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                ) : (
                  <Monitor className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Install Call For Blood
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Get instant access to emergency blood requests and save lives faster
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Instant Notifications
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Get emergency blood requests even when the app is closed
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Wifi className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Works Offline
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Access essential features even without internet connection
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <Bell className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Quick Response
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Respond to blood requests directly from notifications
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                Not Now
              </Button>
              <Button
                onClick={handleInstall}
                loading={isInstalling}
                disabled={isInstalling}
                className="flex-1 flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Install App</span>
              </Button>
            </div>

            {/* Privacy note */}
            <p className="text-xs text-slate-500 dark:text-slate-500 text-center mt-4">
              Free to install. No personal data is shared during installation.
            </p>
          </motion.div>
        );
    }
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md"
          >
            <Card className="relative">
              {/* Close button */}
              {installStep === 'prompt' && (
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              )}

              <div className="p-6">
                {renderPromptContent()}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;