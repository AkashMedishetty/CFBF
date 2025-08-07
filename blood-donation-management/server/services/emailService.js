const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        this.apiKey = process.env.SENDGRID_API_KEY;
        this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@callforblood.org';
        this.fromName = process.env.SENDGRID_FROM_NAME || 'Call For Blood Foundation';
        this.isConfigured = !!(this.apiKey && this.fromEmail);

        if (this.isConfigured) {
            sgMail.setApiKey(this.apiKey);
            logger.success('Email Service initialized with SendGrid credentials', 'EMAIL_SERVICE');
        } else {
            logger.warn('Email Service initialized without credentials (development mode)', 'EMAIL_SERVICE');
            logger.debug('Missing: SENDGRID_API_KEY or SENDGRID_FROM_EMAIL', 'EMAIL_SERVICE');
        }
    }

    /**
     * Send email
     * @param {string} to - Recipient email address
     * @param {string} subject - Email subject
     * @param {string} content - Email content (text or HTML)
     * @param {Object} options - Send options
     * @returns {Promise<Object>} Send result
     */
    async sendEmail(to, subject, content, options = {}) {
        logger.info(`Sending email to: ${this.maskEmail(to)}`, 'EMAIL_SERVICE');

        // Development mode - simulate sending
        if (!this.isConfigured) {
            logger.warn('Email not configured - simulating email send', 'EMAIL_SERVICE');
            logger.info(`[SIMULATED] Email to ${this.maskEmail(to)}: ${subject}`, 'EMAIL_SERVICE');

            return {
                success: true,
                messageId: `sim_email_${Date.now()}`,
                message: 'Email sent successfully (simulated)',
                simulated: true
            };
        }

        try {
            // Validate email address
            const emailValidation = this.validateEmail(to);
            if (!emailValidation.valid) {
                return {
                    success: false,
                    error: 'INVALID_EMAIL',
                    message: emailValidation.message
                };
            }

            // Prepare email message
            const msg = {
                to: to.toLowerCase().trim(),
                from: {
                    email: this.fromEmail,
                    name: this.fromName
                },
                subject: subject,
                ...this.prepareContent(content, options),
                ...options.sendGridOptions
            };

            // Add template ID if provided
            if (options.templateId) {
                msg.templateId = options.templateId;
                if (options.dynamicTemplateData) {
                    msg.dynamicTemplateData = options.dynamicTemplateData;
                }
            }

            // Add categories for tracking
            if (options.categories) {
                msg.categories = Array.isArray(options.categories) ? options.categories : [options.categories];
            }

            // Add custom args for tracking
            if (options.customArgs) {
                msg.customArgs = options.customArgs;
            }

            const response = await sgMail.send(msg);

            logger.success(`Email sent successfully to: ${this.maskEmail(to)}`, 'EMAIL_SERVICE');
            logger.debug(`SendGrid Message ID: ${response[0].headers['x-message-id']}`, 'EMAIL_SERVICE');

            return {
                success: true,
                messageId: response[0].headers['x-message-id'],
                message: 'Email sent successfully',
                statusCode: response[0].statusCode
            };

        } catch (error) {
            logger.error(`Failed to send email to: ${this.maskEmail(to)}`, 'EMAIL_SERVICE', error);

            // Handle SendGrid specific errors
            if (error.response && error.response.body) {
                const sendGridError = error.response.body.errors?.[0];
                return {
                    success: false,
                    error: 'SENDGRID_ERROR',
                    message: sendGridError?.message || 'SendGrid API error',
                    statusCode: error.code,
                    details: sendGridError
                };
            } else {
                return {
                    success: false,
                    error: 'EMAIL_SEND_ERROR',
                    message: 'Failed to send email',
                    details: error.message
                };
            }
        }
    }

    /**
     * Send OTP via email
     * @param {string} email - Recipient email address
     * @param {string} otp - OTP code
     * @param {string} purpose - Purpose of OTP
     * @returns {Promise<Object>} Send result
     */
    async sendOTP(email, otp, purpose = 'verification') {
        const subject = '🔐 Verification Code - Call For Blood Foundation';
        const content = this.formatOTPEmail(otp, purpose);

        return this.sendEmail(email, subject, content, {
            categories: ['otp', purpose],
            customArgs: {
                type: 'otp_verification',
                purpose: purpose
            }
        });
    }

    /**
     * Send blood request notification via email
     * @param {string} email - Recipient email address
     * @param {Object} requestData - Blood request details
     * @returns {Promise<Object>} Send result
     */
    async sendBloodRequestNotification(email, requestData) {
        const subject = `🩸 ${requestData.urgency.toUpperCase()} Blood Donation Request`;
        const content = this.formatBloodRequestEmail(requestData);

        return this.sendEmail(email, subject, content, {
            categories: ['blood_request', requestData.urgency],
            customArgs: {
                type: 'blood_request',
                urgency: requestData.urgency,
                bloodType: requestData.bloodType
            }
        });
    }

    /**
     * Send welcome email to new donors
     * @param {string} email - Recipient email address
     * @param {Object} donorData - Donor information
     * @returns {Promise<Object>} Send result
     */
    async sendWelcomeEmail(email, donorData) {
        const subject = '🎉 Welcome to Call For Blood Foundation!';
        const content = this.formatWelcomeEmail(donorData);

        return this.sendEmail(email, subject, content, {
            categories: ['welcome', 'onboarding'],
            customArgs: {
                type: 'welcome_email',
                donorId: donorData.id
            }
        });
    }

    /**
     * Send donation confirmation email
     * @param {string} email - Recipient email address
     * @param {Object} donationData - Donation details
     * @returns {Promise<Object>} Send result
     */
    async sendDonationConfirmation(email, donationData) {
        const subject = '✅ Blood Donation Confirmed - Thank You!';
        const content = this.formatDonationConfirmationEmail(donationData);

        return this.sendEmail(email, subject, content, {
            categories: ['donation', 'confirmation'],
            customArgs: {
                type: 'donation_confirmation',
                donationId: donationData.id
            }
        });
    }

    /**
     * Send bulk emails
     * @param {Array} emails - Array of email objects
     * @param {Object} options - Bulk send options
     * @returns {Promise<Object>} Bulk send result
     */
    async sendBulkEmails(emails, options = {}) {
        const { batchSize = 10, delayBetweenBatches = 1000 } = options;

        logger.info(`Sending bulk emails: ${emails.length} total`, 'EMAIL_SERVICE');

        const results = {
            total: emails.length,
            successful: 0,
            failed: 0,
            results: []
        };

        // Process emails in batches
        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);

            logger.info(`Processing email batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(emails.length / batchSize)}`, 'EMAIL_SERVICE');

            // Send batch concurrently
            const batchPromises = batch.map(async (emailData) => {
                try {
                    const result = await this.sendEmail(
                        emailData.to,
                        emailData.subject,
                        emailData.content,
                        emailData.options || {}
                    );

                    if (result.success) {
                        results.successful++;
                    } else {
                        results.failed++;
                    }

                    return { ...result, email: this.maskEmail(emailData.to) };
                } catch (error) {
                    results.failed++;
                    return {
                        success: false,
                        error: 'SEND_FAILED',
                        email: this.maskEmail(emailData.to),
                        message: error.message
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.results.push(...batchResults);

            // Delay between batches
            if (i + batchSize < emails.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }

        logger.success(`Bulk emails completed: ${results.successful} successful, ${results.failed} failed`, 'EMAIL_SERVICE');

        return results;
    }

    /**
     * Prepare email content (text and HTML)
     * @param {string} content - Email content
     * @param {Object} options - Content options
     * @returns {Object} Prepared content
     */
    prepareContent(content, options = {}) {
        const { isHtml = false, includeTextVersion = true } = options;

        if (isHtml) {
            const result = { html: content };

            // Generate text version from HTML if requested
            if (includeTextVersion) {
                result.text = this.htmlToText(content);
            }

            return result;
        } else {
            const result = { text: content };

            // Generate HTML version from text
            result.html = this.textToHtml(content);

            return result;
        }
    }

    /**
     * Convert HTML to plain text
     * @param {string} html - HTML content
     * @returns {string} Plain text
     */
    htmlToText(html) {
        return html
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
            .replace(/&amp;/g, '&') // Replace &amp; with &
            .replace(/&lt;/g, '<') // Replace &lt; with <
            .replace(/&gt;/g, '>') // Replace &gt; with >
            .replace(/&quot;/g, '"') // Replace &quot; with "
            .replace(/&#39;/g, "'") // Replace &#39; with '
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim();
    }

    /**
     * Convert plain text to HTML
     * @param {string} text - Plain text content
     * @returns {string} HTML content
     */
    textToHtml(text) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Call For Blood Foundation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🩸 Call For Blood Foundation</h1>
    </div>
    <div class="content">
        ${text.split('\n').map(line => `<p>${line}</p>`).join('')}
    </div>
    <div class="footer">
        <p>Call For Blood Foundation | Saving Lives Together</p>
        <p>📞 +91-911-BLOOD | 📧 support@callforblood.org | 🌐 www.callforblood.org</p>
    </div>
</body>
</html>`;
    }

    /**
     * Format OTP email content
     * @param {string} otp - OTP code
     * @param {string} purpose - Purpose of OTP
     * @returns {string} Formatted email content
     */
    formatOTPEmail(otp, purpose) {
        const purposeText = {
            'registration': 'complete your registration',
            'login': 'log into your account',
            'verification': 'verify your email address',
            'password_reset': 'reset your password'
        };

        const action = purposeText[purpose] || 'verify your email address';

        return `Dear User,

Your Call For Blood Foundation verification code is:

${otp}

Use this code to ${action}.

⏰ This code expires in 5 minutes.
🔒 For security, don't share this code with anyone.

If you didn't request this code, please ignore this email.

Need help? Contact our support team at support@callforblood.org

Best regards,
Call For Blood Foundation Team`;
    }

    /**
     * Format blood request email content
     * @param {Object} requestData - Blood request details
     * @returns {string} Formatted email content
     */
    formatBloodRequestEmail(requestData) {
        const urgencyText = {
            'critical': '🚨 CRITICAL EMERGENCY',
            'urgent': '⚡ URGENT REQUEST',
            'scheduled': '📅 SCHEDULED REQUEST'
        };

        const urgency = urgencyText[requestData.urgency] || '🩸 BLOOD REQUEST';

        return `${urgency}

Dear Blood Donor,

We have an urgent blood donation request that matches your profile:

PATIENT DETAILS:
• Blood Type Needed: ${requestData.bloodType}
• Patient Name: ${requestData.patientName || 'Not specified'}
• Age: ${requestData.age || 'Not specified'}
• Medical Condition: ${requestData.condition || 'Not specified'}

LOCATION DETAILS:
• Hospital: ${requestData.hospital}
• Address: ${requestData.location}
• Contact Number: ${requestData.contactNumber}

URGENCY: ${requestData.urgency.toUpperCase()}
${requestData.requiredBy ? `Required By: ${new Date(requestData.requiredBy).toLocaleString()}` : ''}

Can you help save a life?

To respond:
• Reply to this email with "YES" if you can donate
• Reply with "NO" if you cannot donate at this time
• Call ${requestData.contactNumber} for immediate coordination

Your generosity can make the difference between life and death.

Thank you for being a life saver!

Best regards,
Call For Blood Foundation Team

---
Every drop counts. Every donor matters.`;
    }

    /**
     * Format welcome email content
     * @param {Object} donorData - Donor information
     * @returns {string} Formatted email content
     */
    formatWelcomeEmail(donorData) {
        return `Welcome to Call For Blood Foundation, ${donorData.name}!

🎉 Congratulations on joining our life-saving community!

Your registration has been successfully completed with the following details:
• Name: ${donorData.name}
• Blood Type: ${donorData.bloodType}
• Phone: ${donorData.phoneNumber}
• Registration Date: ${new Date().toLocaleDateString()}

WHAT'S NEXT?
1. Complete your profile verification (if not already done)
2. Set your donation preferences
3. Start receiving blood donation requests
4. Help save lives in your community

IMPORTANT INFORMATION:
• You can donate blood every 3 months
• Each donation can save up to 3 lives
• You'll receive a digital certificate after each donation
• Your privacy and safety are our top priorities

GETTING STARTED:
• Visit your dashboard: www.callforblood.org/dashboard
• Update your availability status
• Set your notification preferences
• Learn about blood donation guidelines

Need help? Our support team is here for you:
📞 Phone: +91-911-BLOOD
📧 Email: support@callforblood.org
🌐 Website: www.callforblood.org

Thank you for choosing to be a hero. Together, we save lives!

Best regards,
Call For Blood Foundation Team

---
"The gift of blood is the gift of life. Thank you for giving."`;
    }

    /**
     * Format donation confirmation email content
     * @param {Object} donationData - Donation details
     * @returns {string} Formatted email content
     */
    formatDonationConfirmationEmail(donationData) {
        return `Thank You for Your Life-Saving Donation!

Dear ${donationData.donorName},

🏆 You are a true hero! Your blood donation has been successfully recorded.

DONATION DETAILS:
• Donation ID: ${donationData.id}
• Date: ${new Date(donationData.donatedAt).toLocaleDateString()}
• Time: ${new Date(donationData.donatedAt).toLocaleTimeString()}
• Location: ${donationData.location}
• Units Donated: ${donationData.unitsContributed}
• Blood Type: ${donationData.bloodType}

IMPACT:
Your donation can potentially save up to ${donationData.unitsContributed * 3} lives!

WHAT'S NEXT:
• Your digital certificate will be available within 24 hours
• You can donate again after 90 days (next eligible: ${donationData.nextEligibleDate})
• Share your achievement on social media
• Encourage friends and family to become donors

POST-DONATION CARE:
• Rest for 10-15 minutes after donation
• Drink plenty of fluids for the next 24 hours
• Avoid heavy lifting for 24 hours
• Contact us immediately if you feel unwell

CERTIFICATE & RECOGNITION:
• Digital certificate: Available in your dashboard
• Social sharing: Share your heroic act
• Milestone badges: Unlock achievements as you donate more
• Community recognition: Join our hall of heroes

Thank you for making a difference. Your generosity gives hope and saves lives.

Best regards,
Call For Blood Foundation Team

---
"Heroes don't always wear capes. Sometimes they just roll up their sleeves."`;
    }

    /**
     * Validate email address
     * @param {string} email - Email address to validate
     * @returns {Object} Validation result
     */
    validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return {
                valid: false,
                message: 'Email address is required'
            };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return {
                valid: false,
                message: 'Invalid email address format'
            };
        }

        if (email.length > 254) {
            return {
                valid: false,
                message: 'Email address is too long'
            };
        }

        return {
            valid: true,
            message: 'Valid email address'
        };
    }

    /**
     * Mask email address for logging
     * @param {string} email - Email address to mask
     * @returns {string} Masked email address
     */
    maskEmail(email) {
        if (!email || !email.includes('@')) return '****@****.***';

        const [local, domain] = email.split('@');
        const maskedLocal = local.length > 2
            ? local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1)
            : '**';

        const [domainName, tld] = domain.split('.');
        const maskedDomain = domainName.length > 2
            ? domainName.charAt(0) + '*'.repeat(domainName.length - 2) + domainName.charAt(domainName.length - 1)
            : '**';

        return `${maskedLocal}@${maskedDomain}.${tld}`;
    }

    /**
     * Get service status
     * @returns {Object} Service status
     */
    getStatus() {
        return {
            configured: this.isConfigured,
            hasApiKey: !!this.apiKey,
            hasFromEmail: !!this.fromEmail,
            fromEmail: this.fromEmail,
            fromName: this.fromName,
            ready: this.isConfigured
        };
    }

    /**
     * Test email configuration
     * @param {string} testEmail - Email address to send test email
     * @returns {Promise<Object>} Test result
     */
    async testConfiguration(testEmail) {
        if (!this.isConfigured) {
            return {
                success: false,
                message: 'Email service not configured'
            };
        }

        try {
            const result = await this.sendEmail(
                testEmail,
                'Test Email - Call For Blood Foundation',
                'This is a test email to verify your email configuration is working correctly.',
                {
                    categories: ['test'],
                    customArgs: {
                        type: 'configuration_test'
                    }
                }
            );

            return {
                success: result.success,
                message: result.success ? 'Test email sent successfully' : result.message,
                messageId: result.messageId
            };

        } catch (error) {
            logger.error('Email configuration test failed', 'EMAIL_SERVICE', error);

            return {
                success: false,
                message: 'Email configuration test failed',
                error: error.message
            };
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;