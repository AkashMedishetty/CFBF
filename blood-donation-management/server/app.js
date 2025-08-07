const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');

const connectDB = require('./config/database');
const logger = require('./utils/logger');
const auditLogger = require('./utils/auditLogger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bloodRequestRoutes = require('./routes/bloodRequests');
const adminRoutes = require('./routes/admin');
const whatsappRoutes = require('./routes/whatsapp');
const otpRoutes = require('./routes/otp');
const securityRoutes = require('./routes/security');
const analyticsRoutes = require('./routes/analytics');
const institutionsRoutes = require('./routes/institutions');
const publicRoutes = require('./routes/public');
const hospitalsRoutes = require('./routes/hospitals');
const educationRoutes = require('./routes/education');

// Import middleware
const { auth, optionalAuth } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');

const app = express();

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://callforblood.org',
      'https://www.callforblood.org'
    ];
    
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
    }
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development' && origin && origin.includes('localhost')) {
      callback(null, true);
    } else if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`, 'APP');
      logger.debug(`Allowed origins: ${allowedOrigins.join(', ')}`, 'APP');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining']
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook signature verification
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization middleware
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes per IP
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, 'APP');
    auditLogger.logSecurityEvent({
      event: 'rate_limit_exceeded',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: `Global rate limit exceeded: ${req.method} ${req.path}`,
      severity: 'medium'
    });
    
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP. Please try again later.'
    });
  }
});

app.use(globalLimiter);

// Request logging middleware
app.use(requestLogger);

// Health check endpoint (before other routes)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Blood Donation Management System is healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/blood-requests', bloodRequestRoutes);
app.use('/api/v1/admin', auth, adminRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/otp', otpRoutes);
app.use('/api/v1/security', securityRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/institutions', institutionsRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/hospitals', hospitalsRoutes);
app.use('/api/public/education', educationRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Catch all handler for React Router
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// API documentation endpoint
app.get('/api/v1/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Blood Donation Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      bloodRequests: '/api/v1/blood-requests',
      admin: '/api/v1/admin',
      whatsapp: '/api/v1/whatsapp',
      otp: '/api/v1/otp',
      security: '/api/v1/security',
      analytics: '/api/v1/analytics',
      institutions: '/api/v1/institutions',
      public: '/api/v1/public',
      hospitals: '/api/v1/hospitals'
    },
    documentation: 'https://docs.callforblood.org'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  logger.warn(`API endpoint not found: ${req.method} ${req.path}`, 'APP');
  
  res.status(404).json({
    success: false,
    error: 'ENDPOINT_NOT_FOUND',
    message: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...', 'APP');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...', 'APP');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection', 'APP', err);
  
  auditLogger.logSystemEvent({
    event: 'unhandled_promise_rejection',
    service: 'app',
    details: 'Unhandled promise rejection occurred',
    success: false,
    metadata: {
      error: err.message,
      stack: err.stack
    }
  });
  
  // Close server & exit process
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', 'APP', err);
  
  auditLogger.logSystemEvent({
    event: 'uncaught_exception',
    service: 'app',
    details: 'Uncaught exception occurred',
    success: false,
    metadata: {
      error: err.message,
      stack: err.stack
    }
  });
  
  // Close server & exit process
  process.exit(1);
});

module.exports = app;