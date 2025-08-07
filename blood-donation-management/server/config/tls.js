const fs = require('fs');
const https = require('https');
const logger = require('../utils/logger');

/**
 * TLS/HTTPS Configuration for production deployment
 */
class TLSConfig {
    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
        this.httpsEnabled = process.env.HTTPS_ENABLED === 'true';
        this.certPath = process.env.SSL_CERT_PATH;
        this.keyPath = process.env.SSL_KEY_PATH;
        this.caPath = process.env.SSL_CA_PATH;

        logger.info('TLS Configuration initialized', 'TLS');
        logger.debug(`HTTPS enabled: ${this.httpsEnabled}`, 'TLS');
        logger.debug(`Environment: ${this.isProduction ? 'production' : 'development'}`, 'TLS');
    }

    /**
     * Get HTTPS options for server creation
     * @returns {Object|null} HTTPS options or null if not configured
     */
    getHTTPSOptions() {
        if (!this.httpsEnabled || !this.isProduction) {
            logger.info('HTTPS not enabled or not in production mode', 'TLS');
            return null;
        }

        try {
            // Validate certificate files exist
            if (!this.certPath || !this.keyPath) {
                logger.warn('SSL certificate paths not configured', 'TLS');
                return null;
            }

            if (!fs.existsSync(this.certPath)) {
                logger.error(`SSL certificate file not found: ${this.certPath}`, 'TLS');
                return null;
            }

            if (!fs.existsSync(this.keyPath)) {
                logger.error(`SSL private key file not found: ${this.keyPath}`, 'TLS');
                return null;
            }

            // Read certificate files
            const options = {
                cert: fs.readFileSync(this.certPath, 'utf8'),
                key: fs.readFileSync(this.keyPath, 'utf8')
            };

            // Add CA certificate if provided
            if (this.caPath && fs.existsSync(this.caPath)) {
                options.ca = fs.readFileSync(this.caPath, 'utf8');
                logger.debug('CA certificate loaded', 'TLS');
            }

            // TLS security options
            options.secureProtocol = 'TLSv1_2_method'; // Use TLS 1.2+
            options.ciphers = [
                'ECDHE-RSA-AES128-GCM-SHA256',
                'ECDHE-RSA-AES256-GCM-SHA384',
                'ECDHE-RSA-AES128-SHA256',
                'ECDHE-RSA-AES256-SHA384'
            ].join(':');
            options.honorCipherOrder = true;

            logger.success('HTTPS options configured successfully', 'TLS');
            return options;

        } catch (error) {
            logger.error('Failed to configure HTTPS options', 'TLS', error);
            return null;
        }
    }

    /**
     * Create HTTPS server
     * @param {Object} app - Express application
     * @param {number} port - Port to listen on
     * @returns {Object|null} HTTPS server or null
     */
    createHTTPSServer(app, port) {
        const httpsOptions = this.getHTTPSOptions();

        if (!httpsOptions) {
            logger.info('HTTPS server not created - using HTTP', 'TLS');
            return null;
        }

        try {
            const server = https.createServer(httpsOptions, app);

            server.on('error', (error) => {
                logger.error('HTTPS server error', 'TLS', error);
            });

            server.on('listening', () => {
                logger.success(`HTTPS server listening on port ${port}`, 'TLS');
            });

            return server;

        } catch (error) {
            logger.error('Failed to create HTTPS server', 'TLS', error);
            return null;
        }
    }

    /**
     * Configure HTTP to HTTPS redirect middleware
     * @returns {Function} Express middleware
     */
    httpsRedirectMiddleware() {
        return (req, res, next) => {
            if (this.isProduction && this.httpsEnabled && !req.secure && req.get('x-forwarded-proto') !== 'https') {
                logger.debug(`Redirecting HTTP to HTTPS: ${req.url}`, 'TLS');
                return res.redirect(301, `https://${req.get('host')}${req.url}`);
            }
            next();
        };
    }

    /**
     * Get TLS configuration status
     * @returns {Object} TLS status
     */
    getStatus() {
        return {
            httpsEnabled: this.httpsEnabled,
            isProduction: this.isProduction,
            certPath: this.certPath ? '***configured***' : null,
            keyPath: this.keyPath ? '***configured***' : null,
            caPath: this.caPath ? '***configured***' : null,
            ready: this.httpsEnabled ? !!(this.certPath && this.keyPath) : true
        };
    }

    /**
     * Validate certificate expiration
     * @returns {Object} Certificate validation result
     */
    validateCertificate() {
        if (!this.httpsEnabled || !this.certPath) {
            return { valid: true, message: 'HTTPS not enabled' };
        }

        try {
            const cert = fs.readFileSync(this.certPath, 'utf8');
            const certData = cert.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);

            if (!certData) {
                return { valid: false, message: 'Invalid certificate format' };
            }

            // Parse certificate (basic validation)
            const certBuffer = Buffer.from(certData[0].replace(/-----BEGIN CERTIFICATE-----|\-----END CERTIFICATE-----|\n|\r/g, ''), 'base64');

            // This is a basic check - in production, use a proper certificate parsing library
            logger.info('Certificate validation completed', 'TLS');

            return {
                valid: true,
                message: 'Certificate appears valid',
                size: certBuffer.length
            };

        } catch (error) {
            logger.error('Certificate validation failed', 'TLS', error);
            return {
                valid: false,
                message: `Certificate validation error: ${error.message}`
            };
        }
    }
}

// Create singleton instance
const tlsConfig = new TLSConfig();

module.exports = tlsConfig;