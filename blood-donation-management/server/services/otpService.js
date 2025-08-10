const crypto = require('crypto');
const logger = require('../utils/logger');

class OTPService {
  constructor() {
    this.otpStore = new Map(); // In production, use Redis or database
    this.maxRetries = 3;
    this.otpLength = 6;
    this.otpExpiry = 5 * 60 * 1000; // 5 minutes
    this.retryDelay = 60 * 1000; // 1 minute between retries
    
    logger.info('OTP Service initialized', 'OTP_SERVICE');
    logger.debug(`OTP expiry: ${this.otpExpiry / 1000}s, Max retries: ${this.maxRetries}`, 'OTP_SERVICE');
  }

  /**
   * Generate a secure OTP
   * @returns {string} 6-digit OTP
   */
  generateOTP() {
    const otp = crypto.randomInt(100000, 999999).toString();
    logger.debug('OTP generated', 'OTP_SERVICE');
    return otp;
  }

  /**
   * Store OTP with metadata
   * @param {string} phoneNumber - User's phone number
   * @param {string} otp - Generated OTP
   * @param {string} purpose - Purpose of OTP (registration, login, etc.)
   */
  storeOTP(phoneNumber, otp, purpose = 'verification') {
    const otpData = {
      otp,
      purpose,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.otpExpiry,
      attempts: 0,
      maxAttempts: this.maxRetries,
      verified: false
    };

    this.otpStore.set(phoneNumber, otpData);
    logger.info(`OTP stored for phone: ${this.maskPhoneNumber(phoneNumber)}`, 'OTP_SERVICE');
    logger.debug(`OTP expires at: ${new Date(otpData.expiresAt).toISOString()}`, 'OTP_SERVICE');
    
    // Auto-cleanup expired OTPs
    setTimeout(() => {
      if (this.otpStore.has(phoneNumber)) {
        const storedData = this.otpStore.get(phoneNumber);
        if (!storedData.verified && Date.now() > storedData.expiresAt) {
          this.otpStore.delete(phoneNumber);
          logger.debug(`Auto-cleaned expired OTP for: ${this.maskPhoneNumber(phoneNumber)}`, 'OTP_SERVICE');
        }
      }
    }, this.otpExpiry + 1000);
  }

  /**
   * Verify OTP
   * @param {string} phoneNumber - User's phone number
   * @param {string} inputOTP - OTP provided by user
   * @returns {Object} Verification result
   */
  verifyOTP(phoneNumber, inputOTP) {
    logger.info(`OTP verification attempt for: ${this.maskPhoneNumber(phoneNumber)}`, 'OTP_SERVICE');
    
    const otpData = this.otpStore.get(phoneNumber);
    
    if (!otpData) {
      logger.warn(`No OTP found for phone: ${this.maskPhoneNumber(phoneNumber)}`, 'OTP_SERVICE');
      return {
        success: false,
        error: 'OTP_NOT_FOUND',
        message: 'No OTP found for this phone number. Please request a new OTP.',
        remainingAttempts: 0
      };
    }

    // Check if OTP is expired
    if (Date.now() > otpData.expiresAt) {
      logger.warn(`Expired OTP verification attempt for: ${this.maskPhoneNumber(phoneNumber)}`, 'OTP_SERVICE');
      this.otpStore.delete(phoneNumber);
      return {
        success: false,
        error: 'OTP_EXPIRED',
        message: 'OTP has expired. Please request a new OTP.',
        remainingAttempts: 0
      };
    }

    // Check if already verified - allow reuse within 2 minutes for login purposes
    if (otpData.verified) {
      const timeSinceVerification = Date.now() - (otpData.verifiedAt || 0);
      const gracePeriod = 2 * 60 * 1000; // 2 minutes
      
      if (timeSinceVerification > gracePeriod) {
        logger.warn(`Expired verified OTP used for: ${this.maskPhoneNumber(phoneNumber)}`, 'OTP_SERVICE');
        return {
          success: false,
          error: 'OTP_ALREADY_USED',
          message: 'This OTP has already been used. Please request a new OTP.',
          remainingAttempts: 0
        };
      } else {
        // Allow reuse within grace period for login
        logger.info(`Allowing verified OTP reuse within grace period for: ${this.maskPhoneNumber(phoneNumber)}`, 'OTP_SERVICE');
        return {
          success: true,
          message: 'OTP verified successfully (reused within grace period)',
          purpose: otpData.purpose,
          verifiedAt: otpData.verifiedAt,
          reused: true
        };
      }
    }

    // Increment attempt count
    otpData.attempts += 1;
    
    // Check if max attempts exceeded
    if (otpData.attempts > otpData.maxAttempts) {
      logger.warn(`Max OTP attempts exceeded for: ${this.maskPhoneNumber(phoneNumber)}`, 'OTP_SERVICE');
      this.otpStore.delete(phoneNumber);
      return {
        success: false,
        error: 'MAX_ATTEMPTS_EXCEEDED',
        message: 'Maximum verification attempts exceeded. Please request a new OTP.',
        remainingAttempts: 0
      };
    }

    // Verify OTP
    if (otpData.otp === inputOTP) {
      otpData.verified = true;
      otpData.verifiedAt = Date.now();
      logger.success(`OTP verified successfully for: ${this.maskPhoneNumber(phoneNumber)}`, 'OTP_SERVICE');
      
      // Clean up after successful verification (with grace period for login)
      setTimeout(() => {
        this.otpStore.delete(phoneNumber);
        logger.debug(`Cleaned up verified OTP for: ${this.maskPhoneNumber(phoneNumber)}`, 'OTP_SERVICE');
      }, 2 * 60 * 1000); // 2 minutes grace period
      
      return {
        success: true,
        message: 'OTP verified successfully',
        purpose: otpData.purpose,
        verifiedAt: otpData.verifiedAt
      };
    } else {
      logger.warn(`Invalid OTP attempt ${otpData.attempts}/${otpData.maxAttempts} for: ${this.maskPhoneNumber(phoneNumber)}`, 'OTP_SERVICE');
      this.otpStore.set(phoneNumber, otpData); // Update attempt count
      
      return {
        success: false,
        error: 'INVALID_OTP',
        message: 'Invalid OTP. Please check and try again.',
        remainingAttempts: otpData.maxAttempts - otpData.attempts
      };
    }
  }

  /**
   * Check if phone number can request new OTP (rate limiting)
   * @param {string} phoneNumber - User's phone number
   * @returns {Object} Rate limit status
   */
  canRequestOTP(phoneNumber) {
    const otpData = this.otpStore.get(phoneNumber);
    
    if (!otpData) {
      return { canRequest: true };
    }

    // If OTP is expired, allow new request
    if (Date.now() > otpData.expiresAt) {
      this.otpStore.delete(phoneNumber);
      return { canRequest: true };
    }

    // If OTP is verified, allow new request for different purpose
    if (otpData.verified) {
      return { canRequest: true };
    }

    // Check retry delay
    const timeSinceCreation = Date.now() - otpData.createdAt;
    if (timeSinceCreation < this.retryDelay) {
      const remainingTime = Math.ceil((this.retryDelay - timeSinceCreation) / 1000);
      logger.warn(`Rate limit active for: ${this.maskPhoneNumber(phoneNumber)}, retry in ${remainingTime}s`, 'OTP_SERVICE');
      
      return {
        canRequest: false,
        error: 'RATE_LIMITED',
        message: `Please wait ${remainingTime} seconds before requesting a new OTP.`,
        retryAfter: remainingTime
      };
    }

    return { canRequest: true };
  }

  /**
   * Get OTP status for a phone number
   * @param {string} phoneNumber - User's phone number
   * @returns {Object} OTP status
   */
  getOTPStatus(phoneNumber) {
    const otpData = this.otpStore.get(phoneNumber);
    
    if (!otpData) {
      return {
        exists: false,
        message: 'No active OTP found'
      };
    }

    const now = Date.now();
    const timeRemaining = Math.max(0, Math.ceil((otpData.expiresAt - now) / 1000));
    
    return {
      exists: true,
      expired: now > otpData.expiresAt,
      verified: otpData.verified,
      attempts: otpData.attempts,
      maxAttempts: otpData.maxAttempts,
      remainingAttempts: otpData.maxAttempts - otpData.attempts,
      timeRemaining,
      purpose: otpData.purpose,
      createdAt: new Date(otpData.createdAt).toISOString()
    };
  }

  /**
   * Clear OTP for a phone number
   * @param {string} phoneNumber - User's phone number
   */
  clearOTP(phoneNumber) {
    const deleted = this.otpStore.delete(phoneNumber);
    if (deleted) {
      logger.info(`OTP cleared for: ${this.maskPhoneNumber(phoneNumber)}`, 'OTP_SERVICE');
    }
    return deleted;
  }

  /**
   * Mask phone number for logging
   * @param {string} phoneNumber - Phone number to mask
   * @returns {string} Masked phone number
   */
  maskPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 4) return '****';
    return phoneNumber.slice(0, 2) + '*'.repeat(phoneNumber.length - 4) + phoneNumber.slice(-2);
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    const activeOTPs = this.otpStore.size;
    const now = Date.now();
    let expiredCount = 0;
    let verifiedCount = 0;

    for (const [phone, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) expiredCount++;
      if (data.verified) verifiedCount++;
    }

    return {
      activeOTPs,
      expiredCount,
      verifiedCount,
      pendingCount: activeOTPs - expiredCount - verifiedCount
    };
  }

  /**
   * Cleanup expired OTPs (maintenance function)
   */
  cleanupExpiredOTPs() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [phoneNumber, otpData] of this.otpStore.entries()) {
      if (now > otpData.expiresAt && !otpData.verified) {
        this.otpStore.delete(phoneNumber);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired OTPs`, 'OTP_SERVICE');
    }

    return cleanedCount;
  }
}

// Create singleton instance
const otpService = new OTPService();

// Run cleanup every 5 minutes
setInterval(() => {
  otpService.cleanupExpiredOTPs();
}, 5 * 60 * 1000);

module.exports = otpService;