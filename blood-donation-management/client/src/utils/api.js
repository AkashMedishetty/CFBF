import logger from './logger';

// API Configuration
class ApiClient {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.appName = process.env.REACT_APP_NAME || 'Blood Donation Management System';
    this.appVersion = process.env.REACT_APP_VERSION || '1.0.0';
    
    logger.info(`${this.appName} v${this.appVersion} - API Client initialized with base URL: ${this.baseURL}`, 'API_CLIENT');
    
    if (this.isDevelopment) {
      logger.debug('Running in development mode', 'API_CLIENT');
    }
  }

  // Generate unique request ID
  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  // Build full URL
  buildUrl(endpoint) {
    // In development, use relative URLs to leverage the proxy
    if (process.env.NODE_ENV === 'development') {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      logger.debug(`Using relative URL for development: ${cleanEndpoint}`, 'API_CLIENT');
      return cleanEndpoint;
    }
    
    // In production, use the full URL
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const fullUrl = `${this.baseURL}/${cleanEndpoint}`;
    
    logger.debug(`Built API URL: ${fullUrl}`, 'API_CLIENT');
    return fullUrl;
  }

  // Generic fetch wrapper with error handling
  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const startTime = performance.now();
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Name': this.appName,
        'X-Client-Version': this.appVersion,
        'X-Request-ID': this.generateRequestId(),
        ...options.headers,
      },
      ...options,
    };

    // Add token to headers if available and not already present
    const token = localStorage.getItem('token');
    if (token && !defaultOptions.headers.Authorization) {
      defaultOptions.headers.Authorization = `Bearer ${token}`;
    }

    try {
      logger.api('REQUEST', `${options.method || 'GET'} ${endpoint}`, 'API_CLIENT');
      logger.debug('Making API request', 'API_CLIENT', {
        url,
        method: options.method || 'GET',
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
        headers: Object.keys(defaultOptions.headers),
        hasAuthHeader: !!defaultOptions.headers.Authorization
      });
      
      let response = await fetch(url, defaultOptions);

      // If unauthorized, attempt token refresh once then retry original request
      if (response.status === 401 && endpoint !== 'api/v1/auth/refresh') {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const refreshRes = await fetch(this.buildUrl('api/v1/auth/refresh'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              const newAccess = refreshData?.data?.accessToken;
              if (newAccess) {
                localStorage.setItem('token', newAccess);
                defaultOptions.headers.Authorization = `Bearer ${newAccess}`;
                response = await fetch(url, defaultOptions);
              }
            } else {
              // Clear tokens if refresh fails
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
            }
          }
        } catch (e) {
          // Swallow and proceed to normal error path
        }
      }
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logger.api('RESPONSE', `${response.status} ${endpoint} (${duration.toFixed(2)}ms)`, 'API_CLIENT');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logger.error(`API request failed: ${endpoint} (${duration.toFixed(2)}ms)`, 'API_CLIENT', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    // Build a safe URL even in development with relative paths
    const built = this.buildUrl(endpoint);
    const base = typeof window !== 'undefined' ? window.location.origin : this.baseURL;
    const urlObj = new URL(built.startsWith('http') ? built : (built.startsWith('/') ? built : `/${built}`), base);

    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        urlObj.searchParams.append(key, params[key]);
      }
    });

    return this.request(urlObj.pathname + urlObj.search, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // PATCH request
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Education API endpoints
export const educationApi = {
  // Get all content
  getContent: (params = {}) => apiClient.get('api/public/education/content', params),
  
  // Get content by slug
  getContentBySlug: (slug) => apiClient.get(`api/public/education/content/${slug}`),
  
  // Get featured content
  getFeaturedContent: (limit = 3) => apiClient.get('api/public/education/featured', { limit }),
  
  // Get popular content
  getPopularContent: (limit = 5) => apiClient.get('api/public/education/popular', { limit }),
  
  // Get categories
  getCategories: () => apiClient.get('api/public/education/categories'),
  
  // Get FAQs
  getFAQs: (params = {}) => apiClient.get('api/public/education/faqs', params),
  
  // Get FAQ by ID
  getFAQById: (id) => apiClient.get(`api/public/education/faqs/${id}`),
  
  // Submit FAQ feedback
  submitFAQFeedback: (id, helpful) => apiClient.post(`api/public/education/faqs/${id}/feedback`, { helpful }),
  
  // Track download
  trackDownload: (id) => apiClient.post(`api/public/education/content/${id}/download`),
};

// Authentication API endpoints
export const authApi = {
  // Register user
  register: (userData) => apiClient.post('api/v1/auth/register', userData),
  
  // Login user (password-based)
  login: (credentials) => apiClient.post('api/v1/auth/login', credentials),
  
  // Login user with OTP
  loginWithOTP: (credentials) => apiClient.post('api/v1/auth/login-otp', credentials),
  
  // Refresh token
  refreshToken: (refreshToken) => apiClient.post('api/v1/auth/refresh', { refreshToken }),
  
  // Logout
  logout: () => apiClient.post('api/v1/auth/logout'),
  
  // Get current user
  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    logger.debug('🔍 Getting current user', 'API_CLIENT', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
    });
    return apiClient.get('api/v1/auth/me');
  },
  
  // Check if email is available
  checkEmailAvailability: (email) => apiClient.post('api/v1/auth/check-email', { email }),
  
  // Check if phone number is available
  checkPhoneAvailability: (phone) => apiClient.post('api/v1/auth/check-phone', { phone }),
  
  // Reset password
  resetPassword: (resetData) => apiClient.post('api/v1/auth/reset-password', resetData)
};

// User/Dashboard API endpoints
export const userApi = {
  getUserStats: (userId) => apiClient.get(`api/v1/users/${userId}/stats`),
  getUserProfile: (userId) => apiClient.get(`api/v1/users/${userId}`),
  getDonations: (userId) => apiClient.get(`api/v1/users/${userId}/donations`),
  getActivity: (userId) => apiClient.get(`api/v1/users/${userId}/activity`),
  getOnboardingStatus: (userId) => apiClient.get(`api/v1/users/${userId}/onboarding-status`),
};

// Admin dashboard API
export const adminApi = {
  getPendingDonors: () => apiClient.get('api/v1/admin/donors/pending'),
  getDonorStats: () => apiClient.get('api/v1/admin/donors/stats'),
  getRecentActivity: () => apiClient.get('api/v1/admin/activity/recent'),
  getRequestsSummary: () => apiClient.get('api/v1/admin/requests/summary'),
  getAnalyticsOverview: (timeRange = '30d') => apiClient.get('api/v1/analytics/dashboard', { timeRange }),
  // Donor details
  getDonorDetails: (donorId) => apiClient.get(`api/v1/admin/donors/${donorId}/details`),
  // Documents (admin)
  getUserDocuments: (userId) => apiClient.get('api/v1/documents/list', { userId }),
  verifyDocument: (documentId, { verified, rejectionReason } = { verified: true }) =>
    apiClient.put(`api/v1/documents/${documentId}/verify`, { verified, rejectionReason }),
  // Email diagnostics
  getEmailStatus: () => apiClient.get('api/v1/admin/email/status'),
  sendTestEmail: (email) => apiClient.post('api/v1/admin/email/test', { email }),
  // Requests management
  getBloodRequests: (params = {}) => apiClient.get('api/v1/blood-requests', params),
  updateRequestStatus: (requestId, status, notes = '') => apiClient.put(`api/v1/blood-requests/${requestId}/status`, { status, notes })
  ,
  // Notification settings
  getNotificationSettings: () => apiClient.get('api/v1/admin/notifications/settings'),
  updateNotificationSettings: (payload) => apiClient.put('api/v1/admin/notifications/settings', payload),
  
  // Donor management
  approveDonor: (donorId) => apiClient.post(`api/v1/admin/donors/${donorId}/approve`),
  rejectDonor: (donorId, reason) => apiClient.post(`api/v1/admin/donors/${donorId}/reject`, { reason }),
  suspendDonor: (donorId, reason) => apiClient.post(`api/v1/admin/donors/${donorId}/suspend`, { reason }),
  reactivateDonor: (donorId) => apiClient.post(`api/v1/admin/donors/${donorId}/reactivate`),
  
  // Data export
  exportDonors: async (filters = {}) => {
    try {
      const response = await fetch('/api/v1/admin/export/donors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(filters)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get the CSV content as text
      const csvContent = await response.text();
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `donors-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'Export completed successfully' };
    } catch (error) {
      logger.error('Export failed', 'API_CLIENT', error);
      throw error;
    }
  },
  
  // Questionnaire review
  reviewQuestionnaire: (donorId, reviewData) => apiClient.put(`api/v1/admin/donors/${donorId}/questionnaire/review`, reviewData)
};

// Blood Request API endpoints
export const bloodRequestApi = {
  // Submit emergency blood request
  submitEmergencyRequest: (requestData) => apiClient.post('api/v1/blood-requests', requestData),
  
  // Get blood requests
  getBloodRequests: (params = {}) => apiClient.get('api/v1/blood-requests', params),
  
  // Get blood request by ID
  getBloodRequestById: (id) => apiClient.get(`api/v1/blood-requests/${id}`),
  
  // Update blood request
  updateBloodRequest: (id, data) => apiClient.put(`api/v1/blood-requests/${id}`, data),
  
  // Cancel blood request
  cancelBloodRequest: (id) => apiClient.delete(`api/v1/blood-requests/${id}`),
};

// Hospital/Facility API endpoints
export const facilityApi = {
  // Get facilities directory
  getFacilities: (params = {}) => apiClient.get('api/v1/public/facilities/directory', params),
  
  // Get facility by ID
  getFacilityById: (id) => apiClient.get(`api/v1/public/facilities/${id}`),
  
  // Get nearby facilities
  getNearbyFacilities: (params = {}) => apiClient.get('api/v1/public/facilities/nearby', params),
  
  // Search facilities
  searchFacilities: (params = {}) => apiClient.get('api/v1/public/facilities/search', params),
};

// OTP API endpoints
export const otpApi = {
  // Request OTP (supports both phone and email)
  sendOTP: (target, purpose = 'verification', method = 'email') => {
    const isEmail = target.includes('@');
    return apiClient.post('api/v1/otp/request', { 
      [isEmail ? 'email' : 'phoneNumber']: target, 
      purpose,
      method: isEmail ? 'email' : method
    });
  },
  
  // Verify OTP (supports both phone and email)
  verifyOTP: (target, otp, purpose = 'verification') => {
    const isEmail = target.includes('@');
    return apiClient.post('api/v1/otp/verify', { 
      [isEmail ? 'email' : 'phoneNumber']: target, 
      otp, 
      purpose 
    });
  },
  
  // Resend OTP
  resendOTP: (target, purpose = 'verification', method = 'email') => {
    const isEmail = target.includes('@');
    return apiClient.post('api/v1/otp/request', { 
      [isEmail ? 'email' : 'phoneNumber']: target, 
      purpose,
      method: isEmail ? 'email' : method,
      isResend: true 
    });
  },

  // Email-specific OTP methods
  sendEmailOTP: (email, purpose = 'verification') => apiClient.post('api/v1/otp/email/request', { email, purpose }),
  verifyEmailOTP: (email, otp, purpose = 'verification') => apiClient.post('api/v1/otp/email/verify', { email, otp, purpose }),
};

// Export the main API client and specific APIs
export default apiClient;