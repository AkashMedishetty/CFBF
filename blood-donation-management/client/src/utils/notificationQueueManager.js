import logger from './logger';

class NotificationQueueManager {
  constructor() {
    this.dbName = 'CFBNotificationDB';
    this.dbVersion = 1;
    this.storeName = 'notificationQueue';
    this.db = null;
    this.isInitialized = false;
    this.backgroundProcessor = null;
    
    // Queue configuration
    this.config = {
      maxQueueSize: 500,
      maxRetryAttempts: 5,
      retryDelayBase: 1000, // Base delay in ms
      maxRetryDelay: 60000, // Max delay in ms
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    
    // Priority levels for notifications
    this.priorityLevels = {
      critical: 1,
      urgent: 2,
      high: 3,
      normal: 4,
      low: 5
    };
    
    // Notification delivery status
    this.deliveryCallbacks = [];
    this.isDelivering = false;
    
    logger.info('NotificationQueueManager initialized', 'NOTIFICATION_QUEUE');
  }

  // Initialize IndexedDB
  async init() {
    if (this.isInitialized) return;
    
    try {
      logger.debug('Initializing notification queue database', 'NOTIFICATION_QUEUE');
      
      this.db = await this.openDB();
      this.isInitialized = true;
      
      // Start periodic cleanup
      this.startPeriodicCleanup();
      
      // Process any queued notifications
      await this.processQueue();
      
      // Initialize background processor integration
      await this.initBackgroundProcessor();
      
      logger.success('NotificationQueueManager initialized successfully', 'NOTIFICATION_QUEUE');
    } catch (error) {
      logger.error('Failed to initialize NotificationQueueManager', 'NOTIFICATION_QUEUE', error);
      throw error;
    }
  }

  // Initialize background processor integration
  async initBackgroundProcessor() {
    try {
      // Dynamically import to avoid circular dependencies
      const { default: backgroundNotificationProcessor } = await import('./backgroundNotificationProcessor');
      this.backgroundProcessor = backgroundNotificationProcessor;
      
      logger.debug('Background processor integration initialized', 'NOTIFICATION_QUEUE');
    } catch (error) {
      logger.warn('Failed to initialize background processor integration', 'NOTIFICATION_QUEUE', error);
    }
  }

  // Open IndexedDB connection
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        logger.error('Failed to open notification queue DB', 'NOTIFICATION_QUEUE', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        logger.debug('Notification queue DB opened successfully', 'NOTIFICATION_QUEUE');
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        logger.debug('Upgrading notification queue DB schema', 'NOTIFICATION_QUEUE');
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('urgency', 'urgency', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
          logger.debug('Created notification queue object store', 'NOTIFICATION_QUEUE');
        }
      };
    });
  }

  // Queue notification for delivery
  async queueNotification(notificationData, options = {}) {
    await this.init();
    
    try {
      const queueItem = {
        id: this.generateId(),
        ...notificationData,
        priority: this.priorityLevels[notificationData.urgency] || this.priorityLevels.normal,
        status: 'pending',
        attempts: 0,
        queuedAt: Date.now(),
        expiresAt: Date.now() + (options.maxAge || this.config.maxAge),
        retryDelay: this.config.retryDelayBase,
        metadata: {
          source: options.source || 'unknown',
          queuedBy: 'NotificationQueueManager',
          ...options.metadata
        }
      };

      // Check queue size
      const queueSize = await this.getQueueSize();
      if (queueSize >= this.config.maxQueueSize) {
        logger.warn('Queue is full, removing oldest low-priority items', 'NOTIFICATION_QUEUE');
        await this.cleanupQueue();
      }

      // Store in IndexedDB
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.add(queueItem);

      logger.success('Notification queued', 'NOTIFICATION_QUEUE', {
        id: queueItem.id,
        urgency: notificationData.urgency,
        priority: queueItem.priority
      });

      // Try immediate delivery
      this.processQueue();

      return queueItem.id;
      
    } catch (error) {
      logger.error('Failed to queue notification', 'NOTIFICATION_QUEUE', error);
      throw error;
    }
  }

  // Process notification queue
  async processQueue() {
    if (this.isDelivering) {
      return;
    }

    this.isDelivering = true;
    
    try {
      logger.debug('Processing notification queue', 'NOTIFICATION_QUEUE');
      
      const pendingNotifications = await this.getPendingNotifications();
      
      if (pendingNotifications.length === 0) {
        logger.debug('No pending notifications to process', 'NOTIFICATION_QUEUE');
        return;
      }

      logger.info(`Processing ${pendingNotifications.length} pending notifications`, 'NOTIFICATION_QUEUE');

      const results = {
        delivered: 0,
        failed: 0,
        expired: 0,
        errors: []
      };

      for (const notification of pendingNotifications) {
        try {
          // Check if notification has expired
          if (Date.now() > notification.expiresAt) {
            await this.updateNotificationStatus(notification.id, 'expired');
            results.expired++;
            continue;
          }

          // Attempt delivery
          const delivered = await this.deliverNotification(notification);
          
          if (delivered) {
            await this.updateNotificationStatus(notification.id, 'delivered');
            results.delivered++;
          } else {
            await this.handleDeliveryFailure(notification);
            results.failed++;
          }
          
        } catch (error) {
          logger.error(`Failed to process notification ${notification.id}`, 'NOTIFICATION_QUEUE', error);
          await this.handleDeliveryFailure(notification);
          results.failed++;
          results.errors.push({ notificationId: notification.id, error: error.message });
        }
      }

      logger.success('Queue processing completed', 'NOTIFICATION_QUEUE', results);
      
      // Notify callbacks
      this.notifyDeliveryCallbacks(results);
      
    } catch (error) {
      logger.error('Queue processing failed', 'NOTIFICATION_QUEUE', error);
    } finally {
      this.isDelivering = false;
    }
  }

  // Deliver individual notification
  async deliverNotification(notification) {
    try {
      logger.debug(`Delivering notification: ${notification.id}`, 'NOTIFICATION_QUEUE', {
        urgency: notification.urgency,
        attempts: notification.attempts
      });

      // Try background processor first for enhanced processing
      if (this.backgroundProcessor) {
        try {
          const backgroundId = await this.backgroundProcessor.queueNotification({
            type: notification.type || 'notification',
            title: notification.title,
            body: notification.body,
            urgency: notification.urgency,
            priority: notification.priority,
            data: notification.data,
            ...notification.options
          });
          
          if (backgroundId) {
            logger.success(`Notification queued for background processing: ${notification.id}`, 'NOTIFICATION_QUEUE');
            return true;
          }
        } catch (error) {
          logger.warn(`Background processor failed, falling back to direct delivery: ${error.message}`, 'NOTIFICATION_QUEUE');
        }
      }

      // Fallback to direct service worker delivery
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
      }

      const registration = await navigator.serviceWorker.ready;
      
      if (!registration) {
        throw new Error('Service Worker not ready');
      }

      // Show notification directly
      await registration.showNotification(notification.title, notification.options);
      
      logger.success(`Notification delivered directly: ${notification.id}`, 'NOTIFICATION_QUEUE');
      return true;
      
    } catch (error) {
      logger.error(`Failed to deliver notification ${notification.id}`, 'NOTIFICATION_QUEUE', error);
      return false;
    }
  }

  // Handle delivery failure
  async handleDeliveryFailure(notification) {
    try {
      const newAttempts = notification.attempts + 1;
      
      if (newAttempts >= this.config.maxRetryAttempts) {
        // Max attempts reached, mark as failed
        await this.updateNotificationStatus(notification.id, 'failed');
        logger.warn(`Notification ${notification.id} failed after ${newAttempts} attempts`, 'NOTIFICATION_QUEUE');
      } else {
        // Schedule retry with exponential backoff
        const retryDelay = Math.min(
          notification.retryDelay * Math.pow(2, newAttempts - 1),
          this.config.maxRetryDelay
        );
        
        await this.scheduleRetry(notification.id, retryDelay, newAttempts);
        
        logger.debug(`Notification ${notification.id} scheduled for retry in ${retryDelay}ms`, 'NOTIFICATION_QUEUE');
      }
    } catch (error) {
      logger.error(`Failed to handle delivery failure for ${notification.id}`, 'NOTIFICATION_QUEUE', error);
    }
  }

  // Schedule notification retry
  async scheduleRetry(notificationId, delay, attempts) {
    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const notification = await store.get(notificationId);
      if (notification) {
        notification.status = 'retry_scheduled';
        notification.attempts = attempts;
        notification.nextRetryAt = Date.now() + delay;
        notification.retryDelay = delay;
        
        await store.put(notification);
        
        // Schedule actual retry
        setTimeout(() => {
          this.retryNotification(notificationId);
        }, delay);
      }
    } catch (error) {
      logger.error(`Failed to schedule retry for ${notificationId}`, 'NOTIFICATION_QUEUE', error);
    }
  }

  // Retry notification delivery
  async retryNotification(notificationId) {
    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const notification = await store.get(notificationId);
      if (notification && notification.status === 'retry_scheduled') {
        notification.status = 'pending';
        await store.put(notification);
        
        // Process this specific notification
        await this.processQueue();
      }
    } catch (error) {
      logger.error(`Failed to retry notification ${notificationId}`, 'NOTIFICATION_QUEUE', error);
    }
  }

  // Get pending notifications sorted by priority
  async getPendingNotifications() {
    try {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('status');
      
      const pendingNotifications = await index.getAll('pending');
      const retryNotifications = await index.getAll('retry_scheduled');
      
      // Filter retry notifications that are ready
      const readyRetries = retryNotifications.filter(n => 
        !n.nextRetryAt || Date.now() >= n.nextRetryAt
      );
      
      const allNotifications = [...pendingNotifications, ...readyRetries];
      
      // Sort by priority (lower number = higher priority) then by timestamp
      return allNotifications.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.queuedAt - b.queuedAt;
      });
      
    } catch (error) {
      logger.error('Failed to get pending notifications', 'NOTIFICATION_QUEUE', error);
      return [];
    }
  }

  // Update notification status
  async updateNotificationStatus(notificationId, status) {
    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const notification = await store.get(notificationId);
      if (notification) {
        notification.status = status;
        notification.updatedAt = Date.now();
        
        if (status === 'delivered') {
          notification.deliveredAt = Date.now();
        } else if (status === 'failed') {
          notification.failedAt = Date.now();
        }
        
        await store.put(notification);
      }
    } catch (error) {
      logger.error(`Failed to update notification status: ${notificationId}`, 'NOTIFICATION_QUEUE', error);
    }
  }

  // Get queue size
  async getQueueSize() {
    try {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      return await store.count();
    } catch (error) {
      logger.error('Failed to get queue size', 'NOTIFICATION_QUEUE', error);
      return 0;
    }
  }

  // Clean up queue by removing old items
  async cleanupQueue() {
    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // Remove expired notifications
      const expiredCursor = store.index('expiresAt').openCursor(IDBKeyRange.upperBound(Date.now()));
      let expiredCount = 0;
      
      expiredCursor.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          expiredCount++;
          cursor.continue();
        }
      };
      
      // Remove old delivered/failed notifications
      const allNotifications = await store.getAll();
      const oldNotifications = allNotifications.filter(n => 
        (n.status === 'delivered' || n.status === 'failed') &&
        Date.now() - n.queuedAt > this.config.maxAge
      );
      
      for (const notification of oldNotifications) {
        await store.delete(notification.id);
      }
      
      logger.debug(`Cleaned up ${expiredCount + oldNotifications.length} old notifications`, 'NOTIFICATION_QUEUE');
      
    } catch (error) {
      logger.error('Failed to cleanup queue', 'NOTIFICATION_QUEUE', error);
    }
  }

  // Start periodic cleanup
  startPeriodicCleanup() {
    setInterval(() => {
      this.cleanupQueue();
    }, this.config.cleanupInterval);
    
    logger.debug('Periodic cleanup started', 'NOTIFICATION_QUEUE');
  }

  // Generate unique ID
  generateId() {
    return `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Register delivery callback
  onDelivery(callback) {
    this.deliveryCallbacks.push(callback);
  }

  // Remove delivery callback
  removeOnDelivery(callback) {
    this.deliveryCallbacks = this.deliveryCallbacks.filter(cb => cb !== callback);
  }

  // Notify delivery callbacks
  notifyDeliveryCallbacks(results) {
    this.deliveryCallbacks.forEach(callback => {
      try {
        callback(results);
      } catch (error) {
        logger.error('Delivery callback failed', 'NOTIFICATION_QUEUE', error);
      }
    });
  }

  // Get queue statistics
  async getQueueStats() {
    try {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const all = await store.getAll();
      
      const stats = {
        total: all.length,
        pending: 0,
        delivered: 0,
        failed: 0,
        expired: 0,
        retryScheduled: 0,
        byPriority: {
          critical: 0,
          urgent: 0,
          high: 0,
          normal: 0,
          low: 0
        },
        oldestItem: null,
        newestItem: null
      };

      all.forEach(item => {
        stats[item.status] = (stats[item.status] || 0) + 1;
        
        const urgency = item.urgency || 'normal';
        stats.byPriority[urgency] = (stats.byPriority[urgency] || 0) + 1;
        
        if (!stats.oldestItem || item.queuedAt < stats.oldestItem.queuedAt) {
          stats.oldestItem = item;
        }
        if (!stats.newestItem || item.queuedAt > stats.newestItem.queuedAt) {
          stats.newestItem = item;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get queue stats', 'NOTIFICATION_QUEUE', error);
      return null;
    }
  }

  // Clear all notifications
  async clearQueue() {
    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.clear();
      
      logger.success('Notification queue cleared', 'NOTIFICATION_QUEUE');
    } catch (error) {
      logger.error('Failed to clear queue', 'NOTIFICATION_QUEUE', error);
    }
  }

  // Force process queue (for testing)
  async forceProcessQueue() {
    this.isDelivering = false;
    await this.processQueue();
  }

  // Destroy queue manager
  destroy() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    
    this.isInitialized = false;
    this.deliveryCallbacks = [];
    
    logger.debug('NotificationQueueManager destroyed', 'NOTIFICATION_QUEUE');
  }
}

// Create singleton instance
const notificationQueueManager = new NotificationQueueManager();

export default notificationQueueManager;