class ClientLogger {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        
        // Define levels before computing current log level
        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3,
            TRACE: 4
        };
        
        this.logLevel = this.getLogLevel();
        this.logBuffer = [];
        this.maxBufferSize = 1000;
        this.contexts = new Set();
        
        this.initializeLogger();
    }

    // Initialize enhanced logging features
    initializeLogger() {
        // Set up periodic log flushing
        this.setupLogFlushing();
        
        // Initialize global error handling
        this.initializeGlobalErrorHandling();
    }

    // Get log level from environment or localStorage
    getLogLevel() {
        const storedLevel = localStorage.getItem('logLevel');
        if (storedLevel && this.levels.hasOwnProperty(storedLevel)) {
            return this.levels[storedLevel];
        }
        
        const envLevel = process.env.REACT_APP_LOG_LEVEL;
        if (envLevel && this.levels.hasOwnProperty(envLevel.toUpperCase())) {
            return this.levels[envLevel.toUpperCase()];
        }
        
        return this.isDevelopment ? this.levels.DEBUG : this.levels.INFO;
    }

    // Initialize global error handling
    initializeGlobalErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled promise rejection', 'GLOBAL_ERROR', event.reason);
        });

        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            this.error(`JavaScript error: ${event.message}`, 'GLOBAL_ERROR', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
    }

    // Setup periodic log flushing
    setupLogFlushing() {
        setInterval(() => {
            this.flushLogs();
        }, 30000); // Flush every 30 seconds
        
        // Flush on page unload
        window.addEventListener('beforeunload', () => {
            this.flushLogs();
        });
    }

    // Flush logs to storage
    flushLogs() {
        try {
            const logsToFlush = this.logBuffer.filter(log => 
                ['ERROR', 'WARN'].includes(log.level)
            );
            
            if (logsToFlush.length > 0) {
                const existingLogs = JSON.parse(localStorage.getItem('app_logs') || '[]');
                const updatedLogs = [...existingLogs, ...logsToFlush].slice(-100);
                localStorage.setItem('app_logs', JSON.stringify(updatedLogs));
            }
        } catch (error) {
            console.error('[Logger] Failed to flush logs:', error);
        }
    }

    // Create structured log entry
    createLogEntry(level, message, context, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            context: context || 'GENERAL',
            data: data || null,
            url: window.location.href,
            userAgent: navigator.userAgent,
            sessionId: this.getSessionId(),
            userId: this.getUserId()
        };

        // Add to buffer
        this.logBuffer.push(entry);
        
        // Maintain buffer size
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }

        return entry;
    }

    // Utility methods
    getSessionId() {
        return sessionStorage.getItem('sessionId') || 'unknown';
    }

    getUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.id || null;
        } catch {
            return null;
        }
    }

    // Format timestamp
    getTimestamp() {
        return new Date().toISOString();
    }

    // Format log message with emojis and context
    formatMessage(level, message, context = '') {
        const timestamp = this.getTimestamp();
        const contextStr = context ? ` [${context}]` : '';

        let emoji = '📝';
        let style = 'color: #333;';

        switch (level.toLowerCase()) {
            case 'error':
                emoji = '❌';
                style = 'color: #dc2626; font-weight: bold;';
                break;
            case 'warn':
                emoji = '⚠️';
                style = 'color: #f59e0b; font-weight: bold;';
                break;
            case 'info':
                emoji = 'ℹ️';
                style = 'color: #2563eb;';
                break;
            case 'success':
                emoji = '✅';
                style = 'color: #16a34a; font-weight: bold;';
                break;
            case 'debug':
                emoji = '🔍';
                style = 'color: #9333ea;';
                break;
            case 'api':
                emoji = '🌐';
                style = 'color: #0891b2;';
                break;
            case 'ui':
                emoji = '🎨';
                style = 'color: #ec4899;';
                break;
            case 'route':
                emoji = '🧭';
                style = 'color: #059669;';
                break;
            case 'theme':
                emoji = '🌙';
                style = 'color: #7c3aed;';
                break;
            default:
                emoji = '📝';
                style = 'color: #333;';
                break;
        }

        return {
            message: `${emoji} [${timestamp}] ${level.toUpperCase()}${contextStr}: ${message}`,
            style
        };
    }

    // Enhanced log methods
    error(message, context = '', error = null) {
        // Create structured log entry
        this.createLogEntry('ERROR', message, context, error);
        
        if (this.isDevelopment || this.levels.ERROR <= this.logLevel) {
            const formatted = this.formatMessage('error', message, context);
            console.error(`%c${formatted.message}`, formatted.style);
            if (error) {
                console.error('Error details:', error);
                if (error && error.stack) {
                    console.error('Stack trace:', error.stack);
                }
            }
        }
    }

    warn(message, context = '', data = null) {
        this.createLogEntry('WARN', message, context, data);
        
        if (this.isDevelopment || this.levels.WARN <= this.logLevel) {
            const formatted = this.formatMessage('warn', message, context);
            console.warn(`%c${formatted.message}`, formatted.style);
            if (data) console.warn('Data:', data);
        }
    }

    info(message, context = '', data = null) {
        this.createLogEntry('INFO', message, context, data);
        
        if (this.isDevelopment || this.levels.INFO <= this.logLevel) {
            const formatted = this.formatMessage('info', message, context);
            console.info(`%c${formatted.message}`, formatted.style);
            if (data) console.info('Data:', data);
        }
    }

    success(message, context = '') {
        if (this.isDevelopment) {
            const formatted = this.formatMessage('success', message, context);
            console.log(`%c${formatted.message}`, formatted.style);
        }
    }

    debug(message, context = '') {
        if (this.isDevelopment) {
            const formatted = this.formatMessage('debug', message, context);
            console.log(`%c${formatted.message}`, formatted.style);
        }
    }

    // Specialized logging methods
    api(method, url, status, data = null, context = '') {
        if (this.isDevelopment) {
            const message = `${method} ${url} - Status: ${status}`;
            const formatted = this.formatMessage('api', message, context);
            console.log(`%c${formatted.message}`, formatted.style);
            if (data) {
                console.log('Response data:', data);
            }
        }
    }

    ui(action, component, data = null, context = '') {
        if (this.isDevelopment) {
            const message = `${action} in ${component}`;
            const formatted = this.formatMessage('ui', message, context);
            console.log(`%c${formatted.message}`, formatted.style);
            if (data) {
                console.log('UI data:', data);
            }
        }
    }

    route(from, to, context = '') {
        if (this.isDevelopment) {
            const message = `Navigation: ${from} → ${to}`;
            const formatted = this.formatMessage('route', message, context);
            console.log(`%c${formatted.message}`, formatted.style);
        }
    }

    theme(action, theme, context = '') {
        if (this.isDevelopment) {
            const message = `Theme ${action}: ${theme}`;
            const formatted = this.formatMessage('theme', message, context);
            console.log(`%c${formatted.message}`, formatted.style);
        }
    }

    // Log object data in a readable format
    logObject(obj, title = 'Object Data', context = '') {
        if (this.isDevelopment) {
            const formatted = this.formatMessage('debug', title, context);
            console.log(`%c${formatted.message}`, formatted.style);
            console.log(obj);
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

    // Component lifecycle logging
    componentMount(componentName, props = null) {
        if (this.isDevelopment) {
            this.ui('MOUNT', componentName, props, 'LIFECYCLE');
        }
    }

    componentUnmount(componentName) {
        if (this.isDevelopment) {
            this.ui('UNMOUNT', componentName, null, 'LIFECYCLE');
        }
    }

    componentUpdate(componentName, changes = null) {
        if (this.isDevelopment) {
            this.ui('UPDATE', componentName, changes, 'LIFECYCLE');
        }
    }

    // Form logging
    formSubmit(formName, data = null) {
        if (this.isDevelopment) {
            this.ui('SUBMIT', formName, data, 'FORM');
        }
    }

    formValidation(formName, errors = null) {
        if (this.isDevelopment) {
            if (errors && Object.keys(errors).length > 0) {
                this.warn(`Validation errors in ${formName}`, 'FORM');
                console.log('Validation errors:', errors);
            } else {
                this.success(`Validation passed for ${formName}`, 'FORM');
            }
        }
    }

    // Enhanced logging methods
    trace(message, context = '', data = null) {
        this.createLogEntry('TRACE', message, context, data);
        
        if (this.isDevelopment || this.levels.TRACE <= this.logLevel) {
            const formatted = this.formatMessage('debug', message, context);
            console.log(`%c${formatted.message}`, formatted.style);
            if (data) console.log('Data:', data);
        }
    }

    // API logging with enhanced details
    apiRequest(method, url, data = null) {
        this.info(`API Request: ${method} ${url}`, 'API', { data });
    }

    apiResponse(method, url, status, data = null) {
        const level = status >= 400 ? 'ERROR' : 'INFO';
        const message = `API Response: ${method} ${url} - ${status}`;
        
        if (level === 'ERROR') {
            this.error(message, 'API', { status, data });
        } else {
            this.info(message, 'API', { status, data });
        }
    }

    apiError(method, url, error) {
        this.error(`API Error: ${method} ${url}`, 'API', { 
            error: error.message, 
            stack: error.stack 
        });
    }

    // User action logging
    userAction(action, details = null) {
        this.info(`User Action: ${action}`, 'USER_ACTION', details);
    }

    // Performance logging
    performance(metric, value, context = 'PERFORMANCE') {
        this.info(`Performance: ${metric} = ${value}ms`, context, { metric, value });
    }

    // Security logging
    security(event, details = null) {
        this.warn(`Security Event: ${event}`, 'SECURITY', details);
    }

    // Business logic logging
    business(event, details = null) {
        this.info(`Business Event: ${event}`, 'BUSINESS', details);
    }

    // Configuration methods
    setLogLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.logLevel = this.levels[level];
            localStorage.setItem('logLevel', level);
            this.info(`Log level set to ${level}`, 'LOGGER');
        }
    }

    getCurrentLogLevel() {
        return Object.keys(this.levels).find(key => this.levels[key] === this.logLevel);
    }

    // Get logs
    getLogs(level = null, context = null, limit = 50) {
        let logs = [...this.logBuffer];
        
        if (level) {
            logs = logs.filter(log => log.level === level);
        }
        
        if (context) {
            logs = logs.filter(log => log.context === context);
        }
        
        return logs.slice(-limit);
    }

    // Get stored logs
    getStoredLogs() {
        try {
            return JSON.parse(localStorage.getItem('app_logs') || '[]');
        } catch {
            return [];
        }
    }

    // Clear logs
    clearLogs() {
        this.logBuffer = [];
        localStorage.removeItem('app_logs');
        this.info('Logs cleared', 'LOGGER');
    }

    // Get log statistics
    getLogStats() {
        const logs = this.logBuffer;
        const stats = {
            total: logs.length,
            byLevel: {},
            byContext: {},
            recent: logs.filter(log => 
                Date.now() - new Date(log.timestamp).getTime() < 60 * 60 * 1000
            ).length
        };
        
        logs.forEach(log => {
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
            stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
        });
        
        return stats;
    }

    // Export logs
    exportLogs(format = 'json') {
        const logs = [...this.logBuffer, ...this.getStoredLogs()];
        
        if (format === 'csv') {
            const headers = ['timestamp', 'level', 'context', 'message', 'url'];
            const csvContent = [
                headers.join(','),
                ...logs.map(log => [
                    log.timestamp,
                    log.level,
                    log.context,
                    `"${log.message.replace(/"/g, '""')}"`,
                    log.url
                ].join(','))
            ].join('\n');
            
            return csvContent;
        }
        
        return JSON.stringify(logs, null, 2);
    }
}

// Create singleton instance
const logger = new ClientLogger();

export default logger;