import logger from './logger';

class PWAInstallManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isInstallable = false;
    this.installCallbacks = [];
    this.updateCallbacks = [];
    
    // Installation tracking
    this.installPromptShown = false;
    this.installPromptDismissed = false;
    this.lastPromptTime = null;
    
    // Update management
    this.updateAvailable = false;
    this.newServiceWorker = null;
    
    this.init();
    
    logger.info('PWAInstallManager initialized', 'PWA_INSTALL');
  }

  // Initialize PWA installation management
  init() {
    // Check if already installed
    this.checkInstallationStatus();
    
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      logger.info('PWA install prompt available', 'PWA_INSTALL');
      
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Save the event for later use
      this.deferredPrompt = e;
      this.isInstallable = true;
      
      // Notify callbacks
      this.notifyInstallCallbacks('installable', { canInstall: true });
      
      // Show custom install prompt after delay
      this.scheduleInstallPrompt();
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', (e) => {
      logger.success('PWA installed successfully', 'PWA_INSTALL');
      
      this.isInstalled = true;
      this.isInstallable = false;
      this.deferredPrompt = null;
      
      // Store installation info
      this.storeInstallationInfo();
      
      // Notify callbacks
      this.notifyInstallCallbacks('installed', { 
        timestamp: Date.now(),
        source: 'user_action'
      });
    });

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_ACTIVATED') {
          this.handleServiceWorkerUpdate(event.data);
        }
      });
    }

    // Check for updates periodically
    this.startUpdateCheck();
    
    logger.debug('PWA install listeners initialized', 'PWA_INSTALL');
  }

  // Check current installation status
  checkInstallationStatus() {
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true;
    
    // Check if installed via other means
    const isInstalled = isStandalone || 
                       document.referrer.includes('android-app://') ||
                       window.location.search.includes('utm_source=pwa');
    
    this.isInstalled = isInstalled;
    
    logger.debug('Installation status checked', 'PWA_INSTALL', {
      isInstalled: this.isInstalled,
      isStandalone,
      referrer: document.referrer
    });
  }

  // Schedule install prompt based on user behavior
  scheduleInstallPrompt() {
    // Don't show if already dismissed recently
    const lastDismissed = localStorage.getItem('pwa_install_dismissed');
    if (lastDismissed && Date.now() - parseInt(lastDismissed) < 7 * 24 * 60 * 60 * 1000) {
      logger.debug('Install prompt recently dismissed, skipping', 'PWA_INSTALL');
      return;
    }

    // Don't show if already shown recently
    if (this.lastPromptTime && Date.now() - this.lastPromptTime < 24 * 60 * 60 * 1000) {
      logger.debug('Install prompt shown recently, skipping', 'PWA_INSTALL');
      return;
    }

    // Show prompt after user engagement
    this.waitForUserEngagement().then(() => {
      this.showInstallPrompt();
    });
  }

  // Wait for user engagement before showing prompt
  waitForUserEngagement() {
    return new Promise((resolve) => {
      let engagementScore = 0;
      const requiredScore = 3;
      
      const trackEngagement = () => {
        engagementScore++;
        logger.debug(`User engagement: ${engagementScore}/${requiredScore}`, 'PWA_INSTALL');
        
        if (engagementScore >= requiredScore) {
          // Remove listeners
          window.removeEventListener('click', trackEngagement);
          window.removeEventListener('scroll', trackEngagement);
          window.removeEventListener('keydown', trackEngagement);
          
          // Wait a bit more to ensure user is engaged
          setTimeout(resolve, 2000);
        }
      };

      // Track various engagement signals
      window.addEventListener('click', trackEngagement);
      window.addEventListener('scroll', trackEngagement);
      window.addEventListener('keydown', trackEngagement);
      
      // Fallback timeout
      setTimeout(() => {
        if (engagementScore > 0) {
          resolve();
        }
      }, 30000); // 30 seconds
    });
  }

  // Show custom install prompt
  async showInstallPrompt() {
    if (!this.deferredPrompt || this.installPromptShown) {
      return false;
    }

    try {
      logger.info('Showing PWA install prompt', 'PWA_INSTALL');
      
      this.installPromptShown = true;
      this.lastPromptTime = Date.now();
      
      // Show the install prompt
      const result = await this.deferredPrompt.prompt();
      
      logger.debug('Install prompt result', 'PWA_INSTALL', { outcome: result.outcome });
      
      if (result.outcome === 'accepted') {
        logger.success('User accepted install prompt', 'PWA_INSTALL');
        this.notifyInstallCallbacks('accepted', { timestamp: Date.now() });
      } else {
        logger.info('User dismissed install prompt', 'PWA_INSTALL');
        this.installPromptDismissed = true;
        localStorage.setItem('pwa_install_dismissed', Date.now().toString());
        this.notifyInstallCallbacks('dismissed', { timestamp: Date.now() });
      }
      
      // Clear the deferred prompt
      this.deferredPrompt = null;
      this.isInstallable = false;
      
      return result.outcome === 'accepted';
      
    } catch (error) {
      logger.error('Install prompt failed', 'PWA_INSTALL', error);
      return false;
    }
  }

  // Manually trigger install prompt
  async triggerInstall() {
    if (!this.isInstallable || !this.deferredPrompt) {
      logger.warn('PWA not installable or prompt not available', 'PWA_INSTALL');
      return false;
    }

    return await this.showInstallPrompt();
  }

  // Handle service worker updates
  handleServiceWorkerUpdate(data) {
    logger.info('Service worker update detected', 'PWA_INSTALL', data);
    
    this.updateAvailable = true;
    this.newServiceWorker = data;
    
    // Notify callbacks about update
    this.notifyUpdateCallbacks('available', {
      version: data.version,
      features: data.features,
      timestamp: Date.now()
    });
    
    // Show update notification after delay
    setTimeout(() => {
      this.showUpdateNotification();
    }, 5000);
  }

  // Show update notification
  showUpdateNotification() {
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('pwa:update-available', {
      detail: {
        version: this.newServiceWorker?.version,
        features: this.newServiceWorker?.features
      }
    }));
  }

  // Apply available update
  async applyUpdate() {
    if (!this.updateAvailable) {
      logger.warn('No update available to apply', 'PWA_INSTALL');
      return false;
    }

    try {
      logger.info('Applying PWA update', 'PWA_INSTALL');
      
      // Get service worker registration
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration && registration.waiting) {
        // Tell the waiting service worker to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Listen for controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          logger.success('PWA updated successfully', 'PWA_INSTALL');
          
          // Notify callbacks
          this.notifyUpdateCallbacks('applied', {
            timestamp: Date.now(),
            version: this.newServiceWorker?.version
          });
          
          // Reload the page to use new version
          window.location.reload();
        }, { once: true });
        
        return true;
      } else {
        // Force update check
        if (registration) {
          await registration.update();
        }
        return false;
      }
      
    } catch (error) {
      logger.error('Failed to apply PWA update', 'PWA_INSTALL', error);
      return false;
    }
  }

  // Start periodic update checks
  startUpdateCheck() {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Check for updates every hour
    setInterval(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      } catch (error) {
        logger.warn('Update check failed', 'PWA_INSTALL', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Check for updates when page becomes visible
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.update();
          }
        } catch (error) {
          logger.warn('Visibility update check failed', 'PWA_INSTALL', error);
        }
      }
    });

    logger.debug('Update check started', 'PWA_INSTALL');
  }

  // Store installation information
  storeInstallationInfo() {
    const installInfo = {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      version: this.newServiceWorker?.version || 'unknown'
    };

    localStorage.setItem('pwa_install_info', JSON.stringify(installInfo));
    logger.debug('Installation info stored', 'PWA_INSTALL', installInfo);
  }

  // Get installation information
  getInstallationInfo() {
    try {
      const stored = localStorage.getItem('pwa_install_info');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.warn('Failed to get installation info', 'PWA_INSTALL', error);
      return null;
    }
  }

  // Register install callback
  onInstall(callback) {
    this.installCallbacks.push(callback);
  }

  // Remove install callback
  removeOnInstall(callback) {
    this.installCallbacks = this.installCallbacks.filter(cb => cb !== callback);
  }

  // Notify install callbacks
  notifyInstallCallbacks(event, data) {
    this.installCallbacks.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        logger.error('Install callback failed', 'PWA_INSTALL', error);
      }
    });
  }

  // Register update callback
  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  // Remove update callback
  removeOnUpdate(callback) {
    this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
  }

  // Notify update callbacks
  notifyUpdateCallbacks(event, data) {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        logger.error('Update callback failed', 'PWA_INSTALL', error);
      }
    });
  }

  // Get PWA capabilities
  getPWACapabilities() {
    return {
      installable: this.isInstallable,
      installed: this.isInstalled,
      updateAvailable: this.updateAvailable,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      notificationSupported: 'Notification' in window,
      pushSupported: 'PushManager' in window,
      backgroundSyncSupported: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      offlineSupported: 'caches' in window,
      shareSupported: 'share' in navigator,
      badgeSupported: 'setAppBadge' in navigator,
      shortcutsSupported: 'getInstalledRelatedApps' in navigator
    };
  }

  // Get installation statistics
  getInstallStats() {
    const installInfo = this.getInstallationInfo();
    
    return {
      isInstalled: this.isInstalled,
      isInstallable: this.isInstallable,
      installDate: installInfo?.timestamp ? new Date(installInfo.timestamp) : null,
      promptShown: this.installPromptShown,
      promptDismissed: this.installPromptDismissed,
      lastPromptTime: this.lastPromptTime ? new Date(this.lastPromptTime) : null,
      updateAvailable: this.updateAvailable,
      capabilities: this.getPWACapabilities()
    };
  }

  // Reset install prompt state (for testing)
  resetInstallPrompt() {
    localStorage.removeItem('pwa_install_dismissed');
    this.installPromptShown = false;
    this.installPromptDismissed = false;
    this.lastPromptTime = null;
    
    logger.debug('Install prompt state reset', 'PWA_INSTALL');
  }
}

// Create singleton instance
const pwaInstallManager = new PWAInstallManager();

export default pwaInstallManager;