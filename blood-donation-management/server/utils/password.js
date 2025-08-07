const bcrypt = require('bcryptjs');
const logger = require('./logger');

class PasswordManager {
  constructor() {
    this.saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    logger.info('Password Manager initialized', 'PASSWORD_MANAGER');
    logger.debug(`Salt rounds: ${this.saltRounds}`, 'PASSWORD_MANAGER');
  }

  // Hash password
  async hashPassword(plainPassword) {
    try {
      logger.debug('Hashing password', 'PASSWORD_MANAGER');
      logger.startTimer('Password Hash');
      
      if (!plainPassword || typeof plainPassword !== 'string') {
        logger.error('Invalid password provided for hashing', 'PASSWORD_MANAGER');
        throw new Error('Password must be a non-empty string');
      }

      if (plainPassword.length < 8) {
        logger.warn('Password too short for hashing', 'PASSWORD_MANAGER');
        throw new Error('Password must be at least 8 characters long');
      }

      const salt = await bcrypt.genSalt(this.saltRounds);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);
      
      logger.endTimer('Password Hash');
      logger.success('Password hashed successfully', 'PASSWORD_MANAGER');
      
      return hashedPassword;
    } catch (error) {
      logger.error('Password hashing failed', 'PASSWORD_MANAGER', error);
      throw error;
    }
  }

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    try {
      logger.debug('Verifying password', 'PASSWORD_MANAGER');
      logger.startTimer('Password Verify');
      
      if (!plainPassword || !hashedPassword) {
        logger.error('Missing password or hash for verification', 'PASSWORD_MANAGER');
        throw new Error('Both password and hash are required');
      }

      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      
      logger.endTimer('Password Verify');
      
      if (isValid) {
        logger.success('Password verification successful', 'PASSWORD_MANAGER');
      } else {
        logger.warn('Password verification failed', 'PASSWORD_MANAGER');
      }
      
      return isValid;
    } catch (error) {
      logger.error('Password verification error', 'PASSWORD_MANAGER', error);
      throw error;
    }
  }

  // Generate secure random password
  generateSecurePassword(length = 12) {
    try {
      logger.debug(`Generating secure password of length ${length}`, 'PASSWORD_MANAGER');
      
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      const allChars = lowercase + uppercase + numbers + symbols;
      
      let password = '';
      
      // Ensure at least one character from each category
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      password += symbols[Math.floor(Math.random() * symbols.length)];
      
      // Fill the rest randomly
      for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }
      
      // Shuffle the password
      password = password.split('').sort(() => Math.random() - 0.5).join('');
      
      logger.success(`Secure password generated (length: ${password.length})`, 'PASSWORD_MANAGER');
      
      return password;
    } catch (error) {
      logger.error('Secure password generation failed', 'PASSWORD_MANAGER', error);
      throw error;
    }
  }

  // Validate password strength
  validatePasswordStrength(password) {
    try {
      logger.debug('Validating password strength', 'PASSWORD_MANAGER');
      
      const validations = {
        minLength: password.length >= 8,
        hasLowercase: /[a-z]/.test(password),
        hasUppercase: /[A-Z]/.test(password),
        hasNumbers: /\d/.test(password),
        hasSymbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
        noCommonPatterns: !this.hasCommonPatterns(password)
      };

      const score = Object.values(validations).filter(Boolean).length;
      const maxScore = Object.keys(validations).length;
      
      const strength = {
        score,
        maxScore,
        percentage: Math.round((score / maxScore) * 100),
        level: this.getStrengthLevel(score, maxScore),
        validations,
        suggestions: this.getPasswordSuggestions(validations)
      };

      logger.debug(`Password strength: ${strength.level} (${strength.percentage}%)`, 'PASSWORD_MANAGER');
      logger.logObject(strength, 'Password Strength Analysis', 'PASSWORD_MANAGER');
      
      return strength;
    } catch (error) {
      logger.error('Password strength validation failed', 'PASSWORD_MANAGER', error);
      throw error;
    }
  }

  // Check for common password patterns
  hasCommonPatterns(password) {
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i,
      /welcome/i,
      /monkey/i,
      /dragon/i
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }

  // Get password strength level
  getStrengthLevel(score, maxScore) {
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 90) return 'Very Strong';
    if (percentage >= 75) return 'Strong';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Weak';
  }

  // Get password improvement suggestions
  getPasswordSuggestions(validations) {
    const suggestions = [];
    
    if (!validations.minLength) {
      suggestions.push('Use at least 8 characters');
    }
    if (!validations.hasLowercase) {
      suggestions.push('Include lowercase letters (a-z)');
    }
    if (!validations.hasUppercase) {
      suggestions.push('Include uppercase letters (A-Z)');
    }
    if (!validations.hasNumbers) {
      suggestions.push('Include numbers (0-9)');
    }
    if (!validations.hasSymbols) {
      suggestions.push('Include special characters (!@#$%^&*)');
    }
    if (!validations.noCommonPatterns) {
      suggestions.push('Avoid common patterns like "123456" or "password"');
    }
    
    return suggestions;
  }

  // Generate password reset token
  generateResetToken() {
    try {
      logger.debug('Generating password reset token', 'PASSWORD_MANAGER');
      
      const token = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      logger.success('Password reset token generated', 'PASSWORD_MANAGER');
      logger.debug(`Reset token expires at: ${expiresAt.toISOString()}`, 'PASSWORD_MANAGER');
      
      return {
        token,
        expiresAt
      };
    } catch (error) {
      logger.error('Password reset token generation failed', 'PASSWORD_MANAGER', error);
      throw error;
    }
  }

  // Validate reset token expiration
  isResetTokenValid(tokenData) {
    try {
      if (!tokenData || !tokenData.expiresAt) {
        logger.warn('Invalid reset token data', 'PASSWORD_MANAGER');
        return false;
      }

      const isValid = new Date() < new Date(tokenData.expiresAt);
      
      if (isValid) {
        logger.debug('Reset token is valid', 'PASSWORD_MANAGER');
      } else {
        logger.warn('Reset token has expired', 'PASSWORD_MANAGER');
      }
      
      return isValid;
    } catch (error) {
      logger.error('Reset token validation error', 'PASSWORD_MANAGER', error);
      return false;
    }
  }
}

// Create singleton instance
const passwordManager = new PasswordManager();

module.exports = passwordManager;