import logger from './logger';

class BackgroundNotificationProcessor {
  constructor() {
    this.processingQueue = [];
    this.retryQueue = [];
    this.maxRetries = 3;
    this.retryDelay = 1000; // Start with 1 second
    this.maxRetryDelay = 30000; // Max 30 seconds
    this.isProcessing = false;
    this.notificationBadgeCount = 0;
    
    // Priority levels for different notification types
    this.priorityLevels = {
      critical: 1,
      emergency: 2,
      urgent: 3,
      normal: 4,
      low: 5
    };
    
    this.init();
    
    logger.info('BackgroundNotificationProcessor initialized', 'BACKGROUND_NOTIFICATION');
  }

  // Initialize background processing
  async init() {
    try {
      // Set up service worker message listener
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event);
        });
      }
      
      // Set up periodic processing
      this.startPeriodicProcessing();
      
      // Load pending notifications from storage
      await this.loadPendingNotifications();
      
      logger.success('Background notification processor ready', 'BACKGROUND_NOTIFICATION');
    } catch (error) {
      logger.error('Failed to initialize background processor', 'BACKGROUND_NOTIFICATION', error);
    }
  }

  // Handle messages from service worker
  handleServiceWorkerMessage(event) {
    const { type, data } = event.data || {};
    
    switch (type) {
      case 'NOTIFICATION_ACTION_RESPONSE':
        this.processNotificationResponse(data);
        break;
        
      case 'NOTIFICATION_DELIVERY_FAILED':
        this.handleDeliveryFailure(data);
        break;
        
      case 'BACKGROUND_SYNC_COMPLETE':
        this.handleSyncComplete(data);
        break;
        
      case 'NOTIFICATION_QUEUE_STATUS':
        this.updateQueueStatus(data);
        break;
        
      default:
        logger.debug(`Unknown service worker message: ${type}`, 'BACKGROUND_NOTIFICATION');
    }
  }

  // Queue notification for background processing
  async queueNotification(notificationData) {
    try {
      const queueItem = {
        id: this.generateNotificationId(),
        data: notificationData,
        priority: this.getPriority(notificationData),
        timestamp: Date.now(),
        attempts: 0,
        status: 'queued',
        retryAfter: null
      };
      
      // Add to appropriate queue based on priority
      if (queueItem.priority <= 2) {
        // Critical/Emergency - process immediately
        this.processingQueue.unshift(queueItem);
      } else {
        // Normal priority - add to end
        this.processingQueue.push(queueItem);
      }
      
      // Sort queue by priority
      this.processingQueue.sort((a, b) => a.priority - b.priority);
      
      // Store in IndexedDB for persistence
      await this.persistNotification(queueItem);
      
      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }
      
      logger.info('Notification queued for background processing', 'BACKGROUND_NOTIFICATION', {
        id: queueItem.id,
        priority: queueItem.priority,
        queueLength: this.processingQueue.length
      });
      
      return queueItem.id;
    } catch (error) {
      logger.error('Failed to queue notification', 'BACKGROUND_NOTIFICATION', error);
      return null;
    }
  }

  // Process notification queue
  async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      logger.info('Starting notification queue processing', 'BACKGROUND_NOTIFICATION', {
        queueLength: this.processingQueue.length
      });
      
      while (this.processingQueue.length > 0) {
        const item = this.processingQueue.shift();
        
        // Check if item should be retried yet
        if (item.retryAfter && Date.now() < item.retryAfter) {
          this.retryQueue.push(item);
          continue;
        }
        
        try {
          await this.processNotificationItem(item);
        } catch (error) {
          await this.handleProcessingError(item, error);
        }
        
        // Small delay between processing items
        await this.delay(100);
      }
      
      // Process retry queue
      await this.processRetryQueue();
      
    } catch (error) {
      logger.error('Queue processing failed', 'BACKGROUND_NOTIFICATION', error);
    } finally {
      this.isProcessing = false;
      
      // Schedule next processing cycle if there are items in retry queue
      if (this.retryQueue.length > 0) {
        setTimeout(() => this.processQueue(), 5000);
      }
    }
  }

  // Process individual notification item
  async processNotificationItem(item) {
    try {
      logger.debug('Processing notification item', 'BACKGROUND_NOTIFICATION', {
        id: item.id,
        type: item.data.type,
        attempt: item.attempts + 1
      });
      
      item.attempts++;
      item.status = 'processing';
      
      // Send notification through service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        // Send message to service worker to handle notification
        registration.active.postMessage({
          type: 'PROCESS_BACKGROUND_NOTIFICATION',
          data: {
            id: item.id,
            notification: item.data,
            priority: item.priority
          }
        });
        
        // Wait for response or timeout
        const response = await this.waitForServiceWorkerResponse(item.id, 10000);
        
        if (response && response.success) {
          item.status = 'completed';
          await this.removePersistedNotification(item.id);
          
          // Update badge count
          if (item.data.updateBadge !== false) {
            await this.updateNotificationBadge(1);
          }
          
          logger.success('Notification processed successfully', 'BACKGROUND_NOTIFICATION', {
            id: item.id
          });
        } else {
          throw new Error(response?.error || 'Service worker processing failed');
        }
      } else {
        throw new Error('Service worker not available');
      }
      
    } catch (error) {
      throw error;
    }
  }

  // Handle processing errors with retry logic
  async handleProcessingError(item, error) {
    logger.warn('Notification processing failed', 'BACKGROUND_NOTIFICATION', {
      id: item.id,
      attempt: item.attempts,
      error: error.message
    });
    
    if (item.attempts < this.maxRetries) {
      // Calculate exponential backoff delay
      const delay = Math.min(
        this.retryDelay * Math.pow(2, item.attempts - 1),
        this.maxRetryDelay
      );
      
      item.retryAfter = Date.now() + delay;
      item.status = 'retry_scheduled';
      
      // Add to retry queue
      this.retryQueue.push(item);
      
      // Update persisted notification
      await this.persistNotification(item);
      
      logger.info('Notification scheduled for retry', 'BACKGROUND_NOTIFICATION', {
        id: item.id,
        retryAfter: new Date(item.retryAfter).toISOString(),
        attempt: item.attempts
      });
    } else {
      // Max retries reached, mark as failed
      item.status = 'failed';
      await this.handleFailedNotification(item, error);
      
      logger.error('Notification failed after max retries', 'BACKGROUND_NOTIFICATION', {
        id: item.id,
        attempts: item.attempts,
        error: error.message
      });
    }
  }

  // Process retry queue
  async processRetryQueue() {
    const now = Date.now();
    const readyItems = this.retryQueue.filter(item => item.retryAfter <= now);
    
    if (readyItems.length === 0) {
      return;
    }
    
    logger.info('Processing retry queue', 'BACKGROUND_NOTIFICATION', {
      readyItems: readyItems.length,
      totalRetryQueue: this.retryQueue.length
    });
    
    // Remove ready items from retry queue and add to processing queue
    this.retryQueue = this.retryQueue.filter(item => item.retryAfter > now);
    this.processingQueue.unshift(...readyItems);
    
    // Sort by priority
    this.processingQueue.sort((a, b) => a.priority - b.priority);
  }

  // Handle failed notifications
  async handleFailedNotification(item, error) {
    try {
      // Store failed notification for manual review
      const failedNotification = {
        ...item,
        failureReason: error.message,
        failedAt: Date.now()
      };
      
      await this.storeFailedNotification(failedNotification);
      
      // Remove from persistent storage
      await this.removePersistedNotification(item.id);
      
      // Send failure report to service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.active.postMessage({
          type: 'NOTIFICATION_PROCESSING_FAILED',
          data: {
            id: item.id,
            error: error.message,
            attempts: item.attempts
          }
        });
      }
      
    } catch (storageError) {
      logger.error('Failed to handle failed notification', 'BACKGROUND_NOTIFICATION', storageError);
    }
  }

  // Wait for service worker response
  waitForServiceWorkerResponse(notificationId, timeout = 10000) {
    return new Promise((resolve) => {
      const responseHandler = (event) => {
        const { type, data } = event.data || {};
        
        if (type === 'BACKGROUND_NOTIFICATION_RESPONSE' && data.id === notificationId) {
          navigator.serviceWorker.removeEventListener('message', responseHandler);
          resolve(data);
        }
      };
      
      navigator.serviceWorker.addEventListener('message', responseHandler);
      
      // Timeout handler
      setTimeout(() => {
        navigator.serviceWorker.removeEventListener('message', responseHandler);
        resolve({ success: false, error: 'Timeout' });
      }, timeout);
    });
  }

  // Process notification response from user action
  async processNotificationResponse(responseData) {
    try {
      logger.info('Processing notification response', 'BACKGROUND_NOTIFICATION', {
        notificationId: responseData.notificationId,
        action: responseData.action
      });
      
      // Handle different response types
      switch (responseData.action) {
        case 'accept':
          await this.handleAcceptResponse(responseData);
          break;
          
        case 'decline':
          await this.handleDeclineResponse(responseData);
          break;
          
        case 'view_details':
          await this.handleViewDetailsResponse(responseData);
          break;
          
        case 'call_hospital':
          await this.handleCallHospitalResponse(responseData);
          break;
          
        default:
          logger.warn('Unknown notification action', 'BACKGROUND_NOTIFICATION', {
            action: responseData.action
          });
      }
      
      // Update badge count
      await this.updateNotificationBadge(-1);
      
    } catch (error) {
      logger.error('Failed to process notification response', 'BACKGROUND_NOTIFICATION', error);
    }
  }

  // Handle accept response
  async handleAcceptResponse(responseData) {
    try {
      // Send acceptance to backend
      const response = await fetch('/api/v1/blood-requests/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          requestId: responseData.requestId,
          response: 'accept',
          timestamp: Date.now(),
          source: 'background_notification'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      logger.success('Accept response sent successfully', 'BACKGROUND_NOTIFICATION');
      
      // Send confirmation notification
      await this.sendConfirmationNotification(responseData, 'accepted');
      
    } catch (error) {
      logger.error('Failed to send accept response', 'BACKGROUND_NOTIFICATION', error);
      
      // Queue for retry
      await this.queueNotification({
        type: 'response_retry',
        action: 'accept',
        requestId: responseData.requestId,
        originalResponse: responseData
      });
    }
  }

  // Handle decline response
  async handleDeclineResponse(responseData) {
    try {
      // Send decline to backend
      const response = await fetch('/api/v1/blood-requests/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          requestId: responseData.requestId,
          response: 'decline',
          timestamp: Date.now(),
          source: 'background_notification'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      logger.success('Decline response sent successfully', 'BACKGROUND_NOTIFICATION');
      
    } catch (error) {
      logger.error('Failed to send decline response', 'BACKGROUND_NOTIFICATION', error);
      
      // Queue for retry
      await this.queueNotification({
        type: 'response_retry',
        action: 'decline',
        requestId: responseData.requestId,
        originalResponse: responseData
      });
    }
  }

  // Handle view details response
  async handleViewDetailsResponse(responseData) {
    // Log interaction for analytics
    logger.info('User viewed notification details', 'BACKGROUND_NOTIFICATION', {
      requestId: responseData.requestId
    });
    
    // Send analytics event
    try {
      await fetch('/api/v1/analytics/notification-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          type: 'view_details',
          notificationId: responseData.notificationId,
          requestId: responseData.requestId,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      logger.warn('Failed to send analytics event', 'BACKGROUND_NOTIFICATION', error);
    }
  }

  // Handle call hospital response
  async handleCallHospitalResponse(responseData) {
    // Log call initiation for analytics
    logger.info('User initiated hospital call', 'BACKGROUND_NOTIFICATION', {
      requestId: responseData.requestId,
      hospitalPhone: responseData.hospitalPhone
    });
    
    // Send analytics event
    try {
      await fetch('/api/v1/analytics/notification-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          type: 'call_hospital',
          notificationId: responseData.notificationId,
          requestId: responseData.requestId,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      logger.warn('Failed to send analytics event', 'BACKGROUND_NOTIFICATION', error);
    }
  }

  // Send confirmation notification
  async sendConfirmationNotification(responseData, action) {
    try {
      const confirmationData = {
        type: 'response_confirmation',
        title: 'Response Confirmed',
        body: `Your ${action} response has been sent successfully.`,
        priority: 'normal',
        updateBadge: false,
        data: {
          originalRequestId: responseData.requestId,
          action: action,
          timestamp: Date.now()
        }
      };
      
      await this.queueNotification(confirmationData);
      
    } catch (error) {
      logger.error('Failed to send confirmation notification', 'BACKGROUND_NOTIFICATION', error);
    }
  }

  // Update notification badge count
  async updateNotificationBadge(increment) {
    try {
      this.notificationBadgeCount = Math.max(0, this.notificationBadgeCount + increment);
      
      if ('setAppBadge' in navigator) {
        if (this.notificationBadgeCount > 0) {
          await navigator.setAppBadge(this.notificationBadgeCount);
        } else {
          await navigator.clearAppBadge();
        }
      }
      
      // Also update through service worker for broader compatibility
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.active.postMessage({
          type: 'UPDATE_BADGE_COUNT',
          count: this.notificationBadgeCount
        });
      }
      
      logger.debug('Badge count updated', 'BACKGROUND_NOTIFICATION', {
        count: this.notificationBadgeCount
      });
      
    } catch (error) {
      logger.error('Failed to update badge count', 'BACKGROUND_NOTIFICATION', error);
    }
  }

  // Clear notification badge
  async clearNotificationBadge() {
    try {
      this.notificationBadgeCount = 0;
      
      if ('clearAppBadge' in navigator) {
        await navigator.clearAppBadge();
      }
      
      // Also clear through service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.active.postMessage({
          type: 'CLEAR_BADGE'
        });
      }
      
      logger.debug('Badge cleared', 'BACKGROUND_NOTIFICATION');
      
    } catch (error) {
      logger.error('Failed to clear badge', 'BACKGROUND_NOTIFICATION', error);
    }
  }

  // Get priority level for notification
  getPriority(notificationData) {
    const type = notificationData.type || 'normal';
    const urgency = notificationData.urgency || notificationData.priority || 'normal';
    
    // Map urgency levels to priority numbers
    if (urgency === 'critical' || type.includes('critical')) {
      return this.priorityLevels.critical;
    } else if (urgency === 'emergency' || type.includes('emergency')) {
      return this.priorityLevels.emergency;
    } else if (urgency === 'urgent' || type.includes('urgent')) {
      return this.priorityLevels.urgent;
    } else if (urgency === 'low') {
      return this.priorityLevels.low;
    } else {
      return this.priorityLevels.normal;
    }
  }

  // Generate unique notification ID
  generateNotificationId() {
    return `bg_notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start periodic processing
  startPeriodicProcessing() {
    // Process queue every 30 seconds
    setInterval(() => {
      if (this.retryQueue.length > 0 && !this.isProcessing) {
        this.processQueue();
      }
    }, 30000);
    
    // Clean up old failed notifications every hour
    setInterval(() => {
      this.cleanupOldFailedNotifications();
    }, 3600000);
  }

  // Persist notification to IndexedDB
  async persistNotification(notification) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      await store.put(notification);
    } catch (error) {
      logger.error('Failed to persist notification', 'BACKGROUND_NOTIFICATION', error);
    }
  }

  // Remove persisted notification
  async removePersistedNotification(notificationId) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      await store.delete(notificationId);
    } catch (error) {
      logger.error('Failed to remove persisted notification', 'BACKGROUND_NOTIFICATION', error);
    }
  }

  // Store failed notification
  async storeFailedNotification(notification) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['failedNotifications'], 'readwrite');
      const store = transaction.objectStore('failedNotifications');
      await store.put(notification);
    } catch (error) {
      logger.error('Failed to store failed notification', 'BACKGROUND_NOTIFICATION', error);
    }
  }

  // Load pending notifications from storage
  async loadPendingNotifications() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['notifications'], 'readonly');
      const store = transaction.objectStore('notifications');
      const notifications = await store.getAll();
      
      // Add to appropriate queues
      for (const notification of notifications) {
        if (notification.status === 'retry_scheduled' && notification.retryAfter > Date.now()) {
          this.retryQueue.push(notification);
        } else if (notification.status !== 'completed' && notification.status !== 'failed') {
          this.processingQueue.push(notification);
        }
      }
      
      // Sort processing queue by priority
      this.processingQueue.sort((a, b) => a.priority - b.priority);
      
      logger.info('Loaded pending notifications', 'BACKGROUND_NOTIFICATION', {
        processingQueue: this.processingQueue.length,
        retryQueue: this.retryQueue.length
      });
      
    } catch (error) {
      logger.error('Failed to load pending notifications', 'BACKGROUND_NOTIFICATION', error);
    }
  }

  // Clean up old failed notifications
  async cleanupOldFailedNotifications() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['failedNotifications'], 'readwrite');
      const store = transaction.objectStore('failedNotifications');
      
      const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
      const notifications = await store.getAll();
      
      let cleanedCount = 0;
      for (const notification of notifications) {
        if (notification.failedAt < cutoffTime) {
          await store.delete(notification.id);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        logger.info('Cleaned up old failed notifications', 'BACKGROUND_NOTIFICATION', {
          cleanedCount
        });
      }
      
    } catch (error) {
      logger.error('Failed to cleanup old failed notifications', 'BACKGROUND_NOTIFICATION', error);
    }
  }

  // Get authentication token
  async getAuthToken() {
    try {
      // Try to get from IndexedDB first
      const db = await this.openDB();
      const transaction = db.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const session = await store.get('current_session');
      
      if (session && session.tokens && session.tokens.accessToken) {
        return session.tokens.accessToken;
      }
    } catch (error) {
      logger.warn('Failed to get auth token from storage', 'BACKGROUND_NOTIFICATION', error);
    }
    
    return null;
  }

  // Open IndexedDB
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CFBBackgroundNotificationDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('notifications')) {
          const notificationStore = db.createObjectStore('notifications', { keyPath: 'id' });
          notificationStore.createIndex('priority', 'priority', { unique: false });
          notificationStore.createIndex('status', 'status', { unique: false });
          notificationStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('failedNotifications')) {
          const failedStore = db.createObjectStore('failedNotifications', { keyPath: 'id' });
          failedStore.createIndex('failedAt', 'failedAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
      };
    });
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get queue status
  getQueueStatus() {
    return {
      processingQueue: this.processingQueue.length,
      retryQueue: this.retryQueue.length,
      isProcessing: this.isProcessing,
      badgeCount: this.notificationBadgeCount,
      lastProcessed: this.lastProcessedTime || null
    };
  }

  // Manual queue processing trigger
  async triggerQueueProcessing() {
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  // Clear all queues (for testing/debugging)
  async clearAllQueues() {
    this.processingQueue = [];
    this.retryQueue = [];
    
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      await store.clear();
      
      logger.info('All notification queues cleared', 'BACKGROUND_NOTIFICATION');
    } catch (error) {
      logger.error('Failed to clear notification queues', 'BACKGROUND_NOTIFICATION', error);
    }
  }
}

// Create singleton instance
const backgroundNotificationProcessor = new BackgroundNotificationProcessor();

export default backgroundNotificationProcessor;