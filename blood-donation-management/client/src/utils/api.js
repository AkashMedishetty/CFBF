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
    // Always use absolute URLs for now to bypass proxy issues
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

    try {
      logger.api('REQUEST', `${options.method || 'GET'} ${endpoint}`, 'API_CLIENT');
      
      const response = await fetch(url, defaultOptions);
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
    const url = new URL(this.buildUrl(endpoint));
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    return this.request(url.pathname + url.search, { method: 'GET' });
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
  
  // Login user
  login: (credentials) => apiClient.post('api/v1/auth/login', credentials),
  
  // Refresh token
  refreshToken: (refreshToken) => apiClient.post('api/v1/auth/refresh', { refreshToken }),
  
  // Logout
  logout: () => apiClient.post('api/v1/auth/logout'),
  
  // Get current user
  getCurrentUser: () => apiClient.get('api/v1/auth/me'),
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
  // Send OTP
  sendOTP: (phoneNumber, purpose = 'verification') => apiClient.post('api/v1/otp/send', { phoneNumber, purpose }),
  
  // Verify OTP
  verifyOTP: (phoneNumber, otp, purpose = 'verification') => apiClient.post('api/v1/otp/verify', { phoneNumber, otp, purpose }),
  
  // Resend OTP
  resendOTP: (phoneNumber, purpose = 'verification') => apiClient.post('api/v1/otp/resend', { phoneNumber, purpose }),
};

// Export the main API client and specific APIs
export default apiClient;