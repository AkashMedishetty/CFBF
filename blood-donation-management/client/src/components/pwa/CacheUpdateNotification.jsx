import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Download } from 'lucide-react';
import Button from '../ui/Button';

const CacheUpdateNotification = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    const handleCacheUpdate = (event) => {
      setUpdateInfo(event.detail);
      setShowNotification(true);
    };

    // Listen for cache update events
    window.addEventListener('cacheUpdated', handleCacheUpdate);

    return () => {
      window.removeEventListener('cacheUpdated', handleCacheUpdate);
    };
  }, []);

  const handleRefresh = () => {
    // Force reload to get the latest version
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">New Version Available</h3>
                  <p className="text-sm text-gray-600">
                    A new version of the app is ready with latest features
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {updateInfo && (
              <div className="mb-3 text-xs text-gray-500">
                Version: {updateInfo.version} • Updated: {new Date(updateInfo.timestamp).toLocaleTimeString()}
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleRefresh}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="flex-1"
              >
                Refresh Now
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="px-3"
              >
                Later
              </Button>
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              Refreshing will load the latest version with new features and improvements
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CacheUpdateNotification;