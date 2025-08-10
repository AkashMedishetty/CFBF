import sessionManager from './sessionManager';
import logger from './logger';

class SessionRestoration {
  constructor() {
    this.isRestoring = false;
    this.restorationCallbacks = [];
    
    logger.debug('SessionRestoration initialized', 'SESSION_RESTORATION');
  }

  // Register callback for session restoration events
  onSessionRestored(callback) {
    this.restorationCallbacks.push(callback);
  }

  // Remove callback
  removeSessionRestoredCallback(callback) {
    this.restorationCallbacks = this.restorationCallbacks.filter(cb => cb !== callback);
  }

  // Notify all callbacks about session restoration
  notifySessionRestored(session) {
    this.restorationCallbacks.forEach(callback => {
      try {
        callback(session);
      } catch (error) {
        logger.error('Session restoration callback failed', 'SESSION_RESTORATION', error);
      }
    });
  }

  // Check if this is a PWA restart
  isPWARestart() {
    // Check various indicators that suggest this is a PWA restart
    const indicators = {
      // Check if we're in standalone mode (PWA)
      isStandalone: window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone === true,
      
      // Check if there's a session but no current auth state
      hasPersistedSession: false, // Will be set after checking
      
      // Check if this is a fresh page load (not a navigation)
      isFreshLoad: performance.navigation?.type === performance.navigation.TYPE_RELOAD ||
                   performance.getEntriesByType('navigation')[0]?.type === 'reload',
      
      // Check if there's no referrer (direct access)
      noReferrer: !document.referrer || document.referrer === window.location.href
    };

    logger.debug('PWA restart indicators', 'SESSION_RESTORATION', indicators);

    return indicators.isStandalone && (indicators.isFreshLoad || indicators.noReferrer);
  }

  // Attempt to restore session after PWA restart
  async restoreSession() {
    if (this.isRestoring) {
      logger.debug('Session restoration already in progress', 'SESSION_RESTORATION');
      return null;
    }

    this.isRestoring = true;

    try {
      logger.info('Attempting session restoration', 'SESSION_RESTORATION');

      // Initialize session manager
      await sessionManager.init();

      // Get persisted session
      const session = await sessionManager.getSession();

      if (!session) {
        logger.debug('No persisted session found for restoration', 'SESSION_RESTORATION');
        return null;
      }

      // Validate session integrity
      if (!this.validateSessionIntegrity(session)) {
        logger.warn('Session integrity validation failed', 'SESSION_RESTORATION');
        await sessionManager.clearSession();
        return null;
      }

      // Check if session needs refresh
      if (sessionManager.shouldRefreshToken(session.tokens.expiresIn)) {
        logger.debug('Refreshing tokens during session restoration', 'SESSION_RESTORATION');
        try {
          const refreshedSession = await sessionManager.refreshTokens(session);
          session.tokens = refreshedSession.tokens;
        } catch (refreshError) {
          logger.warn('Token refresh failed during restoration', 'SESSION_RESTORATION', refreshError);
          await sessionManager.clearSession();
          return null;
        }
      }

      // Restore application state
      await this.restoreApplicationState(session);

      logger.success('Session restored successfully', 'SESSION_RESTORATION', {
        userId: session.userId,
        lastAccessed: new Date(session.lastAccessed).toISOString()
      });

      // Notify callbacks
      this.notifySessionRestored(session);

      return session;

    } catch (error) {
      logger.error('Session restoration failed', 'SESSION_RESTORATION', error);
      // Clear potentially corrupted session
      await sessionManager.clearSession();
      return null;
    } finally {
      this.isRestoring = false;
    }
  }

  // Validate session integrity
  validateSessionIntegrity(session) {
    try {
      // Check required fields
      const requiredFields = ['userId', 'user', 'tokens', 'createdAt', 'expiresAt'];
      for (const field of requiredFields) {
        if (!session[field]) {
          logger.warn(`Session missing required field: ${field}`, 'SESSION_RESTORATION');
          return false;
        }
      }

      // Check token structure
      if (!session.tokens.accessToken || !session.tokens.refreshToken) {
        logger.warn('Session missing required tokens', 'SESSION_RESTORATION');
        return false;
      }

      // Check expiration
      if (Date.now() > session.expiresAt) {
        logger.warn('Session has expired', 'SESSION_RESTORATION');
        return false;
      }

      // Check device consistency (optional security check)
      if (session.deviceInfo) {
        const currentDeviceInfo = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform
        };

        // Allow some flexibility in device info matching
        if (session.deviceInfo.userAgent !== currentDeviceInfo.userAgent) {
          logger.warn('Device info mismatch detected', 'SESSION_RESTORATION', {
            stored: session.deviceInfo.userAgent,
            current: currentDeviceInfo.userAgent
          });
          // Don't fail validation for device info mismatch, just log it
        }
      }

      return true;
    } catch (error) {
      logger.error('Session integrity validation error', 'SESSION_RESTORATION', error);
      return false;
    }
  }

  // Restore application state from session
  async restoreApplicationState(session) {
    try {
      logger.debug('Restoring application state', 'SESSION_RESTORATION');

      // Restore tokens to localStorage for API calls
      localStorage.setItem('token', session.tokens.accessToken);
      localStorage.setItem('refreshToken', session.tokens.refreshToken);

      // Restore any cached data that might be needed
      await this.restoreCachedData(session);

      // Restore UI state if needed
      await this.restoreUIState(session);

      logger.debug('Application state restored', 'SESSION_RESTORATION');
    } catch (error) {
      logger.error('Failed to restore application state', 'SESSION_RESTORATION', error);
      throw error;
    }
  }

  // Restore cached data
  async restoreCachedData(session) {
    try {
      // This could include restoring:
      // - User preferences
      // - Cached API responses
      // - Form data
      // - Navigation state

      logger.debug('Cached data restoration completed', 'SESSION_RESTORATION');
    } catch (error) {
      logger.warn('Failed to restore cached data', 'SESSION_RESTORATION', error);
      // Don't throw - this is not critical
    }
  }

  // Restore UI state
  async restoreUIState(session) {
    try {
      // This could include restoring:
      // - Theme preferences
      // - Language settings
      // - Layout preferences
      // - Last visited page

      // Example: Restore theme
      const theme = localStorage.getItem('theme');
      if (theme) {
        document.documentElement.setAttribute('data-theme', theme);
      }

      logger.debug('UI state restoration completed', 'SESSION_RESTORATION');
    } catch (error) {
      logger.warn('Failed to restore UI state', 'SESSION_RESTORATION', error);
      // Don't throw - this is not critical
    }
  }

  // Save current application state for future restoration
  async saveApplicationState(additionalData = {}) {
    try {
      const session = await sessionManager.getSession();
      if (!session) return;

      // Save current state data
      const stateData = {
        currentPath: window.location.pathname,
        timestamp: Date.now(),
        theme: localStorage.getItem('theme'),
        language: localStorage.getItem('language'),
        ...additionalData
      };

      // Store state data (could be in IndexedDB or localStorage)
      localStorage.setItem('cfb_app_state', JSON.stringify(stateData));

      logger.debug('Application state saved', 'SESSION_RESTORATION', stateData);
    } catch (error) {
      logger.warn('Failed to save application state', 'SESSION_RESTORATION', error);
    }
  }

  // Get saved application state
  getSavedApplicationState() {
    try {
      const saved = localStorage.getItem('cfb_app_state');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      logger.warn('Failed to get saved application state', 'SESSION_RESTORATION', error);
      return null;
    }
  }

  // Clear saved application state
  clearSavedApplicationState() {
    try {
      localStorage.removeItem('cfb_app_state');
      logger.debug('Saved application state cleared', 'SESSION_RESTORATION');
    } catch (error) {
      logger.warn('Failed to clear saved application state', 'SESSION_RESTORATION', error);
    }
  }

  // Handle PWA visibility change (app coming back to foreground)
  handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      logger.debug('PWA became visible, checking session', 'SESSION_RESTORATION');
      
      // Check if session needs refresh when app becomes visible
      setTimeout(async () => {
        try {
          const session = await sessionManager.getSession();
          if (session && sessionManager.shouldRefreshToken(session.tokens.expiresIn)) {
            logger.debug('Refreshing tokens after visibility change', 'SESSION_RESTORATION');
            await sessionManager.refreshTokens(session);
          }
        } catch (error) {
          logger.warn('Token refresh after visibility change failed', 'SESSION_RESTORATION', error);
        }
      }, 1000); // Small delay to ensure app is fully active
    }
  }

  // Initialize session restoration listeners
  initializeListeners() {
    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Listen for page unload to save state
    window.addEventListener('beforeunload', () => {
      this.saveApplicationState();
    });

    // Listen for PWA install/update events
    window.addEventListener('appinstalled', () => {
      logger.info('PWA installed, session restoration available', 'SESSION_RESTORATION');
    });

    logger.debug('Session restoration listeners initialized', 'SESSION_RESTORATION');
  }
}

// Create singleton instance
const sessionRestoration = new SessionRestoration();

export default sessionRestoration;