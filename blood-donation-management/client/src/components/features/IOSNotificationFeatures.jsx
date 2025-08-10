/**
 * IOSNotificationFeatures Component
 * Displays iOS-specific notification features and controls
 */

import React, { useState } from 'react';
import { useIOSNotifications } from '../../hooks/useIOSNotifications';

const IOSNotificationFeatures = () => {
  const {
    isIOS,
    isStandalone,
    isInitialized,
    criticalAlertsSupported,
    badgeCount,
    notificationPermission,
    isLoading,
    error,
    canReceiveNotifications,
    needsPermission,
    permissionDenied,
    hasBadge,
    isIOSPWA,
    createCriticalAlert,
    createNotification,
    triggerHapticFeedback,
    updateBadgeCount,
    clearBadge,
    showAddToHomeScreenPrompt,
    requestNotificationPermission,
    getIOSStats,
    handleEmergencyBloodRequest
  } = useIOSNotifications();

  const [stats, setStats] = useState(null);
  const [testNotificationData, setTestNotificationData] = useState({
    bloodType: 'O-',
    urgency: 'critical',
    hospital: {
      name: 'City General Hospital',
      phone: '+1-555-0123'
    },
    patient: {
      name: 'Emergency Patient',
      age: 35
    },
    distance: 2.5
  });

  // Handle test critical alert
  const handleTestCriticalAlert = async () => {
    try {
      await createCriticalAlert({
        id: `test-critical-${Date.now()}`,
        ...testNotificationData,
        urgency: 'critical'
      });
      alert('Critical alert sent! Check your notifications.');
    } catch (err) {
      alert(`Failed to send critical alert: ${err.message}`);
    }
  };

  // Handle test regular notification
  const handleTestNotification = async () => {
    try {
      await createNotification({
        id: `test-regular-${Date.now()}`,
        ...testNotificationData,
        urgency: 'urgent'
      });
      alert('Notification sent! Check your notifications.');
    } catch (err) {
      alert(`Failed to send notification: ${err.message}`);
    }
  };

  // Handle test emergency request
  const handleTestEmergencyRequest = async () => {
    try {
      await handleEmergencyBloodRequest({
        id: `test-emergency-${Date.now()}`,
        ...testNotificationData
      });
      alert('Emergency request processed! Check your notifications.');
    } catch (err) {
      alert(`Failed to process emergency request: ${err.message}`);
    }
  };

  // Handle haptic feedback test
  const handleHapticTest = (intensity) => {
    triggerHapticFeedback(intensity);
    alert(`${intensity} haptic feedback triggered!`);
  };

  // Handle badge update
  const handleBadgeUpdate = async (increment) => {
    try {
      await updateBadgeCount(increment);
    } catch (err) {
      alert(`Failed to update badge: ${err.message}`);
    }
  };

  // Handle permission request
  const handleRequestPermission = async () => {
    try {
      const granted = await requestNotificationPermission();
      alert(granted ? 'Permission granted!' : 'Permission denied.');
    } catch (err) {
      alert(`Failed to request permission: ${err.message}`);
    }
  };

  // Handle get stats
  const handleGetStats = () => {
    const iosStats = getIOSStats();
    setStats(iosStats);
  };

  if (!isIOS) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">iOS Features Not Available</h3>
            <p className="mt-1 text-sm text-gray-600">
              iOS-specific notification features are only available on iOS devices.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Initializing iOS features...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">iOS Notification Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">iOS Notification Features</h2>
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${isInitialized ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isInitialized ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* iOS Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900">Device Type</p>
              <p className="text-lg font-semibold text-blue-600">
                {isIOSPWA ? 'iOS PWA' : 'iOS Browser'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12h5v12z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-900">Critical Alerts</p>
              <p className="text-lg font-semibold text-purple-600">
                {criticalAlertsSupported ? 'Supported' : 'Not Available'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-900">Badge Count</p>
              <p className="text-2xl font-semibold text-red-600">{badgeCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12h5v12z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900">Permissions</p>
              <p className="text-lg font-semibold text-green-600">
                {canReceiveNotifications ? 'Granted' : needsPermission ? 'Needed' : 'Denied'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Request */}
      {needsPermission && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-yellow-800">
                Notification permission required for emergency alerts
              </span>
            </div>
            <button
              onClick={handleRequestPermission}
              className="ml-3 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200"
            >
              Grant Permission
            </button>
          </div>
        </div>
      )}

      {/* Add to Home Screen Prompt */}
      {!isStandalone && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-blue-800">
                Add to Home Screen for instant emergency access
              </span>
            </div>
            <button
              onClick={showAddToHomeScreenPrompt}
              className="ml-3 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-800 bg-blue-100 hover:bg-blue-200"
            >
              Show Instructions
            </button>
          </div>
        </div>
      )}

      {/* Test Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Test iOS Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Notification Tests */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Notification Tests</h4>
            
            <button
              onClick={handleTestCriticalAlert}
              disabled={!canReceiveNotifications}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Test Critical Alert
            </button>
            
            <button
              onClick={handleTestNotification}
              disabled={!canReceiveNotifications}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12h5v12z" />
              </svg>
              Test Regular Notification
            </button>
            
            <button
              onClick={handleTestEmergencyRequest}
              disabled={!canReceiveNotifications}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Test Emergency Request
            </button>
          </div>

          {/* Haptic Feedback Tests */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Haptic Feedback Tests</h4>
            
            <button
              onClick={() => handleHapticTest('light')}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Light Haptic
            </button>
            
            <button
              onClick={() => handleHapticTest('medium')}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Medium Haptic
            </button>
            
            <button
              onClick={() => handleHapticTest('heavy')}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Heavy Haptic
            </button>
            
            <button
              onClick={() => handleHapticTest('emergency')}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Emergency Haptic
            </button>
          </div>
        </div>

        {/* Badge Controls */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => handleBadgeUpdate(1)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Badge
          </button>
          
          <button
            onClick={() => handleBadgeUpdate(-1)}
            disabled={badgeCount === 0}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
            </svg>
            Remove Badge
          </button>
          
          <button
            onClick={clearBadge}
            disabled={badgeCount === 0}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Badge
          </button>
          
          <button
            onClick={handleGetStats}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Get Stats
          </button>
        </div>
      </div>

      {/* Stats Display */}
      {stats && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">iOS Statistics</h3>
          <pre className="text-sm text-gray-600 overflow-auto">
            {JSON.stringify(stats, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default IOSNotificationFeatures;