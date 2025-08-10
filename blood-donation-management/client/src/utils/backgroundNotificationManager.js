/**
 * Background Notification Manager
 * Handles notification processing when PWA is closed and manages response synchronization
 * Integrates with iOS-specific notification features
 */

import iosNotificationManager from './iosNotificationManager';

class BackgroundNotificationManager {
  constructor() {
    this.serviceWorker = null;
    this.isInitialized = false;
    this.messageChannel = null;
  }

  // Initialize the background notification manager
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Register service worker if not already registered
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        
        this.serviceWorker = registration;
        
        // Set up message channel for communication
        this.setupMessageChannel();
        
        // Listen for service worker messages
        this.setupMessageListener();
        
        this.isInitialized = true;
        console.log('[BGNotificationManager] Initialized successfully');
        
      } else {
        throw new Error('Service Worker not supported');
      }
      
    } catch (error) {
      console.error('[BGNotificationManager] Initialization failed:', error);
      throw error;
    }
  }

  // Set up message channel for communication with service worker
  setupMessageChannel() {
    this.messageChannel = new MessageChannel();
    
    // Listen for responses from service worker
    this.messageChannel.port1.onmessage = (event) => {
      this.handleServiceWorkerMessage(event.data);
    };
  }

  // Set up message listener for service worker communications
  setupMessageListener() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event.data);
    });
  }

  // Handle messages from service worker
  handleServiceWorkerMessage(data) {
    const { type, ...payload } = data;
    
    switch (type) {
      case 'NOTIFICATION_QUEUED':
        console.log('[BGNotificationManager] Notification queued:', payload);
        break;
        
      case 'QUEUE_STATUS':
        console.log('[BGNotificationManager] Queue status:', payload.data);
        break;
        
      case 'RESPONSES_SYNCED':
        console.log('[BGNotificationManager] Responses synced:', payload);
        break;
        
      case 'BADGE_CLEARED':
        console.log('[BGNotificationManager] Badge cleared:', payload);
        break;
        
      case 'BACKGROUND_NOTIFICATION_RESPONSE':
        this.handleBackgroundNotificationResponse(payload);
        break;
        
      default:
        console.log('[BGNotificationManager] Unknown message type:', type);
    }
  }

  // Handle background notification response
  handleBackgroundNotificationResponse(payload) {
    const { id, success, error } = payload;
    
    if (success) {
      console.log(`[BGNotificationManager] Background notification ${id} processed successfully`);
    } else {
      console.error(`[BGNotificationManager] Background notification ${id} failed:`, error);
    }
  }

  // Queue notification for background processing
  async queueBackgroundNotification(notification, priority = 3) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        const { success, id, error } = event.data;
        
        if (success) {
          resolve(id);
        } else {
          reject(new Error(error));
        }
      };

      // Send message to service worker
      navigator.serviceWorker.controller?.postMessage({
        type: 'QUEUE_BACKGROUND_NOTIFICATION',
        data: { notification, priority }
      }, [messageChannel.port2]);
    });
  }

  // Get notification queue status
  async getQueueStatus() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.data);
      };

      navigator.serviceWorker.controller?.postMessage({
        type: 'GET_QUEUE_STATUS'
      }, [messageChannel.port2]);
    });
  }

  // Sync notification responses
  async syncNotificationResponses() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        const { success, error } = event.data;
        
        if (success) {
          resolve();
        } else {
          reject(new Error(error));
        }
      };

      navigator.serviceWorker.controller?.postMessage({
        type: 'SYNC_NOTIFICATION_RESPONSES'
      }, [messageChannel.port2]);
    });
  }

  // Clear notification badge
  async clearNotificationBadge() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };

      navigator.serviceWorker.controller?.postMessage({
        type: 'CLEAR_NOTIFICATION_BADGE'
      }, [messageChannel.port2]);
    });
  }

  // Create emergency blood request notification with iOS integration
  async createEmergencyNotification(bloodRequest) {
    // If on iOS, use iOS-specific critical alert features
    if (iosNotificationManager.isIOS && iosNotificationManager.criticalAlertsSupported) {
      try {
        // Create iOS critical alert directly
        await iosNotificationManager.createCriticalAlert(bloodRequest);
        
        // Also queue for background processing
        const notification = {
          title: `🚨 ${bloodRequest.bloodType} Blood Needed URGENTLY`,
          body: `Emergency at ${bloodRequest.hospital.name} - ${bloodRequest.distance}km away`,
          icon: '/icons/emergency-blood.png',
          image: bloodRequest.hospital.image || '/images/emergency-banner.png',
          type: 'blood_request_critical',
          tag: `emergency-${bloodRequest.id}`,
          data: {
            requestId: bloodRequest.id,
            bloodType: bloodRequest.bloodType,
            hospitalName: bloodRequest.hospital.name,
            hospitalPhone: bloodRequest.hospital.phone,
            distance: bloodRequest.distance,
            urgency: bloodRequest.urgency,
            patientInfo: bloodRequest.patient,
            requiresResponse: true,
            notificationId: `emergency-${bloodRequest.id}-${Date.now()}`,
            iosProcessed: true
          }
        };

        return await this.queueBackgroundNotification(notification, 1);
        
      } catch (error) {
        console.error('[BackgroundNotificationManager] iOS critical alert failed, falling back to regular notification:', error);
      }
    }

    // Regular notification for non-iOS or fallback
    const notification = {
      title: `🚨 ${bloodRequest.bloodType} Blood Needed URGENTLY`,
      body: `Emergency at ${bloodRequest.hospital.name} - ${bloodRequest.distance}km away`,
      icon: '/icons/emergency-blood.png',
      image: bloodRequest.hospital.image || '/images/emergency-banner.png',
      type: 'blood_request_critical',
      tag: `emergency-${bloodRequest.id}`,
      data: {
        requestId: bloodRequest.id,
        bloodType: bloodRequest.bloodType,
        hospitalName: bloodRequest.hospital.name,
        hospitalPhone: bloodRequest.hospital.phone,
        distance: bloodRequest.distance,
        urgency: bloodRequest.urgency,
        patientInfo: bloodRequest.patient,
        requiresResponse: true,
        notificationId: `emergency-${bloodRequest.id}-${Date.now()}`
      }
    };

    // Queue with highest priority (1 = critical)
    return await this.queueBackgroundNotification(notification, 1);
  }

  // Create urgent blood request notification with iOS integration
  async createUrgentNotification(bloodRequest) {
    // If on iOS, use iOS-specific notification features
    if (iosNotificationManager.isIOS) {
      try {
        // Create iOS notification with enhanced features
        await iosNotificationManager.createRegularNotification(bloodRequest);
        
        // Also queue for background processing
        const notification = {
          title: `🩸 ${bloodRequest.bloodType} Blood Needed`,
          body: `Urgent request at ${bloodRequest.hospital.name} - Can you help?`,
          icon: '/icons/blood-request.png',
          type: 'blood_request_urgent',
          tag: `urgent-${bloodRequest.id}`,
          data: {
            requestId: bloodRequest.id,
            bloodType: bloodRequest.bloodType,
            hospitalName: bloodRequest.hospital.name,
            hospitalPhone: bloodRequest.hospital.phone,
            distance: bloodRequest.distance,
            urgency: bloodRequest.urgency,
            requiresResponse: true,
            notificationId: `urgent-${bloodRequest.id}-${Date.now()}`,
            iosProcessed: true
          }
        };

        return await this.queueBackgroundNotification(notification, 2);
        
      } catch (error) {
        console.error('[BackgroundNotificationManager] iOS notification failed, falling back to regular notification:', error);
      }
    }

    // Regular notification for non-iOS or fallback
    const notification = {
      title: `🩸 ${bloodRequest.bloodType} Blood Needed`,
      body: `Urgent request at ${bloodRequest.hospital.name} - Can you help?`,
      icon: '/icons/blood-request.png',
      type: 'blood_request_urgent',
      tag: `urgent-${bloodRequest.id}`,
      data: {
        requestId: bloodRequest.id,
        bloodType: bloodRequest.bloodType,
        hospitalName: bloodRequest.hospital.name,
        hospitalPhone: bloodRequest.hospital.phone,
        distance: bloodRequest.distance,
        urgency: bloodRequest.urgency,
        requiresResponse: true,
        notificationId: `urgent-${bloodRequest.id}-${Date.now()}`
      }
    };

    // Queue with urgent priority (2 = urgent)
    return await this.queueBackgroundNotification(notification, 2);
  }

  // Create donation reminder notification
  async createDonationReminder(reminderData) {
    const notification = {
      title: '💝 Time to Donate Blood',
      body: `You haven't donated in ${reminderData.daysSinceLastDonation} days. Ready to save lives?`,
      icon: '/icons/donation-reminder.png',
      type: 'donation_reminder',
      tag: `reminder-${reminderData.donorId}`,
      data: {
        donorId: reminderData.donorId,
        daysSinceLastDonation: reminderData.daysSinceLastDonation,
        nearbyFacilities: reminderData.nearbyFacilities,
        requiresResponse: false,
        notificationId: `reminder-${reminderData.donorId}-${Date.now()}`
      }
    };

    // Queue with normal priority (3 = normal)
    return await this.queueBackgroundNotification(notification, 3);
  }

  // Create response confirmation notification
  async createResponseConfirmation(responseData) {
    const notification = {
      title: '✅ Response Confirmed',
      body: `Thank you for responding to the ${responseData.bloodType} blood request`,
      icon: '/icons/confirmation.png',
      type: 'response_confirmation',
      tag: `confirmation-${responseData.responseId}`,
      data: {
        responseId: responseData.responseId,
        requestId: responseData.requestId,
        action: responseData.action,
        requiresResponse: false,
        notificationId: `confirmation-${responseData.responseId}-${Date.now()}`
      }
    };

    // Queue with normal priority (3 = normal)
    return await this.queueBackgroundNotification(notification, 3);
  }

  // Handle app visibility change
  handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // App became visible, sync any pending responses
      this.syncNotificationResponses().catch(error => {
        console.error('[BGNotificationManager] Failed to sync responses on visibility change:', error);
      });
    }
  }

  // Handle app focus
  handleAppFocus() {
    // Clear badge when app gains focus
    this.clearNotificationBadge().catch(error => {
      console.error('[BGNotificationManager] Failed to clear badge on focus:', error);
    });
  }

  // Set up event listeners for app state changes
  setupAppStateListeners() {
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    window.addEventListener('focus', () => {
      this.handleAppFocus();
    });
  }

  // Get notification statistics
  async getNotificationStats() {
    try {
      const queueStatus = await this.getQueueStatus();
      
      return {
        queueStatus,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('[BGNotificationManager] Failed to get notification stats:', error);
      return null;
    }
  }
}

// Create singleton instance
const backgroundNotificationManager = new BackgroundNotificationManager();

// Auto-initialize when module loads
backgroundNotificationManager.initialize().catch(error => {
  console.error('[BGNotificationManager] Auto-initialization failed:', error);
});

// Set up app state listeners
backgroundNotificationManager.setupAppStateListeners();

export default backgroundNotificationManager;