import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download } from 'lucide-react';
import Button from '../ui/Button';

const ServiceWorkerUpdater = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('[PWA] Service Worker registered successfully');
      setRegistration(reg);

      // Listen for updates
      reg.addEventListener('updatefound', () => {
        console.log('[PWA] Service Worker update found');
        const newWorker = reg.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New Service Worker installed, update available');
              setUpdateAvailable(true);
            }
          });
        }
      });

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service Worker controller changed, reloading page');
        window.location.reload();
      });

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  };

  const handleUpdate = async () => {
    if (!registration || !registration.waiting) {
      return;
    }

    setIsUpdating(true);

    try {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // The page will reload automatically when the new SW takes control
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('[PWA] Failed to update service worker:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    // Store dismissal in session storage
    sessionStorage.setItem('sw-update-dismissed', 'true');
  };

  // Don't show if dismissed in this session
  if (sessionStorage.getItem('sw-update-dismissed')) {
    return null;
  }

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        >
          <div className="bg-white rounded-lg shadow-xl border border-blue-200 p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Download className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  App Update Available
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  A new version of Callforblood Foundation is ready with improvements and bug fixes.
                </p>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={handleUpdate}
                    isLoading={isUpdating}
                    leftIcon={!isUpdating && <RefreshCw className="w-4 h-4" />}
                    className="text-xs"
                  >
                    {isUpdating ? 'Updating...' : 'Update Now'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-xs text-gray-500"
                    isDisabled={isUpdating}
                  >
                    Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ServiceWorkerUpdater;