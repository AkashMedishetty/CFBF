// Blood types and compatibility
export const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

export const BLOOD_COMPATIBILITY = {
  'A+': ['A+', 'AB+'],
  'A-': ['A+', 'A-', 'AB+', 'AB-'],
  'B+': ['B+', 'AB+'],
  'B-': ['B+', 'B-', 'AB+', 'AB-'],
  'AB+': ['AB+'],
  'AB-': ['AB+', 'AB-'],
  'O+': ['A+', 'B+', 'AB+', 'O+'],
  'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
};

// User roles
export const USER_ROLES = {
  DONOR: 'donor',
  ADMIN: 'admin',
  HOSPITAL: 'hospital',
  GUEST: 'guest'
};

// Request urgency levels
export const URGENCY_LEVELS = {
  CRITICAL: 'critical',    // Within 2 hours
  URGENT: 'urgent',        // Within 6 hours
  SCHEDULED: 'scheduled'   // Within 24 hours
};

// Request status
export const REQUEST_STATUS = {
  PENDING: 'pending',
  MATCHED: 'matched',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

// Donor availability status
export const AVAILABILITY_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  INACTIVE: 'inactive',
  POST_DONATION: 'post_donation'
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    VERIFY_OTP: '/api/v1/auth/verify-otp',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout'
  },
  USERS: {
    PROFILE: '/api/v1/users/profile',
    UPDATE_PROFILE: '/api/v1/users/profile',
    PREFERENCES: '/api/v1/users/preferences'
  },
  DONORS: {
    LIST: '/api/v1/donors',
    PROFILE: '/api/v1/donors/profile',
    AVAILABILITY: '/api/v1/donors/availability',
    HISTORY: '/api/v1/donors/history'
  },
  REQUESTS: {
    CREATE: '/api/v1/requests',
    LIST: '/api/v1/requests',
    RESPOND: '/api/v1/requests/:id/respond',
    STATUS: '/api/v1/requests/:id/status'
  }
};

// WhatsApp message templates
export const WHATSAPP_TEMPLATES = {
  BLOOD_REQUEST_URGENT: 'blood_request_urgent_en',
  DONATION_CONFIRMATION: 'donation_confirmation_en',
  THANK_YOU: 'thank_you_donor_en',
  REMINDER: 'donation_reminder_en'
};

// Validation constants
export const VALIDATION = {
  PHONE_REGEX: /^[6-9]\d{9}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_AGE: 18,
  MAX_AGE: 65,
  MIN_WEIGHT: 50,
  PASSWORD_MIN_LENGTH: 8
};

// Geographic constants
export const GEO_CONSTANTS = {
  DEFAULT_SEARCH_RADIUS: 15, // km
  MAX_SEARCH_RADIUS: 50,     // km
  EMERGENCY_RADIUS: 25,      // km
  COORDINATES_PRECISION: 6   // decimal places
};

// Time constants
export const TIME_CONSTANTS = {
  OTP_EXPIRY: 5 * 60 * 1000,           // 5 minutes
  JWT_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  DONATION_COOLDOWN: 56 * 24 * 60 * 60 * 1000, // 56 days
  RESPONSE_TIMEOUT: 30 * 60 * 1000      // 30 minutes
};