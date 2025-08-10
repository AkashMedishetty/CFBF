import logger from './logger';

class SessionManager {
  constructor() {
    this.dbName = 'CFBSessionDB';
    this.dbVersion = 1;
    this.storeName = 'sessions';
    this.db = null;
    this.isInitialized = false;
    
    // Session configuration
    this.config = {
      maxSessionDuration: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      refreshThreshold: 24 * 60 * 60 * 1000, // Refresh if token expires within 24 hours
      backgroundRefreshInterval: 60 * 60 * 1000, // Check every hour
      encryptionKey: this.generateEncryptionKey()
    };
    
    this.backgroundRefreshTimer = null;
    
    logger.info('SessionManager initialized', 'SESSION_MANAGER', {
      maxSessionDuration: this.config.maxSessionDuration / (24 * 60 * 60 * 1000) + ' days',
      refreshThreshold: this.config.refreshThreshold / (60 * 60 * 1000) + ' hours'
    });
  }

  // Initialize IndexedDB
  async init() {
    if (this.isInitialized) return;
    
    try {
      logger.debug('Initializing IndexedDB for session storage', 'SESSION_MANAGER');
      
      this.db = await this.openDB();
      this.isInitialized = true;
      
      // Start background refresh timer
      this.startBackgroundRefresh();
      
      // Clean up expired sessions
      await this.cleanupExpiredSessions();
      
      logger.success('SessionManager initialized successfully', 'SESSION_MANAGER');
    } catch (error) {
      logger.error('Failed to initialize SessionManager', 'SESSION_MANAGER', error);
      // Fallback to localStorage if IndexedDB fails
      this.isInitialized = true;
    }
  }

  // Open IndexedDB connection
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        logger.error('Failed to open IndexedDB', 'SESSION_MANAGER', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        logger.debug('IndexedDB opened successfully', 'SESSION_MANAGER');
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        logger.debug('Upgrading IndexedDB schema', 'SESSION_MANAGER');
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
          logger.debug('Created session object store', 'SESSION_MANAGER');
        }
      };
    });
  }

  // Generate encryption key for sensitive data
  generateEncryptionKey() {
    // In a real implementation, this should be more secure
    // For now, we'll use a simple key derived from device info
    const deviceInfo = navigator.userAgent + navigator.language + window.screen.width + window.screen.height;
    return btoa(deviceInfo).substring(0, 32);
  }

  // Simple encryption for sensitive data
  encrypt(data) {
    try {
      // Simple XOR encryption (in production, use proper encryption)
      const key = this.config.encryptionKey;
      let encrypted = '';
      for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return btoa(encrypted);
    } catch (error) {
      logger.warn('Encryption failed, storing data unencrypted', 'SESSION_MANAGER', error);
      return data;
    }
  }

  // Simple decryption for sensitive data
  decrypt(encryptedData) {
    try {
      const key = this.config.encryptionKey;
      const data = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < data.length; i++) {
        decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return decrypted;
    } catch (error) {
      logger.warn('Decryption failed, returning data as-is', 'SESSION_MANAGER', error);
      return encryptedData;
    }
  }

  // Store session data
  async storeSession(sessionData) {
    await this.init();
    
    try {
      const sessionId = 'current_session';
      const expiresAt = Date.now() + this.config.maxSessionDuration;
      
      const sessionRecord = {
        id: sessionId,
        userId: sessionData.user?.id || sessionData.user?._id,
        user: sessionData.user,
        tokens: {
          accessToken: this.encrypt(sessionData.tokens.accessToken),
          refreshToken: this.encrypt(sessionData.tokens.refreshToken),
          expiresIn: sessionData.tokens.expiresIn
        },
        createdAt: Date.now(),
        expiresAt,
        lastAccessed: Date.now(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform
        }
      };

      if (this.db) {
        // Store in IndexedDB (promisified)
        await new Promise((resolve, reject) => {
          const transaction = this.db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.put(sessionRecord);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        
        logger.success('Session stored in IndexedDB', 'SESSION_MANAGER', {
          userId: sessionRecord.userId,
          expiresAt: new Date(expiresAt).toISOString()
        });
      } else {
        // Fallback to localStorage
        localStorage.setItem('cfb_session', JSON.stringify(sessionRecord));
        logger.success('Session stored in localStorage (fallback)', 'SESSION_MANAGER');
      }

      // Also store in localStorage for quick access
      localStorage.setItem('token', sessionData.tokens.accessToken);
      localStorage.setItem('refreshToken', sessionData.tokens.refreshToken);
      
    } catch (error) {
      logger.error('Failed to store session', 'SESSION_MANAGER', error);
      throw error;
    }
  }

  // Retrieve session data
  async getSession() {
    await this.init();
    
    try {
      const sessionId = 'current_session';
      let sessionRecord = null;

      if (this.db) {
        // Try IndexedDB first (promisified)
        sessionRecord = await new Promise((resolve, reject) => {
          const transaction = this.db.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.get(sessionId);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });
      }

      if (!sessionRecord) {
        // Fallback to localStorage
        const stored = localStorage.getItem('cfb_session');
        if (stored) {
          sessionRecord = JSON.parse(stored);
        }
      }

      if (!sessionRecord) {
        logger.debug('No session found', 'SESSION_MANAGER');
        return null;
      }

      // Check if session is expired
      if (Date.now() > sessionRecord.expiresAt) {
        logger.warn('Session expired, cleaning up', 'SESSION_MANAGER');
        await this.clearSession();
        return null;
      }

      // Update last accessed time
      sessionRecord.lastAccessed = Date.now();
      await this.updateSessionAccess(sessionRecord);

      // Decrypt tokens
      const decryptedSession = {
        ...sessionRecord,
        tokens: {
          accessToken: this.decrypt(sessionRecord.tokens.accessToken),
          refreshToken: this.decrypt(sessionRecord.tokens.refreshToken),
          expiresIn: sessionRecord.tokens.expiresIn
        }
      };

      logger.debug('Session retrieved successfully', 'SESSION_MANAGER', {
        userId: sessionRecord.userId,
        lastAccessed: new Date(sessionRecord.lastAccessed).toISOString()
      });

      return decryptedSession;
      
    } catch (error) {
      logger.error('Failed to retrieve session', 'SESSION_MANAGER', error);
      return null;
    }
  }

  // Update session access time
  async updateSessionAccess(sessionRecord) {
    try {
      if (this.db) {
        await new Promise((resolve, reject) => {
          const transaction = this.db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.put(sessionRecord);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } else {
        localStorage.setItem('cfb_session', JSON.stringify(sessionRecord));
      }
    } catch (error) {
      logger.warn('Failed to update session access time', 'SESSION_MANAGER', error);
    }
  }

  // Clear session data
  async clearSession() {
    await this.init();
    
    try {
      const sessionId = 'current_session';

      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        await store.delete(sessionId);
      }

      // Clear localStorage
      localStorage.removeItem('cfb_session');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      logger.success('Session cleared successfully', 'SESSION_MANAGER');
      
    } catch (error) {
      logger.error('Failed to clear session', 'SESSION_MANAGER', error);
    }
  }

  // Check if token needs refresh
  shouldRefreshToken(tokenExpiresIn) {
    if (!tokenExpiresIn) return true;
    
    // Convert expiresIn (seconds) to milliseconds and check if it expires within threshold
    const expiresAt = Date.now() + (tokenExpiresIn * 1000);
    return (expiresAt - Date.now()) < this.config.refreshThreshold;
  }

  // Background token refresh
  startBackgroundRefresh() {
    if (this.backgroundRefreshTimer) {
      clearInterval(this.backgroundRefreshTimer);
    }

    this.backgroundRefreshTimer = setInterval(async () => {
      try {
        const session = await this.getSession();
        if (!session) return;

        if (this.shouldRefreshToken(session.tokens.expiresIn)) {
          logger.debug('Background token refresh triggered', 'SESSION_MANAGER');
          await this.refreshTokens(session);
        }
      } catch (error) {
        logger.error('Background refresh failed', 'SESSION_MANAGER', error);
      }
    }, this.config.backgroundRefreshInterval);

    logger.debug('Background refresh timer started', 'SESSION_MANAGER');
  }

  // Refresh tokens
  async refreshTokens(session) {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: session.tokens.refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update session with new tokens
          const updatedSession = {
            ...session,
            tokens: {
              accessToken: data.data.accessToken,
              refreshToken: session.tokens.refreshToken, // Keep existing refresh token
              expiresIn: data.data.expiresIn
            },
            lastAccessed: Date.now()
          };

          await this.storeSession(updatedSession);
          logger.success('Tokens refreshed successfully', 'SESSION_MANAGER');
          return updatedSession;
        }
      }

      throw new Error('Token refresh failed');
      
    } catch (error) {
      logger.error('Token refresh failed', 'SESSION_MANAGER', error);
      // Clear session if refresh fails
      await this.clearSession();
      throw error;
    }
  }

  // Clean up expired sessions
  async cleanupExpiredSessions() {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('expiresAt');
      
      const range = IDBKeyRange.upperBound(Date.now());
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      logger.debug('Expired sessions cleaned up', 'SESSION_MANAGER');
      
    } catch (error) {
      logger.warn('Failed to cleanup expired sessions', 'SESSION_MANAGER', error);
    }
  }

  // Get session info for debugging
  async getSessionInfo() {
    const session = await this.getSession();
    if (!session) return null;

    return {
      userId: session.userId,
      createdAt: new Date(session.createdAt).toISOString(),
      expiresAt: new Date(session.expiresAt).toISOString(),
      lastAccessed: new Date(session.lastAccessed).toISOString(),
      timeUntilExpiry: session.expiresAt - Date.now(),
      deviceInfo: session.deviceInfo
    };
  }

  // Destroy session manager
  destroy() {
    if (this.backgroundRefreshTimer) {
      clearInterval(this.backgroundRefreshTimer);
      this.backgroundRefreshTimer = null;
    }

    if (this.db) {
      this.db.close();
      this.db = null;
    }

    this.isInitialized = false;
    logger.debug('SessionManager destroyed', 'SESSION_MANAGER');
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;