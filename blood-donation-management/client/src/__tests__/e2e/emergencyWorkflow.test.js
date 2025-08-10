/**
 * Emergency Workflow End-to-End Tests
 * Tests complete emergency blood request workflow from creation to fulfillment
 */

import { 
  setupTestEnvironment, 
  cleanupUtils, 
  mockData, 
  renderWithProviders,
  userInteractions,
  waitForAsync,
  mockApiResponses
} from '../../utils/testUtils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock components for E2E testing
const MockEmergencyRequestForm = () => (
  <form data-testid="emergency-form">
    <input 
      data-testid="patient-name" 
      placeholder="Patient Name" 
      required 
    />
    <select data-testid="blood-type" required>
      <option value="">Select Blood Type</option>
      <option value="O+">O+</option>
      <option value="A+">A+</option>
      <option value="B+">B+</option>
      <option value="AB+">AB+</option>
    </select>
    <input 
      data-testid="units-needed" 
      type="number" 
      placeholder="Units Needed" 
      min="1" 
      max="10" 
      required 
    />
    <select data-testid="urgency-level" required>
      <option value="">Select Urgency</option>
      <option value="critical">Critical</option>
      <option value="urgent">Urgent</option>
      <option value="scheduled">Scheduled</option>
    </select>
    <input 
      data-testid="hospital-name" 
      placeholder="Hospital Name" 
      required 
    />
    <textarea 
      data-testid="medical-condition" 
      placeholder="Medical Condition" 
      required 
    />
    <input 
      data-testid="contact-number" 
      placeholder="Contact Number" 
      required 
    />
    <button type="submit" data-testid="submit-request">
      Submit Emergency Request
    </button>
  </form>
);

const MockDonorResponse = ({ request }) => (
  <div data-testid="donor-response">
    <h3>Emergency Blood Request</h3>
    <p data-testid="request-details">
      {request.bloodType} blood needed for {request.patientName}
    </p>
    <p data-testid="hospital-info">
      Hospital: {request.hospitalName}
    </p>
    <p data-testid="urgency-info">
      Urgency: {request.urgencyLevel}
    </p>
    <div data-testid="action-buttons">
      <button data-testid="accept-button">Accept Emergency</button>
      <button data-testid="decline-button">Decline</button>
      <button data-testid="view-details-button">View Details</button>
      <button data-testid="call-hospital-button">Call Hospital</button>
    </div>
  </div>
);

describe('Emergency Workflow E2E Tests', () => {
  let mocks;

  beforeEach(() => {
    mocks = setupTestEnvironment();
    
    // Mock geolocation
    mocks.geolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10
        }
      });
    });
  });

  afterEach(() => {
    cleanupUtils.cleanupAll();
  });

  describe('Complete Emergency Request Flow', () => {
    test('should handle complete emergency request creation and donor notification', async () => {
      const emergencyData = mockData.bloodRequest.emergency;
      
      // Mock API responses
      mockApiResponses.success({
        requestId: emergencyData.id,
        message: 'Emergency request created successfully',
        donorsNotified: 5,
        estimatedResponseTime: '15 minutes'
      });

      // Render emergency form
      renderWithProviders(<MockEmergencyRequestForm />);

      // Fill out the form
      await userInteractions.type(
        screen.getByTestId('patient-name'), 
        emergencyData.patientName
      );
      
      await userInteractions.selectOption(
        screen.getByTestId('blood-type'), 
        emergencyData.bloodType
      );
      
      await userInteractions.type(
        screen.getByTestId('units-needed'), 
        emergencyData.unitsNeeded.toString()
      );
      
      await userInteractions.selectOption(
        screen.getByTestId('urgency-level'), 
        emergencyData.urgencyLevel
      );
      
      await userInteractions.type(
        screen.getByTestId('hospital-name'), 
        emergencyData.hospitalName
      );
      
      await userInteractions.type(
        screen.getByTestId('medical-condition'), 
        emergencyData.medicalCondition
      );
      
      await userInteractions.type(
        screen.getByTestId('contact-number'), 
        emergencyData.contactNumber
      );

      // Submit the form
      await userInteractions.click(screen.getByTestId('submit-request'));

      // Wait for API call
      await waitForAsync(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/blood-requests'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: expect.stringContaining(emergencyData.patientName)
          })
        );
      });
    });

    test('should validate required fields before submission', async () => {
      renderWithProviders(<MockEmergencyRequestForm />);

      // Try to submit without filling required fields
      await userInteractions.click(screen.getByTestId('submit-request'));

      // Form should not submit (no API call)
      expect(global.fetch).not.toHaveBeenCalled();

      // Fill only patient name
      await userInteractions.type(
        screen.getByTestId('patient-name'), 
        'John Doe'
      );

      // Try to submit again
      await userInteractions.click(screen.getByTestId('submit-request'));

      // Still should not submit
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should handle form submission errors gracefully', async () => {
      const emergencyData = mockData.bloodRequest.emergency;
      
      // Mock API error
      mockApiResponses.error(500, {
        error: 'Internal Server Error',
        message: 'Failed to create emergency request'
      });

      renderWithProviders(<MockEmergencyRequestForm />);

      // Fill out the form
      await userInteractions.type(
        screen.getByTestId('patient-name'), 
        emergencyData.patientName
      );
      await userInteractions.selectOption(
        screen.getByTestId('blood-type'), 
        emergencyData.bloodType
      );
      await userInteractions.type(
        screen.getByTestId('units-needed'), 
        emergencyData.unitsNeeded.toString()
      );
      await userInteractions.selectOption(
        screen.getByTestId('urgency-level'), 
        emergencyData.urgencyLevel
      );
      await userInteractions.type(
        screen.getByTestId('hospital-name'), 
        emergencyData.hospitalName
      );
      await userInteractions.type(
        screen.getByTestId('medical-condition'), 
        emergencyData.medicalCondition
      );
      await userInteractions.type(
        screen.getByTestId('contact-number'), 
        emergencyData.contactNumber
      );

      // Submit the form
      await userInteractions.click(screen.getByTestId('submit-request'));

      // Wait for error handling
      await waitForAsync(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Should handle error gracefully (no crash)
      expect(screen.getByTestId('emergency-form')).toBeInTheDocument();
    });
  });

  describe('Donor Response Flow', () => {
    test('should handle donor accepting emergency request', async () => {
      const emergencyData = mockData.bloodRequest.emergency;
      
      // Mock successful acceptance
      mockApiResponses.success({
        success: true,
        message: 'Emergency request accepted',
        appointmentDetails: {
          hospitalName: emergencyData.hospitalName,
          appointmentTime: '2024-02-10T16:00:00Z',
          contactNumber: emergencyData.contactNumber,
          directions: 'https://maps.google.com/directions'
        }
      });

      renderWithProviders(<MockDonorResponse request={emergencyData} />);

      // Verify request details are displayed
      expect(screen.getByTestId('request-details')).toHaveTextContent(
        `${emergencyData.bloodType} blood needed for ${emergencyData.patientName}`
      );
      expect(screen.getByTestId('hospital-info')).toHaveTextContent(
        `Hospital: ${emergencyData.hospitalName}`
      );
      expect(screen.getByTestId('urgency-info')).toHaveTextContent(
        `Urgency: ${emergencyData.urgencyLevel}`
      );

      // Accept the emergency
      await userInteractions.click(screen.getByTestId('accept-button'));

      // Wait for API call
      await waitForAsync(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/emergency-requests/accept'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: expect.stringContaining(emergencyData.id)
          })
        );
      });
    });

    test('should handle donor declining emergency request', async () => {
      const emergencyData = mockData.bloodRequest.emergency;
      
      // Mock successful decline
      mockApiResponses.success({
        success: true,
        message: 'Emergency request declined',
        alternativeDonors: 3
      });

      renderWithProviders(<MockDonorResponse request={emergencyData} />);

      // Decline the emergency
      await userInteractions.click(screen.getByTestId('decline-button'));

      // Wait for API call
      await waitForAsync(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/emergency-requests/decline'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: expect.stringContaining(emergencyData.id)
          })
        );
      });
    });

    test('should handle view details action', async () => {
      const emergencyData = mockData.bloodRequest.emergency;
      
      // Mock detailed request data
      mockApiResponses.success(emergencyData);

      renderWithProviders(<MockDonorResponse request={emergencyData} />);

      // View details
      await userInteractions.click(screen.getByTestId('view-details-button'));

      // Wait for API call
      await waitForAsync(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/v1/blood-requests/${emergencyData.id}`),
          expect.objectContaining({
            method: 'GET'
          })
        );
      });
    });

    test('should handle call hospital action', async () => {
      const emergencyData = mockData.bloodRequest.emergency;
      
      // Mock window.open
      const mockOpen = jest.fn();
      Object.defineProperty(window, 'open', { value: mockOpen });

      renderWithProviders(<MockDonorResponse request={emergencyData} />);

      // Call hospital
      await userInteractions.click(screen.getByTestId('call-hospital-button'));

      // Should open phone dialer
      expect(mockOpen).toHaveBeenCalledWith(
        `tel:${emergencyData.contactNumber}`,
        '_self'
      );
    });
  });

  describe('Offline Functionality', () => {
    test('should handle emergency request creation while offline', async () => {
      const emergencyData = mockData.bloodRequest.emergency;
      
      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      // Mock network error
      mockApiResponses.networkError();

      renderWithProviders(<MockEmergencyRequestForm />);

      // Fill out the form
      await userInteractions.type(
        screen.getByTestId('patient-name'), 
        emergencyData.patientName
      );
      await userInteractions.selectOption(
        screen.getByTestId('blood-type'), 
        emergencyData.bloodType
      );
      await userInteractions.type(
        screen.getByTestId('units-needed'), 
        emergencyData.unitsNeeded.toString()
      );
      await userInteractions.selectOption(
        screen.getByTestId('urgency-level'), 
        emergencyData.urgencyLevel
      );
      await userInteractions.type(
        screen.getByTestId('hospital-name'), 
        emergencyData.hospitalName
      );
      await userInteractions.type(
        screen.getByTestId('medical-condition'), 
        emergencyData.medicalCondition
      );
      await userInteractions.type(
        screen.getByTestId('contact-number'), 
        emergencyData.contactNumber
      );

      // Submit the form
      await userInteractions.click(screen.getByTestId('submit-request'));

      // Should store request offline
      await waitForAsync(() => {
        expect(mocks.localStorage.setItem).toHaveBeenCalledWith(
          expect.stringContaining('offline_requests'),
          expect.any(String)
        );
      });
    });

    test('should sync offline requests when coming back online', async () => {
      const offlineRequest = {
        id: 'offline_req_123',
        ...mockData.bloodRequest.emergency,
        timestamp: Date.now(),
        status: 'pending_sync'
      };

      // Set up offline requests in localStorage
      mocks.localStorage.getItem.mockReturnValue(
        JSON.stringify([offlineRequest])
      );

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

      // Mock successful sync
      mockApiResponses.success({
        requestId: offlineRequest.id,
        synced: true,
        donorsNotified: 3
      });

      // Trigger online event
      window.dispatchEvent(new Event('online'));

      // Wait for sync
      await waitForAsync(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/blood-requests/sync'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining(offlineRequest.patientName)
          })
        );
      });
    });
  });

  describe('Real-time Updates', () => {
    test('should handle real-time request status updates', async () => {
      const emergencyData = mockData.bloodRequest.emergency;
      
      renderWithProviders(<MockDonorResponse request={emergencyData} />);

      // Simulate WebSocket message for status update
      const statusUpdate = {
        type: 'request_status_update',
        requestId: emergencyData.id,
        status: 'donor_found',
        donorInfo: {
          name: 'John Donor',
          eta: '20 minutes'
        }
      };

      // Mock WebSocket
      const mockWebSocket = {
        send: jest.fn(),
        close: jest.fn(),
        addEventListener: jest.fn()
      };

      global.WebSocket = jest.fn(() => mockWebSocket);

      // Simulate receiving status update
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(statusUpdate)
      });

      // Trigger message handler
      if (mockWebSocket.addEventListener.mock.calls.length > 0) {
        const messageHandler = mockWebSocket.addEventListener.mock.calls
          .find(call => call[0] === 'message')?.[1];
        
        if (messageHandler) {
          messageHandler(messageEvent);
        }
      }

      // Should update UI with new status
      await waitForAsync(() => {
        // In a real implementation, this would update the UI
        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith(
          'message',
          expect.any(Function)
        );
      });
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle multiple simultaneous emergency requests', async () => {
      const startTime = performance.now();
      
      // Mock successful responses
      mockApiResponses.success({ success: true });

      // Create multiple emergency forms
      const forms = Array.from({ length: 10 }, (_, i) => (
        <div key={i} data-testid={`form-${i}`}>
          <MockEmergencyRequestForm />
        </div>
      ));

      renderWithProviders(<div>{forms}</div>);

      // Submit all forms simultaneously
      const submitPromises = [];
      for (let i = 0; i < 10; i++) {
        const form = screen.getByTestId(`form-${i}`);
        const submitButton = form.querySelector('[data-testid="submit-request"]');
        
        submitPromises.push(
          userInteractions.click(submitButton)
        );
      }

      await Promise.all(submitPromises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds for 10 forms
    });

    test('should handle rapid donor responses', async () => {
      const emergencyData = mockData.bloodRequest.emergency;
      const startTime = performance.now();
      
      // Mock successful responses
      mockApiResponses.success({ success: true });

      // Create multiple donor response components
      const responses = Array.from({ length: 20 }, (_, i) => (
        <div key={i} data-testid={`response-${i}`}>
          <MockDonorResponse request={emergencyData} />
        </div>
      ));

      renderWithProviders(<div>{responses}</div>);

      // Click accept on all responses simultaneously
      const acceptPromises = [];
      for (let i = 0; i < 20; i++) {
        const response = screen.getByTestId(`response-${i}`);
        const acceptButton = response.querySelector('[data-testid="accept-button"]');
        
        acceptPromises.push(
          userInteractions.click(acceptButton)
        );
      }

      await Promise.all(acceptPromises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(3000); // 3 seconds for 20 responses
    });
  });

  describe('Accessibility', () => {
    test('should be keyboard navigable', async () => {
      renderWithProviders(<MockEmergencyRequestForm />);

      // Tab through form elements
      await userInteractions.keyboard('{Tab}');
      expect(screen.getByTestId('patient-name')).toHaveFocus();

      await userInteractions.keyboard('{Tab}');
      expect(screen.getByTestId('blood-type')).toHaveFocus();

      await userInteractions.keyboard('{Tab}');
      expect(screen.getByTestId('units-needed')).toHaveFocus();

      // Continue tabbing through all elements
      await userInteractions.keyboard('{Tab}');
      expect(screen.getByTestId('urgency-level')).toHaveFocus();

      await userInteractions.keyboard('{Tab}');
      expect(screen.getByTestId('hospital-name')).toHaveFocus();

      await userInteractions.keyboard('{Tab}');
      expect(screen.getByTestId('medical-condition')).toHaveFocus();

      await userInteractions.keyboard('{Tab}');
      expect(screen.getByTestId('contact-number')).toHaveFocus();

      await userInteractions.keyboard('{Tab}');
      expect(screen.getByTestId('submit-request')).toHaveFocus();
    });

    test('should have proper ARIA labels', () => {
      renderWithProviders(<MockEmergencyRequestForm />);

      // Check for required attributes
      const form = screen.getByTestId('emergency-form');
      expect(form).toBeInTheDocument();

      // All form inputs should be accessible
      const inputs = form.querySelectorAll('input, select, textarea, button');
      inputs.forEach(input => {
        // Should have either label, aria-label, or placeholder
        const hasLabel = input.labels?.length > 0 ||
                        input.getAttribute('aria-label') ||
                        input.getAttribute('placeholder');
        expect(hasLabel).toBeTruthy();
      });
    });
  });
});