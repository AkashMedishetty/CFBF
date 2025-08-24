import logger from './logger';
import offlineQueueManager from './offlineQueueManager';

class NotificationResponseProcessor {
  constructor() {
    this.responseHandlers = {
      'accept': this.handleAcceptResponse.bind(this),
      'decline': this.handleDeclineResponse.bind(this),
      'view_details': this.handleViewDetailsResponse.bind(this),
      'call_hospital': this.handleCallHospitalResponse.bind(this),
      'share': this.handleShareResponse.bind(this),
      'schedule': this.handleScheduleResponse.bind(this),
      'find_requests': this.handleFindRequestsResponse.bind(this),
      'remind_later': this.handleRemindLaterResponse.bind(this)
    };

    this.responseQueue = [];
    this.isProcessing = false;
    this.retryAttempts = new Map();

    // Response tracking metrics
    this.responseMetrics = {
      total: 0,
      successful: 0,
      failed: 0,
      pending: 0,
      retries: 0
    };

    // Configuration
    this.config = {
      maxRetries: 3,
      retryDelay: 2000, // 2 seconds
      batchSize: 5,
      processingTimeout: 30000, // 30 seconds
      offlineQueueEnabled: true
    };

    logger.info('NotificationResponseProcessor initialized', 'NOTIFICATION_RESPONSE');
  }

  // Process notification action response
  async processResponse(action, notificationData, event) {
    try {
      logger.info('Processing notification response', 'NOTIFICATION_RESPONSE', {
        action,
        type: notificationData.type,
        timestamp: Date.now()
      });

      // Add to response queue
      const response = {
        id: this.generateResponseId(),
        action,
        notificationData,
        event,
        timestamp: Date.now(),
        processed: false
      };

      this.responseQueue.push(response);

      // Process queue
      await this.processResponseQueue();

      return response.id;

    } catch (error) {
      logger.error('Failed to process notification response', 'NOTIFICATION_RESPONSE', error);
      throw error;
    }
  }

  // Process response queue
  async processResponseQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.responseQueue.length > 0) {
        const response = this.responseQueue.shift();

        try {
          await this.processIndividualResponse(response);
          response.processed = true;
        } catch (error) {
          logger.error('Failed to process individual response', 'NOTIFICATION_RESPONSE', error);

          // Add back to queue for retry if it's a critical response
          if (this.isCriticalResponse(response)) {
            response.retryCount = (response.retryCount || 0) + 1;
            if (response.retryCount < 3) {
              this.responseQueue.push(response);
            }
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual response
  async processIndividualResponse(response) {
    const { action, notificationData, event } = response;

    const handler = this.responseHandlers[action];
    if (!handler) {
      logger.warn(`No handler found for action: ${action}`, 'NOTIFICATION_RESPONSE');
      return;
    }

    // Create response context with timing and event information
    const responseContext = {
      notificationTimestamp: notificationData.timestamp,
      responseTimestamp: response.timestamp,
      responseTime: response.timestamp - (notificationData.timestamp || response.timestamp),
      event,
      responseId: response.id
    };

    await handler(notificationData, responseContext);
  }

  // Handle accept response
  async handleAcceptResponse(notificationData, responseContext) {
    try {
      logger.info('Processing accept response', 'NOTIFICATION_RESPONSE', {
        requestId: notificationData.requestId,
        urgency: notificationData.urgency
      });

      this.responseMetrics.total++;
      this.responseMetrics.pending++;

      const responseData = {
        requestId: notificationData.requestId,
        response: 'accept',
        timestamp: Date.now(),
        source: 'notification',
        urgency: notificationData.urgency,
        location: await this.getCurrentLocation(),
        estimatedArrival: this.calculateEstimatedArrival(notificationData.location),
        donorId: await this.getDonorId(),
        responseContext: {
          notificationType: notificationData.type,
          actionTaken: 'accept',
          responseTime: Date.now() - (responseContext.notificationTimestamp || Date.now())
        }
      };

      // Try to send immediately
      if (navigator.onLine) {
        try {
          await this.sendResponseToServer(responseData);

          this.responseMetrics.successful++;
          this.responseMetrics.pending--;

          // Show confirmation
          await this.showResponseConfirmation('accept', notificationData);

          // Open app to dashboard with context
          const dashboardUrl = `/donor/dashboard?action=accept&requestId=${notificationData.requestId}&urgency=${notificationData.urgency}`;
          await this.openApp(dashboardUrl);

          // Track successful response
          await this.trackResponseSuccess('accept', notificationData);

        } catch (error) {
          logger.warn('Failed to send response immediately, queuing for offline sync', 'NOTIFICATION_RESPONSE', error);
          await this.handleOfflineResponse(responseData, 'accept');
        }
      } else {
        await this.handleOfflineResponse(responseData, 'accept');
      }

    } catch (error) {
      this.responseMetrics.failed++;
      this.responseMetrics.pending--;
      logger.error('Failed to handle accept response', 'NOTIFICATION_RESPONSE', error);
      throw error;
    }
  }

  // Handle decline response
  async handleDeclineResponse(notificationData, responseContext) {
    try {
      logger.info('Processing decline response', 'NOTIFICATION_RESPONSE', {
        requestId: notificationData.requestId,
        urgency: notificationData.urgency
      });

      this.responseMetrics.total++;

      const responseData = {
        requestId: notificationData.requestId,
        response: 'decline',
        timestamp: Date.now(),
        source: 'notification',
        urgency: notificationData.urgency,
        reason: 'user_declined',
        donorId: await this.getDonorId(),
        responseContext: {
          notificationType: notificationData.type,
          actionTaken: 'decline',
          responseTime: Date.now() - (responseContext.notificationTimestamp || Date.now())
        }
      };

      // Try to send immediately
      if (navigator.onLine) {
        try {
          await this.sendResponseToServer(responseData);
          this.responseMetrics.successful++;

          // Show brief confirmation
          await this.showResponseConfirmation('decline', notificationData);

          // Track response
          await this.trackResponseSuccess('decline', notificationData);

        } catch (error) {
          logger.warn('Failed to send decline response immediately, queuing for offline sync', 'NOTIFICATION_RESPONSE', error);
          await this.handleOfflineResponse(responseData, 'decline');
        }
      } else {
        await this.handleOfflineResponse(responseData, 'decline');
      }

      // Don't open app for decline responses - just log the interaction

    } catch (error) {
      this.responseMetrics.failed++;
      logger.error('Failed to handle decline response', 'NOTIFICATION_RESPONSE', error);
      throw error;
    }
  }

  // Handle view details response
  async handleViewDetailsResponse(notificationData, responseContext) {
    try {
      logger.info('Processing view details response', 'NOTIFICATION_RESPONSE', {
        requestId: notificationData.requestId,
        urgency: notificationData.urgency
      });

      // Track interaction
      await this.trackInteraction('view_details', notificationData, responseContext);

      // Open app to details page with context
      const detailsUrl = notificationData.detailsUrl || `/emergency/${notificationData.requestId}?source=notification&urgency=${notificationData.urgency}`;
      await this.openApp(detailsUrl);

      // Track successful interaction
      await this.trackResponseSuccess('view_details', notificationData);

    } catch (error) {
      logger.error('Failed to handle view details response', 'NOTIFICATION_RESPONSE', error);
      throw error;
    }
  }

  // Handle call hospital response
  async handleCallHospitalResponse(notificationData, responseContext) {
    try {
      const hospitalPhone = notificationData.hospitalPhone || notificationData.hospitalInfo?.phone;

      logger.info('Processing call hospital response', 'NOTIFICATION_RESPONSE', {
        requestId: notificationData.requestId,
        hasPhone: !!hospitalPhone
      });

      if (!hospitalPhone) {
        logger.warn('Hospital phone number not available', 'NOTIFICATION_RESPONSE');
        await this.showErrorNotification('Hospital contact information not available');
        return;
      }

      // Track interaction
      await this.trackInteraction('call_hospital', notificationData, responseContext);

      // Open phone dialer
      const phoneUrl = `tel:${hospitalPhone}`;
      await this.openApp(phoneUrl);

      // Track successful interaction
      await this.trackResponseSuccess('call_hospital', notificationData);

    } catch (error) {
      logger.error('Failed to handle call hospital response', 'NOTIFICATION_RESPONSE', error);
      throw error;
    }
  }

  // Handle share response
  async handleShareResponse(notificationData, responseContext) {
    try {
      logger.info('Processing share response', 'NOTIFICATION_RESPONSE', {
        requestId: notificationData.requestId,
        urgency: notificationData.urgency
      });

      // Track interaction
      await this.trackInteraction('share', notificationData, responseContext);

      // Prepare enhanced share data
      const urgencyText = {
        critical: 'CRITICAL',
  urgent: 'URGENT',
  high: 'HIGH PRIORITY',
  normal: 'Blood Needed'
      };

      const shareData = {
        title: `${urgencyText[notificationData.urgency] || urgencyText.normal}: ${notificationData.bloodType} Blood Needed`,
        text: `Emergency blood request at ${notificationData.hospitalInfo?.name || 'local hospital'}. Help save a life! Every donation matters.`,
        url: `${self.location?.origin || window.location?.origin || ''}/emergency/${notificationData.requestId}?source=share&urgency=${notificationData.urgency}`
      };

      // Try native sharing first
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          await this.trackResponseSuccess('share', notificationData);
          logger.success('Content shared successfully via native share', 'NOTIFICATION_RESPONSE');
        } catch (shareError) {
          if (shareError.name !== 'AbortError') {
            logger.warn('Native share failed, falling back to share page', 'NOTIFICATION_RESPONSE', shareError);
            await this.openShareFallback(notificationData, shareData);
          }
        }
      } else {
        // Fallback to opening share page
        await this.openShareFallback(notificationData, shareData);
      }

    } catch (error) {
      logger.error('Failed to handle share response', 'NOTIFICATION_RESPONSE', error);
      throw error;
    }
  }

  // Handle schedule response (for donation reminders)
  async handleScheduleResponse(notificationData, responseContext) {
    try {
      logger.info('Processing schedule response', 'NOTIFICATION_RESPONSE', {
        donorName: notificationData.donorName
      });

      // Track interaction
      await this.trackInteraction('schedule', notificationData, responseContext);

      // Open app to scheduling page with context
      await this.openApp('/donor/schedule?source=notification&action=schedule');

      // Track successful interaction
      await this.trackResponseSuccess('schedule', notificationData);

    } catch (error) {
      logger.error('Failed to handle schedule response', 'NOTIFICATION_RESPONSE', error);
      throw error;
    }
  }

  // Handle find requests response
  async handleFindRequestsResponse(notificationData, responseContext) {
    try {
      logger.info('Processing find requests response', 'NOTIFICATION_RESPONSE', {
        nearbyRequests: notificationData.nearbyRequests
      });

      // Track interaction
      await this.trackInteraction('find_requests', notificationData, responseContext);

      // Open app to requests page with context
      await this.openApp('/donor/dashboard?tab=requests&source=notification&action=find_requests');

      // Track successful interaction
      await this.trackResponseSuccess('find_requests', notificationData);

    } catch (error) {
      logger.error('Failed to handle find requests response', 'NOTIFICATION_RESPONSE', error);
      throw error;
    }
  }

  // Handle remind later response
  async handleRemindLaterResponse(notificationData, responseContext) {
    try {
      logger.info('Processing remind later response', 'NOTIFICATION_RESPONSE', {
        donorName: notificationData.donorName
      });

      // Track interaction
      await this.trackInteraction('remind_later', notificationData, responseContext);

      // Schedule reminder for later (e.g., 1 week)
      await this.scheduleReminder(notificationData, 7 * 24 * 60 * 60 * 1000); // 1 week

      // Show confirmation
      await this.showResponseConfirmation('remind_later', notificationData);

      // Track successful interaction
      await this.trackResponseSuccess('remind_later', notificationData);

    } catch (error) {
      logger.error('Failed to handle remind later response', 'NOTIFICATION_RESPONSE', error);
      throw error;
    }
  }

  // Send response to server
  async sendResponseToServer(responseData) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch('/api/v1/blood-requests/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(responseData)
      });

      if (!response.ok) {
        throw new Error(`Server response: ${response.status}`);
      }

      const result = await response.json();
      logger.success('Response sent to server', 'NOTIFICATION_RESPONSE', {
        requestId: responseData.requestId,
        response: responseData.response
      });

      return result;

    } catch (error) {
      logger.error('Failed to send response to server', 'NOTIFICATION_RESPONSE', error);
      throw error;
    }
  }

  // Get authentication token
  async getAuthToken() {
    // Try to get from service worker first
    try {
      const clients = await self.clients.matchAll();
      for (const client of clients) {
        const response = await new Promise((resolve) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => resolve(event.data);
          client.postMessage({ type: 'GET_TOKEN' }, [channel.port2]);
          setTimeout(() => resolve(null), 1000);
        });

        if (response && response.token) {
          return response.token;
        }
      }
    } catch (error) {
      logger.warn('Failed to get token from clients', 'NOTIFICATION_RESPONSE', error);
    }

    // Fallback to localStorage (if available)
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('token');
    }

    throw new Error('No authentication token available');
  }

  // Get current location
  async getCurrentLocation() {
    try {
      if (!navigator.geolocation) {
        return null;
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: Date.now()
            });
          },
          (error) => {
            logger.warn('Failed to get current location', 'NOTIFICATION_RESPONSE', error);
            resolve(null); // Always resolve to avoid hanging promises
          },
          {
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
            enableHighAccuracy: false
          }
        );
      });
    } catch (error) {
      logger.warn('Geolocation error', 'NOTIFICATION_RESPONSE', error);
      return null;
    }
  }

  // Calculate estimated arrival time
  calculateEstimatedArrival(hospitalLocation) {
    if (!hospitalLocation || !hospitalLocation.distance) {
      return null;
    }

    // Simple estimation: assume 30 km/h average speed in city
    const averageSpeed = 30; // km/h
    const travelTimeHours = hospitalLocation.distance / averageSpeed;
    const travelTimeMinutes = Math.ceil(travelTimeHours * 60);

    return {
      estimatedMinutes: travelTimeMinutes,
      estimatedArrival: Date.now() + (travelTimeMinutes * 60 * 1000)
    };
  }

  // Show response confirmation
  async showResponseConfirmation(action, notificationData) {
    try {
      const messages = {
        accept: 'Thank you! Your response has been recorded. Opening dashboard...',
        decline: '📝 Response recorded. Thank you for letting us know.'
      };

      const message = messages[action] || 'Response recorded.';

      // Show confirmation notification
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('Response Confirmed', {
          body: message,
          icon: '/logo192.png',
          badge: '/badge-success.png',
          tag: 'response-confirmation',
          requireInteraction: false,
          vibrate: [100],
          actions: []
        });
      }
    } catch (error) {
      logger.warn('Failed to show response confirmation', 'NOTIFICATION_RESPONSE', error);
    }
  }

  // Show offline confirmation
  async showOfflineConfirmation(action) {
    try {
      const messages = {
        accept: 'Your acceptance has been saved offline. Will sync when connection is restored.',
    decline: 'Your response has been saved offline. Will sync when connection is restored.',
    default: 'Response saved offline. Will sync when connection is restored.'
      };

      const message = messages[action] || messages.default;
      const title = action === 'accept' ? 'Acceptance Saved' : 'Response Saved';

      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body: message,
          icon: '/logo192.png',
          badge: '/badge-offline.png',
          tag: `offline-confirmation-${action}`,
          requireInteraction: false,
          vibrate: [100, 50, 100],
          actions: []
        });
      }
    } catch (error) {
      logger.warn('Failed to show offline confirmation', 'NOTIFICATION_RESPONSE', error);
    }
  }

  // Open app or URL
  async openApp(url) {
    try {
      if ('serviceWorker' in navigator) {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

        // Try to focus existing window
        for (const client of clients) {
          if (client.url.startsWith(self.location.origin)) {
            await client.focus();
            client.postMessage({ type: 'NAVIGATE', url: url });
            return;
          }
        }
      }

      // Open new window
      if (self.clients && self.clients.openWindow) {
        await self.clients.openWindow(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      logger.error('Failed to open app', 'NOTIFICATION_RESPONSE', error);
    }
  }

  // Track interaction for analytics
  async trackInteraction(action, notificationData, responseContext = {}) {
    try {
      const interactionData = {
        action,
        notificationType: notificationData.type,
        requestId: notificationData.requestId,
        urgency: notificationData.urgency,
        bloodType: notificationData.bloodType,
        timestamp: Date.now(),
        source: 'notification_action',
        donorId: await this.getDonorId(),
        responseTime: responseContext.responseTime || 0,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          online: navigator.onLine
        }
      };

      // Queue for offline sync
      await offlineQueueManager.queueAction({
        type: 'interaction_tracking',
        data: interactionData,
        priority: 'low'
      });

      logger.debug('Interaction tracked', 'NOTIFICATION_RESPONSE', {
        action,
        requestId: notificationData.requestId
      });

    } catch (error) {
      logger.warn('Failed to track interaction', 'NOTIFICATION_RESPONSE', error);
    }
  }

  // Schedule reminder notification
  async scheduleReminder(notificationData, delayMs) {
    try {
      // In a real implementation, this would use a scheduling service
      // For now, we'll store it locally and check periodically
      const reminder = {
        id: this.generateResponseId(),
        notificationData: {
          donorName: notificationData.donorName,
          type: notificationData.type,
          timestamp: Date.now()
        },
        scheduledFor: Date.now() + delayMs,
        type: 'scheduled_reminder'
      };

      const reminders = JSON.parse(localStorage.getItem('scheduled_reminders') || '[]');
      reminders.push(reminder);
      localStorage.setItem('scheduled_reminders', JSON.stringify(reminders));

      logger.info('Reminder scheduled', 'NOTIFICATION_RESPONSE', {
        scheduledFor: new Date(reminder.scheduledFor).toISOString(),
        donorName: notificationData.donorName
      });

    } catch (error) {
      logger.error('Failed to schedule reminder', 'NOTIFICATION_RESPONSE', error);
    }
  }

  // Check if response is critical
  isCriticalResponse(response) {
    return response.action === 'accept' ||
      response.notificationData.urgency === 'critical';
  }

  // Generate unique response ID
  generateResponseId() {
    return `response_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Get response statistics
  getResponseStats() {
    return {
      queueLength: this.responseQueue.length,
      isProcessing: this.isProcessing,
      totalProcessed: this.responseQueue.filter(r => r.processed).length,
      totalFailed: this.responseQueue.filter(r => r.retryCount >= 3).length
    };
  }

  // Clear response queue
  clearResponseQueue() {
    this.responseQueue = [];
    this.retryAttempts.clear();
    logger.debug('Response queue cleared', 'NOTIFICATION_RESPONSE');
  }

  // Handle offline response
  async handleOfflineResponse(responseData, action) {
    try {
      // Queue for offline sync with appropriate priority
      const priority = action === 'accept' ? 'emergency' : 'high';

      await offlineQueueManager.queueAction({
        type: 'blood_request_response',
        data: responseData,
        priority
      });

      // Show offline confirmation
      await this.showOfflineConfirmation(action);

      // Update metrics
      this.responseMetrics.pending--;

      logger.info('Response queued for offline sync', 'NOTIFICATION_RESPONSE', {
        action,
        requestId: responseData.requestId
      });

    } catch (error) {
      this.responseMetrics.failed++;
      logger.error('Failed to handle offline response', 'NOTIFICATION_RESPONSE', error);
      throw error;
    }
  }

  // Get donor ID from storage or context
  async getDonorId() {
    try {
      // Try to get from service worker context first
      if (typeof self !== 'undefined' && self.clients) {
        const clients = await self.clients.matchAll();
        for (const client of clients) {
          const response = await new Promise((resolve) => {
            const channel = new MessageChannel();
            channel.port1.onmessage = (event) => resolve(event.data);
            client.postMessage({ type: 'GET_USER_ID' }, [channel.port2]);
            setTimeout(() => resolve(null), 1000);
          });

          if (response && response.userId) {
            return response.userId;
          }
        }
      }

      // Fallback to localStorage (if available)
      if (typeof localStorage !== 'undefined') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.id || user._id || 'anonymous';
      }

      return 'anonymous';
    } catch (error) {
      logger.warn('Failed to get donor ID', 'NOTIFICATION_RESPONSE', error);
      return 'anonymous';
    }
  }

  // Track successful response
  async trackResponseSuccess(action, notificationData) {
    try {
      const successData = {
        action,
        requestId: notificationData.requestId,
        urgency: notificationData.urgency,
        bloodType: notificationData.bloodType,
        timestamp: Date.now(),
        source: 'notification_success',
        donorId: await this.getDonorId()
      };

      // Queue for analytics
      await offlineQueueManager.queueAction({
        type: 'response_success_tracking',
        data: successData,
        priority: 'low'
      });

    } catch (error) {
      logger.warn('Failed to track response success', 'NOTIFICATION_RESPONSE', error);
    }
  }

  // Open share fallback
  async openShareFallback(notificationData, shareData) {
    try {
      const shareUrl = `/share?requestId=${notificationData.requestId}&urgency=${notificationData.urgency}&bloodType=${encodeURIComponent(notificationData.bloodType)}`;
      await this.openApp(shareUrl);
      await this.trackResponseSuccess('share_fallback', notificationData);
      logger.info('Opened share fallback page', 'NOTIFICATION_RESPONSE');
    } catch (error) {
      logger.error('Failed to open share fallback', 'NOTIFICATION_RESPONSE', error);
    }
  }

  // Show error notification
  async showErrorNotification(message) {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('Error', {
          body: message,
          icon: '/logo192.png',
          badge: '/badge-error.png',
          tag: 'error-notification',
          requireInteraction: false,
          vibrate: [100, 100, 100],
          actions: []
        });
      }
    } catch (error) {
      logger.warn('Failed to show error notification', 'NOTIFICATION_RESPONSE', error);
    }
  }

  // Enhanced response confirmation with action-specific messages
  async showResponseConfirmation(action, notificationData) {
    try {
      const messages = {
        accept: 'Thank you! Your response has been recorded. Opening dashboard...',
        decline: '📝 Response recorded. Thank you for letting us know.',
        remind_later: '⏰ Reminder set! We\'ll notify you again in a week.',
        share: '📤 Thank you for helping spread the word!',
        schedule: '📅 Opening scheduling page...',
        find_requests: '🔍 Opening blood requests...',
        view_details: 'Opening request details...',
        call_hospital: '📞 Opening phone dialer...'
      };

      const message = messages[action] || 'Response recorded.';
      const title = action === 'accept' ? 'Response Confirmed' : 'Action Completed';

      // Show confirmation notification
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body: message,
          icon: '/logo192.png',
          badge: '/badge-success.png',
          tag: `response-confirmation-${action}`,
          requireInteraction: false,
          vibrate: action === 'accept' ? [200, 100, 200] : [100],
          actions: []
        });
      }
    } catch (error) {
      logger.warn('Failed to show response confirmation', 'NOTIFICATION_RESPONSE', error);
    }
  }

  // Get comprehensive response metrics
  getResponseMetrics() {
    return {
      ...this.responseMetrics,
      queueLength: this.responseQueue.length,
      isProcessing: this.isProcessing,
      retryAttempts: this.retryAttempts.size,
      successRate: this.responseMetrics.total > 0
        ? (this.responseMetrics.successful / this.responseMetrics.total * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  // Reset metrics
  resetMetrics() {
    this.responseMetrics = {
      total: 0,
      successful: 0,
      failed: 0,
      pending: 0,
      retries: 0
    };
    logger.debug('Response metrics reset', 'NOTIFICATION_RESPONSE');
  }
}

// Create singleton instance
const notificationResponseProcessor = new NotificationResponseProcessor();

export default notificationResponseProcessor;