import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download, Sparkles, Zap, Shield } from 'lucide-react';

import Button from '../ui/Button';
import Alert from '../ui/Alert';
import pwaInstallManager from '../../utils/pwaInstallManager';
import logger from '../../utils/logger';

const UpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateStep, setUpdateStep] = useState('available'); // 'available', 'updating', 'success'

  useEffect(() => {
    // Listen for update events
    const handleUpdateEvent = (event, data) => {
      logger.debug('Update event received', 'UPDATE_NOTIFICATION', { event, data });
      
      switch (event) {
        case 'available':
          setUpdateInfo(data);
          setShowUpdate(true);
          setUpdateStep('available');
          break;
          
        case 'applied':
          setUpdateStep('success');
          setTimeout(() => {
            setShowUpdate(false);
          }, 2000);
          break;
          
        default:
          logger.warn('Unknown update event', 'UPDATE_NOTIFICATION', { event, data });
          break;
      }
    };

    // Listen for PWA update events
    const handlePWAUpdate = (event) => {
      logger.info('PWA update available', 'UPDATE_NOTIFICATION', event.detail);
      setUpdateInfo(event.detail);
      setShowUpdate(true);
      setUpdateStep('available');
    };

    pwaInstallManager.onUpdate(handleUpdateEvent);
    window.addEventListener('pwa:update-available', handlePWAUpdate);

    return () => {
      pwaInstallManager.removeOnUpdate(handleUpdateEvent);
      window.removeEventListener('pwa:update-available', handlePWAUpdate);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateStep('updating');
    
    try {
      const success = await pwaInstallManager.applyUpdate();
      
      if (success) {
        logger.success('Update applied successfully', 'UPDATE_NOTIFICATION');
      } else {
        logger.warn('Update application failed', 'UPDATE_NOTIFICATION');
        setIsUpdating(false);
        setUpdateStep('available');
      }
    } catch (error) {
      logger.error('Update failed', 'UPDATE_NOTIFICATION', error);
      setIsUpdating(false);
      setUpdateStep('available');
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    logger.info('Update notification dismissed', 'UPDATE_NOTIFICATION');
  };

  const handleRefreshLater = () => {
    setShowUpdate(false);
    // Show again in 1 hour
    setTimeout(() => {
      setShowUpdate(true);
    }, 60 * 60 * 1000);
  };

  const getUpdateFeatures = () => {
    const features = updateInfo?.features || {};
    const highlights = [];

    if (features.backgroundSync) {
      highlights.push({
        icon: Zap,
        title: 'Enhanced Offline Support',
        description: 'Better background synchronization'
      });
    }

    if (features.notifications) {
      highlights.push({
        icon: Sparkles,
        title: 'Improved Notifications',
        description: 'Faster emergency alerts'
      });
    }

    if (features.offlineSupport) {
      highlights.push({
        icon: Shield,
        title: 'Better Reliability',
        description: 'Enhanced offline capabilities'
      });
    }

    // Default features if none specified
    if (highlights.length === 0) {
      highlights.push(
        {
          icon: Zap,
          title: 'Performance Improvements',
          description: 'Faster loading and better responsiveness'
        },
        {
          icon: Shield,
          title: 'Security Updates',
          description: 'Latest security patches and fixes'
        },
        {
          icon: Sparkles,
          title: 'Bug Fixes',
          description: 'Resolved issues and stability improvements'
        }
      );
    }

    return highlights;
  };

  const renderUpdateContent = () => {
    switch (updateStep) {
      case 'updating':
        return (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </motion.div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Updating App...
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Please wait while we apply the latest updates
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <Download className="h-6 w-6 text-green-600 dark:text-green-400" />
              </motion.div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Update Complete!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your app has been updated to the latest version
            </p>
          </div>
        );

      default:
        const features = getUpdateFeatures();
        
        return (
          <div className="py-2">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                  Update Available
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  A new version of Call For Blood is ready with improvements and fixes
                </p>
                {updateInfo?.version && (
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Version {updateInfo.version}
                  </p>
                )}
              </div>
            </div>

            {/* Feature highlights */}
            <div className="space-y-3 mb-6">
              {features.slice(0, 2).map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                      <Icon className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {feature.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleRefreshLater}
                className="flex-1"
                size="sm"
              >
                Later
              </Button>
              <Button
                onClick={handleUpdate}
                loading={isUpdating}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center space-x-2"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Update Now</span>
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm w-full"
        >
          <Alert
            variant="info"
            className="relative shadow-lg border-blue-200 dark:border-blue-800"
            dismissible={updateStep === 'available'}
            onDismiss={handleDismiss}
          >
            {renderUpdateContent()}
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateNotification;