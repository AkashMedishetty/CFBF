import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../utils/api';
import logger from '../utils/logger';

const AuthContext = createContext();

// Token management utilities
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const AUTH_STATE_KEY = 'authState';

const tokenManager = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token) => {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },
  getUser: () => {
    try {
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      logger.error('Failed to parse user data from localStorage', 'AUTH_CONTEXT', error);
      return null;
    }
  },
  setUser: (user) => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },
  getAuthState: () => {
    try {
      const authState = localStorage.getItem(AUTH_STATE_KEY);
      return authState ? JSON.parse(authState) : null;
    } catch (error) {
      logger.error('Failed to parse auth state from localStorage', 'AUTH_CONTEXT', error);
      return null;
    }
  },
  setAuthState: (state) => {
    if (state) {
      localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(AUTH_STATE_KEY);
    }
  },
  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(AUTH_STATE_KEY);
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      isAuthenticated: false,
      user: null,
      loading: false, // Changed from isLoading to loading to match ProtectedRoute
      error: null,
      login: async () => ({ success: false, error: 'Auth context not available' }),
      logout: () => {},
      refreshAuth: async () => ({ success: false, error: 'Auth context not available' }),
      clearError: () => {},
      handleEnableNotifications: () => {},
      isEnablingPush: false,
      pushEnabled: false
    };
  }
  return {
    ...context,
    loading: context.isLoading // Map isLoading to loading for consistency
  };
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Refresh authentication token
  const refreshAuth = useCallback(async () => {
    if (isRefreshing) {
      logger.debug('Token refresh already in progress', 'AUTH_CONTEXT');
      return { success: false, error: 'Refresh already in progress' };
    }

    setIsRefreshing(true);
    
    try {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      logger.info('Refreshing authentication token', 'AUTH_CONTEXT');
      const response = await authApi.refreshToken(refreshToken);

      if (response.success && response.data) {
        const { accessToken, refreshToken: newRefreshToken, user: userData } = response.data;
        
        // Update tokens
        tokenManager.setToken(accessToken);
        if (newRefreshToken) {
          tokenManager.setRefreshToken(newRefreshToken);
        }
        
        // Update user data if provided
        if (userData) {
          setUser(userData);
          tokenManager.setUser(userData);
        }
        
        // Update auth state
        tokenManager.setAuthState({ timestamp: Date.now(), verified: true });
        setIsAuthenticated(true);
        setError(null);
        
        logger.success('Token refreshed successfully', 'AUTH_CONTEXT');
        return { success: true };
      } else {
        throw new Error(response.error?.message || 'Token refresh failed');
      }
    } catch (error) {
      logger.error('Token refresh failed', 'AUTH_CONTEXT', error);
      
      // Clear invalid tokens
      tokenManager.clearAll();
      setIsAuthenticated(false);
      setUser(null);
      setError('Session expired. Please sign in again.');
      
      return { success: false, error: error.message };
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initialize authentication state from localStorage
  const initializeAuth = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (isInitialized || isInitializing) {
      logger.debug('Auth already initialized or initializing, skipping', 'AUTH_CONTEXT');
      return;
    }
    
    setIsInitializing(true);
    setIsLoading(true);
    setError(null);

    try {
      logger.info('Initializing authentication state', 'AUTH_CONTEXT');

      const token = tokenManager.getToken();
      const cachedUser = tokenManager.getUser();
      const cachedAuthState = tokenManager.getAuthState();

      if (!token) {
        logger.info('No token found, user not authenticated', 'AUTH_CONTEXT');
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      // If we have cached user data and it's recent, use it without API call
      if (cachedUser && cachedAuthState && cachedAuthState.timestamp) {
        const cacheAge = Date.now() - cachedAuthState.timestamp;
        const maxCacheAge = 5 * 60 * 1000; // 5 minutes - shorter cache to avoid stale data

        if (cacheAge < maxCacheAge) {
          // Normalize cached user data
          const normalizedCachedUser = {
            ...cachedUser,
            id: cachedUser.id || cachedUser._id,
            _id: cachedUser._id || cachedUser.id,
            name: cachedUser.name || `${cachedUser.firstName || ''} ${cachedUser.lastName || ''}`.trim() || cachedUser.email?.split('@')[0] || 'User',
            status: cachedUser.status || 'pending'
          };
          
          logger.info('Using cached user data', 'AUTH_CONTEXT', { 
            cacheAge: Math.round(cacheAge / 1000) + 's',
            userName: normalizedCachedUser.name,
            userStatus: normalizedCachedUser.status
          });
          setUser(normalizedCachedUser);
          setIsAuthenticated(true);
          setIsLoading(false);
          setIsInitialized(true);
          return;
        } else {
          logger.info('Cache expired, will verify with server', 'AUTH_CONTEXT', { cacheAge: Math.round(cacheAge / 1000) + 's' });
        }
      }

      // Only verify token with server if cache is expired
      logger.info('Verifying token with server', 'AUTH_CONTEXT');
      const response = await authApi.getCurrentUser();

      if (response.success && response.data?.user) {
        const userData = response.data.user;
        console.log('AuthContext init: server user payload', userData);
        
        // Ensure user data has proper structure
        const normalizedUser = {
          ...userData,
          id: userData.id || userData._id,
          _id: userData._id || userData.id,
          name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email?.split('@')[0] || 'User',
          status: userData.status || 'pending'
        };
        
        logger.success('Token verified, user authenticated', 'AUTH_CONTEXT', { 
          userId: normalizedUser.id,
          userName: normalizedUser.name,
          userStatus: normalizedUser.status
        });
        
        setUser(normalizedUser);
        setIsAuthenticated(true);
        
        // Cache user data and auth state
        tokenManager.setUser(normalizedUser);
        tokenManager.setAuthState({ timestamp: Date.now(), verified: true });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      logger.error('Authentication initialization failed', 'AUTH_CONTEXT', error);
      
      // Try to refresh token if we have a refresh token
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken && !isRefreshing) {
        logger.info('Attempting token refresh', 'AUTH_CONTEXT');
        const refreshResult = await refreshAuth();
        if (!refreshResult.success) {
          // Clear invalid tokens but don't show error immediately
          tokenManager.clearAll();
          setIsAuthenticated(false);
          setUser(null);
          logger.info('Token refresh failed, user will need to login again', 'AUTH_CONTEXT');
        }
      } else {
        // Clear invalid tokens but don't show error immediately
        tokenManager.clearAll();
        setIsAuthenticated(false);
        setUser(null);
        logger.info('No valid tokens found, user needs to login', 'AUTH_CONTEXT');
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
      setIsInitializing(false);
    }
  }, [refreshAuth]);



  // Login function
  const login = useCallback(async (userData, tokens) => {
    try {
      logger.info('Logging in user', 'AUTH_CONTEXT', { userId: userData?.id });
      
      if (!userData || !tokens) {
        throw new Error('Invalid login data provided');
      }

      // Normalize user data for consistent structure
      const normalizedUser = {
        ...userData,
        id: userData.id || userData._id,
        _id: userData._id || userData.id,
        name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email?.split('@')[0] || 'User',
        status: userData.status || 'pending'
      };

      // Store tokens
      if (tokens.accessToken) {
        tokenManager.setToken(tokens.accessToken);
      }
      if (tokens.refreshToken) {
        tokenManager.setRefreshToken(tokens.refreshToken);
      }

      // Store user data
      setUser(normalizedUser);
      setIsAuthenticated(true);
      setError(null);
      
      // Cache user data and auth state
      tokenManager.setUser(normalizedUser);
      tokenManager.setAuthState({ timestamp: Date.now(), verified: true });
      
      logger.success('User logged in successfully', 'AUTH_CONTEXT', { 
        userId: normalizedUser.id,
        userName: normalizedUser.name,
        userStatus: normalizedUser.status
      });
      return { success: true };
    } catch (error) {
      logger.error('Login failed', 'AUTH_CONTEXT', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      logger.info('Logging out user', 'AUTH_CONTEXT');
      
      // Call logout API if we have a token
      const token = tokenManager.getToken();
      if (token) {
        try {
          await authApi.logout();
        } catch (error) {
          // Don't fail logout if API call fails
          logger.warn('Logout API call failed, continuing with local logout', 'AUTH_CONTEXT', error);
        }
      }
      
      // Clear all stored data
      tokenManager.clearAll();
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
      setPushEnabled(false);
      
      logger.success('User logged out successfully', 'AUTH_CONTEXT');
    } catch (error) {
      logger.error('Logout failed', 'AUTH_CONTEXT', error);
      // Still clear local state even if logout fails
      tokenManager.clearAll();
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle push notifications
  const handleEnableNotifications = useCallback(async () => {
    setIsEnablingPush(true);
    try {
      // Add notification enabling logic here
      logger.info('Enabling push notifications', 'AUTH_CONTEXT');
      
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        logger.success('Push notifications enabled', 'AUTH_CONTEXT');
      } else {
        throw new Error('Notification permission denied');
      }
    } catch (error) {
      logger.error('Failed to enable notifications', 'AUTH_CONTEXT', error);
      setError('Failed to enable notifications: ' + error.message);
    } finally {
      setIsEnablingPush(false);
    }
  }, []);

  // Initialize auth on mount - only once
  useEffect(() => {
    if (!isInitialized && !isInitializing) {
      initializeAuth();
    }
  }, [initializeAuth]); // Include initializeAuth but it's memoized with useCallback

  // Set up token refresh interval - very infrequent to avoid loops
  useEffect(() => {
    if (!isAuthenticated || !isInitialized) return;

    const refreshInterval = setInterval(async () => {
      const token = tokenManager.getToken();
      if (token && !isRefreshing && isAuthenticated) {
        // Check if token needs refresh (refresh 15 minutes before expiry)
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const expiryTime = tokenPayload.exp * 1000;
          const currentTime = Date.now();
          const timeUntilExpiry = expiryTime - currentTime;
          
          // Only refresh if token expires in less than 15 minutes
          if (timeUntilExpiry < 15 * 60 * 1000 && timeUntilExpiry > 0) {
            logger.info('Token expiring soon, refreshing', 'AUTH_CONTEXT');
            await refreshAuth();
          }
        } catch (error) {
          logger.warn('Failed to parse token for expiry check', 'AUTH_CONTEXT', error);
        }
      }
    }, 30 * 60 * 1000); // Check every 30 minutes - much less frequent

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, isInitialized, refreshAuth]); // Removed isRefreshing from deps

  const value = {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    logout,
    refreshAuth,
    clearError,
    handleEnableNotifications,
    isEnablingPush,
    pushEnabled
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};