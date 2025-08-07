const jwt = require('jsonwebtoken');
const logger = require('./logger');

class JWTManager {
  constructor() {
    this.secret = process.env.JWT_SECRET;
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    if (!this.secret) {
      logger.error('JWT_SECRET environment variable is not set', 'JWT_MANAGER');
      throw new Error('JWT_SECRET is required');
    }
    
    logger.info('JWT Manager initialized', 'JWT_MANAGER');
    logger.debug(`JWT expires in: ${this.expiresIn}`, 'JWT_MANAGER');
  }

  // Generate JWT token
  generateToken(payload, options = {}) {
    try {
      logger.debug(`Generating JWT token for user: ${payload.userId || payload.id}`, 'JWT_MANAGER');
      
      const tokenPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        jti: this.generateJTI() // JWT ID for token tracking
      };

      const tokenOptions = {
        expiresIn: options.expiresIn || this.expiresIn,
        issuer: 'call-for-blood-foundation',
        audience: 'call-for-blood-users',
        ...options
      };

      const token = jwt.sign(tokenPayload, this.secret, tokenOptions);
      
      logger.success(`JWT token generated successfully for user: ${payload.userId || payload.id}`, 'JWT_MANAGER');
      logger.debug(`Token expires in: ${tokenOptions.expiresIn}`, 'JWT_MANAGER');
      
      return token;
    } catch (error) {
      logger.error('Failed to generate JWT token', 'JWT_MANAGER', error);
      throw new Error('Token generation failed');
    }
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      logger.debug('Verifying JWT token', 'JWT_MANAGER');
      
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'call-for-blood-foundation',
        audience: 'call-for-blood-users'
      });

      logger.success(`JWT token verified successfully for user: ${decoded.userId || decoded.id}`, 'JWT_MANAGER');
      logger.debug(`Token JTI: ${decoded.jti}`, 'JWT_MANAGER');
      
      return decoded;
    } catch (error) {
      logger.warn('JWT token verification failed', 'JWT_MANAGER');
      
      if (error.name === 'TokenExpiredError') {
        logger.debug(`Token expired at: ${error.expiredAt}`, 'JWT_MANAGER');
        throw new Error('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        logger.debug(`Invalid token: ${error.message}`, 'JWT_MANAGER');
        throw new Error('Invalid token');
      } else if (error.name === 'NotBeforeError') {
        logger.debug(`Token not active until: ${error.date}`, 'JWT_MANAGER');
        throw new Error('Token not yet active');
      }
      
      throw new Error('Token verification failed');
    }
  }

  // Decode token without verification (for debugging)
  decodeToken(token) {
    try {
      logger.debug('Decoding JWT token without verification', 'JWT_MANAGER');
      const decoded = jwt.decode(token, { complete: true });
      
      if (!decoded) {
        logger.warn('Failed to decode JWT token', 'JWT_MANAGER');
        return null;
      }
      
      logger.debug('JWT token decoded successfully', 'JWT_MANAGER');
      logger.logObject(decoded.header, 'Token Header', 'JWT_MANAGER');
      logger.logObject(decoded.payload, 'Token Payload', 'JWT_MANAGER');
      
      return decoded;
    } catch (error) {
      logger.error('Failed to decode JWT token', 'JWT_MANAGER', error);
      return null;
    }
  }

  // Generate refresh token
  generateRefreshToken(payload) {
    try {
      logger.debug(`Generating refresh token for user: ${payload.userId || payload.id}`, 'JWT_MANAGER');
      
      const refreshPayload = {
        userId: payload.userId || payload.id,
        type: 'refresh',
        jti: this.generateJTI()
      };

      const refreshToken = jwt.sign(refreshPayload, this.secret, {
        expiresIn: '30d', // Refresh tokens last longer
        issuer: 'call-for-blood-foundation',
        audience: 'call-for-blood-users'
      });

      logger.success(`Refresh token generated successfully for user: ${payload.userId || payload.id}`, 'JWT_MANAGER');
      
      return refreshToken;
    } catch (error) {
      logger.error('Failed to generate refresh token', 'JWT_MANAGER', error);
      throw new Error('Refresh token generation failed');
    }
  }

  // Refresh access token
  refreshAccessToken(refreshToken) {
    try {
      logger.debug('Refreshing access token', 'JWT_MANAGER');
      
      const decoded = this.verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        logger.warn('Invalid refresh token type', 'JWT_MANAGER');
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const newAccessToken = this.generateToken({
        userId: decoded.userId,
        type: 'access'
      });

      logger.success(`Access token refreshed successfully for user: ${decoded.userId}`, 'JWT_MANAGER');
      
      return newAccessToken;
    } catch (error) {
      logger.error('Failed to refresh access token', 'JWT_MANAGER', error);
      throw error;
    }
  }

  // Generate unique JWT ID
  generateJTI() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Extract token from Authorization header
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      logger.debug('No authorization header provided', 'JWT_MANAGER');
      return null;
    }

    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('Invalid authorization header format', 'JWT_MANAGER');
      return null;
    }

    const token = authHeader.substring(7);
    logger.debug('Token extracted from authorization header', 'JWT_MANAGER');
    
    return token;
  }

  // Get token expiration time
  getTokenExpiration(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.payload.exp) {
        return null;
      }

      const expirationDate = new Date(decoded.payload.exp * 1000);
      logger.debug(`Token expires at: ${expirationDate.toISOString()}`, 'JWT_MANAGER');
      
      return expirationDate;
    } catch (error) {
      logger.error('Failed to get token expiration', 'JWT_MANAGER', error);
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(token) {
    try {
      const expiration = this.getTokenExpiration(token);
      if (!expiration) {
        return true;
      }

      const isExpired = expiration < new Date();
      logger.debug(`Token expired: ${isExpired}`, 'JWT_MANAGER');
      
      return isExpired;
    } catch (error) {
      logger.error('Failed to check token expiration', 'JWT_MANAGER', error);
      return true;
    }
  }

  // Get time until token expires
  getTimeUntilExpiration(token) {
    try {
      const expiration = this.getTokenExpiration(token);
      if (!expiration) {
        return 0;
      }

      const timeUntilExpiration = expiration.getTime() - Date.now();
      const minutes = Math.floor(timeUntilExpiration / (1000 * 60));
      
      logger.debug(`Token expires in ${minutes} minutes`, 'JWT_MANAGER');
      
      return Math.max(0, timeUntilExpiration);
    } catch (error) {
      logger.error('Failed to calculate time until expiration', 'JWT_MANAGER', error);
      return 0;
    }
  }
}

// Create singleton instance
const jwtManager = new JWTManager();

module.exports = jwtManager;