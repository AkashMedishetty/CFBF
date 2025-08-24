const emailService = require('./emailService');
const logger = require('../utils/logger');

class ContactService {
    constructor() {
        this.supportEmail = process.env.SUPPORT_EMAIL || 'support@callforblood.org';
        this.partnershipEmail = process.env.PARTNERSHIP_EMAIL || 'partnerships@callforblood.org';
    }

    /**
     * Process contact form submission
     * @param {Object} contactData - Contact form data
     * @returns {Promise<Object>} Processing result
     */
    async processContactForm(contactData) {
        try {
            logger.info(`Processing contact form submission from: ${emailService.maskEmail(contactData.email)}`, 'CONTACT_SERVICE');

            // Validate required fields
            const validation = this.validateContactData(contactData);
            if (!validation.valid) {
                return {
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: validation.message,
                    details: validation.errors
                };
            }

            // Determine recipient email based on category
            const recipientEmail = this.getRecipientEmail(contactData.category);

            // Send notification email to support team
            const supportEmailResult = await this.sendSupportNotification(contactData, recipientEmail);

            // Send confirmation email to user
            const confirmationEmailResult = await this.sendUserConfirmation(contactData);

            // Log the contact form submission
            this.logContactSubmission(contactData);

            return {
                success: true,
                message: 'Contact form submitted successfully',
                data: {
                    submissionId: this.generateSubmissionId(),
                    supportEmailSent: supportEmailResult.success,
                    confirmationEmailSent: confirmationEmailResult.success,
                    estimatedResponseTime: this.getEstimatedResponseTime(contactData.priority, contactData.category)
                }
            };

        } catch (error) {
            logger.error('Error processing contact form', 'CONTACT_SERVICE', error);
            return {
                success: false,
                error: 'PROCESSING_ERROR',
                message: 'Failed to process contact form submission'
            };
        }
    }

    /**
     * Validate contact form data
     * @param {Object} contactData - Contact form data
     * @returns {Object} Validation result
     */
    validateContactData(contactData) {
        const errors = [];

        // Required fields
        if (!contactData.name || contactData.name.trim().length < 2) {
            errors.push('Name must be at least 2 characters long');
        }

        if (!contactData.email || !this.isValidEmail(contactData.email)) {
            errors.push('Valid email address is required');
        }

        if (!contactData.message || contactData.message.trim().length < 10) {
            errors.push('Message must be at least 10 characters long');
        }

        // Optional field validations
        if (contactData.phone && !this.isValidPhone(contactData.phone)) {
            errors.push('Invalid phone number format');
        }

        if (contactData.category && !this.isValidCategory(contactData.category)) {
            errors.push('Invalid category selected');
        }

        if (contactData.priority && !['normal', 'high', 'urgent'].includes(contactData.priority)) {
            errors.push('Invalid priority level');
        }

        return {
            valid: errors.length === 0,
            message: errors.length > 0 ? 'Validation failed' : 'Validation passed',
            errors
        };
    }

    /**
     * Send notification email to support team
     * @param {Object} contactData - Contact form data
     * @param {string} recipientEmail - Support team email
     * @returns {Promise<Object>} Email send result
     */
    async sendSupportNotification(contactData, recipientEmail) {
        const subject = `${this.getPriorityEmoji(contactData.priority)} Contact Form: ${contactData.subject || contactData.category || 'General Inquiry'}`;
        
        const content = this.formatSupportNotificationEmail(contactData);

        return await emailService.sendEmail(recipientEmail, subject, content, {
            categories: ['contact_form', contactData.category || 'general', contactData.priority || 'normal'],
            customArgs: {
                type: 'contact_form_notification',
                category: contactData.category || 'general',
                priority: contactData.priority || 'normal',
                submissionId: this.generateSubmissionId()
            }
        });
    }

    /**
     * Send confirmation email to user
     * @param {Object} contactData - Contact form data
     * @returns {Promise<Object>} Email send result
     */
    async sendUserConfirmation(contactData) {
        const subject = '✅ We received your message - CallforBlood Foundation';
        const content = this.formatUserConfirmationEmail(contactData);

        return await emailService.sendEmail(contactData.email, subject, content, {
            categories: ['contact_confirmation', contactData.category || 'general'],
            customArgs: {
                type: 'contact_form_confirmation',
                category: contactData.category || 'general',
                priority: contactData.priority || 'normal'
            }
        });
    }

    /**
     * Format support notification email content
     * @param {Object} contactData - Contact form data
     * @returns {string} Formatted email content
     */
    formatSupportNotificationEmail(contactData) {
        const priorityText = {
            'urgent': '🚨 URGENT',
            'high': '⚡ HIGH PRIORITY',
            'normal': '📝 NORMAL'
        };

        const priority = priorityText[contactData.priority] || '📝 NORMAL';

        return `${priority} - New Contact Form Submission

CONTACT DETAILS:
• Name: ${contactData.name}
• Email: ${contactData.email}
• Phone: ${contactData.phone || 'Not provided'}
• Category: ${contactData.category || 'General Inquiry'}
• Priority: ${contactData.priority || 'Normal'}

SUBJECT: ${contactData.subject || 'No subject provided'}

MESSAGE:
${contactData.message}

SUBMISSION DETAILS:
• Submitted At: ${new Date().toLocaleString()}
• IP Address: ${contactData.ipAddress || 'Not available'}
• User Agent: ${contactData.userAgent || 'Not available'}

RESPONSE REQUIRED BY: ${this.getResponseDeadline(contactData.priority)}

Please respond to this inquiry within the expected timeframe.

---
CallforBlood Foundation - Contact Management System`;
    }

    /**
     * Format user confirmation email content
     * @param {Object} contactData - Contact form data
     * @returns {string} Formatted email content
     */
    formatUserConfirmationEmail(contactData) {
        const responseTime = this.getEstimatedResponseTime(contactData.priority, contactData.category);

        return `Thank you for contacting CallforBlood Foundation!

Dear ${contactData.name},

We have successfully received your message and appreciate you reaching out to us.

YOUR SUBMISSION DETAILS:
• Subject: ${contactData.subject || 'General Inquiry'}
• Category: ${contactData.category || 'General Inquiry'}
• Priority: ${contactData.priority || 'Normal'}
• Submitted: ${new Date().toLocaleString()}

WHAT HAPPENS NEXT:
• Our team will review your message carefully
• You can expect a response within ${responseTime}
• For urgent matters, you can also call our hotline: 1800-BLOOD-1
• We'll respond to the email address you provided: ${contactData.email}

NEED IMMEDIATE HELP?
If this is an emergency blood request, please:
📞 Call our 24/7 hotline: 1800-BLOOD-1
💬 WhatsApp us: +91 98765 43210
🌐 Visit: www.callforblood.org/emergency

YOUR MESSAGE:
"${contactData.message.substring(0, 200)}${contactData.message.length > 200 ? '...' : ''}"

Thank you for being part of our life-saving community!

Best regards,
CallforBlood Foundation Support Team

---
Need help? Visit www.callforblood.org or call 1800-BLOOD-1`;
    }

    /**
     * Get recipient email based on category
     * @param {string} category - Contact category
     * @returns {string} Recipient email address
     */
    getRecipientEmail(category) {
        const categoryEmails = {
            'partnership': this.partnershipEmail,
            'media': this.partnershipEmail,
            'technical': this.supportEmail,
            'general': this.supportEmail,
            'feedback': this.supportEmail,
            'complaint': this.supportEmail
        };

        return categoryEmails[category] || this.supportEmail;
    }

    /**
     * Get priority emoji
     * @param {string} priority - Priority level
     * @returns {string} Priority emoji
     */
    getPriorityEmoji(priority) {
        const emojis = {
            'urgent': '🚨',
            'high': '⚡',
            'normal': '📝'
        };

        return emojis[priority] || '📝';
    }

    /**
     * Get estimated response time
     * @param {string} priority - Priority level
     * @param {string} category - Contact category
     * @returns {string} Estimated response time
     */
    getEstimatedResponseTime(priority, category) {
        if (priority === 'urgent') return '2-4 hours';
        if (priority === 'high') return '4-8 hours';
        if (category === 'partnership') return '2-3 business days';
        if (category === 'technical') return '24-48 hours';
        return '24 hours';
    }

    /**
     * Get response deadline
     * @param {string} priority - Priority level
     * @returns {string} Response deadline
     */
    getResponseDeadline(priority) {
        const now = new Date();
        let deadline;

        switch (priority) {
            case 'urgent':
                deadline = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
                break;
            case 'high':
                deadline = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours
                break;
            default:
                deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
                break;
        }

        return deadline.toLocaleString();
    }

    /**
     * Generate unique submission ID
     * @returns {string} Submission ID
     */
    generateSubmissionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `CONTACT_${timestamp}_${random}`.toUpperCase();
    }

    /**
     * Log contact form submission
     * @param {Object} contactData - Contact form data
     */
    logContactSubmission(contactData) {
        logger.info(`Contact form submitted: ${contactData.category || 'general'} - ${contactData.priority || 'normal'}`, 'CONTACT_SERVICE');
        logger.debug(`Contact details: ${contactData.name} <${emailService.maskEmail(contactData.email)}>`, 'CONTACT_SERVICE');
    }

    /**
     * Validate email format
     * @param {string} email - Email address
     * @returns {boolean} Is valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    /**
     * Validate phone number format
     * @param {string} phone - Phone number
     * @returns {boolean} Is valid phone
     */
    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    /**
     * Validate category
     * @param {string} category - Contact category
     * @returns {boolean} Is valid category
     */
    isValidCategory(category) {
        const validCategories = ['general', 'technical', 'partnership', 'feedback', 'complaint', 'media'];
        return validCategories.includes(category);
    }

    /**
     * Get service status
     * @returns {Object} Service status
     */
    getStatus() {
        return {
            ready: true,
            supportEmail: this.supportEmail,
            partnershipEmail: this.partnershipEmail,
            emailServiceReady: emailService.getStatus().ready
        };
    }
}

// Create singleton instance
const contactService = new ContactService();

module.exports = contactService;