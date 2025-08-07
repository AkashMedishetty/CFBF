#!/usr/bin/env node

/**
 * Blood Donation Management System Server
 * Main server entry point
 */

// Load environment variables
require('dotenv').config();

const app = require('./app');
const { connectDB, createIndexes, startPeriodicCleanup } = require('./config/database');
const logger = require('./utils/logger');

// Set default port
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start the server
 */
async function startServer() {
  try {
    logger.info('Starting Blood Donation Management System...', 'SERVER');
    logger.info(`Environment: ${NODE_ENV}`, 'SERVER');
    logger.info(`Port: ${PORT}`, 'SERVER');

    // Connect to database
    await connectDB();
    
    // Create database indexes
    await createIndexes();
    
    // Start periodic cleanup
    startPeriodicCleanup();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.success(`Server running on port ${PORT}`, 'SERVER');
      logger.info(`API Documentation: http://localhost:${PORT}/api/v1/docs`, 'SERVER');
      logger.info(`Health Check: http://localhost:${PORT}/health`, 'SERVER');
      
      if (NODE_ENV === 'development') {
        logger.info(`Admin Panel: http://localhost:3000/admin`, 'SERVER');
        logger.info(`Public Site: http://localhost:3000`, 'SERVER');
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`, 'SERVER');
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`, 'SERVER');
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`, 'SERVER');
      
      server.close((err) => {
        if (err) {
          logger.error('Error during server shutdown', 'SERVER', err);
          process.exit(1);
        }
        
        logger.success('Server closed successfully', 'SERVER');
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout', 'SERVER');
        process.exit(1);
      }, 30000);
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception - shutting down...', 'SERVER', err);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      logger.error('Unhandled Promise Rejection - shutting down...', 'SERVER', err);
      server.close(() => {
        process.exit(1);
      });
    });

    // Log system information
    logger.info(`Node.js version: ${process.version}`, 'SERVER');
    logger.info(`Platform: ${process.platform}`, 'SERVER');
    logger.info(`Architecture: ${process.arch}`, 'SERVER');
    logger.info(`Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`, 'SERVER');

    return server;

  } catch (error) {
    logger.error('Failed to start server', 'SERVER', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer };