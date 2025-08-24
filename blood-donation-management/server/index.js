const express = require('express');
const morgan = require('morgan');
require('dotenv').config();

const { connectDB } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const securityMiddleware = require('./middleware/security');
const securityValidation = require('./middleware/securityValidation');
const { sanitizeInputMiddleware } = require('./middleware/joiValidation');
const logger = require('./utils/logger');
const auditLogger = require('./utils/auditLogger');

const app = express();
const PORT = process.env.PORT || 5000;

// Log server startup
logger.info('🚀 Starting CallforBlood Foundation server...', 'STARTUP');
logger.debug(`Environment: ${process.env.NODE_ENV}`, 'STARTUP');
logger.debug(`Port: ${PORT}`, 'STARTUP');

// Connect to MongoDB
connectDB();

// Security middleware setup
logger.info('Setting up comprehensive security middleware...', 'MIDDLEWARE');

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Compression middleware (should be early in the stack)
app.use(securityMiddleware.configureCompression());
logger.success('Compression middleware configured', 'MIDDLEWARE');

// Security headers
app.use(securityMiddleware.securityHeaders);
logger.success('Security headers configured', 'MIDDLEWARE');

// Helmet security middleware
app.use(securityMiddleware.configureHelmet());
logger.success('Helmet security middleware configured', 'MIDDLEWARE');

// CORS configuration
app.use(securityMiddleware.configureCORS());
logger.success('CORS configured', 'MIDDLEWARE');

// HTTP Parameter Pollution protection
app.use(securityMiddleware.configureHPP());
logger.success('HPP protection configured', 'MIDDLEWARE');

// Rate limiting and slow down
app.use('/api/', securityMiddleware.configureRateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
}));
app.use('/api/', securityMiddleware.configureSlowDown());
logger.success('Rate limiting and slow down configured', 'MIDDLEWARE');

// Body parsing middleware
logger.info('Setting up body parsing middleware...', 'MIDDLEWARE');
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    logger.debug(`Parsing JSON body: ${buf.length} bytes`, 'BODY_PARSER');
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  verify: (req, res, buf) => {
    logger.debug(`Parsing URL-encoded body: ${buf.length} bytes`, 'BODY_PARSER');
  }
}));
logger.success('Body parsing middleware configured', 'MIDDLEWARE');

// Security validation middleware
app.use(securityValidation.validateRequest.bind(securityValidation));
logger.success('Security validation configured', 'MIDDLEWARE');

// Input sanitization middleware
app.use(sanitizeInputMiddleware);
logger.success('Input sanitization configured', 'MIDDLEWARE');

// Security logging middleware
app.use(securityMiddleware.securityLogger);
logger.success('Security logging configured', 'MIDDLEWARE');

// Custom request logging middleware
logger.info('Setting up request logging...', 'MIDDLEWARE');
app.use(logger.requestLogger());

// Morgan logging middleware (for additional HTTP logging)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  logger.success('Morgan dev logging enabled', 'MIDDLEWARE');
} else {
  app.use(morgan('combined'));
  logger.success('Morgan combined logging enabled', 'MIDDLEWARE');
}

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check requested', 'HEALTH');
  const healthData = {
    status: 'OK',
    message: 'CallforBlood Foundation API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  logger.debug('Health check data prepared', 'HEALTH');
  logger.logObject(healthData, 'Health Check Response', 'HEALTH');
  res.status(200).json(healthData);
});

// API routes
logger.info('Setting up API routes...', 'SERVER');
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/otp', require('./routes/otp'));
app.use('/api/v1/security', require('./routes/security'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/public/education', require('./routes/education'));
// app.use('/api/v1/donors', require('./routes/donors'));
// app.use('/api/v1/requests', require('./routes/requests'));
logger.success('API routes configured', 'SERVER');

// Root endpoint
app.get('/', (req, res) => {
  logger.info('Root endpoint accessed', 'ROOT');
  const welcomeData = {
    message: 'Welcome to CallforBlood Foundation API',
    version: '1.0.0',
    documentation: '/api/docs',
    timestamp: new Date().toISOString()
  };
  logger.debug('Welcome data prepared', 'ROOT');
  res.json(welcomeData);
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle 404 routes
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, '404');
  logger.debug(`Request from IP: ${req.ip}`, '404');
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  logger.success(`CallforBlood Foundation server running on port ${PORT}`, 'SERVER');
  logger.info(`Environment: ${process.env.NODE_ENV}`, 'SERVER');
  logger.info(`Health check: http://localhost:${PORT}/health`, 'SERVER');
  logger.info(`API documentation: http://localhost:${PORT}/api/docs`, 'SERVER');
  logger.debug('Server startup completed successfully', 'SERVER');
});

module.exports = app;