import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Register service worker
if ('serviceWorker' in navigator) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Production: Use external service worker file
    const swUrl = '/sw.js';
    
    navigator.serviceWorker.register(swUrl)
       .then((registration) => {
         console.log('SW registered: ', registration);
         swRegistration = registration;
         
         // Check for updates
         registration.addEventListener('updatefound', () => {
           const newWorker = registration.installing;
           if (newWorker) {
             newWorker.addEventListener('statechange', () => {
               if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                 console.log('New content is available; please refresh.');
                 // You can show a notification to the user here
               }
             });
           }
         });
       })
       .catch((error) => {
         console.error('SW registration failed: ', error);
       });
  } else {
    // Development: Use external service worker file
    const swUrl = `${process.env.PUBLIC_URL}/sw.js`;
    
    navigator.serviceWorker.register(swUrl)
       .then((registration) => {
         console.log('Development SW registered: ', registration);
         swRegistration = registration;
         
         // Check for updates
         registration.addEventListener('updatefound', () => {
           const newWorker = registration.installing;
           if (newWorker) {
             newWorker.addEventListener('statechange', () => {
               if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                 console.log('New development SW content is available; please refresh.');
               }
             });
           }
         });
       })
       .catch((error) => {
         console.error('Development SW registration failed: ', error);
       });
  }

  // Enhanced PWA install prompt handling
  let deferredPrompt;
  let swRegistration;
  let installPromptState = {
    available: false,
    dismissed: false,
    installed: false,
    lastPromptTime: null,
    userChoice: null
  };

  const logPWA = (level, message, data = null) => {
    const timestamp = new Date().toISOString();
    const logData = data ? { timestamp, ...data } : { timestamp };
    console[level](`[PWA] ${message}`, logData);
    
    // Dispatch custom event for PWA debug helper
    window.dispatchEvent(new CustomEvent('pwa:debug-log', {
      detail: { level, message, data: logData }
    }));
  };

  // Check if PWA is already installed
  const checkPWAInstallStatus = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator.standalone === true);
    const isInWebAppChrome = (window.matchMedia('(display-mode: standalone)').matches);
    
    const installed = isStandalone || isInWebAppiOS || isInWebAppChrome;
    
    logPWA('info', 'PWA install status check', {
      isStandalone,
      isInWebAppiOS,
      isInWebAppChrome,
      installed,
      userAgent: navigator.userAgent
    });
    
    if (installed) {
      installPromptState.installed = true;
      window.dispatchEvent(new CustomEvent('pwa:already-installed'));
    }
    
    return installed;
  };

  // Enhanced beforeinstallprompt handler
  window.addEventListener('beforeinstallprompt', (e) => {
    logPWA('info', 'PWA install prompt available', {
      platforms: e.platforms,
      userChoice: e.userChoice
    });
    
    e.preventDefault();
    deferredPrompt = e;
    installPromptState.available = true;
    installPromptState.lastPromptTime = Date.now();
    
    // Store the event for later use
    window.pwaInstallPrompt = e;
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('pwa:install-available', {
      detail: { 
        prompt: deferredPrompt,
        platforms: e.platforms,
        state: { ...installPromptState }
      }
    }));
  });

  // Handle successful installation
  window.addEventListener('appinstalled', (e) => {
    logPWA('info', 'PWA was installed successfully');
    
    deferredPrompt = null;
    window.pwaInstallPrompt = null;
    installPromptState.installed = true;
    installPromptState.available = false;
    
    window.dispatchEvent(new CustomEvent('pwa:installed', {
      detail: { state: { ...installPromptState } }
    }));
  });

  // Development mode: Add manual install prompt trigger
  if (process.env.NODE_ENV === 'development') {
    // Add global function for manual testing
    window.triggerPWAInstall = async () => {
      if (deferredPrompt) {
        logPWA('info', 'Manually triggering PWA install prompt');
        
        try {
          const result = await deferredPrompt.prompt();
          installPromptState.userChoice = result.outcome;
          
          logPWA('info', 'PWA install prompt result', {
            outcome: result.outcome,
            platform: result.platform
          });
          
          if (result.outcome === 'dismissed') {
            installPromptState.dismissed = true;
          }
          
          window.dispatchEvent(new CustomEvent('pwa:install-prompt-result', {
            detail: { result, state: { ...installPromptState } }
          }));
          
          deferredPrompt = null;
          window.pwaInstallPrompt = null;
          
        } catch (error) {
          logPWA('error', 'PWA install prompt failed', { error: error.message });
        }
      } else {
        logPWA('warn', 'No deferred install prompt available');
        
        // Check if already installed
        if (checkPWAInstallStatus()) {
          logPWA('info', 'PWA is already installed');
        } else {
          logPWA('info', 'PWA install prompt not yet available - waiting for beforeinstallprompt event');
        }
      }
    };
    
    // Add global function to get PWA status
    window.getPWAStatus = () => {
      const status = {
        ...installPromptState,
        hasServiceWorker: 'serviceWorker' in navigator,
        serviceWorkerReady: false,
        deferredPromptAvailable: !!deferredPrompt,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches,
        userAgent: navigator.userAgent
      };
      
      navigator.serviceWorker.ready.then(() => {
        status.serviceWorkerReady = true;
      }).catch(() => {
        status.serviceWorkerReady = false;
      });
      
      return status;
    };
    
    logPWA('info', 'Development mode PWA debugging functions available', {
      functions: ['window.triggerPWAInstall()', 'window.getPWAStatus()']
    });
  }

  // Check install status on load
  setTimeout(checkPWAInstallStatus, 1000);

  // Service worker registration happens immediately above
  // No need for additional registration calls
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);