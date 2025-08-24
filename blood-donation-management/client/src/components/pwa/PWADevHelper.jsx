import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  X,
  Settings
} from 'lucide-react';
import Button from '../ui/Button';

const PWADevHelper = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [pwaStatus, setPwaStatus] = useState({
    serviceWorkerRegistered: false,
    isOnline: navigator.onLine,
    isInstallable: false,
    isInstalled: false,
    updateAvailable: false
  });

  // Only show in development
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isDev) return;

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setPwaStatus(prev => ({ ...prev, serviceWorkerRegistered: true }));
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setPwaStatus(prev => ({ ...prev, updateAvailable: false }));
      });
    }

    // Check if app is installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setPwaStatus(prev => ({ ...prev, isInstalled: isStandalone }));

    // Listen for network changes
    const handleOnline = () => setPwaStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setPwaStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setPwaStatus(prev => ({ ...prev, isInstallable: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for SW updates
    const handleSWUpdate = () => {
      setPwaStatus(prev => ({ ...prev, updateAvailable: true }));
    };

    window.addEventListener('sw-update-available', handleSWUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, [isDev]);

  const handleInstall = async () => {
    const event = window.deferredPrompt;
    if (event) {
      event.prompt();
      const { outcome } = await event.userChoice;
      console.log('Install prompt result:', outcome);
      if (outcome === 'accepted') {
        setPwaStatus(prev => ({ ...prev, isInstallable: false, isInstalled: true }));
      }
    }
  };

  const handleUpdate = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (!isDev) return null;

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={toggleVisibility}
        className="fixed bottom-4 left-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="PWA Development Helper"
      >
        <Settings className="w-5 h-5" />
      </motion.button>

      {/* PWA Status Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 left-4 z-40 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">PWA Dev Status</h3>
              <button
                onClick={toggleVisibility}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Service Worker Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Service Worker</span>
                <div className="flex items-center">
                  {pwaStatus.serviceWorkerRegistered ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className="text-xs">
                    {pwaStatus.serviceWorkerRegistered ? 'Active' : 'Not Registered'}
                  </span>
                </div>
              </div>

              {/* Network Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Network</span>
                <div className="flex items-center">
                  {pwaStatus.isOnline ? (
                    <Wifi className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className="text-xs">
                    {pwaStatus.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Install Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Installation</span>
                <div className="flex items-center">
                  {pwaStatus.isInstalled ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  ) : pwaStatus.isInstallable ? (
                    <Download className="w-4 h-4 text-blue-500 mr-1" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-400 mr-1" />
                  )}
                  <span className="text-xs">
                    {pwaStatus.isInstalled 
                      ? 'Installed' 
                      : pwaStatus.isInstallable 
                        ? 'Available' 
                        : 'Not Available'
                    }
                  </span>
                </div>
              </div>

              {/* Update Status */}
              {pwaStatus.updateAvailable && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Update</span>
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-xs">Available</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-4 space-y-2">
              {pwaStatus.isInstallable && !pwaStatus.isInstalled && (
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="w-full"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Install App
                </Button>
              )}

              {pwaStatus.updateAvailable && (
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  className="w-full"
                  variant="outline"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Update App
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => window.location.reload()}
                className="w-full"
                variant="ghost"
              >
                Reload Page
              </Button>
            </div>

            {/* Development Info */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Development Mode - This panel is only visible in development
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PWADevHelper;