const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // MongoDB connection options
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    // Try MongoDB Atlas first, then fallback to local
    let mongoURI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;
    
    if (!mongoURI) {
      // Default local MongoDB URI
      mongoURI = 'mongodb://localhost:27017/blood-donation-management';
      logger.warn('No MongoDB URI provided, using default local connection', 'DATABASE');
    }

    logger.info('Connecting to MongoDB...', 'DATABASE');
    
    const conn = await mongoose.connect(mongoURI, options);

    logger.success(`MongoDB Connected: ${conn.connection.host}`, 'DATABASE');
    logger.info(`Database: ${conn.connection.name}`, 'DATABASE');

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      logger.success('MongoDB connection established', 'DATABASE');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', 'DATABASE', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected', 'DATABASE');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination', 'DATABASE');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing MongoDB connection', 'DATABASE', error);
        process.exit(1);
      }
    });

    return conn;

  } catch (error) {
    logger.error('Failed to connect to MongoDB', 'DATABASE', error);
    
    // Try fallback connection if Atlas fails
    if (process.env.MONGODB_ATLAS_URI && error.message.includes('Atlas')) {
      logger.info('Attempting fallback to local MongoDB...', 'DATABASE');
      
      try {
        const fallbackURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blood-donation-management';
        const conn = await mongoose.connect(fallbackURI, options);
        
        logger.success(`MongoDB Connected (fallback): ${conn.connection.host}`, 'DATABASE');
        return conn;
        
      } catch (fallbackError) {
        logger.error('Fallback MongoDB connection also failed', 'DATABASE', fallbackError);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

/**
 * Get database connection status
 * @returns {Object} Connection status information
 */
const getConnectionStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return {
    state: states[state] || 'unknown',
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    collections: Object.keys(mongoose.connection.collections).length
  };
};

/**
 * Create database indexes
 * @returns {Promise<void>}
 */
const createIndexes = async () => {
  try {
    logger.info('Creating database indexes...', 'DATABASE');

    // User indexes
    await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await mongoose.connection.collection('users').createIndex({ phoneNumber: 1 }, { unique: true });
    await mongoose.connection.collection('users').createIndex({ bloodType: 1, status: 1 });
    await mongoose.connection.collection('users').createIndex({ 'location.coordinates': '2dsphere' });
    await mongoose.connection.collection('users').createIndex({ role: 1, status: 1 });

    // Blood request indexes
    await mongoose.connection.collection('bloodrequests').createIndex({ requestId: 1 }, { unique: true });
    await mongoose.connection.collection('bloodrequests').createIndex({ status: 1, createdAt: -1 });
    await mongoose.connection.collection('bloodrequests').createIndex({ 'patient.bloodType': 1, status: 1 });
    await mongoose.connection.collection('bloodrequests').createIndex({ 'location.hospital.coordinates': '2dsphere' });
    await mongoose.connection.collection('bloodrequests').createIndex({ 'requester.phoneNumber': 1 });
    await mongoose.connection.collection('bloodrequests').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // OTP indexes
    await mongoose.connection.collection('otps').createIndex({ phoneNumber: 1, purpose: 1 });
    await mongoose.connection.collection('otps').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // Audit log indexes
    await mongoose.connection.collection('auditlogs').createIndex({ timestamp: -1 });
    await mongoose.connection.collection('auditlogs').createIndex({ userId: 1, timestamp: -1 });
    await mongoose.connection.collection('auditlogs').createIndex({ event: 1, timestamp: -1 });

    logger.success('Database indexes created successfully', 'DATABASE');

  } catch (error) {
    logger.error('Error creating database indexes', 'DATABASE', error);
  }
};

/**
 * Database health check
 * @returns {Promise<Object>} Health check result
 */
const healthCheck = async () => {
  try {
    const status = getConnectionStatus();
    
    if (status.state !== 'connected') {
      return {
        healthy: false,
        status: status.state,
        message: 'Database not connected'
      };
    }

    // Test database operation
    await mongoose.connection.db.admin().ping();

    return {
      healthy: true,
      status: status.state,
      host: status.host,
      database: status.name,
      collections: status.collections,
      message: 'Database is healthy'
    };

  } catch (error) {
    logger.error('Database health check failed', 'DATABASE', error);
    
    return {
      healthy: false,
      status: 'error',
      message: error.message
    };
  }
};

/**
 * Clean up expired documents
 * @returns {Promise<void>}
 */
const cleanupExpiredDocuments = async () => {
  try {
    logger.info('Running database cleanup...', 'DATABASE');

    // Clean up expired OTPs (if not using TTL index)
    const expiredOTPs = await mongoose.connection.collection('otps').deleteMany({
      expiresAt: { $lt: new Date() }
    });

    // Clean up old audit logs (keep last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const oldAuditLogs = await mongoose.connection.collection('auditlogs').deleteMany({
      timestamp: { $lt: ninetyDaysAgo }
    });

    // Clean up expired blood requests (if not using TTL index)
    const expiredRequests = await mongoose.connection.collection('bloodrequests').deleteMany({
      expiresAt: { $lt: new Date() },
      status: { $in: ['expired', 'cancelled'] }
    });

    logger.success(`Database cleanup completed: ${expiredOTPs.deletedCount} OTPs, ${oldAuditLogs.deletedCount} audit logs, ${expiredRequests.deletedCount} requests`, 'DATABASE');

  } catch (error) {
    logger.error('Database cleanup failed', 'DATABASE', error);
  }
};

/**
 * Start periodic cleanup
 */
const startPeriodicCleanup = () => {
  // Run cleanup every 6 hours
  setInterval(cleanupExpiredDocuments, 6 * 60 * 60 * 1000);
  
  // Run initial cleanup after 1 minute
  setTimeout(cleanupExpiredDocuments, 60 * 1000);
  
  logger.info('Periodic database cleanup scheduled', 'DATABASE');
};

module.exports = {
  connectDB,
  getConnectionStatus,
  createIndexes,
  healthCheck,
  cleanupExpiredDocuments,
  startPeriodicCleanup
};