import logger from './logger';
import offlineQueueManager from './offlineQueueManager';
import conflictResolver from './conflictResolver';

class OfflineDataManager {
  constructor() {
    this.dbName = 'CFBOfflineDataDB';
    this.dbVersion = 1;
    this.db = null;
    this.isInitialized = false;
    
    // Cache configuration
    this.config = {
      maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      syncInterval: 30 * 60 * 1000, // 30 minutes
      criticalDataTypes: [
        'user_profile',
        'donor_availability',
        'emergency_contacts',
        'blood_requests',
        'nearby_facilities'
      ]
    };
    
    // Data stores
    this.stores = {
      userProfile: 'userProfile',
      donorData: 'donorData',
      bloodRequests: 'bloodRequests',
      facilities: 'facilities',
      emergencyContacts: 'emergencyContacts',
      preferences: 'preferences',
      cachedResponses: 'cachedResponses'
    };
    
    this.syncInProgress = false;
    this.lastSyncTime = null;
    
    logger.info('OfflineDataManager initialized', 'OFFLINE_DATA');
  }

  // Initialize IndexedDB with all required stores
  async init() {
    if (this.isInitialized) return;
    
    try {
      logger.debug('Initializing offline data storage', 'OFFLINE_DATA');
      
      this.db = await this.openDB();
      this.isInitialized = true;
      
      // Start periodic cleanup and sync
      this.startPeriodicMaintenance();
      
      // Load critical data if online
      if (navigator.onLine) {
        await this.loadCriticalData();
      }
      
      logger.success('OfflineDataManager initialized successfully', 'OFFLINE_DATA');
    } catch (error) {
      logger.error('Failed to initialize OfflineDataManager', 'OFFLINE_DATA', error);
      throw error;
    }
  }

  // Open IndexedDB with all required object stores
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        logger.error('Failed to open offline data DB', 'OFFLINE_DATA', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        logger.debug('Offline data DB opened successfully', 'OFFLINE_DATA');
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        logger.debug('Upgrading offline data DB schema', 'OFFLINE_DATA');
        const db = event.target.result;
        
        // Create object stores
        Object.values(this.stores).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('type', 'type', { unique: false });
            store.createIndex('userId', 'userId', { unique: false });
            logger.debug(`Created object store: ${storeName}`, 'OFFLINE_DATA');
          }
        });
      };
    });
  }

  // Store data for offline access
  async storeData(storeName, data, options = {}) {
    await this.init();
    
    try {
      const dataToStore = {
        id: options.id || this.generateId(),
        ...data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (options.maxAge || this.config.maxCacheAge),
        type: options.type || 'general',
        userId: options.userId || this.getCurrentUserId(),
        metadata: {
          source: 'offline_cache',
          version: options.version || 1,
          ...options.metadata
        }
      };

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.put(dataToStore);

      logger.debug(`Data stored offline: ${storeName}`, 'OFFLINE_DATA', {
        id: dataToStore.id,
        type: dataToStore.type
      });

      return dataToStore.id;
      
    } catch (error) {
      logger.error(`Failed to store offline data: ${storeName}`, 'OFFLINE_DATA', error);
      throw error;
    }
  }

  // Retrieve data from offline storage
  async getData(storeName, id = null, options = {}) {
    await this.init();
    
    try {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let data;
      if (id) {
        data = await store.get(id);
        if (data && this.isDataExpired(data)) {
          await this.removeData(storeName, id);
          return null;
        }
      } else {
        // Get all data, filter expired
        const allData = await store.getAll();
        data = allData.filter(item => !this.isDataExpired(item));
        
        // Sort by timestamp (newest first)
        data.sort((a, b) => b.timestamp - a.timestamp);
        
        // Apply filters
        if (options.type) {
          data = data.filter(item => item.type === options.type);
        }
        if (options.userId) {
          data = data.filter(item => item.userId === options.userId);
        }
        if (options.limit) {
          data = data.slice(0, options.limit);
        }
      }

      logger.debug(`Data retrieved from offline storage: ${storeName}`, 'OFFLINE_DATA', {
        id,
        count: Array.isArray(data) ? data.length : (data ? 1 : 0)
      });

      return data;
      
    } catch (error) {
      logger.error(`Failed to retrieve offline data: ${storeName}`, 'OFFLINE_DATA', error);
      return null;
    }
  }

  // Remove data from offline storage
  async removeData(storeName, id) {
    await this.init();
    
    try {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.delete(id);
      
      logger.debug(`Data removed from offline storage: ${storeName}`, 'OFFLINE_DATA', { id });
    } catch (error) {
      logger.error(`Failed to remove offline data: ${storeName}`, 'OFFLINE_DATA', error);
    }
  }

  // Check if data is expired
  isDataExpired(data) {
    return Date.now() > data.expiresAt;
  }

  // Generate unique ID
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  // Get current user ID
  getCurrentUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || user._id || 'anonymous';
    } catch (error) {
      return 'anonymous';
    }
  }

  // Load critical data for offline access
  async loadCriticalData() {
    if (!navigator.onLine) {
      logger.debug('Device offline, skipping critical data load', 'OFFLINE_DATA');
      return;
    }

    try {
      logger.info('Loading critical data for offline access', 'OFFLINE_DATA');
      
      const token = localStorage.getItem('token');
      if (!token) {
        logger.debug('No auth token, skipping authenticated data load', 'OFFLINE_DATA');
        return;
      }

      // Load user profile
      await this.loadUserProfile(token);
      
      // Load donor availability
      await this.loadDonorAvailability(token);
      
      // Load recent blood requests
      await this.loadRecentBloodRequests(token);
      
      // Load nearby facilities
      await this.loadNearbyFacilities();
      
      // Load emergency contacts
      await this.loadEmergencyContacts(token);
      
      this.lastSyncTime = Date.now();
      logger.success('Critical data loaded for offline access', 'OFFLINE_DATA');
      
    } catch (error) {
      logger.error('Failed to load critical data', 'OFFLINE_DATA', error);
    }
  }

  // Load user profile
  async loadUserProfile(token) {
    try {
      const response = await fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        await this.storeData(this.stores.userProfile, data.data.user, {
          id: 'current_user',
          type: 'user_profile'
        });
      }
    } catch (error) {
      logger.warn('Failed to load user profile', 'OFFLINE_DATA', error);
    }
  }

  // Load donor availability
  async loadDonorAvailability(token) {
    try {
      const response = await fetch('/api/v1/donors/availability', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        await this.storeData(this.stores.donorData, data.data, {
          id: 'donor_availability',
          type: 'donor_availability'
        });
      }
    } catch (error) {
      logger.warn('Failed to load donor availability', 'OFFLINE_DATA', error);
    }
  }

  // Load recent blood requests
  async loadRecentBloodRequests(token) {
    try {
      const response = await fetch('/api/v1/blood-requests?limit=50&status=active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          for (const request of data.data) {
            await this.storeData(this.stores.bloodRequests, request, {
              id: request.id || request._id,
              type: 'blood_request'
            });
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to load blood requests', 'OFFLINE_DATA', error);
    }
  }

  // Load nearby facilities
  async loadNearbyFacilities() {
    try {
      // Get user location if available
      const position = await this.getCurrentPosition();
      const params = position 
        ? `?lat=${position.latitude}&lng=${position.longitude}&radius=25`
        : '?limit=20';
      
      const response = await fetch(`/api/v1/public/facilities/nearby${params}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          for (const facility of data.data) {
            await this.storeData(this.stores.facilities, facility, {
              id: facility.id || facility._id,
              type: 'facility'
            });
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to load nearby facilities', 'OFFLINE_DATA', error);
    }
  }

  // Load emergency contacts
  async loadEmergencyContacts(token) {
    try {
      const response = await fetch('/api/v1/users/emergency-contacts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        await this.storeData(this.stores.emergencyContacts, data.data, {
          id: 'emergency_contacts',
          type: 'emergency_contacts'
        });
      }
    } catch (error) {
      logger.warn('Failed to load emergency contacts', 'OFFLINE_DATA', error);
    }
  }

  // Get current position
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        position => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
        error => reject(error),
        { timeout: 10000, maximumAge: 300000 } // 5 minute cache
      );
    });
  }

  // Sync offline changes with server
  async syncOfflineChanges() {
    if (this.syncInProgress || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;
    
    try {
      logger.info('Starting offline data sync', 'OFFLINE_DATA');
      
      // Sync queued actions first
      await offlineQueueManager.syncQueue();
      
      // Detect and resolve conflicts
      await this.detectAndResolveConflicts();
      
      // Refresh critical data
      await this.loadCriticalData();
      
      logger.success('Offline data sync completed', 'OFFLINE_DATA');
      
    } catch (error) {
      logger.error('Offline data sync failed', 'OFFLINE_DATA', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Detect and resolve data conflicts
  async detectAndResolveConflicts() {
    try {
      // Get local user profile
      const localProfile = await this.getData(this.stores.userProfile, 'current_user');
      if (!localProfile) return;

      // Get server profile
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return;

      const serverData = await response.json();
      const serverProfile = serverData.data.user;

      // Detect conflicts
      const conflicts = conflictResolver.detectConflicts(
        localProfile,
        serverProfile,
        'profile_update'
      );

      if (conflicts.length > 0) {
        logger.info(`Detected ${conflicts.length} profile conflicts`, 'OFFLINE_DATA');
        
        // Resolve conflicts
        const resolutions = await conflictResolver.resolveMultipleConflicts(conflicts);
        
        // Apply resolutions
        for (const resolution of resolutions.results) {
          if (resolution.resolution.success) {
            const resolvedData = await conflictResolver.applyResolution(
              localProfile,
              resolution.resolution.resolution
            );
            
            // Update local storage with resolved data
            await this.storeData(this.stores.userProfile, resolvedData, {
              id: 'current_user',
              type: 'user_profile'
            });
          }
        }
      }
      
    } catch (error) {
      logger.error('Conflict detection and resolution failed', 'OFFLINE_DATA', error);
    }
  }

  // Start periodic maintenance tasks
  startPeriodicMaintenance() {
    // Cleanup expired data every hour
    setInterval(() => {
      this.cleanupExpiredData();
    }, 60 * 60 * 1000);

    // Sync data every 30 minutes when online
    setInterval(() => {
      if (navigator.onLine) {
        this.syncOfflineChanges();
      }
    }, this.config.syncInterval);

    // Sync when coming back online
    window.addEventListener('online', () => {
      logger.info('Device came online, starting data sync', 'OFFLINE_DATA');
      setTimeout(() => this.syncOfflineChanges(), 2000);
    });

    logger.debug('Periodic maintenance started', 'OFFLINE_DATA');
  }

  // Clean up expired data
  async cleanupExpiredData() {
    await this.init();
    
    try {
      logger.debug('Starting expired data cleanup', 'OFFLINE_DATA');
      
      let totalCleaned = 0;
      
      for (const storeName of Object.values(this.stores)) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const allData = await store.getAll();
        
        let cleanedCount = 0;
        for (const item of allData) {
          if (this.isDataExpired(item)) {
            await store.delete(item.id);
            cleanedCount++;
          }
        }
        
        totalCleaned += cleanedCount;
        if (cleanedCount > 0) {
          logger.debug(`Cleaned ${cleanedCount} expired items from ${storeName}`, 'OFFLINE_DATA');
        }
      }
      
      if (totalCleaned > 0) {
        logger.success(`Cleanup completed: ${totalCleaned} expired items removed`, 'OFFLINE_DATA');
      }
      
    } catch (error) {
      logger.error('Data cleanup failed', 'OFFLINE_DATA', error);
    }
  }

  // Get offline storage statistics
  async getStorageStats() {
    await this.init();
    
    try {
      const stats = {
        stores: {},
        totalItems: 0,
        totalSize: 0,
        lastSync: this.lastSyncTime,
        isOnline: navigator.onLine
      };

      for (const [key, storeName] of Object.entries(this.stores)) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const allData = await store.getAll();
        
        const storeStats = {
          itemCount: allData.length,
          expiredItems: allData.filter(item => this.isDataExpired(item)).length,
          types: {}
        };

        // Count by type
        allData.forEach(item => {
          storeStats.types[item.type] = (storeStats.types[item.type] || 0) + 1;
        });

        stats.stores[key] = storeStats;
        stats.totalItems += storeStats.itemCount;
      }

      return stats;
      
    } catch (error) {
      logger.error('Failed to get storage stats', 'OFFLINE_DATA', error);
      return null;
    }
  }

  // Clear all offline data
  async clearAllData() {
    await this.init();
    
    try {
      for (const storeName of Object.values(this.stores)) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await store.clear();
      }
      
      this.lastSyncTime = null;
      logger.success('All offline data cleared', 'OFFLINE_DATA');
      
    } catch (error) {
      logger.error('Failed to clear offline data', 'OFFLINE_DATA', error);
    }
  }

  // Destroy offline data manager
  destroy() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    
    this.isInitialized = false;
    logger.debug('OfflineDataManager destroyed', 'OFFLINE_DATA');
  }
}

// Create singleton instance
const offlineDataManager = new OfflineDataManager();

export default offlineDataManager;