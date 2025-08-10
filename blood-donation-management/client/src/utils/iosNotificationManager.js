/**
 * iOS Notification Manager
 * Handles iOS-specific notification features including critical alerts, badge management,
 * and Add to Home Screen prompts for emergency blood donation access
 */

class IOSNotificationManager {
  constructor() {
    this.isIOS = this.detectIOS();
    this.isStandalone = this.detectStandalone();
    this.badgeCount = 0;
    this.criticalAlertsSupported = false;
    this.initialized = false;
  }

  // Detect if device is iOS
  detectIOS() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSUserAgent = /iphone|ipad|ipod/.test(userAgent);
    
    // Check for iPad on iOS 13+ which reports as Mac
    const isMacWithTouchPoints = navigator.userAgentData ? 
      navigator.userAgentData.platform === 'macOS' && navigator.maxTouchPoints > 1 :
      navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1;
    
    return isIOSUserAgent || isMacWithTouchPoints;
  }

  // Detect if PWA is running in standalone mode
  detectStandalone() {
    return window.navigator.standalone === true || 
           window.matchMedia('(display-mode: standalone)').matches;
  }

  // Initialize iOS-specific notification features
  async initialize() {
    if (this.initialized || !this.isIOS) return;

    try {
      console.log('[IOSNotificationManager] Initializing iOS-specific features');

      // Set up iOS-specific meta tags
      this.setupIOSMetaTags();

      // Check for critical alert support
      await this.checkCriticalAlertSupport();

      // Set up iOS notification permissions
      await this.setupIOSNotificationPermissions();

      // Set up Add to Home Screen prompt
      this.setupAddToHomeScreenPrompt();

      // Set up iOS-specific event listeners
      this.setupIOSEventListeners();

      // Initialize badge management
      await this.initializeBadgeManagement();

      this.initialized = true;
      console.log('[IOSNotificationManager] iOS features initialized successfully');

    } catch (error) {
      console.error('[IOSNotificationManager] Initialization failed:', error);
      throw error;
    }
  }

  // Set up iOS-specific meta tags
  setupIOSMetaTags() {
    const metaTags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'Call For Blood' },
      { name: 'apple-touch-icon', content: '/apple-touch-icon.png' },
      { name: 'apple-touch-startup-image', content: '/apple-splash-screen.png' }
    ];

    metaTags.forEach(tag => {
      let existingTag = document.querySelector(`meta[name="${tag.name}"]`);
      
      if (!existingTag) {
        existingTag = document.createElement('meta');
        existingTag.name = tag.name;
        document.head.appendChild(existingTag);
      }
      
      existingTag.content = tag.content;
    });

    console.log('[IOSNotificationManager] iOS meta tags configured');
  }

  // Check if critical alerts are supported
  async checkCriticalAlertSupport() {
    try {
      // Critical alerts require iOS 12+ and specific permission
      const permission = await Notification.requestPermission();
      
      // Check if we can request critical alert permission
      if ('Notification' in window && 'requestPermission' in Notification) {
        // Try to detect critical alert support (iOS 12+)
        const userAgent = navigator.userAgent;
        const iosVersion = userAgent.match(/OS (\d+)_/);
        
        if (iosVersion && parseInt(iosVersion[1]) >= 12) {
          this.criticalAlertsSupported = true;
          console.log('[IOSNotificationManager] Critical alerts supported');
        }
      }
      
    } catch (error) {
      console.log('[IOSNotificationManager] Critical alerts not supported:', error);
      this.criticalAlertsSupported = false;
    }
  }

  // Set up iOS notification permissions with critical alerts
  async setupIOSNotificationPermissions() {
    try {
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported');
      }

      let notificationPermission = Notification.permission;

      if (notificationPermission === 'default') {
        // Request notification permission
        notificationPermission = await Notification.requestPermission();
      }

      if (notificationPermission === 'granted') {
        console.log('[IOSNotificationManager] Notification permission granted');
        
        // Try to register for critical alerts if supported
        if (this.criticalAlertsSupported) {
          await this.requestCriticalAlertPermission();
        }
        
        return true;
      } else {
        console.log('[IOSNotificationManager] Notification permission denied');
        return false;
      }

    } catch (error) {
      console.error('[IOSNotificationManager] Failed to setup notification permissions:', error);
      return false;
    }
  }

  // Request critical alert permission (iOS-specific)
  async requestCriticalAlertPermission() {
    try {
      // This would typically require server-side integration with Apple Push Notification service
      // For now, we'll prepare the client-side handling
      console.log('[IOSNotificationManager] Critical alert permission requested');
      
      // Store that critical alerts are available
      localStorage.setItem('ios_critical_alerts_available', 'true');
      
    } catch (error) {
      console.error('[IOSNotificationManager] Failed to request critical alert permission:', error);
    }
  }

  // Create iOS critical alert notification
  async createCriticalAlert(bloodRequest) {
    if (!this.isIOS || !this.criticalAlertsSupported) {
      console.log('[IOSNotificationManager] Critical alerts not supported, falling back to regular notification');
      return this.createRegularNotification(bloodRequest);
    }

    try {
      const notification = new Notification(`🚨 CRITICAL: ${bloodRequest.bloodType} Blood Needed NOW`, {
        body: `Life-threatening emergency at ${bloodRequest.hospital.name}\nPatient needs ${bloodRequest.bloodType} blood immediately`,
        icon: '/icons/emergency-critical.png',
        badge: '/icons/badge-critical.png',
        tag: `critical-${bloodRequest.id}`,
        requireInteraction: true,
        silent: false,
        vibrate: [300, 100, 300, 100, 300, 100, 300],
        data: {
          requestId: bloodRequest.id,
          type: 'critical_emergency',
          bloodType: bloodRequest.bloodType,
          hospital: bloodRequest.hospital,
          patient: bloodRequest.patient,
          isCritical: true,
          bypassDND: true,
          iosSpecific: true
        },
        actions: [
          {
            action: 'accept_critical',
            title: '🚨 Accept Emergency',
            icon: '/icons/accept-critical.png'
          },
          {
            action: 'call_hospital',
            title: '📞 Call Hospital',
            icon: '/icons/call.png'
          },
          {
            action: 'share_emergency',
            title: '📤 Share Emergency',
            icon: '/icons/share.png'
          }
        ]
      });

      // Handle notification click
      notification.onclick = () => {
        this.handleCriticalNotificationClick(bloodRequest);
      };

      // Update badge count
      await this.updateBadgeCount(1);

      // Trigger iOS haptic feedback
      this.triggerHapticFeedback('heavy');

      console.log('[IOSNotificationManager] Critical alert created');
      return notification;

    } catch (error) {
      console.error('[IOSNotificationManager] Failed to create critical alert:', error);
      return this.createRegularNotification(bloodRequest);
    }
  }

  // Create regular iOS notification with enhanced features
  async createRegularNotification(bloodRequest) {
    try {
      const isEmergency = bloodRequest.urgency === 'critical' || bloodRequest.urgency === 'urgent';
      
      const notification = new Notification(
        `🩸 ${bloodRequest.bloodType} Blood ${isEmergency ? 'URGENTLY' : ''} Needed`,
        {
          body: `${isEmergency ? 'Emergency' : 'Request'} at ${bloodRequest.hospital.name}\n${bloodRequest.distance}km away`,
          icon: isEmergency ? '/icons/emergency-blood.png' : '/icons/blood-request.png',
          badge: '/icons/badge.png',
          tag: `${bloodRequest.urgency}-${bloodRequest.id}`,
          requireInteraction: isEmergency,
          silent: false,
          vibrate: isEmergency ? [200, 100, 200, 100, 200] : [100, 50, 100],
          data: {
            requestId: bloodRequest.id,
            type: `blood_request_${bloodRequest.urgency}`,
            bloodType: bloodRequest.bloodType,
            hospital: bloodRequest.hospital,
            patient: bloodRequest.patient,
            isEmergency: isEmergency,
            iosSpecific: true
          },
          actions: [
            {
              action: 'accept',
              title: isEmergency ? '🚨 Accept Emergency' : '✅ Accept',
              icon: '/icons/accept.png'
            },
            {
              action: 'decline',
              title: '❌ Cannot Help',
              icon: '/icons/decline.png'
            },
            {
              action: 'view_details',
              title: '👁 View Details',
              icon: '/icons/view.png'
            },
            {
              action: 'call_hospital',
              title: '📞 Call Hospital',
              icon: '/icons/call.png'
            }
          ]
        }
      );

      // Handle notification click
      notification.onclick = () => {
        this.handleNotificationClick(bloodRequest);
      };

      // Update badge count
      await this.updateBadgeCount(1);

      // Trigger appropriate haptic feedback
      this.triggerHapticFeedback(isEmergency ? 'heavy' : 'medium');

      console.log('[IOSNotificationManager] Regular notification created');
      return notification;

    } catch (error) {
      console.error('[IOSNotificationManager] Failed to create regular notification:', error);
      throw error;
    }
  }

  // Handle critical notification click with deep linking
  handleCriticalNotificationClick(bloodRequest) {
    // Clear the notification badge
    this.updateBadgeCount(-1);

    // Deep link to emergency request page
    const emergencyUrl = `/emergency/${bloodRequest.id}?source=critical_notification&action=respond`;
    
    if (this.isStandalone) {
      // PWA is running, navigate within app
      window.location.href = emergencyUrl;
    } else {
      // Open PWA or browser
      window.open(emergencyUrl, '_blank');
    }

    // Trigger haptic feedback
    this.triggerHapticFeedback('heavy');

    console.log('[IOSNotificationManager] Critical notification clicked, navigating to:', emergencyUrl);
  }

  // Handle regular notification click with deep linking
  handleNotificationClick(bloodRequest) {
    // Clear the notification badge
    this.updateBadgeCount(-1);

    // Deep link to request details page
    const requestUrl = `/requests/${bloodRequest.id}?source=notification&action=view`;
    
    if (this.isStandalone) {
      // PWA is running, navigate within app
      window.location.href = requestUrl;
    } else {
      // Open PWA or browser
      window.open(requestUrl, '_blank');
    }

    // Trigger haptic feedback
    this.triggerHapticFeedback('medium');

    console.log('[IOSNotificationManager] Notification clicked, navigating to:', requestUrl);
  }

  // Trigger iOS haptic feedback
  triggerHapticFeedback(intensity = 'medium') {
    if (!this.isIOS) return;

    try {
      // Use iOS haptic feedback if available
      if ('vibrate' in navigator) {
        const patterns = {
          light: [50],
          medium: [100],
          heavy: [200],
          emergency: [300, 100, 300, 100, 300]
        };

        navigator.vibrate(patterns[intensity] || patterns.medium);
      }

      // Try to use iOS-specific haptic feedback API if available
      if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
        // This would require additional iOS-specific implementation
        console.log(`[IOSNotificationManager] Haptic feedback triggered: ${intensity}`);
      }

    } catch (error) {
      console.log('[IOSNotificationManager] Haptic feedback not available:', error);
    }
  }

  // Initialize badge management for iOS
  async initializeBadgeManagement() {
    try {
      // Get current badge count from storage
      const storedCount = localStorage.getItem('ios_badge_count');
      this.badgeCount = storedCount ? parseInt(storedCount) : 0;

      // Set initial badge if needed
      if (this.badgeCount > 0) {
        await this.setBadge(this.badgeCount);
      }

      console.log('[IOSNotificationManager] Badge management initialized, count:', this.badgeCount);

    } catch (error) {
      console.error('[IOSNotificationManager] Failed to initialize badge management:', error);
    }
  }

  // Update badge count
  async updateBadgeCount(increment) {
    try {
      this.badgeCount = Math.max(0, this.badgeCount + increment);
      
      // Store in localStorage
      localStorage.setItem('ios_badge_count', this.badgeCount.toString());

      // Update the actual badge
      await this.setBadge(this.badgeCount);

      console.log('[IOSNotificationManager] Badge count updated:', this.badgeCount);

    } catch (error) {
      console.error('[IOSNotificationManager] Failed to update badge count:', error);
    }
  }

  // Set badge count
  async setBadge(count) {
    try {
      // Use service worker badge API if available
      if ('serviceWorker' in navigator && 'setAppBadge' in navigator.serviceWorker) {
        const registration = await navigator.serviceWorker.ready;
        
        if (count > 0) {
          await registration.setAppBadge(count);
        } else {
          await registration.clearAppBadge();
        }
      }

      // Fallback: Update document title for iOS
      if (this.isIOS) {
        const originalTitle = 'Call For Blood';
        document.title = count > 0 ? `(${count}) ${originalTitle}` : originalTitle;
      }

    } catch (error) {
      console.error('[IOSNotificationManager] Failed to set badge:', error);
    }
  }

  // Clear badge
  async clearBadge() {
    await this.updateBadgeCount(-this.badgeCount);
  }

  // Set up Add to Home Screen prompt
  setupAddToHomeScreenPrompt() {
    if (!this.isIOS || this.isStandalone) return;

    // Check if user has already been prompted
    const hasBeenPrompted = localStorage.getItem('ios_a2hs_prompted');
    const lastPromptTime = localStorage.getItem('ios_a2hs_last_prompt');
    
    // Don't prompt more than once per week
    if (hasBeenPrompted && lastPromptTime) {
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (parseInt(lastPromptTime) > weekAgo) {
        return;
      }
    }

    // Show prompt after a delay
    setTimeout(() => {
      this.showAddToHomeScreenPrompt();
    }, 10000); // Show after 10 seconds
  }

  // Show Add to Home Screen prompt
  showAddToHomeScreenPrompt() {
    const promptHtml = `
      <div id="ios-a2hs-prompt" style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: #007AFF;
        color: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: slideUp 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <div style="font-size: 24px; margin-right: 12px;">🩸</div>
          <div>
            <div style="font-weight: 600; font-size: 16px;">Add to Home Screen</div>
            <div style="font-size: 14px; opacity: 0.9;">Get instant access to emergency blood requests</div>
          </div>
        </div>
        <div style="font-size: 14px; margin-bottom: 16px; opacity: 0.9;">
          Tap <strong>Share</strong> <span style="font-size: 18px;">⬆️</span> then <strong>"Add to Home Screen"</strong> for quick emergency access
        </div>
        <div style="display: flex; gap: 12px;">
          <button onclick="document.getElementById('ios-a2hs-prompt').remove(); localStorage.setItem('ios_a2hs_prompted', 'true'); localStorage.setItem('ios_a2hs_last_prompt', Date.now());" 
                  style="flex: 1; background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 16px; border-radius: 8px; font-size: 14px;">
            Maybe Later
          </button>
          <button onclick="document.getElementById('ios-a2hs-prompt').remove(); localStorage.setItem('ios_a2hs_prompted', 'true'); localStorage.setItem('ios_a2hs_last_prompt', Date.now());" 
                  style="flex: 1; background: white; border: none; color: #007AFF; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Got It
          </button>
        </div>
      </div>
      <style>
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      </style>
    `;

    document.body.insertAdjacentHTML('beforeend', promptHtml);

    // Auto-hide after 15 seconds
    setTimeout(() => {
      const prompt = document.getElementById('ios-a2hs-prompt');
      if (prompt) {
        prompt.remove();
        localStorage.setItem('ios_a2hs_prompted', 'true');
        localStorage.setItem('ios_a2hs_last_prompt', Date.now().toString());
      }
    }, 15000);

    console.log('[IOSNotificationManager] Add to Home Screen prompt shown');
  }

  // Set up iOS-specific event listeners
  setupIOSEventListeners() {
    // Handle app state changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // App became visible, clear badge
        this.clearBadge();
      }
    });

    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      // Adjust UI for orientation change if needed
      setTimeout(() => {
        console.log('[IOSNotificationManager] Orientation changed');
      }, 100);
    });

    // Handle iOS-specific touch events
    if (this.isIOS) {
      document.addEventListener('touchstart', () => {
        // Enable iOS momentum scrolling
        document.body.style.webkitOverflowScrolling = 'touch';
      }, { passive: true });
    }
  }

  // Create emergency shortcut for iOS
  createEmergencyShortcut() {
    if (!this.isIOS) return;

    // This would be handled by the manifest.json shortcuts
    // But we can also create dynamic shortcuts
    const shortcut = {
      name: 'Emergency Blood Request',
      short_name: 'Emergency',
      description: 'Quick access to emergency blood requests',
      url: '/emergency?source=shortcut',
      icons: [
        {
          src: '/icons/emergency-shortcut.png',
          sizes: '192x192',
          type: 'image/png'
        }
      ]
    };

    console.log('[IOSNotificationManager] Emergency shortcut configured:', shortcut);
  }

  // Get iOS notification statistics
  getIOSStats() {
    return {
      isIOS: this.isIOS,
      isStandalone: this.isStandalone,
      criticalAlertsSupported: this.criticalAlertsSupported,
      badgeCount: this.badgeCount,
      initialized: this.initialized,
      notificationPermission: Notification.permission,
      hasBeenPromptedA2HS: localStorage.getItem('ios_a2hs_prompted') === 'true'
    };
  }
}

// Create singleton instance
const iosNotificationManager = new IOSNotificationManager();

// Auto-initialize if on iOS
if (iosNotificationManager.isIOS) {
  iosNotificationManager.initialize().catch(error => {
    console.error('[IOSNotificationManager] Auto-initialization failed:', error);
  });
}

export default iosNotificationManager;