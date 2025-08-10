/**
 * useIOSNotifications Hook
 * React hook for managing iOS-specific notification features including critical alerts,
 * badge management, and Add to Home Screen prompts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import iosNotificationManager from '../utils/iosNotificationManager';

export const useIOSNotifications = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [criticalAlertsSupported, setCriticalAlertsSupported] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use ref to prevent multiple initializations
  const initializationRef = useRef(false);

  // Initialize iOS notification manager
  const initialize = useCallback(async () => {
    if (initializationRef.current || !iosNotificationManager.isIOS) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await iosNotificationManager.initialize();
      
      initializationRef.current = true;
      
      // Update state from manager
      const stats = iosNotificationManager.getIOSStats();
      setIsIOS(stats.isIOS);
      setIsStandalone(stats.isStandalone);
      setIsInitialized(stats.initialized);
      setCriticalAlertsSupported(stats.criticalAlertsSupported);
      setBadgeCount(stats.badgeCount);
      setNotificationPermission(stats.notificationPermission);
      
    } catch (err) {
      console.error('[useIOSNotifications] Initialization failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create critical alert notification
  const createCriticalAlert = useCallback(async (bloodRequest) => {
    try {
      setError(null);
      
      if (!isInitialized) {
        await initialize();
      }
      
      const notification = await iosNotificationManager.createCriticalAlert(bloodRequest);
      
      // Update badge count
      const stats = iosNotificationManager.getIOSStats();
      setBadgeCount(stats.badgeCount);
      
      return notification;
      
    } catch (err) {
      console.error('[useIOSNotifications] Failed to create critical alert:', err);
      setError(err.message);
      throw err;
    }
  }, [isInitialized, initialize]);

  // Create regular notification with iOS enhancements
  const createNotification = useCallback(async (bloodRequest) => {
    try {
      setError(null);
      
      if (!isInitialized) {
        await initialize();
      }
      
      const notification = await iosNotificationManager.createRegularNotification(bloodRequest);
      
      // Update badge count
      const stats = iosNotificationManager.getIOSStats();
      setBadgeCount(stats.badgeCount);
      
      return notification;
      
    } catch (err) {
      console.error('[useIOSNotifications] Failed to create notification:', err);
      setError(err.message);
      throw err;
    }
  }, [isInitialized, initialize]);

  // Trigger haptic feedback
  const triggerHapticFeedback = useCallback((intensity = 'medium') => {
    try {
      setError(null);
      iosNotificationManager.triggerHapticFeedback(intensity);
    } catch (err) {
      console.error('[useIOSNotifications] Failed to trigger haptic feedback:', err);
      setError(err.message);
    }
  }, []);

  // Update badge count
  const updateBadgeCount = useCallback(async (increment) => {
    try {
      setError(null);
      
      if (!isInitialized) {
        await initialize();
      }
      
      await iosNotificationManager.updateBadgeCount(increment);
      
      // Update local state
      const stats = iosNotificationManager.getIOSStats();
      setBadgeCount(stats.badgeCount);
      
    } catch (err) {
      console.error('[useIOSNotifications] Failed to update badge count:', err);
      setError(err.message);
      throw err;
    }
  }, [isInitialized, initialize]);

  // Clear badge
  const clearBadge = useCallback(async () => {
    try {
      setError(null);
      
      if (!isInitialized) {
        await initialize();
      }
      
      await iosNotificationManager.clearBadge();
      setBadgeCount(0);
      
    } catch (err) {
      console.error('[useIOSNotifications] Failed to clear badge:', err);
      setError(err.message);
      throw err;
    }
  }, [isInitialized, initialize]);

  // Show Add to Home Screen prompt
  const showAddToHomeScreenPrompt = useCallback(() => {
    try {
      setError(null);
      iosNotificationManager.showAddToHomeScreenPrompt();
    } catch (err) {
      console.error('[useIOSNotifications] Failed to show A2HS prompt:', err);
      setError(err.message);
    }
  }, []);

  // Request notification permissions
  const requestNotificationPermission = useCallback(async () => {
    try {
      setError(null);
      
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported');
      }
      
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      return permission === 'granted';
      
    } catch (err) {
      console.error('[useIOSNotifications] Failed to request notification permission:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Get iOS statistics
  const getIOSStats = useCallback(() => {
    try {
      setError(null);
      return iosNotificationManager.getIOSStats();
    } catch (err) {
      console.error('[useIOSNotifications] Failed to get iOS stats:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Handle emergency blood request with iOS-specific features
  const handleEmergencyBloodRequest = useCallback(async (bloodRequest) => {
    try {
      setError(null);
      
      // Trigger heavy haptic feedback for emergency
      triggerHapticFeedback('emergency');
      
      // Create critical alert if supported, otherwise regular notification
      let notification;
      if (criticalAlertsSupported && bloodRequest.urgency === 'critical') {
        notification = await createCriticalAlert(bloodRequest);
      } else {
        notification = await createNotification(bloodRequest);
      }
      
      return notification;
      
    } catch (err) {
      console.error('[useIOSNotifications] Failed to handle emergency request:', err);
      setError(err.message);
      throw err;
    }
  }, [criticalAlertsSupported, createCriticalAlert, createNotification, triggerHapticFeedback]);

  // Auto-initialize on mount if iOS
  useEffect(() => {
    if (iosNotificationManager.isIOS) {
      initialize();
    } else {
      setIsIOS(false);
      setIsInitialized(true); // Mark as initialized even if not iOS
    }
  }, [initialize]);

  // Update notification permission when it changes
  useEffect(() => {
    if (!('Notification' in window)) return;

    const updatePermission = () => {
      setNotificationPermission(Notification.permission);
    };

    // Check permission periodically
    const interval = setInterval(updatePermission, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle visibility change to clear badge
  useEffect(() => {
    if (!isIOS) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && badgeCount > 0) {
        clearBadge().catch(err => {
          console.error('[useIOSNotifications] Failed to clear badge on visibility change:', err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isIOS, badgeCount, clearBadge]);

  // Handle window focus to clear badge
  useEffect(() => {
    if (!isIOS) return;

    const handleFocus = () => {
      if (badgeCount > 0) {
        clearBadge().catch(err => {
          console.error('[useIOSNotifications] Failed to clear badge on focus:', err);
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isIOS, badgeCount, clearBadge]);

  return {
    // State
    isIOS,
    isStandalone,
    isInitialized,
    criticalAlertsSupported,
    badgeCount,
    notificationPermission,
    isLoading,
    error,
    
    // Actions
    initialize,
    createCriticalAlert,
    createNotification,
    triggerHapticFeedback,
    updateBadgeCount,
    clearBadge,
    showAddToHomeScreenPrompt,
    requestNotificationPermission,
    getIOSStats,
    handleEmergencyBloodRequest,
    
    // Computed values
    canReceiveNotifications: notificationPermission === 'granted',
    needsPermission: notificationPermission === 'default',
    permissionDenied: notificationPermission === 'denied',
    hasBadge: badgeCount > 0,
    isIOSPWA: isIOS && isStandalone
  };
};

export default useIOSNotifications;