import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import logger from '../../utils/logger';

const PWADevHelper = () => {
  const [pwaInfo, setPwaInfo] = useState({
    isInstalled: false,
    isStandalone: false,
    serviceWorkerStatus: 'unknown',
    manifestInfo: null,
    installPromptAvailable: false,
    cacheInfo: null
  });
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), { message, type, timestamp }]);
  };

  useEffect(() => {
    const checkPWAStatus = async () => {
      try {
        // Check if app is installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                            window.navigator.standalone ||
                            document.referrer.includes('android-app://');

        // Check service worker status
        let swStatus = 'not-supported';
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            if (registration.active) {
              swStatus = 'active';
            } else if (registration.installing) {
              swStatus = 'installing';
            } else if (registration.waiting) {
              swStatus = 'waiting';
            }
          } else {
            swStatus = 'not-registered';
          }
        }

        // Check manifest
        let manifestInfo = null;
        try {
          const manifestResponse = await fetch('/manifest.json');
          if (manifestResponse.ok) {
            manifestInfo = await manifestResponse.json();
          }
        } catch (error) {
          addLog(`Manifest fetch failed: ${error.message}`, 'error');
        }

        // Check cache info
        let cacheInfo = null;
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            cacheInfo = {
              count: cacheNames.length,
              names: cacheNames
            };
          } catch (error) {
            addLog(`Cache check failed: ${error.message}`, 'error');
          }
        }

        setPwaInfo({
          isInstalled: isStandalone,
          isStandalone,
          serviceWorkerStatus: swStatus,
          manifestInfo,
          installPromptAvailable: window.deferredPrompt !== undefined,
          cacheInfo
        });

        addLog('PWA status updated', 'success');
      } catch (error) {
        addLog(`PWA status check failed: ${error.message}`, 'error');
        logger.error('PWA Dev Helper status check failed', 'PWA_DEV_HELPER', error);
      }
    };

    checkPWAStatus();

    // Listen for PWA events
    const handleBeforeInstallPrompt = (e) => {
      addLog('Install prompt available', 'info');
      setPwaInfo(prev => ({ ...prev, installPromptAvailable: true }));
    };

    const handleAppInstalled = () => {
      addLog('App installed successfully', 'success');
      setPwaInfo(prev => ({ ...prev, isInstalled: true }));
    };

    const handleSWUpdate = () => {
      addLog('Service worker updated', 'info');
      checkPWAStatus();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa:update-available', handleSWUpdate);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa:update-available', handleSWUpdate);
    };
  }, []);

  const handleForceInstall = async () => {
    if (window.deferredPrompt) {
      try {
        window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        addLog(`Install prompt result: ${outcome}`, outcome === 'accepted' ? 'success' : 'info');
        window.deferredPrompt = null;
      } catch (error) {
        addLog(`Install prompt failed: ${error.message}`, 'error');
      }
    } else {
      addLog('No install prompt available', 'warning');
    }
  };

  const handleClearCaches = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        addLog(`Cleared ${cacheNames.length} caches`, 'success');
        // Refresh PWA info
        window.location.reload();
      } catch (error) {
        addLog(`Cache clear failed: ${error.message}`, 'error');
      }
    }
  };

  const handleUnregisterSW = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
          addLog('Service worker unregistered', 'success');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          addLog('No service worker to unregister', 'info');
        }
      } catch (error) {
        addLog(`SW unregister failed: ${error.message}`, 'error');
      }
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2"
        >
          PWA Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 max-h-96 overflow-hidden">
      <Card className="bg-white dark:bg-gray-800 shadow-lg border">
        <Card.Header className="pb-2">
          <div className="flex justify-between items-center">
            <Card.Title className="text-sm font-semibold">PWA Debug Helper</Card.Title>
            <Button
              onClick={() => setIsVisible(false)}
              className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              ×
            </Button>
          </div>
        </Card.Header>
        <Card.Content className="text-xs space-y-3 max-h-80 overflow-y-auto">
          {/* PWA Status */}
          <div className="space-y-1">
            <div className="font-semibold text-gray-700 dark:text-gray-300">Status:</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>Installed: <span className={pwaInfo.isInstalled ? 'text-green-600' : 'text-red-600'}>
                {pwaInfo.isInstalled ? 'Yes' : 'No'}
              </span></div>
              <div>Standalone: <span className={pwaInfo.isStandalone ? 'text-green-600' : 'text-red-600'}>
                {pwaInfo.isStandalone ? 'Yes' : 'No'}
              </span></div>
              <div>SW Status: <span className={
                pwaInfo.serviceWorkerStatus === 'active' ? 'text-green-600' : 
                pwaInfo.serviceWorkerStatus === 'installing' ? 'text-yellow-600' : 'text-red-600'
              }>
                {pwaInfo.serviceWorkerStatus}
              </span></div>
              <div>Install Prompt: <span className={pwaInfo.installPromptAvailable ? 'text-green-600' : 'text-red-600'}>
                {pwaInfo.installPromptAvailable ? 'Available' : 'Not Available'}
              </span></div>
            </div>
          </div>

          {/* Manifest Info */}
          {pwaInfo.manifestInfo && (
            <div className="space-y-1">
              <div className="font-semibold text-gray-700 dark:text-gray-300">Manifest:</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Name: {pwaInfo.manifestInfo.name || 'N/A'}<br/>
                Theme: {pwaInfo.manifestInfo.theme_color || 'N/A'}<br/>
                Display: {pwaInfo.manifestInfo.display || 'N/A'}
              </div>
            </div>
          )}

          {/* Cache Info */}
          {pwaInfo.cacheInfo && (
            <div className="space-y-1">
              <div className="font-semibold text-gray-700 dark:text-gray-300">Caches:</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Count: {pwaInfo.cacheInfo.count}<br/>
                {pwaInfo.cacheInfo.names.slice(0, 2).map(name => (
                  <div key={name}>• {name}</div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-1">
            <div className="font-semibold text-gray-700 dark:text-gray-300">Actions:</div>
            <div className="flex flex-wrap gap-1">
              <Button onClick={handleForceInstall} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white">
                Install
              </Button>
              <Button onClick={handleClearCaches} className="text-xs px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white">
                Clear Cache
              </Button>
              <Button onClick={handleUnregisterSW} className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white">
                Unregister SW
              </Button>
            </div>
          </div>

          {/* Logs */}
          <div className="space-y-1">
            <div className="font-semibold text-gray-700 dark:text-gray-300">Recent Logs:</div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {logs.slice(-5).map((log, index) => (
                <div key={index} className={`text-xs ${
                  log.type === 'error' ? 'text-red-600' :
                  log.type === 'success' ? 'text-green-600' :
                  log.type === 'warning' ? 'text-yellow-600' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  [{log.timestamp}] {log.message}
                </div>
              ))}
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default PWADevHelper;