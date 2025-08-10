import logger from './logger';

class OfflineQueueManager {
  constructor() {
    this.dbName = 'CFBOfflineDB';
    this.dbVersion = 1;
    this.storeName = 'offlineQueue';
    this.db = null;
    this.isInitialized = false;
    
    // Queue configuration
    this.config = {
      maxQueueSize: 1000,
      maxRetryAttempts: 5,
      retryDelayBase: 1000, // Base delay in ms
      maxRetryDelay: 30000, // Max delay in ms
      priorityLevels: {
        emergency: 1,
        high: 2,
        normal: 3,
        low: 4
      }
    };
    
    // Sync status
    this.isSyncing = false;
    this.syncCallbacks = [];
    
    logger.info('OfflineQueueManager initialized', 'OFFLINE_QUEUE');
  }

  // Initialize IndexedDB
  async init() {
    if (this.isInitialized) return;
    
    try {
      logger.debug('Initializing IndexedDB for offline queue', 'OFFLINE_QUEUE');
      
      this.db = await this.openDB();
      this.isInitialized = true;
      
      // Start periodic sync attempts
      this.startPeriodicSync();
      
      logger.success('OfflineQueueManager initialized successfully', 'OFFLINE_QUEUE');
    } catch (error) {
      logger.error('Failed to initialize OfflineQueueManager', 'OFFLINE_QUEUE', error);
      throw error;
    }
  }

  // Open IndexedDB connection
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        logger.error('Failed to open IndexedDB', 'OFFLINE_QUEUE', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        logger.debug('IndexedDB opened successfully', 'OFFLINE_QUEUE');
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        logger.debug('Upgrading IndexedDB schema', 'OFFLINE_QUEUE');
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          logger.debug('Created offline queue object store', 'OFFLINE_QUEUE');
        }
      };
    });
  }

  // Add action to offline queue
  async queueAction(action) {
    await this.init();
    
    try {
      const queueItem = {
        id: this.generateId(),
        ...action,
        timestamp: Date.now(),
        status: 'pending',
        attempts: 0,
        priority: action.priority || 'normal',
        createdAt: new Date().toISOString()
      };

      // Validate required fields
      if (!action.type || !action.data) {
        throw new Error('Action must have type and data properties');
      }

      // Check queue size
      const queueSize = await this.getQueueSize();
      if (queueSize >= this.config.maxQueueSize) {
        logger.warn('Queue is full, removing oldest low-priority items', 'OFFLINE_QUEUE');
        await this.cleanupQueue();
      }

      // Store in IndexedDB
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.add(queueItem);

      logger.success('Action queued for offline sync', 'OFFLINE_QUEUE', {
        id: queueItem.id,
        type: action.type,
        priority: action.priority
      });

      // Try immediate sync if online
      if (navigator.onLine) {
        this.syncQueue();
      }

      return queueItem.id;
      
    } catch (error) {
      logger.error('Failed to queue action', 'OFFLINE_QUEUE', error);
      throw error;
    }
  }

  // Get queue size
  async getQueueSize() {
    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    return await store.count();
  }

  // Generate unique ID
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  // Get all queued actions
  async getQueuedActions(status = null) {
    await this.init();
    
    try {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      let request;
      if (status) {
        const index = store.index('status');
        request = index.getAll(status);
      } else {
        request = store.getAll();
      }
      
      const actions = await request;
      
      // Sort by priority and timestamp
      return actions.sort((a, b) => {
        const priorityDiff = this.config.priorityLevels[a.priority] - this.config.priorityLevels[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp;
      });
      
    } catch (error) {
      logger.error('Failed to get queued actions', 'OFFLINE_QUEUE', error);
      return [];
    }
  }

  // Sync queue with server
  async syncQueue() {
    if (this.isSyncing) {
      logger.debug('Sync already in progress', 'OFFLINE_QUEUE');
      return;
    }

    if (!navigator.onLine) {
      logger.debug('Device is offline, skipping sync', 'OFFLINE_QUEUE');
      return;
    }

    this.isSyncing = true;
    
    try {
      logger.info('Starting offline queue sync', 'OFFLINE_QUEUE');
      
      const pendingActions = await this.getQueuedActions('pending');
      const failedActions = await this.getQueuedActions('failed');
      
      const actionsToSync = [...pendingActions, ...failedActions];
      
      if (actionsToSync.length === 0) {
        logger.debug('No actions to sync', 'OFFLINE_QUEUE');
        return;
      }

      logger.debug(`Syncing ${actionsToSync.length} actions`, 'OFFLINE_QUEUE');

      const results = {
        successful: 0,
        failed: 0,
        errors: []
      };

      for (const action of actionsToSync) {
        try {
          const success = await this.syncAction(action);
          if (success) {
            results.successful++;
            await this.removeAction(action.id);
          } else {
            results.failed++;
            await this.updateActionStatus(action.id, 'failed', action.attempts + 1);
          }
        } catch (error) {
          results.failed++;
          results.errors.push({ actionId: action.id, error: error.message });
          await this.updateActionStatus(action.id, 'failed', action.attempts + 1);
        }
      }

      logger.success('Queue sync completed', 'OFFLINE_QUEUE', results);
      
      // Notify callbacks
      this.notifySyncCallbacks(results);
      
    } catch (error) {
      logger.error('Queue sync failed', 'OFFLINE_QUEUE', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync individual action
  async syncAction(action) {
    try {
      logger.debug(`Syncing action: ${action.type}`, 'OFFLINE_QUEUE', { id: action.id });

      let response;
      
      switch (action.type) {
        case 'blood_request_response':
          response = await this.syncBloodRequestResponse(action);
          break;
          
        case 'profile_update':
          response = await this.syncProfileUpdate(action);
          break;
          
        case 'availability_update':
          response = await this.syncAvailabilityUpdate(action);
          break;
          
        case 'emergency_request':
          response = await this.syncEmergencyRequest(action);
          break;
          
        case 'donation_record':
          response = await this.syncDonationRecord(action);
          break;
          
        default:
          logger.warn(`Unknown action type: ${action.type}`, 'OFFLINE_QUEUE');
          return false;
      }

      return response && response.ok;
      
    } catch (error) {
      logger.error(`Failed to sync action ${action.id}`, 'OFFLINE_QUEUE', error);
      return false;
    }
  }

  // Sync blood request response
  async syncBloodRequestResponse(action) {
    const token = localStorage.getItem('token');
    
    return await fetch('/api/v1/blood-requests/respond', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(action.data)
    });
  }

  // Sync profile update
  async syncProfileUpdate(action) {
    const token = localStorage.getItem('token');
    
    return await fetch('/api/v1/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(action.data)
    });
  }

  // Sync availability update
  async syncAvailabilityUpdate(action) {
    const token = localStorage.getItem('token');
    
    return await fetch('/api/v1/donors/availability', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(action.data)
    });
  }

  // Sync emergency request
  async syncEmergencyRequest(action) {
    return await fetch('/api/v1/blood-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(action.data)
    });
  }

  // Sync donation record
  async syncDonationRecord(action) {
    const token = localStorage.getItem('token');
    
    return await fetch('/api/v1/donations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(action.data)
    });
  }

  // Update action status
  async updateActionStatus(actionId, status, attempts = 0) {
    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const action = await store.get(actionId);
      if (action) {
        action.status = status;
        action.attempts = attempts;
        action.lastAttempt = Date.now();
        
        // Remove actions that have exceeded max retry attempts
        if (attempts >= this.config.maxRetryAttempts) {
          await store.delete(actionId);
          logger.warn(`Action ${actionId} removed after ${attempts} failed attempts`, 'OFFLINE_QUEUE');
        } else {
          await store.put(action);
        }
      }
    } catch (error) {
      logger.error(`Failed to update action status: ${actionId}`, 'OFFLINE_QUEUE', error);
    }
  }

  // Remove action from queue
  async removeAction(actionId) {
    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.delete(actionId);
      
      logger.debug(`Action removed from queue: ${actionId}`, 'OFFLINE_QUEUE');
    } catch (error) {
      logger.error(`Failed to remove action: ${actionId}`, 'OFFLINE_QUEUE', error);
    }
  }

  // Clean up queue by removing old low-priority items
  async cleanupQueue() {
    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('priority');
      
      // Get low priority items
      const lowPriorityItems = await index.getAll('low');
      
      // Sort by timestamp and remove oldest
      lowPriorityItems.sort((a, b) => a.timestamp - b.timestamp);
      const itemsToRemove = lowPriorityItems.slice(0, Math.min(100, lowPriorityItems.length));
      
      for (const item of itemsToRemove) {
        await store.delete(item.id);
      }
      
      logger.debug(`Cleaned up ${itemsToRemove.length} old queue items`, 'OFFLINE_QUEUE');
    } catch (error) {
      logger.error('Failed to cleanup queue', 'OFFLINE_QUEUE', error);
    }
  }

  // Start periodic sync attempts
  startPeriodicSync() {
    // Sync when coming back online
    window.addEventListener('online', () => {
      logger.info('Device came online, starting sync', 'OFFLINE_QUEUE');
      setTimeout(() => this.syncQueue(), 1000); // Small delay to ensure connection is stable
    });

    // Periodic sync every 5 minutes when online
    setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncQueue();
      }
    }, 5 * 60 * 1000);

    logger.debug('Periodic sync started', 'OFFLINE_QUEUE');
  }

  // Register sync callback
  onSync(callback) {
    this.syncCallbacks.push(callback);
  }

  // Remove sync callback
  removeOnSync(callback) {
    this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
  }

  // Notify sync callbacks
  notifySyncCallbacks(results) {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(results);
      } catch (error) {
        logger.error('Sync callback failed', 'OFFLINE_QUEUE', error);
      }
    });
  }

  // Get queue statistics
  async getQueueStats() {
    await this.init();
    
    try {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const all = await store.getAll();
      
      const stats = {
        total: all.length,
        pending: 0,
        failed: 0,
        byPriority: {
          emergency: 0,
          high: 0,
          normal: 0,
          low: 0
        },
        byType: {},
        oldestItem: null,
        newestItem: null
      };

      all.forEach(item => {
        if (item.status === 'pending') stats.pending++;
        if (item.status === 'failed') stats.failed++;
        
        stats.byPriority[item.priority] = (stats.byPriority[item.priority] || 0) + 1;
        stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
        
        if (!stats.oldestItem || item.timestamp < stats.oldestItem.timestamp) {
          stats.oldestItem = item;
        }
        if (!stats.newestItem || item.timestamp > stats.newestItem.timestamp) {
          stats.newestItem = item;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get queue stats', 'OFFLINE_QUEUE', error);
      return null;
    }
  }

  // Clear all queue items
  async clearQueue() {
    await this.init();
    
    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.clear();
      
      logger.success('Queue cleared', 'OFFLINE_QUEUE');
    } catch (error) {
      logger.error('Failed to clear queue', 'OFFLINE_QUEUE', error);
    }
  }

  // Destroy queue manager
  destroy() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    
    this.isInitialized = false;
    this.syncCallbacks = [];
    
    logger.debug('OfflineQueueManager destroyed', 'OFFLINE_QUEUE');
  }
}

// Create singleton instance
const offlineQueueManager = new OfflineQueueManager();

export default offlineQueueManager;