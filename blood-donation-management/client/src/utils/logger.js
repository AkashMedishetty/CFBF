class ClientLogger {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
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

    // Log methods
    error(message, context = '', error = null) {
        if (this.isDevelopment) {
            const formatted = this.formatMessage('error', message, context);
            console.error(`%c${formatted.message}`, formatted.style);
            if (error) {
                console.error('Error details:', error);
                if (error.stack) {
                    console.error('Stack trace:', error.stack);
                }
            }
        }
    }

    warn(message, context = '') {
        if (this.isDevelopment) {
            const formatted = this.formatMessage('warn', message, context);
            console.warn(`%c${formatted.message}`, formatted.style);
        }
    }

    info(message, context = '') {
        if (this.isDevelopment) {
            const formatted = this.formatMessage('info', message, context);
            console.info(`%c${formatted.message}`, formatted.style);
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
}

// Create singleton instance
const logger = new ClientLogger();

export default logger;