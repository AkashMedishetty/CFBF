/**
 * Testing Utilities
 * Comprehensive testing helpers and utilities for the BDMS application
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import logger from './logger';

// Mock data generators
export const mockData = {
  // User data
  user: {
    donor: {
      id: 'donor_123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      bloodType: 'O+',
      location: { lat: 40.7128, lng: -74.0060 },
      isAvailable: true,
      lastDonation: '2024-01-15T10:00:00Z'
    },
    admin: {
      id: 'admin_123',
      name: 'Admin User',
      email: 'info@callforbloodfoundation.com',
      role: 'admin',
      permissions: ['manage_users', 'view_analytics', 'manage_requests']
    }
  },

  // Blood request data
  bloodRequest: {
    emergency: {
      id: 'req_emergency_123',
      patientName: 'Jane Smith',
      bloodType: 'O+',
      unitsNeeded: 2,
      urgencyLevel: 'critical',
      hospitalName: 'City General Hospital',
      hospitalAddress: '123 Medical Center Dr',
      contactNumber: '+1234567891',
      requestedBy: 'Dr. Johnson',
      medicalCondition: 'Severe anemia due to surgery',
      createdAt: '2024-02-10T14:30:00Z',
      location: { lat: 40.7589, lng: -73.9851 }
    },
    scheduled: {
      id: 'req_scheduled_456',
      patientName: 'Bob Wilson',
      bloodType: 'A+',
      unitsNeeded: 1,
      urgencyLevel: 'scheduled',
      hospitalName: 'Metro Hospital',
      scheduledDate: '2024-02-15T09:00:00Z',
      createdAt: '2024-02-10T10:00:00Z'
    }
  },

  // Notification data
  notification: {
    emergency: {
      id: 'notif_123',
      type: 'emergency_request',
      title: 'Emergency Blood Request - O+',
      body: 'Critical: 2 units of O+ blood needed at City General Hospital',
      data: {
        requestId: 'req_emergency_123',
        bloodType: 'O+',
        urgencyLevel: 'critical',
        hospitalName: 'City General Hospital'
      },
      actions: [
        { action: 'accept', title: 'Accept Emergency' },
        { action: 'decline', title: 'Decline' },
        { action: 'view', title: 'View Details' }
      ]
    }
  },

  // API responses
  apiResponse: {
    success: {
      status: 200,
      data: { success: true, message: 'Operation completed successfully' }
    },
    error: {
      status: 400,
      data: { error: 'Bad Request', message: 'Invalid input data' }
    },
    serverError: {
      status: 500,
      data: { error: 'Internal Server Error', message: 'Something went wrong' }
    }
  }
};

// Test environment setup
export const setupTestEnvironment = () => {
  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
  Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

  // Mock geolocation
  const geolocationMock = {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn()
  };
  Object.defineProperty(navigator, 'geolocation', { value: geolocationMock });

  // Mock notifications
  const notificationMock = jest.fn();
  notificationMock.permission = 'granted';
  notificationMock.requestPermission = jest.fn().mockResolvedValue('granted');
  Object.defineProperty(window, 'Notification', { value: notificationMock });

  // Mock service worker
  const serviceWorkerMock = {
    register: jest.fn().mockResolvedValue({ scope: '/' }),
    ready: Promise.resolve({
      showNotification: jest.fn(),
      sync: { register: jest.fn() }
    })
  };
  Object.defineProperty(navigator, 'serviceWorker', { value: serviceWorkerMock });

  // Mock fetch
  global.fetch = jest.fn();

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }));

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }));

  return {
    localStorage: localStorageMock,
    sessionStorage: sessionStorageMock,
    geolocation: geolocationMock,
    notification: notificationMock,
    serviceWorker: serviceWorkerMock
  };
};

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const {
    initialEntries = ['/'],
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Wait for async operations
export const waitForAsync = async (callback, timeout = 5000) => {
  return waitFor(callback, { timeout });
};

// Simulate user interactions
export const userInteractions = {
  // Click with proper event simulation
  click: async (element) => {
    const user = userEvent.setup();
    await user.click(element);
  },

  // Type with realistic timing
  type: async (element, text, options = {}) => {
    const user = userEvent.setup();
    await user.type(element, text, { delay: 50, ...options });
  },

  // Clear and type
  clearAndType: async (element, text) => {
    const user = userEvent.setup();
    await user.clear(element);
    await user.type(element, text);
  },

  // Select option
  selectOption: async (element, option) => {
    const user = userEvent.setup();
    await user.selectOptions(element, option);
  },

  // Upload file
  upload: async (element, file) => {
    const user = userEvent.setup();
    await user.upload(element, file);
  },

  // Keyboard navigation
  keyboard: async (keys) => {
    const user = userEvent.setup();
    await user.keyboard(keys);
  }
};

// Mock API responses
export const mockApiResponses = {
  // Setup successful API response
  success: (data = mockData.apiResponse.success.data) => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data
    });
  },

  // Setup error API response
  error: (status = 400, data = mockData.apiResponse.error.data) => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status,
      json: async () => data
    });
  },

  // Setup network error
  networkError: () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
  },

  // Setup timeout
  timeout: () => {
    global.fetch.mockImplementationOnce(
      () => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 100)
      )
    );
  }
};

// Performance testing utilities
export const performanceUtils = {
  // Measure component render time
  measureRenderTime: async (component) => {
    const startTime = performance.now();
    renderWithProviders(component);
    const endTime = performance.now();
    return endTime - startTime;
  },

  // Measure async operation time
  measureAsyncTime: async (asyncOperation) => {
    const startTime = performance.now();
    await asyncOperation();
    const endTime = performance.now();
    return endTime - startTime;
  },

  // Check memory usage
  checkMemoryUsage: () => {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }
};

// Accessibility testing utilities
export const accessibilityUtils = {
  // Check for ARIA labels
  checkAriaLabels: (container) => {
    const elementsNeedingLabels = container.querySelectorAll(
      'button, input, select, textarea, [role="button"], [role="link"]'
    );
    
    const missingLabels = [];
    elementsNeedingLabels.forEach(element => {
      const hasLabel = element.getAttribute('aria-label') ||
                      element.getAttribute('aria-labelledby') ||
                      element.querySelector('label') ||
                      element.textContent.trim();
      
      if (!hasLabel) {
        missingLabels.push(element);
      }
    });
    
    return missingLabels;
  },

  // Check keyboard navigation
  checkKeyboardNavigation: async (container) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const results = [];
    for (let element of focusableElements) {
      element.focus();
      const isFocused = document.activeElement === element;
      results.push({ element, isFocused });
    }
    
    return results;
  },

  // Check color contrast (simplified)
  checkColorContrast: (element) => {
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    
    // This is a simplified check - in real testing, use proper contrast calculation
    return {
      backgroundColor,
      color,
      hasGoodContrast: backgroundColor !== color
    };
  }
};

// Test data validation
export const validationUtils = {
  // Validate email format
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone format
  isValidPhone: (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  },

  // Validate blood type
  isValidBloodType: (bloodType) => {
    const validTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    return validTypes.includes(bloodType);
  },

  // Validate required fields
  validateRequiredFields: (data, requiredFields) => {
    const missing = [];
    requiredFields.forEach(field => {
      if (!data[field] || data[field].toString().trim() === '') {
        missing.push(field);
      }
    });
    return missing;
  }
};

// Error simulation utilities
export const errorUtils = {
  // Simulate network error
  simulateNetworkError: () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    return () => { global.fetch = originalFetch; };
  },

  // Simulate JavaScript error
  simulateJSError: (message = 'Test error') => {
    const originalError = console.error;
    console.error = jest.fn();
    
    const error = new Error(message);
    window.dispatchEvent(new ErrorEvent('error', { error }));
    
    return () => { console.error = originalError; };
  },

  // Simulate unhandled promise rejection
  simulateUnhandledRejection: (reason = 'Test rejection') => {
    const event = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.reject(reason),
      reason
    });
    window.dispatchEvent(event);
  }
};

// Test cleanup utilities
export const cleanupUtils = {
  // Clean up all mocks
  cleanupMocks: () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  },

  // Clean up DOM
  cleanupDOM: () => {
    document.body.innerHTML = '';
  },

  // Clean up storage
  cleanupStorage: () => {
    localStorage.clear();
    sessionStorage.clear();
  },

  // Clean up timers
  cleanupTimers: () => {
    jest.clearAllTimers();
  },

  // Complete cleanup
  cleanupAll: () => {
    cleanupUtils.cleanupMocks();
    cleanupUtils.cleanupDOM();
    cleanupUtils.cleanupStorage();
    cleanupUtils.cleanupTimers();
  }
};

// Custom matchers for Jest
export const customMatchers = {
  // Check if element is accessible
  toBeAccessible: (element) => {
    const missingLabels = accessibilityUtils.checkAriaLabels(element);
    const pass = missingLabels.length === 0;
    
    return {
      pass,
      message: () => pass 
        ? `Expected element to not be accessible`
        : `Expected element to be accessible, but found ${missingLabels.length} elements without proper labels`
    };
  },

  // Check if component renders within time limit
  toRenderWithinTime: async (component, timeLimit = 1000) => {
    const renderTime = await performanceUtils.measureRenderTime(component);
    const pass = renderTime <= timeLimit;
    
    return {
      pass,
      message: () => pass
        ? `Expected component to render slower than ${timeLimit}ms`
        : `Expected component to render within ${timeLimit}ms, but took ${renderTime}ms`
    };
  }
};

// Test suite helpers
export const testSuiteHelpers = {
  // Create test suite for component
  createComponentTestSuite: (componentName, Component, props = {}) => {
    return {
      name: `${componentName} Component Tests`,
      setup: () => setupTestEnvironment(),
      cleanup: () => cleanupUtils.cleanupAll(),
      render: (customProps = {}) => renderWithProviders(
        <Component {...props} {...customProps} />
      ),
      component: Component,
      defaultProps: props
    };
  },

  // Create test suite for hook
  createHookTestSuite: (hookName, useHook) => {
    return {
      name: `${hookName} Hook Tests`,
      setup: () => setupTestEnvironment(),
      cleanup: () => cleanupUtils.cleanupAll(),
      hook: useHook
    };
  },

  // Create test suite for utility
  createUtilityTestSuite: (utilityName, utility) => {
    return {
      name: `${utilityName} Utility Tests`,
      setup: () => setupTestEnvironment(),
      cleanup: () => cleanupUtils.cleanupAll(),
      utility
    };
  }
};

// Export everything
export default {
  mockData,
  setupTestEnvironment,
  renderWithProviders,
  waitForAsync,
  userInteractions,
  mockApiResponses,
  performanceUtils,
  accessibilityUtils,
  validationUtils,
  errorUtils,
  cleanupUtils,
  customMatchers,
  testSuiteHelpers
};