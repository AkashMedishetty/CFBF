/**
 * useEmergencyNotificationResponse Hook
 * React hook for managing comprehensive emergency notification response system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import emergencyNotificationResponseManager from '../utils/emergencyNotificationResponseManager';

export const useEmergencyNotificationResponse = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use ref to prevent multiple initializations
  const initializationRef = useRef(false);

  // Initialize emergency response manager
  const initialize = useCallback(async () => {
    if (initializationRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await emergencyNotificationResponseManager.initialize();
      
      initializationRef.current = true;
      setIsInitialized(true);
      
      // Get initial analytics
      const initialAnalytics = emergencyNotificationResponseManager.getAnalytics();
      setAnalytics(initialAnalytics);
      
    } catch (err) {
      console.error('[useEmergencyNotificationResponse] Initialization failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create emergency blood request
  const createEmergencyRequest = useCallback(async (bloodRequest) => {
    try {
      setError(null);
      
      if (!isInitialized) {
        await initialize();
      }
      
      const emergencyId = await emergencyNotificationResponseManager.createEmergencyRequest(bloodRequest);
      
      // Update analytics
      const updatedAnalytics = emergencyNotificationResponseManager.getAnalytics();
      setAnalytics(updatedAnalytics);
      
      return emergencyId;
      
    } catch (err) {
      console.error('[useEmergencyNotificationResponse] Failed to create emergency request:', err);
      setError(err.message);
      throw err;
    }
  }, [isInitialized, initialize]);

  // Handle donor response
  const handleDonorResponse = useCallback(async (emergencyId, donorId, response, responseData = {}) => {
    try {
      setError(null);
      
      if (!isInitialized) {
        await initialize();
      }
      
      await emergencyNotificationResponseManager.handleDonorResponse(
        emergencyId, 
        donorId, 
        response, 
        responseData
      );
      
      // Update analytics
      const updatedAnalytics = emergencyNotificationResponseManager.getAnalytics();
      setAnalytics(updatedAnalytics);
      
    } catch (err) {
      console.error('[useEmergencyNotificationResponse] Failed to handle donor response:', err);
      setError(err.message);
      throw err;
    }
  }, [isInitialized, initialize]);

  // Accept emergency request
  const acceptEmergencyRequest = useCallback(async (emergencyId, donorId, additionalData = {}) => {
    return handleDonorResponse(emergencyId, donorId, 'accept', {
      acceptedAt: new Date().toISOString(),
      ...additionalData
    });
  }, [handleDonorResponse]);

  // Decline emergency request
  const declineEmergencyRequest = useCallback(async (emergencyId, donorId, reason = '') => {
    return handleDonorResponse(emergencyId, donorId, 'decline', {
      declinedAt: new Date().toISOString(),
      reason
    });
  }, [handleDonorResponse]);

  // Contact hospital directly
  const contactHospital = useCallback(async (emergencyId, hospitalPhone) => {
    try {
      setError(null);
      
      // Open phone dialer
      if (hospitalPhone) {
        window.open(`tel:${hospitalPhone}`, '_self');
        
        // Track hospital contact
        if (isInitialized) {
          const updatedAnalytics = emergencyNotificationResponseManager.getAnalytics();
          setAnalytics(updatedAnalytics);
        }
      }
      
    } catch (err) {
      console.error('[useEmergencyNotificationResponse] Failed to contact hospital:', err);
      setError(err.message);
    }
  }, [isInitialized]);

  // Share emergency with network
  const shareEmergencyWithNetwork = useCallback(async (emergencyId, shareData) => {
    try {
      setError(null);
      
      const emergency = emergencyNotificationResponseManager.activeEmergencies.get(emergencyId);
      if (!emergency) {
        throw new Error('Emergency not found');
      }
      
      const shareText = `🚨 URGENT: ${emergency.bloodType} blood needed at ${emergency.hospital.name}. Can you help or share with someone who can? #BloodDonation #SaveLives`;
      const shareUrl = `${window.location.origin}/emergency/${emergencyId}`;
      
      if (navigator.share) {
        // Use native sharing if available
        await navigator.share({
          title: 'Emergency Blood Request',
          text: shareText,
          url: shareUrl
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        alert('Emergency details copied to clipboard! Please share with your network.');
      }
      
    } catch (err) {
      console.error('[useEmergencyNotificationResponse] Failed to share emergency:', err);
      setError(err.message);
    }
  }, []);

  // Get emergency details
  const getEmergencyDetails = useCallback((emergencyId) => {
    try {
      setError(null);
      return emergencyNotificationResponseManager.activeEmergencies.get(emergencyId);
    } catch (err) {
      console.error('[useEmergencyNotificationResponse] Failed to get emergency details:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Get all active emergencies
  const getActiveEmergencies = useCallback(() => {
    try {
      setError(null);
      const emergencies = Array.from(emergencyNotificationResponseManager.activeEmergencies.values());
      setActiveEmergencies(emergencies);
      return emergencies;
    } catch (err) {
      console.error('[useEmergencyNotificationResponse] Failed to get active emergencies:', err);
      setError(err.message);
      return [];
    }
  }, []);

  // Refresh analytics
  const refreshAnalytics = useCallback(() => {
    try {
      setError(null);
      const updatedAnalytics = emergencyNotificationResponseManager.getAnalytics();
      setAnalytics(updatedAnalytics);
      return updatedAnalytics;
    } catch (err) {
      console.error('[useEmergencyNotificationResponse] Failed to refresh analytics:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Test emergency notification system
  const testEmergencySystem = useCallback(async () => {
    try {
      setError(null);
      
      const testEmergency = {
        bloodType: 'O-',
        urgency: 'critical',
        hospital: {
          id: 'test-hospital',
          name: 'Test General Hospital',
          phone: '+1-555-TEST',
          address: '123 Test Street, Test City',
          location: { lat: 40.7128, lng: -74.0060 }
        },
        patient: {
          name: 'Test Patient',
          age: 35,
          condition: 'Emergency surgery'
        },
        unitsNeeded: 2,
        neededBy: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        specialInstructions: 'This is a test emergency request for system validation.',
        distance: 2.5
      };
      
      const emergencyId = await createEmergencyRequest(testEmergency);
      
      // Simulate donor responses after a delay
      setTimeout(async () => {
        try {
          await acceptEmergencyRequest(emergencyId, 'test-donor-1', {
            estimatedArrival: new Date(Date.now() + 45 * 60 * 1000).toISOString()
          });
          
          await declineEmergencyRequest(emergencyId, 'test-donor-2', 'Not available today');
          
          console.log('[useEmergencyNotificationResponse] Test emergency system completed');
        } catch (error) {
          console.error('[useEmergencyNotificationResponse] Test simulation failed:', error);
        }
      }, 2000);
      
      return emergencyId;
      
    } catch (err) {
      console.error('[useEmergencyNotificationResponse] Failed to test emergency system:', err);
      setError(err.message);
      throw err;
    }
  }, [createEmergencyRequest, acceptEmergencyRequest, declineEmergencyRequest]);

  // Auto-initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Set up periodic analytics refresh
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      refreshAnalytics();
      getActiveEmergencies();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isInitialized, refreshAnalytics, getActiveEmergencies]);

  // Handle page visibility change to refresh data
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isInitialized) {
        refreshAnalytics();
        getActiveEmergencies();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInitialized, refreshAnalytics, getActiveEmergencies]);

  return {
    // State
    isInitialized,
    activeEmergencies,
    analytics,
    isLoading,
    error,
    
    // Actions
    initialize,
    createEmergencyRequest,
    handleDonorResponse,
    acceptEmergencyRequest,
    declineEmergencyRequest,
    contactHospital,
    shareEmergencyWithNetwork,
    getEmergencyDetails,
    getActiveEmergencies,
    refreshAnalytics,
    testEmergencySystem,
    
    // Computed values
    hasActiveEmergencies: activeEmergencies.length > 0,
    totalEmergencies: analytics?.totalEmergencies || 0,
    successfulMatches: analytics?.successfulMatches || 0,
    averageResponseTime: analytics?.averageResponseTime || 0,
    responseRate: analytics?.responseRate || 0,
    deliverySuccessRate: analytics?.deliverySuccessRate || 0
  };
};

export default useEmergencyNotificationResponse;