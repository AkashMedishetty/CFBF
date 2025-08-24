// PWA Manager - Handles service worker registration, updates, and offline functionality
class PWAManager {
  constructor() {
    this.registration = null;
    this.isOnline = navigator.onLine;
    this.updateAvailable = false;
    this.installPromptEvent = null;
    
    // Bind methods
    this.registerServiceWorker = this.registerServiceWorker.bind(this);
    this.checkForUpdates = this.checkForUpdates.bind(this);
    this.handleInstallPrompt = this.handleInstallPrompt.bind(this);
    
    // Initialize
    this.init();
  }

  async init() {
    console.log('[PWA Manager] Initializing...');
    
    // Listen for network status changes
    window.addEventListener('online', () => {
      console.log('[PWA Manager] Network: Online');
      this.isOnline = true;
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      console.log('[PWA Manager] Network: Offline');
      this.isOnline = false;
    });
    
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', this.handleInstallPrompt);
    
    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('[PWA Manager] App installed successfully');
      this.installPromptEvent = null;
    });
  }

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA Manager] Service Worker not supported');
      return null;
    }

    try {
      console.log('[PWA Manager] Registering Service Worker...');
      
      // Use development service worker in dev mode
      const swPath = process.env.NODE_ENV === 'development' ? '/sw-dev.js' : '/sw.js';
      console.log(`[PWA Manager] Using service worker: ${swPath}`);
      
      const registration = await navigator.serviceWorker.register(swPath, {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });
      
      this.registration = registration;
      console.log('[PWA Manager] Service Worker registered successfully');
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        console.log('[PWA Manager] Service Worker update found');
        this.handleServiceWorkerUpdate(registration);
      });
      
      // Check for existing updates
      if (registration.waiting) {
        console.log('[PWA Manager] Service Worker update already waiting');
        this.updateAvailable = true;
      }
      
      return registration;
    } catch (error) {
      console.error('[PWA Manager] Service Worker registration failed:', error);
      return null;
    }
  }

  handleServiceWorkerUpdate(registration) {
    const newWorker = registration.installing;
    
    if (!newWorker) return;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        console.log('[PWA Manager] New Service Worker installed, update available');
        this.updateAvailable = true;
        
        // Dispatch custom event for UI components
        window.dispatchEvent(new CustomEvent('sw-update-available', {
          detail: { registration }
        }));
      }
    });
  }

  async checkForUpdates() {
    if (!this.registration) {
      console.log('[PWA Manager] No registration available for update check');
      return;
    }

    try {
      console.log('[PWA Manager] Checking for updates...');
      await this.registration.update();
    } catch (error) {
      console.error('[PWA Manager] Update check failed:', error);
    }
  }

  async updateServiceWorker() {
    if (!this.registration || !this.registration.waiting) {
      console.log('[PWA Manager] No waiting service worker to update');
      return false;
    }

    try {
      console.log('[PWA Manager] Updating Service Worker...');
      
      // Tell the waiting SW to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Listen for controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA Manager] Service Worker updated, reloading...');
        window.location.reload();
      });
      
      return true;
    } catch (error) {
      console.error('[PWA Manager] Service Worker update failed:', error);
      return false;
    }
  }

  handleInstallPrompt(event) {
    console.log('[PWA Manager] Install prompt available');
    event.preventDefault();
    this.installPromptEvent = event;
    
    // Dispatch custom event for UI components
    window.dispatchEvent(new CustomEvent('pwa-install-available', {
      detail: { event }
    }));
  }

  async showInstallPrompt() {
    if (!this.installPromptEvent) {
      console.log('[PWA Manager] No install prompt available');
      return { outcome: 'not-available' };
    }

    try {
      console.log('[PWA Manager] Showing install prompt...');
      
      // Show the prompt
      this.installPromptEvent.prompt();
      
      // Wait for user response
      const { outcome } = await this.installPromptEvent.userChoice;
      
      console.log('[PWA Manager] Install prompt outcome:', outcome);
      
      // Clear the prompt
      this.installPromptEvent = null;
      
      return { outcome };
    } catch (error) {
      console.error('[PWA Manager] Install prompt failed:', error);
      return { outcome: 'error', error };
    }
  }

  isInstalled() {
    // Check if running in standalone mode
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  async syncOfflineData() {
    if (!this.isOnline || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      console.log('[PWA Manager] Syncing offline data...');
      
      // Trigger background sync if supported
      if ('sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        
        // Register sync events
        await registration.sync.register('blood-request-sync');
        await registration.sync.register('donor-response-sync');
        
        console.log('[PWA Manager] Background sync registered');
      } else {
        // Fallback: manually sync data
        await this.manualSync();
      }
    } catch (error) {
      console.error('[PWA Manager] Offline data sync failed:', error);
    }
  }

  async manualSync() {
    try {
      // Get offline data from IndexedDB
      const offlineRequests = await this.getOfflineData('blood-requests');
      const offlineResponses = await this.getOfflineData('donor-responses');
      
      // Sync blood requests
      for (const request of offlineRequests) {
        try {
          const response = await fetch('/api/v1/blood-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request.data)
          });
          
          if (response.ok) {
            await this.removeOfflineData('blood-requests', request.id);
            console.log('[PWA Manager] Synced blood request:', request.id);
          }
        } catch (error) {
          console.error('[PWA Manager] Failed to sync blood request:', error);
        }
      }
      
      // Sync donor responses
      for (const response of offlineResponses) {
        try {
          const result = await fetch(`/api/v1/blood-requests/${response.requestId}/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response.data)
          });
          
          if (result.ok) {
            await this.removeOfflineData('donor-responses', response.id);
            console.log('[PWA Manager] Synced donor response:', response.id);
          }
        } catch (error) {
          console.error('[PWA Manager] Failed to sync donor response:', error);
        }
      }
    } catch (error) {
      console.error('[PWA Manager] Manual sync failed:', error);
    }
  }

  async storeOfflineData(storeName, data) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('cfb-offline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const addRequest = store.add({
          id: Date.now().toString(),
          data,
          timestamp: new Date().toISOString()
        });
        
        addRequest.onsuccess = () => resolve(addRequest.result);
        addRequest.onerror = () => reject(addRequest.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async getOfflineData(storeName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('cfb-offline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
    });
  }

  async removeOfflineData(storeName, id) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('cfb-offline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const deleteRequest = store.delete(id);
        
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
    });
  }

  // Cache management
  async clearCache() {
    if (!('caches' in window)) {
      console.warn('[PWA Manager] Cache API not supported');
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[PWA Manager] All caches cleared');
    } catch (error) {
      console.error('[PWA Manager] Failed to clear caches:', error);
    }
  }

  async getCacheSize() {
    if (!('caches' in window) || !('storage' in navigator)) {
      return { size: 0, quota: 0 };
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        size: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0
      };
    } catch (error) {
      console.error('[PWA Manager] Failed to get cache size:', error);
      return { size: 0, quota: 0, percentage: 0 };
    }
  }

  // Notification handling
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('[PWA Manager] Notifications not supported');
      return 'not-supported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[PWA Manager] Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('[PWA Manager] Notification permission request failed:', error);
      return 'error';
    }
  }

  async showNotification(title, options = {}) {
    if (Notification.permission !== 'granted') {
      console.warn('[PWA Manager] Notification permission not granted');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png',
        vibrate: [200, 100, 200],
        ...options
      });
    } catch (error) {
      console.error('[PWA Manager] Failed to show notification:', error);
    }
  }

  // Utility methods
  getNetworkStatus() {
    return {
      online: this.isOnline,
      connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection
    };
  }

  getInstallationStatus() {
    return {
      installed: this.isInstalled(),
      promptAvailable: !!this.installPromptEvent,
      updateAvailable: this.updateAvailable
    };
  }

  // Debug information
  getDebugInfo() {
    return {
      serviceWorker: {
        supported: 'serviceWorker' in navigator,
        registered: !!this.registration,
        controller: !!navigator.serviceWorker.controller
      },
      pwa: {
        installed: this.isInstalled(),
        installPromptAvailable: !!this.installPromptEvent,
        updateAvailable: this.updateAvailable
      },
      network: this.getNetworkStatus(),
      notifications: {
        supported: 'Notification' in window,
        permission: Notification.permission
      },
      storage: {
        supported: 'storage' in navigator,
        indexedDB: 'indexedDB' in window,
        caches: 'caches' in window
      }
    };
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();

// Export for debugging
window.pwaManager = pwaManager;