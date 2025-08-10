/**
 * PWA Session Manager
 * Manages persistent state and cross-device session synchronization
 */

import logger from './logger';
import security from './security';

class PWASessionManager {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.deviceId = this.getOrCreateDeviceId();
    this.userId = null;
    this.sessionData = new Map();
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.lastSyncTime = null;
    
    this.initializeSessionManager();
  }

  // Initialize session manager
  initializeSessionManager() {
    this.loadPersistedSession();
    this.setupNetworkListeners();
    this.setupVisibilityListeners();
    this.setupStorageListeners();
    this.startPeriodicSync();
    
    logger.info('PWA Session Manager initialized', 'SESSION_MANAGER', {
      sessionId: this.sessionId,
      deviceId: this.deviceId
    });
  }

  // Generate unique session ID
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Get or create device ID
  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('pwa_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('pwa_device_id', deviceId);
    }
    return deviceId;
  }

  // Load persisted session data
  loadPersistedSession() {
    try {
      const persistedData = localStorage.getItem('pwa_session_data');
      if (persistedData) {
        const data = JSON.parse(persistedData);
        
        // Validate session data
        if (this.validateSessionData(data)) {
          this.sessionData = new Map(Object.entries(data.sessionData || {}));
          this.userId = data.userId;
          this.lastSyncTime = data.lastSyncTime;
          
          logger.info('Session data loaded from storage', 'SESSION_MANAGER');
        }
      }
    } catch (error) {
      logger.error('Failed to load persisted session', 'SESSION_MANAGER', error);
    }
  }

  // Validate session data
  validateSessionData(data) {
    return data && 
           typeof data === 'object' && 
           data.version === '1.0' &&
           data.deviceId === this.deviceId;
  }

  // Setup network listeners
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleNetworkOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleNetworkOffline();
    });
  }

  // Setup visibility listeners
  setupVisibilityListeners() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleSessionPause();
      } else {
        this.handleSessionResume();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.handleSessionEnd();
    });
  }

  // Setup storage listeners for cross-tab communication
  setupStorageListeners() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'pwa_session_sync') {
        this.handleCrossTabSync(event.newValue);
      }
    });
  }

  // Start periodic sync
  startPeriodicSync() {
    setInterval(() => {
      if (this.isOnline) {
        this.syncSessionData();
      }
    }, 30000); // Sync every 30 seconds
  }

  // Handle network coming online
  handleNetworkOnline() {
    logger.info('Network online - syncing session data', 'SESSION_MANAGER');
    this.syncSessionData();
    this.processSyncQueue();
  }

  // Handle network going offline
  handleNetworkOffline() {
    logger.info('Network offline - queuing sync operations', 'SESSION_MANAGER');
    this.persistSessionData();
  }

  // Handle session pause (app goes to background)
  handleSessionPause() {
    this.setSessionData('lastActiveTime', Date.now());
    this.persistSessionData();
    
    logger.debug('Session paused', 'SESSION_MANAGER');
  }

  // Handle session resume (app comes to foreground)
  handleSessionResume() {
    const lastActiveTime = this.getSessionData('lastActiveTime');
    const pauseDuration = lastActiveTime ? Date.now() - lastActiveTime : 0;
    
    this.setSessionData('totalPauseTime', 
      (this.getSessionData('totalPauseTime') || 0) + pauseDuration
    );
    
    // Sync if we've been away for more than 5 minutes
    if (pauseDuration > 5 * 60 * 1000 && this.isOnline) {
      this.syncSessionData();
    }
    
    logger.debug('Session resumed', 'SESSION_MANAGER', { pauseDuration });
  }

  // Handle session end
  handleSessionEnd() {
    this.setSessionData('sessionEndTime', Date.now());
    this.persistSessionData();
    
    // Try to sync immediately
    if (this.isOnline) {
      this.syncSessionData(true); // Force immediate sync
    }
    
    logger.info('Session ended', 'SESSION_MANAGER');
  }

  // Set session data
  setSessionData(key, value, options = {}) {
    const {
      persist = true,
      sync = true,
      encrypt = false
    } = options;

    // Encrypt sensitive data
    const finalValue = encrypt ? security.encrypt(JSON.stringify(value)) : value;
    
    this.sessionData.set(key, {
      value: finalValue,
      timestamp: Date.now(),
      encrypted: encrypt,
      persist,
      sync
    });

    if (persist) {
      this.persistSessionData();
    }

    if (sync && this.isOnline) {
      this.queueForSync(key, finalValue);
    }

    logger.debug(`Session data set: ${key}`, 'SESSION_MANAGER');
  }

  // Get session data
  getSessionData(key, defaultValue = null) {
    const data = this.sessionData.get(key);
    if (!data) return defaultValue;

    let value = data.value;
    
    // Decrypt if necessary
    if (data.encrypted) {
      try {
        value = JSON.parse(security.decrypt(value));
      } catch (error) {
        logger.error(`Failed to decrypt session data: ${key}`, 'SESSION_MANAGER', error);
        return defaultValue;
      }
    }

    return value;
  }

  // Remove session data
  removeSessionData(key) {
    this.sessionData.delete(key);
    this.persistSessionData();
    
    if (this.isOnline) {
      this.queueForSync(key, null, 'delete');
    }
    
    logger.debug(`Session data removed: ${key}`, 'SESSION_MANAGER');
  }

  // Clear all session data
  clearSessionData() {
    this.sessionData.clear();
    localStorage.removeItem('pwa_session_data');
    
    if (this.isOnline) {
      this.queueForSync('*', null, 'clear');
    }
    
    logger.info('All session data cleared', 'SESSION_MANAGER');
  }

  // Persist session data to localStorage
  persistSessionData() {
    try {
      const persistableData = {};
      
      // Only persist data marked for persistence
      for (const [key, data] of this.sessionData) {
        if (data.persist) {
          persistableData[key] = data;
        }
      }

      const sessionState = {
        version: '1.0',
        sessionId: this.sessionId,
        deviceId: this.deviceId,
        userId: this.userId,
        sessionData: persistableData,
        lastSyncTime: this.lastSyncTime,
        timestamp: Date.now()
      };

      localStorage.setItem('pwa_session_data', JSON.stringify(sessionState));
      
    } catch (error) {
      logger.error('Failed to persist session data', 'SESSION_MANAGER', error);
    }
  }

  // Queue data for sync
  queueForSync(key, value, operation = 'set') {
    this.syncQueue.push({
      key,
      value,
      operation,
      timestamp: Date.now(),
      deviceId: this.deviceId,
      sessionId: this.sessionId
    });

    // Limit queue size
    if (this.syncQueue.length > 100) {
      this.syncQueue = this.syncQueue.slice(-50);
    }
  }

  // Process sync queue
  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;

    const operations = [...this.syncQueue];
    this.syncQueue = [];

    try {
      await this.sendSyncOperations(operations);
      logger.info(`Processed ${operations.length} sync operations`, 'SESSION_MANAGER');
    } catch (error) {
      // Re-queue failed operations
      this.syncQueue.unshift(...operations);
      logger.error('Failed to process sync queue', 'SESSION_MANAGER', error);
    }
  }

  // Send sync operations to server
  async sendSyncOperations(operations) {
    if (!this.userId) {
      logger.debug('No user ID - skipping sync', 'SESSION_MANAGER');
      return;
    }

    const syncData = {
      userId: this.userId,
      deviceId: this.deviceId,
      sessionId: this.sessionId,
      operations,
      timestamp: Date.now()
    };

    const response = await fetch('/api/v1/session/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(syncData)
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle server response
    if (result.conflicts) {
      await this.resolveConflicts(result.conflicts);
    }

    this.lastSyncTime = Date.now();
    this.persistSessionData();
  }

  // Sync session data with server
  async syncSessionData(force = false) {
    if (!this.userId || (!force && !this.shouldSync())) {
      return;
    }

    try {
      await this.processSyncQueue();
      
      // Get latest data from server
      const response = await fetch(`/api/v1/session/${this.userId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (response.ok) {
        const serverData = await response.json();
        await this.mergeServerData(serverData);
      }

    } catch (error) {
      logger.error('Session sync failed', 'SESSION_MANAGER', error);
    }
  }

  // Check if sync is needed
  shouldSync() {
    if (!this.lastSyncTime) return true;
    
    const timeSinceLastSync = Date.now() - this.lastSyncTime;
    return timeSinceLastSync > 5 * 60 * 1000; // 5 minutes
  }

  // Merge server data with local data
  async mergeServerData(serverData) {
    if (!serverData.sessionData) return;

    for (const [key, serverValue] of Object.entries(serverData.sessionData)) {
      const localData = this.sessionData.get(key);
      
      if (!localData) {
        // Server has data we don't have locally
        this.sessionData.set(key, {
          value: serverValue.value,
          timestamp: serverValue.timestamp,
          encrypted: serverValue.encrypted,
          persist: true,
          sync: true
        });
      } else if (serverValue.timestamp > localData.timestamp) {
        // Server data is newer
        this.sessionData.set(key, {
          ...localData,
          value: serverValue.value,
          timestamp: serverValue.timestamp
        });
      }
    }

    this.persistSessionData();
    logger.info('Server data merged', 'SESSION_MANAGER');
  }

  // Resolve sync conflicts
  async resolveConflicts(conflicts) {
    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict);
      
      if (resolution) {
        this.setSessionData(conflict.key, resolution.value, {
          persist: true,
          sync: false // Don't sync the resolution to avoid loops
        });
      }
    }
  }

  // Resolve individual conflict
  async resolveConflict(conflict) {
    const { key, localValue, serverValue, localTimestamp, serverTimestamp } = conflict;
    
    // Default resolution: use the newer value
    if (serverTimestamp > localTimestamp) {
      return { value: serverValue, source: 'server' };
    } else {
      return { value: localValue, source: 'local' };
    }
  }

  // Handle cross-tab synchronization
  handleCrossTabSync(syncData) {
    if (!syncData) return;

    try {
      const data = JSON.parse(syncData);
      
      // Ignore sync from same tab
      if (data.sessionId === this.sessionId) return;
      
      // Merge data from other tab
      for (const [syncKey, value] of Object.entries(data.changes)) {
        const currentData = this.sessionData.get(syncKey);
        
        if (!currentData || value.timestamp > currentData.timestamp) {
          this.sessionData.set(syncKey, value);
        }
      }
      
      logger.debug('Cross-tab sync processed', 'SESSION_MANAGER');
      
    } catch (error) {
      logger.error('Failed to process cross-tab sync', 'SESSION_MANAGER', error);
    }
  }

  // Broadcast changes to other tabs
  broadcastToOtherTabs(changes) {
    const syncData = {
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      changes,
      timestamp: Date.now()
    };

    localStorage.setItem('pwa_session_sync', JSON.stringify(syncData));
    
    // Remove the sync data after a short delay
    setTimeout(() => {
      localStorage.removeItem('pwa_session_sync');
    }, 1000);
  }

  // Set user ID and enable sync
  setUserId(userId) {
    this.userId = userId;
    this.setSessionData('userId', userId, { persist: true, sync: true });
    
    // Trigger initial sync
    if (this.isOnline) {
      this.syncSessionData(true);
    }
    
    logger.info(`User ID set: ${userId}`, 'SESSION_MANAGER');
  }

  // Get auth token for API requests
  getAuthToken() {
    return localStorage.getItem('auth_token') || '';
  }

  // Get session statistics
  getSessionStats() {
    const sessionStartTime = this.getSessionData('sessionStartTime') || Date.now();
    const totalPauseTime = this.getSessionData('totalPauseTime') || 0;
    
    return {
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      userId: this.userId,
      sessionDuration: Date.now() - sessionStartTime,
      totalPauseTime,
      activeTime: (Date.now() - sessionStartTime) - totalPauseTime,
      dataKeys: Array.from(this.sessionData.keys()),
      syncQueueSize: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime,
      isOnline: this.isOnline
    };
  }

  // Export session data for debugging
  exportSessionData() {
    const data = {};
    
    for (const [key, value] of this.sessionData) {
      data[key] = {
        ...value,
        value: value.encrypted ? '[ENCRYPTED]' : value.value
      };
    }
    
    return {
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      userId: this.userId,
      sessionData: data,
      syncQueue: this.syncQueue,
      stats: this.getSessionStats()
    };
  }
}

// Create singleton instance
const pwaSessionManager = new PWASessionManager();

export default pwaSessionManager;