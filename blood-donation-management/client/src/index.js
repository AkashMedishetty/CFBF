import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  const register = async () => {
    try {
      // Use different service worker for development vs production
      const swUrl = process.env.NODE_ENV === 'production' 
        ? '/service-worker.js' 
        : '/service-worker.js';
      
      console.log(`Attempting to register service worker: ${swUrl}`);
      
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration);
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('Service Worker is ready');
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
        const newWorker = registration.installing;
        if (!newWorker) return;
        
        newWorker.addEventListener('statechange', () => {
          console.log('Service Worker state changed:', newWorker.state);
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              window.dispatchEvent(new CustomEvent('pwa:update-available', {
                detail: { registration }
              }));
            } else {
              // First time installation
              window.dispatchEvent(new CustomEvent('pwa:installed'));
            }
          }
        });
      });

      return registration;
    } catch (err) {
      console.error('Service worker registration failed:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
    }
  };

  // Handle install prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('pwa:install-available', {
      detail: { prompt: deferredPrompt }
    }));
  });

  // Handle successful installation
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa:installed'));
  });

  // Register when page loads
  if (process.env.NODE_ENV === 'production') {
    if (document.readyState === 'loading') {
      window.addEventListener('load', register);
    } else {
      register();
    }
  } else {
    // In development, unregister any existing SW before registering the dev one to avoid stale caches
    navigator.serviceWorker.getRegistrations().then(regs => Promise.all(regs.map(r => r.unregister()))).finally(() => {
      if (document.readyState === 'loading') {
        window.addEventListener('load', register);
      } else {
        register();
      }
    });
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);