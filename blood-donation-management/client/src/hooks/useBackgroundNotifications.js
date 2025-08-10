/**
 * useBackgroundNotifications Hook
 * React hook for managing background notifications when PWA is closed
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import backgroundNotificationManager from '../utils/backgroundNotificationManager';

export const useBackgroundNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [queueStatus, setQueueStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use ref to prevent multiple initializations
  const initializationRef = useRef(false);

  // Initialize background notification manager
  const initialize = useCallback(async () => {
    if (initializationRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await backgroundNotificationManager.initialize();
      
      initializationRef.current = true;
      setIsInitialized(true);
      
      // Get initial queue status
      const status = await backgroundNotificationManager.getQueueStatus();
      setQueueStatus(status);
      
    } catch (err) {
      console.error('[useBackgroundNotifications] Initialization failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Queue emergency notification
  const queueEmergencyNotification = useCallback(async (bloodRequest) => {
    try {
      setError(null);
      
      if (!isInitialized) {
        await initialize();
      }
      
      const notificationId = await backgroundNotificationManager.createEmergencyNotification(bloodRequest);
      
      // Update queue status
      const status = await backgroundNotificationManager.getQueueStatus();
      setQueueStatus(status);
      
      return notificationId;
      
    } catch (err) {
      console.error('[useBackgroundNotifications] Failed to queue emergency notification:', err);
      setError(err.message);
      throw err;
    }
  }, [isInitialized, initialize]);

  // Queue urgent notification
  const queueUrgentNotification = useCallback(async (bloodRequest) => {
    try {
      setError(null);
      
      if (!isInitialized) {
        await initialize();
      }
      
      const notificationId = await backgroundNotificationManager.createUrgentNotification(bloodRequest);
      
      // Update queue status
      const status = await backgroundNotificationManager.getQueueStatus();
      setQueueStatus(status);
      
      return notificationId;
      
    } catch (err) {
      console.error('[useBackgroundNotifications] Failed to queue urgent notification:', err);
      setError(err.message);
      throw err;
    }
  }, [isInitialized, initialize]);

  // Queue donation reminder
  const queueDonationReminder = useCallback(async (reminderData) => {
    try {
      setError(null);
      
      if (!isInitialized) {
        await initialize();
      }
      
      const notificationId = await backgroundNotificationManager.createDonationReminder(reminderData);
      
      // Update queue status
      const status = await backgroundNotificationManager.getQueueStatus();
      setQueueStatus(status);
      
      return notificationId;
      
    } catch (err) {
      console.error('[useBackgroundNotifications] Failed to queue donation reminder:', err);
      setError(err.message);
      throw err;
    }
  }, [isInitialized, initialize]);

  // Queue response confirmation
  const queueResponseConfirmation = useCallback(async (responseData) => {
    try {
      setError(null);
      
      if (!isInitialized) {
        await initialize();
      }
      
      const notificationId = await backgroundNotificationManager.createResponseConfirmation(responseData);
      
      // Update queue status
      const status = await backgroundNotificationManager.getQueueStatus();
      setQueueStatus(status);
      
      return notificationId;
      
    } catch (err) {
      console.error('[useBackgroundNotifications] Failed to queue response confirmation:', err);
      setError(err.message);
      throw err;
    }
  }, [isInitialized, initialize]);

  // Sync notification responses
  const syncResponses = useCallback(async () => {
    try {
      setError(null);
      
      if (!isInitialized) {
        await initialize();
      }
      
      await backgroundNotificationManager.syncNotificationResponses();
      
      // Update queue status after sync
      const status = await backgroundNotificationManager.getQueueStatus();
      setQueueStatus(status);
      
    } catch (err) {
      console.error('[useBackgroundNotifications] Failed to sync responses:', err);
      setError(err.message);
      throw err;
    }
  }, [isInitialized, initialize]);

  // Clear notification badge
  const clearBadge = useCallback(async () => {
    try {
      setError(null);
      
      if (!isInitialized) {
        await initialize();
      }
      
      await backgroundNotificationManager.clearNotificationBadge();
      
    } catch (err) {
      console.error('[useBackgroundNotifications] Failed to clear badge:', err);
      setError(err.message);
      throw err;
    }
  }, [isInitialized, initialize]);

  // Refresh queue status
  const refreshQueueStatus = useCallback(async () => {
    try {
      setError(null);
      
      if (!isInitialized) {
        await initialize();
      }
      
      const status = await backgroundNotificationManager.getQueueStatus();
      setQueueStatus(status);
      
      return status;
      
    } catch (err) {
      console.error('[useBackgroundNotifications] Failed to refresh queue status:', err);
      setError(err.message);
      throw err;
    }
  }, [isInitialized, initialize]);

  // Get notification statistics
  const getNotificationStats = useCallback(async () => {
    try {
      setError(null);
      
      if (!isInitialized) {
        await initialize();
      }
      
      return await backgroundNotificationManager.getNotificationStats();
      
    } catch (err) {
      console.error('[useBackgroundNotifications] Failed to get notification stats:', err);
      setError(err.message);
      throw err;
    }
  }, [isInitialized, initialize]);

  // Auto-initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Set up periodic queue status refresh
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      refreshQueueStatus().catch(err => {
        console.error('[useBackgroundNotifications] Periodic refresh failed:', err);
      });
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isInitialized, refreshQueueStatus]);

  // Handle visibility change to sync responses
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isInitialized) {
        syncResponses().catch(err => {
          console.error('[useBackgroundNotifications] Visibility change sync failed:', err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInitialized, syncResponses]);

  // Handle window focus to clear badge
  useEffect(() => {
    const handleFocus = () => {
      if (isInitialized) {
        clearBadge().catch(err => {
          console.error('[useBackgroundNotifications] Focus badge clear failed:', err);
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isInitialized, clearBadge]);

  return {
    // State
    isInitialized,
    queueStatus,
    isLoading,
    error,
    
    // Actions
    initialize,
    queueEmergencyNotification,
    queueUrgentNotification,
    queueDonationReminder,
    queueResponseConfirmation,
    syncResponses,
    clearBadge,
    refreshQueueStatus,
    getNotificationStats,
    
    // Computed values
    hasQueuedNotifications: queueStatus?.totalItems > 0,
    hasCriticalNotifications: queueStatus?.byPriority?.critical > 0,
    hasFailedNotifications: queueStatus?.byStatus?.failed > 0,
    isProcessing: queueStatus?.processing || false
  };
};

export default useBackgroundNotifications;