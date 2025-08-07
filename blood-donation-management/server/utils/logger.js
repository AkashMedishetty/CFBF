const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  // Format timestamp
  getTimestamp() {
    return new Date().toISOString();
  }

  // Format log message with colors and context
  formatMessage(level, message, context = '') {
    const timestamp = this.getTimestamp();
    const contextStr = context ? ` [${context}]` : '';
    
    let colorCode = colors.white;
    let emoji = '📝';
    
    switch (level.toLowerCase()) {
      case 'error':
        colorCode = colors.red;
        emoji = '❌';
        break;
      case 'warn':
        colorCode = colors.yellow;
        emoji = '⚠️';
        break;
      case 'info':
        colorCode = colors.blue;
        emoji = 'ℹ️';
        break;
      case 'success':
        colorCode = colors.green;
        emoji = '✅';
        break;
      case 'debug':
        colorCode = colors.magenta;
        emoji = '🔍';
        break;
      case 'api':
        colorCode = colors.cyan;
        emoji = '🌐';
        break;
      case 'db':
        colorCode = colors.green;
        emoji = '🗄️';
        break;
      case 'auth':
        colorCode = colors.yellow;
        emoji = '🔐';
        break;
    }

    return `${colorCode}${emoji} [${timestamp}] ${level.toUpperCase()}${contextStr}: ${message}${colors.reset}`;
  }

  // Log methods
  error(message, context = '', error = null) {
    if (this.isDevelopment) {
      console.error(this.formatMessage('error', message, context));
      if (error && error.stack) {
        console.error(`${colors.red}Stack trace:${colors.reset}`, error.stack);
      }
    }
    // In production, you might want to send to external logging service
  }

  warn(message, context = '') {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  info(message, context = '') {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  success(message, context = '') {
    if (this.isDevelopment) {
      console.log(this.formatMessage('success', message, context));
    }
  }

  debug(message, context = '') {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  // Specialized logging methods
  api(method, url, statusCode, responseTime, context = '') {
    if (this.isDevelopment) {
      const message = `${method} ${url} - ${statusCode} (${responseTime}ms)`;
      console.log(this.formatMessage('api', message, context));
    }
  }

  db(operation, collection, duration, context = '') {
    if (this.isDevelopment) {
      const message = `${operation} on ${collection} - ${duration}ms`;
      console.log(this.formatMessage('db', message, context));
    }
  }

  auth(action, userId, context = '') {
    if (this.isDevelopment) {
      const message = `${action} for user: ${userId}`;
      console.log(this.formatMessage('auth', message, context));
    }
  }

  // Log object data in a readable format
  logObject(obj, title = 'Object Data', context = '') {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', title, context));
      console.log(`${colors.dim}${JSON.stringify(obj, null, 2)}${colors.reset}`);
    }
  }

  // Performance logging
  startTimer(label) {
    if (this.isDevelopment) {
      console.time(`⏱️  ${label}`);
    }
  }

  endTimer(label) {
    if (this.isDevelopment) {
      console.timeEnd(`⏱️  ${label}`);
    }
  }

  // Request logging middleware
  requestLogger() {
    return (req, res, next) => {
      if (this.isDevelopment) {
        const start = Date.now();
        const { method, url, ip, headers } = req;
        
        this.info(`Incoming ${method} request to ${url}`, 'REQUEST');
        this.debug(`Request IP: ${ip}`, 'REQUEST');
        this.debug(`User-Agent: ${headers['user-agent']}`, 'REQUEST');
        
        if (req.body && Object.keys(req.body).length > 0) {
          // Reason: Don't log sensitive data like passwords
          const sanitizedBody = { ...req.body };
          if (sanitizedBody.password) sanitizedBody.password = '[HIDDEN]';
          if (sanitizedBody.otp) sanitizedBody.otp = '[HIDDEN]';
          this.logObject(sanitizedBody, 'Request Body', 'REQUEST');
        }

        // Override res.end to log response
        const originalEnd = res.end;
        res.end = function(...args) {
          const duration = Date.now() - start;
          logger.api(method, url, res.statusCode, duration, 'RESPONSE');
          originalEnd.apply(this, args);
        };
      }
      next();
    };
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;