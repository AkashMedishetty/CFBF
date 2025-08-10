/**
 * iOS PWA Manager
 * Handles iOS-specific PWA features and optimizations
 */

import logger from './logger';

class IOSPWAManager {
  constructor() {
    this.isIOS = this.detectIOS();
    this.isStandalone = this.detectStandalone();
    this.iosVersion = this.detectIOSVersion();
    
    if (this.isIOS) {
      this.initializeIOSFeatures();
    }
  }

  // Detect if running on iOS
  detectIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  // Detect if running in standalone mode
  detectStandalone() {
    return window.navigator.standalone === true || 
           window.matchMedia('(display-mode: standalone)').matches;
  }

  // Detect iOS version
  detectIOSVersion() {
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      return {
        major: parseInt(match[1]),
        minor: parseInt(match[2]),
        patch: parseInt(match[3]) || 0
      };
    }
    return null;
  }

  // Initialize iOS-specific features
  initializeIOSFeatures() {
    this.setupIOSManifest();
    this.setupIOSMetaTags();
    this.setupIOSStatusBar();
    this.setupIOSViewport();
    this.setupIOSNotifications();
    this.setupIOSSiriShortcuts();
    this.setupIOSSpotlightSearch();
    this.handleIOSEvents();
    this.handlePWALifecycle();
    
    logger.info('iOS PWA features initialized', 'IOS_PWA', {
      version: this.iosVersion,
      standalone: this.isStandalone
    });
  }

  // Setup iOS-specific manifest configuration
  setupIOSManifest() {
    // iOS doesn't fully support web app manifest, so we use meta tags
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      // Add iOS-specific properties to manifest
      fetch(manifestLink.href)
        .then(response => response.json())
        .then(manifest => {
          // Add iOS-specific icons if not present
          if (!manifest.icons.some(icon => icon.sizes === '180x180')) {
            manifest.icons.push({
              src: '/icons/apple-touch-icon-180x180.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any maskable'
            });
          }
          
          // Update manifest with iOS optimizations
          const updatedManifest = {
            ...manifest,
            display: 'standalone',
            orientation: 'portrait-primary',
            theme_color: '#dc2626',
            background_color: '#ffffff'
          };
          
          // Create new manifest blob and update link
          const blob = new Blob([JSON.stringify(updatedManifest)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          manifestLink.href = url;
        })
        .catch(error => {
          logger.warn('Failed to update manifest for iOS', 'IOS_PWA', error);
        });
    }
  }

  // Setup iOS-specific meta tags
  setupIOSMetaTags() {
    const metaTags = [
      // Apple-specific meta tags
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'Call For Blood' },
      
      // Touch icons
      { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon-57x57.png', sizes: '57x57' },
      { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon-60x60.png', sizes: '60x60' },
      { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon-72x72.png', sizes: '72x72' },
      { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon-76x76.png', sizes: '76x76' },
      { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon-114x114.png', sizes: '114x114' },
      { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon-120x120.png', sizes: '120x120' },
      { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon-144x144.png', sizes: '144x144' },
      { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon-152x152.png', sizes: '152x152' },
      { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon-180x180.png', sizes: '180x180' },
      
      // Startup images
      { rel: 'apple-touch-startup-image', href: '/splash/iphone5_splash.png', media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)' },
      { rel: 'apple-touch-startup-image', href: '/splash/iphone6_splash.png', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)' },
      { rel: 'apple-touch-startup-image', href: '/splash/iphoneplus_splash.png', media: '(device-width: 621px) and (device-height: 1104px) and (-webkit-device-pixel-ratio: 3)' },
      { rel: 'apple-touch-startup-image', href: '/splash/iphonex_splash.png', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)' },
      { rel: 'apple-touch-startup-image', href: '/splash/ipad_splash.png', media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)' }
    ];

    metaTags.forEach(tag => {
      let element;
      
      if (tag.name) {
        element = document.querySelector(`meta[name="${tag.name}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.name = tag.name;
          document.head.appendChild(element);
        }
        element.content = tag.content;
      } else if (tag.rel) {
        element = document.querySelector(`link[rel="${tag.rel}"]${tag.sizes ? `[sizes="${tag.sizes}"]` : ''}${tag.media ? `[media="${tag.media}"]` : ''}`);
        if (!element) {
          element = document.createElement('link');
          element.rel = tag.rel;
          if (tag.sizes) element.sizes = tag.sizes;
          if (tag.media) element.media = tag.media;
          document.head.appendChild(element);
        }
        element.href = tag.href;
      }
    });
  }

  // Setup iOS status bar
  setupIOSStatusBar() {
    // Set status bar style based on theme
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const statusBarStyle = isDarkMode ? 'black-translucent' : 'default';
    
    let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBarMeta) {
      statusBarMeta.content = statusBarStyle;
    }

    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const newStyle = e.matches ? 'black-translucent' : 'default';
      if (statusBarMeta) {
        statusBarMeta.content = newStyle;
      }
    });

    // Add safe area CSS variables for iOS
    if (this.isStandalone) {
      document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
      document.documentElement.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right)');
      document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
      document.documentElement.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left)');
    }
  }

  // Setup iOS viewport
  setupIOSViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }

    // iOS-optimized viewport
    const viewportContent = [
      'width=device-width',
      'initial-scale=1.0',
      'maximum-scale=1.0',
      'user-scalable=no',
      'viewport-fit=cover'
    ].join(', ');

    viewport.content = viewportContent;
  }

  // Setup iOS notifications
  setupIOSNotifications() {
    // iOS has limited notification support in PWAs
    // Focus on badge updates and basic notifications
    
    if ('Notification' in window) {
      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          logger.info(`iOS notification permission: ${permission}`, 'IOS_PWA');
        });
      }
    }

    // Setup badge API if available
    if ('setAppBadge' in navigator) {
      this.setupBadgeAPI();
    }
  }

  // Setup badge API
  setupBadgeAPI() {
    // Clear badge on app focus
    window.addEventListener('focus', () => {
      navigator.setAppBadge(0).catch(error => {
        logger.warn('Failed to clear app badge', 'IOS_PWA', error);
      });
    });

    // Set badge for unread notifications
    window.addEventListener('notification-received', (event) => {
      const unreadCount = event.detail?.unreadCount || 1;
      navigator.setAppBadge(unreadCount).catch(error => {
        logger.warn('Failed to set app badge', 'IOS_PWA', error);
      });
    });
  }

  // Setup Siri Shortcuts
  setupIOSSiriShortcuts() {
    // iOS 12+ Siri Shortcuts integration
    if (this.iosVersion && this.iosVersion.major >= 12) {
      // Add shortcuts to manifest
      const shortcuts = [
        {
          name: 'Emergency Request',
          short_name: 'Emergency',
          description: 'Create an emergency blood request',
          url: '/emergency?source=siri',
          icons: [{ src: '/icons/emergency-shortcut.png', sizes: '192x192' }]
        },
        {
          name: 'Find Donors',
          short_name: 'Find Donors',
          description: 'Find nearby blood donors',
          url: '/donors?source=siri',
          icons: [{ src: '/icons/donors-shortcut.png', sizes: '192x192' }]
        },
        {
          name: 'My Profile',
          short_name: 'Profile',
          description: 'View my donor profile',
          url: '/profile?source=siri',
          icons: [{ src: '/icons/profile-shortcut.png', sizes: '192x192' }]
        }
      ];

      // Add shortcuts to document
      shortcuts.forEach(shortcut => {
        const link = document.createElement('link');
        link.rel = 'shortcut';
        link.href = shortcut.url;
        link.setAttribute('data-name', shortcut.name);
        link.setAttribute('data-description', shortcut.description);
        document.head.appendChild(link);
      });

      logger.info('iOS Siri shortcuts configured', 'IOS_PWA', { shortcuts: shortcuts.length });
    }
  }

  // Setup Spotlight Search
  setupIOSSpotlightSearch() {
    // Add structured data for iOS Spotlight search
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      name: 'Call For Blood',
      description: 'Emergency blood donation management system',
      applicationCategory: 'HealthApplication',
      operatingSystem: 'iOS',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1000'
      }
    };

    // Add structured data to page
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Add search keywords meta tag
    const keywordsMeta = document.createElement('meta');
    keywordsMeta.name = 'keywords';
    keywordsMeta.content = 'blood donation, emergency, donors, healthcare, medical, blood bank';
    document.head.appendChild(keywordsMeta);
  }

  // Handle iOS-specific events
  handleIOSEvents() {
    // Handle device orientation changes
    window.addEventListener('orientationchange', () => {
      // Fix viewport issues on orientation change
      setTimeout(() => {
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);
      }, 500);
    });

    // Handle iOS keyboard issues
    if (this.isStandalone) {
      let initialViewportHeight = window.innerHeight;
      
      window.addEventListener('resize', () => {
        // Detect keyboard open/close
        const currentHeight = window.innerHeight;
        const heightDifference = initialViewportHeight - currentHeight;
        
        if (heightDifference > 150) {
          // Keyboard is open
          document.body.classList.add('keyboard-open');
        } else {
          // Keyboard is closed
          document.body.classList.remove('keyboard-open');
        }
      });
    }

    // Handle iOS scroll bounce
    document.addEventListener('touchmove', (e) => {
      if (e.target.closest('.scrollable')) return;
      e.preventDefault();
    }, { passive: false });
  }

  // Add to Home Screen prompt for iOS
  showIOSInstallPrompt() {
    if (this.isIOS && !this.isStandalone) {
      // Create custom install prompt for iOS
      const installPrompt = document.createElement('div');
      installPrompt.className = 'ios-install-prompt';
      installPrompt.innerHTML = `
        <div class="ios-install-content">
          <div class="ios-install-icon">📱</div>
          <h3>Install Call For Blood</h3>
          <p>Add this app to your home screen for quick access to emergency blood requests.</p>
          <div class="ios-install-steps">
            <p>1. Tap the share button <span class="share-icon">⬆️</span></p>
            <p>2. Select "Add to Home Screen"</p>
            <p>3. Tap "Add" to install</p>
          </div>
          <button class="ios-install-close">Got it</button>
        </div>
      `;

      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .ios-install-prompt {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid #e5e7eb;
          padding: 20px;
          z-index: 10000;
          transform: translateY(100%);
          transition: transform 0.3s ease;
        }
        .ios-install-prompt.show {
          transform: translateY(0);
        }
        .ios-install-content {
          text-align: center;
          max-width: 300px;
          margin: 0 auto;
        }
        .ios-install-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .ios-install-steps {
          text-align: left;
          margin: 16px 0;
          font-size: 14px;
        }
        .share-icon {
          font-size: 16px;
        }
        .ios-install-close {
          background: #dc2626;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
      `;
      document.head.appendChild(style);

      // Add to page
      document.body.appendChild(installPrompt);

      // Show prompt
      setTimeout(() => {
        installPrompt.classList.add('show');
      }, 1000);

      // Handle close
      installPrompt.querySelector('.ios-install-close').addEventListener('click', () => {
        installPrompt.remove();
        localStorage.setItem('ios-install-prompt-dismissed', Date.now());
      });

      logger.info('iOS install prompt shown', 'IOS_PWA');
    }
  }

  // Check if install prompt should be shown
  shouldShowInstallPrompt() {
    if (!this.isIOS || this.isStandalone) return false;
    
    const dismissed = localStorage.getItem('ios-install-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      return daysSinceDismissed > 7; // Show again after 7 days
    }
    
    return true;
  }

  // Get iOS-specific capabilities
  getIOSCapabilities() {
    return {
      isIOS: this.isIOS,
      isStandalone: this.isStandalone,
      version: this.iosVersion,
      supportsNotifications: 'Notification' in window,
      supportsBadges: 'setAppBadge' in navigator,
      supportsShortcuts: this.iosVersion && this.iosVersion.major >= 12,
      supportsSpotlight: this.iosVersion && this.iosVersion.major >= 9
    };
  }

  // Handle iOS-specific PWA lifecycle
  handlePWALifecycle() {
    // Track PWA usage
    if (this.isStandalone) {
      // PWA is running in standalone mode
      logger.info('PWA running in standalone mode on iOS', 'IOS_PWA');
      
      // Track app launches
      window.addEventListener('pageshow', (event) => {
        if (!event.persisted) {
          // Fresh app launch
          this.trackAppLaunch();
        }
      });
    }

    // Handle app state changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleAppBackground();
      } else {
        this.handleAppForeground();
      }
    });
  }

  // Track app launch
  trackAppLaunch() {
    const launchData = {
      timestamp: Date.now(),
      standalone: this.isStandalone,
      version: this.iosVersion,
      referrer: document.referrer
    };

    // Store launch data
    const launches = JSON.parse(localStorage.getItem('ios-app-launches') || '[]');
    launches.push(launchData);
    
    // Keep only last 50 launches
    if (launches.length > 50) {
      launches.splice(0, launches.length - 50);
    }
    
    localStorage.setItem('ios-app-launches', JSON.stringify(launches));
    
    logger.info('iOS PWA launch tracked', 'IOS_PWA', launchData);
  }

  // Handle app going to background
  handleAppBackground() {
    logger.debug('iOS PWA went to background', 'IOS_PWA');
    
    // Save app state
    const appState = {
      url: window.location.href,
      timestamp: Date.now(),
      scrollPosition: window.scrollY
    };
    
    sessionStorage.setItem('ios-app-state', JSON.stringify(appState));
  }

  // Handle app coming to foreground
  handleAppForeground() {
    logger.debug('iOS PWA came to foreground', 'IOS_PWA');
    
    // Restore app state if needed
    const savedState = sessionStorage.getItem('ios-app-state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        // Restore scroll position if on same page
        if (state.url === window.location.href) {
          window.scrollTo(0, state.scrollPosition);
        }
      } catch (error) {
        logger.warn('Failed to restore iOS app state', 'IOS_PWA', error);
      }
    }
  }
}

// Create singleton instance
const iosPWAManager = new IOSPWAManager();

export default iosPWAManager;