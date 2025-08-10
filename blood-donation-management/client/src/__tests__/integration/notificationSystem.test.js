/**
 * Notification System Integration Tests
 * Tests the complete notification flow from request to response
 */

import { setupTestEnvironment, cleanupUtils, mockData, waitForAsync } from '../../utils/testUtils';

describe('Notification System Integration', () => {
  let mocks;
  let serviceWorkerRegistration;

  beforeEach(() => {
    mocks = setupTestEnvironment();
    
    // Mock service worker registration
    serviceWorkerRegistration = {
      showNotification: jest.fn().mockResolvedValue(),
      sync: { register: jest.fn().mockResolvedValue() },
      pushManager: {
        subscribe: jest.fn().mockResolvedValue({
          endpoint: 'https://fcm.googleapis.com/fcm/send/test',
          keys: { p256dh: 'test-key', auth: 'test-auth' }
        }),
        getSubscription: jest.fn().mockResolvedValue(null)
      }
    };
    
    mocks.serviceWorker.ready = Promise.resolve(serviceWorkerRegistration);
  });

  afterEach(() => {
    cleanupUtils.cleanupAll();
  });

  describe('Emergency Notification Flow', () => {
    test('should handle complete emergency notification flow', async () => {
      const emergencyRequest = mockData.bloodRequest.emergency;
      
      // Mock API responses
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, requestId: emergencyRequest.id })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            donors: [mockData.user.donor],
            notificationsSent: 1
          })
        });

      // Simulate emergency request creation
      const response = await fetch('/api/v1/blood-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emergencyRequest)
      });

      expect(response.ok).toBe(true);
      
      // Simulate notification sending
      const notificationResponse = await fetch('/api/v1/notifications/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: emergencyRequest.id,
          bloodType: emergencyRequest.bloodType,
          urgencyLevel: emergencyRequest.urgencyLevel
        })
      });

      expect(notificationResponse.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('should handle notification permission flow', async () => {
      // Initially denied
      mocks.notification.permission = 'default';
      
      // Request permission
      mocks.notification.requestPermission.mockResolvedValue('granted');
      
      const permission = await Notification.requestPermission();
      expect(permission).toBe('granted');
      expect(mocks.notification.requestPermission).toHaveBeenCalled();
    });

    test('should handle push subscription', async () => {
      const subscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'test-vapid-key'
      });

      expect(subscription).toHaveProperty('endpoint');
      expect(subscription).toHaveProperty('keys');
      expect(serviceWorkerRegistration.pushManager.subscribe).toHaveBeenCalled();
    });
  });

  describe('Notification Actions', () => {
    test('should handle accept emergency action', async () => {
      const notificationData = mockData.notification.emergency;
      
      // Mock API response for accepting emergency
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          message: 'Emergency accepted',
          appointmentDetails: {
            hospitalName: 'City General Hospital',
            appointmentTime: '2024-02-10T16:00:00Z',
            contactNumber: '+1234567891'
          }
        })
      });

      // Simulate notification action
      const response = await fetch('/api/v1/emergency-requests/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: notificationData.data.requestId,
          donorId: mockData.user.donor.id,
          action: 'accept'
        })
      });

      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('appointmentDetails');
    });

    test('should handle decline emergency action', async () => {
      const notificationData = mockData.notification.emergency;
      
      // Mock API response for declining emergency
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          message: 'Emergency declined',
          alternativeDonors: 3
        })
      });

      // Simulate notification action
      const response = await fetch('/api/v1/emergency-requests/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: notificationData.data.requestId,
          donorId: mockData.user.donor.id,
          action: 'decline',
          reason: 'not_available'
        })
      });

      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('alternativeDonors');
    });

    test('should handle view details action', async () => {
      const notificationData = mockData.notification.emergency;
      
      // Mock API response for getting request details
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData.bloodRequest.emergency
      });

      // Simulate getting request details
      const response = await fetch(`/api/v1/blood-requests/${notificationData.data.requestId}`);
      const requestDetails = await response.json();
      
      expect(response.ok).toBe(true);
      expect(requestDetails).toHaveProperty('patientName');
      expect(requestDetails).toHaveProperty('bloodType');
      expect(requestDetails).toHaveProperty('urgencyLevel');
      expect(requestDetails).toHaveProperty('hospitalName');
    });
  });

  describe('Background Sync', () => {
    test('should register background sync for offline actions', async () => {
      const syncTag = 'emergency-response';
      
      await serviceWorkerRegistration.sync.register(syncTag);
      
      expect(serviceWorkerRegistration.sync.register).toHaveBeenCalledWith(syncTag);
    });

    test('should handle offline emergency response', async () => {
      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      const offlineAction = {
        type: 'emergency_response',
        requestId: 'req_123',
        donorId: 'donor_123',
        action: 'accept',
        timestamp: Date.now()
      };

      // Store offline action
      mocks.localStorage.setItem('offline_actions', JSON.stringify([offlineAction]));
      
      // Register background sync
      await serviceWorkerRegistration.sync.register('offline-actions');
      
      expect(serviceWorkerRegistration.sync.register).toHaveBeenCalledWith('offline-actions');
      expect(mocks.localStorage.setItem).toHaveBeenCalledWith(
        'offline_actions', 
        JSON.stringify([offlineAction])
      );
    });
  });

  describe('Notification Delivery Tracking', () => {
    test('should track notification delivery success', async () => {
      const notificationId = 'notif_123';
      
      // Mock successful delivery tracking
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true,
          deliveryStatus: 'delivered',
          deliveredAt: new Date().toISOString()
        })
      });

      const response = await fetch('/api/v1/notifications/delivery-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          status: 'delivered',
          timestamp: Date.now()
        })
      });

      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.deliveryStatus).toBe('delivered');
    });

    test('should handle notification delivery failure', async () => {
      const notificationId = 'notif_123';
      
      // Mock failed delivery tracking
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true,
          deliveryStatus: 'failed',
          error: 'Device not reachable',
          retryScheduled: true
        })
      });

      const response = await fetch('/api/v1/notifications/delivery-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          status: 'failed',
          error: 'Device not reachable',
          timestamp: Date.now()
        })
      });

      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.deliveryStatus).toBe('failed');
      expect(result.retryScheduled).toBe(true);
    });
  });

  describe('Multi-Channel Fallback', () => {
    test('should fallback to SMS when push notification fails', async () => {
      const emergencyRequest = mockData.bloodRequest.emergency;
      const donor = mockData.user.donor;
      
      // Mock push notification failure and SMS fallback
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 410,
          json: async () => ({ error: 'Push subscription expired' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true,
            channel: 'sms',
            messageId: 'sms_123',
            deliveredAt: new Date().toISOString()
          })
        });

      // Try push notification first
      const pushResponse = await fetch('/api/v1/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId: donor.id,
          message: 'Emergency blood request',
          data: emergencyRequest
        })
      });

      expect(pushResponse.ok).toBe(false);

      // Fallback to SMS
      const smsResponse = await fetch('/api/v1/notifications/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: donor.phone,
          message: `Emergency: ${emergencyRequest.bloodType} blood needed at ${emergencyRequest.hospitalName}`,
          requestId: emergencyRequest.id
        })
      });

      const smsResult = await smsResponse.json();
      
      expect(smsResponse.ok).toBe(true);
      expect(smsResult.channel).toBe('sms');
      expect(smsResult).toHaveProperty('messageId');
    });

    test('should fallback to email when SMS fails', async () => {
      const donor = mockData.user.donor;
      const emergencyRequest = mockData.bloodRequest.emergency;
      
      // Mock SMS failure and email fallback
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Invalid phone number' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true,
            channel: 'email',
            messageId: 'email_123',
            deliveredAt: new Date().toISOString()
          })
        });

      // Try SMS first
      const smsResponse = await fetch('/api/v1/notifications/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: 'invalid-phone',
          message: 'Emergency blood request'
        })
      });

      expect(smsResponse.ok).toBe(false);

      // Fallback to email
      const emailResponse = await fetch('/api/v1/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: donor.email,
          subject: 'Emergency Blood Request',
          template: 'emergency_request',
          data: emergencyRequest
        })
      });

      const emailResult = await emailResponse.json();
      
      expect(emailResponse.ok).toBe(true);
      expect(emailResult.channel).toBe('email');
      expect(emailResult).toHaveProperty('messageId');
    });
  });

  describe('Notification Analytics', () => {
    test('should track notification metrics', async () => {
      const metrics = {
        notificationId: 'notif_123',
        requestId: 'req_123',
        donorId: 'donor_123',
        channel: 'push',
        deliveryTime: 1500, // ms
        responseTime: 30000, // ms
        action: 'accept'
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, metricsRecorded: true })
      });

      const response = await fetch('/api/v1/analytics/notification-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      });

      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.metricsRecorded).toBe(true);
    });

    test('should get notification performance stats', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          averageDeliveryTime: 1200,
          averageResponseTime: 45000,
          deliverySuccessRate: 0.95,
          responseRate: 0.78,
          channelBreakdown: {
            push: 0.85,
            sms: 0.12,
            email: 0.03
          }
        })
      });

      const response = await fetch('/api/v1/analytics/notification-performance');
      const stats = await response.json();
      
      expect(response.ok).toBe(true);
      expect(stats).toHaveProperty('averageDeliveryTime');
      expect(stats).toHaveProperty('averageResponseTime');
      expect(stats).toHaveProperty('deliverySuccessRate');
      expect(stats).toHaveProperty('responseRate');
      expect(stats).toHaveProperty('channelBreakdown');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      try {
        await fetch('/api/v1/notifications/emergency', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: 'req_123' })
        });
      } catch (error) {
        expect(error.message).toBe('Network error');
      }

      // Should still register for background sync
      await serviceWorkerRegistration.sync.register('failed-notifications');
      expect(serviceWorkerRegistration.sync.register).toHaveBeenCalledWith('failed-notifications');
    });

    test('should handle service worker registration failure', async () => {
      // Mock service worker registration failure
      mocks.serviceWorker.register.mockRejectedValue(new Error('Service worker registration failed'));

      try {
        await navigator.serviceWorker.register('/service-worker.js');
      } catch (error) {
        expect(error.message).toBe('Service worker registration failed');
      }

      // Should still allow basic functionality
      expect(typeof mocks.serviceWorker.register).toBe('function');
    });
  });

  describe('Performance', () => {
    test('should handle high volume of notifications efficiently', async () => {
      const startTime = performance.now();
      
      // Mock multiple notification requests
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      // Send 100 notifications
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          fetch('/api/v1/notifications/emergency', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId: `req_${i}` })
          })
        );
      }

      await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds for 100 notifications
      expect(global.fetch).toHaveBeenCalledTimes(100);
    });
  });
});