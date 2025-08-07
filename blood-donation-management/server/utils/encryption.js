const crypto = require('crypto');
const logger = require('./logger');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.tagLength = 16; // 128 bits
    
    // Use environment variable or generate a secure key
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
    
    if (!process.env.ENCRYPTION_KEY) {
      logger.warn('No ENCRYPTION_KEY found in environment. Using generated key (not recommended for production)', 'ENCRYPTION');
      logger.debug(`Generated key: ${this.encryptionKey}`, 'ENCRYPTION');
    } else {
      logger.success('Encryption service initialized with environment key', 'ENCRYPTION');
    }
  }

  /**
   * Generate a secure encryption key
   * @returns {string} Base64 encoded encryption key
   */
  generateEncryptionKey() {
    const key = crypto.randomBytes(this.keyLength);
    return key.toString('base64');
  }

  /**
   * Get the encryption key as a Buffer
   * @returns {Buffer} Encryption key buffer
   */
  getKeyBuffer() {
    return Buffer.from(this.encryptionKey, 'base64');
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   * @param {string} plaintext - Data to encrypt
   * @param {string} associatedData - Additional authenticated data (optional)
   * @returns {Object} Encrypted data with IV and auth tag
   */
  encrypt(plaintext, associatedData = '') {
    try {
      if (!plaintext) {
        throw new Error('Plaintext is required for encryption');
      }

      // Generate random IV for each encryption
      const iv = crypto.randomBytes(this.ivLength);
      const key = this.getKeyBuffer();
      
      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from(associatedData, 'utf8'));
      
      // Encrypt the data
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Get the authentication tag
      const authTag = cipher.getAuthTag();
      
      const result = {
        encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        algorithm: this.algorithm
      };

      logger.debug('Data encrypted successfully', 'ENCRYPTION');
      return result;

    } catch (error) {
      logger.error('Encryption failed', 'ENCRYPTION', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param {Object} encryptedData - Object containing encrypted data, IV, and auth tag
   * @param {string} associatedData - Additional authenticated data (optional)
   * @returns {string} Decrypted plaintext
   */
  decrypt(encryptedData, associatedData = '') {
    try {
      if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv || !encryptedData.authTag) {
        throw new Error('Invalid encrypted data format');
      }

      const key = this.getKeyBuffer();
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const authTag = Buffer.from(encryptedData.authTag, 'base64');
      
      // Create decipher
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAuthTag(authTag);
      decipher.setAAD(Buffer.from(associatedData, 'utf8'));
      
      // Decrypt the data
      let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      logger.debug('Data decrypted successfully', 'ENCRYPTION');
      return decrypted;

    } catch (error) {
      logger.error('Decryption failed', 'ENCRYPTION', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data using SHA-256
   * @param {string} data - Data to hash
   * @param {string} salt - Salt for hashing (optional)
   * @returns {Object} Hash and salt
   */
  hash(data, salt = null) {
    try {
      if (!data) {
        throw new Error('Data is required for hashing');
      }

      // Generate salt if not provided
      if (!salt) {
        salt = crypto.randomBytes(16).toString('base64');
      }

      // Create hash
      const hash = crypto.createHash('sha256');
      hash.update(data + salt);
      const hashedData = hash.digest('base64');

      logger.debug('Data hashed successfully', 'ENCRYPTION');
      return {
        hash: hashedData,
        salt,
        algorithm: 'sha256'
      };

    } catch (error) {
      logger.error('Hashing failed', 'ENCRYPTION', error);
      throw new Error('Failed to hash data');
    }
  }

  /**
   * Verify hashed data
   * @param {string} data - Original data
   * @param {string} hash - Hash to verify against
   * @param {string} salt - Salt used for hashing
   * @returns {boolean} True if hash matches
   */
  verifyHash(data, hash, salt) {
    try {
      const newHash = this.hash(data, salt);
      return newHash.hash === hash;
    } catch (error) {
      logger.error('Hash verification failed', 'ENCRYPTION', error);
      return false;
    }
  }

  /**
   * Encrypt personally identifiable information (PII)
   * @param {Object} piiData - Object containing PII fields
   * @returns {Object} Object with encrypted PII fields
   */
  encryptPII(piiData) {
    const encryptedPII = {};
    const piiFields = [
      'name', 'email', 'phone', 'address', 'emergencyContact',
      'medicalConditions', 'medications', 'nationalId', 'passport'
    ];

    for (const [key, value] of Object.entries(piiData)) {
      if (piiFields.includes(key) && value) {
        encryptedPII[key] = this.encrypt(String(value), key);
        logger.debug(`Encrypted PII field: ${key}`, 'ENCRYPTION');
      } else {
        encryptedPII[key] = value;
      }
    }

    return encryptedPII;
  }

  /**
   * Decrypt personally identifiable information (PII)
   * @param {Object} encryptedPII - Object containing encrypted PII fields
   * @returns {Object} Object with decrypted PII fields
   */
  decryptPII(encryptedPII) {
    const decryptedPII = {};
    const piiFields = [
      'name', 'email', 'phone', 'address', 'emergencyContact',
      'medicalConditions', 'medications', 'nationalId', 'passport'
    ];

    for (const [key, value] of Object.entries(encryptedPII)) {
      if (piiFields.includes(key) && value && typeof value === 'object' && value.encrypted) {
        try {
          decryptedPII[key] = this.decrypt(value, key);
          logger.debug(`Decrypted PII field: ${key}`, 'ENCRYPTION');
        } catch (error) {
          logger.error(`Failed to decrypt PII field: ${key}`, 'ENCRYPTION', error);
          decryptedPII[key] = null;
        }
      } else {
        decryptedPII[key] = value;
      }
    }

    return decryptedPII;
  }

  /**
   * Generate a secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} Base64 encoded token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * Generate a secure API key
   * @returns {string} Secure API key
   */
  generateAPIKey() {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const combined = `${timestamp}-${randomBytes}`;
    
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Mask sensitive data for logging
   * @param {string} data - Data to mask
   * @param {number} visibleChars - Number of characters to show at start/end
   * @returns {string} Masked data
   */
  maskSensitiveData(data, visibleChars = 2) {
    if (!data || data.length <= visibleChars * 2) {
      return '*'.repeat(data?.length || 4);
    }
    
    const start = data.slice(0, visibleChars);
    const end = data.slice(-visibleChars);
    const middle = '*'.repeat(data.length - visibleChars * 2);
    
    return `${start}${middle}${end}`;
  }

  /**
   * Get encryption service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      algorithm: this.algorithm,
      keyLength: this.keyLength,
      ivLength: this.ivLength,
      tagLength: this.tagLength,
      hasEnvironmentKey: !!process.env.ENCRYPTION_KEY,
      ready: true
    };
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

module.exports = encryptionService;