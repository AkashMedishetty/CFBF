const logger = require('../utils/logger');

class MessageTemplateService {
  constructor() {
    this.templates = new Map();
    this.initializeDefaultTemplates();
    logger.success('Message Template Service initialized', 'TEMPLATE_SERVICE');
  }

  /**
   * Initialize default message templates
   */
  initializeDefaultTemplates() {
    const defaultTemplates = [
      {
        name: 'blood_request_urgent',
        category: 'UTILITY',
        language: 'en',
        status: 'APPROVED',
        components: [
          {
            type: 'HEADER',
            format: 'TEXT',
            text: '🚨 URGENT BLOOD NEEDED'
          },
          {
            type: 'BODY',
            text: 'Blood Type: {{1}}\nPatient: {{2}}\nHospital: {{3}}\nLocation: {{4}}\n\nCan you help save a life?\nReply YES to donate or NO if unavailable.'
          },
          {
            type: 'FOOTER',
            text: 'CallforBlood Foundation'
          },
          {
            type: 'BUTTONS',
            buttons: [
              {
                type: 'QUICK_REPLY',
                text: '✅ Yes, I can donate'
              },
              {
                type: 'QUICK_REPLY',
                text: '❌ Cannot donate now'
              },
              {
                type: 'QUICK_REPLY',
                text: 'ℹ️ More info'
              }
            ]
          }
        ]
      },
      {
        name: 'blood_request_critical',
        category: 'UTILITY',
        language: 'en',
        status: 'APPROVED',
        components: [
          {
            type: 'HEADER',
            format: 'TEXT',
            text: '🆘 CRITICAL EMERGENCY'
          },
          {
            type: 'BODY',
            text: 'EMERGENCY: {{1}} blood needed IMMEDIATELY\nPatient: {{2}} (Age: {{3}})\nCondition: {{4}}\nHospital: {{5}}\nContact: {{6}}\n\nEVERY MINUTE COUNTS!\nPlease respond immediately if you can help.'
          },
          {
            type: 'FOOTER',
            text: 'CallforBlood Foundation - Emergency Response'
          },
          {
            type: 'BUTTONS',
            buttons: [
              {
                type: 'QUICK_REPLY',
                text: '🚨 YES - On my way'
              },
              {
                type: 'QUICK_REPLY',
                text: '❌ Cannot help'
              }
            ]
          }
        ]
      },
      {
        name: 'donation_confirmation',
        category: 'UTILITY',
        language: 'en',
        status: 'APPROVED',
        components: [
          {
            type: 'HEADER',
            format: 'TEXT',
            text: '🙏 Thank You Hero!'
          },
          {
            type: 'BODY',
            text: 'Thank you {{1}} for agreeing to donate!\n\nDonation Details:\n📍 Location: {{2}}\n📞 Contact: {{3}}\n⏰ Time: {{4}}\n\nPlease arrive 15 minutes early for screening.\nYour generosity saves lives! ❤️'
          },
          {
            type: 'FOOTER',
            text: 'CallforBlood Foundation'
          }
        ]
      },
      {
        name: 'donor_approval',
        category: 'UTILITY',
        language: 'en',
        status: 'APPROVED',
        components: [
          {
            type: 'HEADER',
            format: 'TEXT',
            text: '🎉 Registration Approved!'
          },
          {
            type: 'BODY',
            text: 'Congratulations {{1}}!\n\nYour blood donor registration has been APPROVED by our admin team.\n\n✅ You are now a verified donor\n✅ You can start receiving donation requests\n✅ Help save lives in your community\n\nThank you for joining our life-saving mission!'
          },
          {
            type: 'FOOTER',
            text: 'CallforBlood Foundation'
          }
        ]
      },
      {
        name: 'donor_rejection',
        category: 'UTILITY',
        language: 'en',
        status: 'APPROVED',
        components: [
          {
            type: 'HEADER',
            format: 'TEXT',
            text: '❌ Registration Update'
          },
          {
            type: 'BODY',
            text: 'Dear {{1}},\n\nUnfortunately, your blood donor registration could not be approved at this time.\n\nReason: {{2}}\n\nYou can reapply after addressing the mentioned concerns. Please contact our support team if you have any questions.'
          },
          {
            type: 'FOOTER',
            text: 'CallforBlood Foundation\nSupport: http://wa.me/919491254120'
          }
        ]
      },
      {
        name: 'otp_verification',
        category: 'AUTHENTICATION',
        language: 'en',
        status: 'APPROVED',
        components: [
          {
            type: 'HEADER',
            format: 'TEXT',
            text: '🔐 Verification Code'
          },
          {
            type: 'BODY',
            text: 'Your CallforBlood Foundation verification code is: *{{1}}*\n\nUse this code to {{2}}.\n\n⏰ This code expires in 5 minutes.\n🔒 For security, don\'t share this code with anyone.'
          },
          {
            type: 'FOOTER',
            text: 'CallforBlood Foundation'
          }
        ]
      },
      {
        name: 'donation_reminder',
        category: 'UTILITY',
        language: 'en',
        status: 'APPROVED',
        components: [
          {
            type: 'HEADER',
            format: 'TEXT',
            text: '⏰ Donation Reminder'
          },
          {
            type: 'BODY',
            text: 'Hi {{1}},\n\nThis is a reminder about your blood donation appointment:\n\n📅 Date: {{2}}\n⏰ Time: {{3}}\n📍 Location: {{4}}\n\nPlease arrive 15 minutes early. If you need to reschedule, please let us know immediately.'
          },
          {
            type: 'FOOTER',
            text: 'CallforBlood Foundation'
          },
          {
            type: 'BUTTONS',
            buttons: [
              {
                type: 'QUICK_REPLY',
                text: '✅ Confirmed'
              },
              {
                type: 'QUICK_REPLY',
                text: '📅 Reschedule'
              },
              {
                type: 'QUICK_REPLY',
                text: '❌ Cancel'
              }
            ]
          }
        ]
      },
      {
        name: 'post_donation_thanks',
        category: 'UTILITY',
        language: 'en',
        status: 'APPROVED',
        components: [
          {
            type: 'HEADER',
            format: 'TEXT',
            text: '🏆 You\'re a Life Saver!'
          },
          {
            type: 'BODY',
            text: 'Thank you {{1}} for your blood donation today!\n\n🩸 You donated: {{2}} units\n📋 Donation ID: {{3}}\n📅 Date: {{4}}\n\nYour donation can save up to 3 lives!\nYour digital certificate will be available in 24 hours.\n\nNext eligible donation: {{5}}'
          },
          {
            type: 'FOOTER',
            text: 'CallforBlood Foundation'
          }
        ]
      }
    ];

    // Store templates in memory
    defaultTemplates.forEach(template => {
      this.templates.set(template.name, template);
    });

    logger.success(`Loaded ${defaultTemplates.length} default message templates`, 'TEMPLATE_SERVICE');
  }

  /**
   * Get all message templates
   * @returns {Array} Array of templates
   */
  getAllTemplates() {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by name
   * @param {string} templateName - Template name
   * @returns {Object|null} Template object or null
   */
  getTemplate(templateName) {
    const template = this.templates.get(templateName);
    if (!template) {
      logger.warn(`Template not found: ${templateName}`, 'TEMPLATE_SERVICE');
      return null;
    }
    return template;
  }

  /**
   * Add or update template
   * @param {Object} template - Template object
   * @returns {boolean} Success status
   */
  setTemplate(template) {
    try {
      if (!template.name || !template.components) {
        logger.error('Invalid template format', 'TEMPLATE_SERVICE');
        return false;
      }

      this.templates.set(template.name, {
        ...template,
        updatedAt: new Date().toISOString()
      });

      logger.success(`Template updated: ${template.name}`, 'TEMPLATE_SERVICE');
      return true;
    } catch (error) {
      logger.error('Error setting template', 'TEMPLATE_SERVICE', error);
      return false;
    }
  }

  /**
   * Delete template
   * @param {string} templateName - Template name
   * @returns {boolean} Success status
   */
  deleteTemplate(templateName) {
    try {
      const deleted = this.templates.delete(templateName);
      if (deleted) {
        logger.success(`Template deleted: ${templateName}`, 'TEMPLATE_SERVICE');
      } else {
        logger.warn(`Template not found for deletion: ${templateName}`, 'TEMPLATE_SERVICE');
      }
      return deleted;
    } catch (error) {
      logger.error('Error deleting template', 'TEMPLATE_SERVICE', error);
      return false;
    }
  }

  /**
   * Format template with parameters
   * @param {string} templateName - Template name
   * @param {Array} parameters - Template parameters
   * @returns {Object|null} Formatted template or null
   */
  formatTemplate(templateName, parameters = []) {
    try {
      const template = this.getTemplate(templateName);
      if (!template) {
        return null;
      }

      // Clone template to avoid modifying original
      const formattedTemplate = JSON.parse(JSON.stringify(template));

      // Replace parameters in body text
      if (formattedTemplate.components) {
        formattedTemplate.components.forEach(component => {
          if (component.type === 'BODY' && component.text) {
            let text = component.text;
            parameters.forEach((param, index) => {
              const placeholder = `{{${index + 1}}}`;
              text = text.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), param);
            });
            component.text = text;
          }
        });
      }

      return formattedTemplate;
    } catch (error) {
      logger.error('Error formatting template', 'TEMPLATE_SERVICE', error);
      return null;
    }
  }

  /**
   * Validate template structure
   * @param {Object} template - Template to validate
   * @returns {Object} Validation result
   */
  validateTemplate(template) {
    const errors = [];

    if (!template.name) {
      errors.push('Template name is required');
    }

    if (!template.category) {
      errors.push('Template category is required');
    }

    if (!template.language) {
      errors.push('Template language is required');
    }

    if (!template.components || !Array.isArray(template.components)) {
      errors.push('Template components array is required');
    } else {
      // Validate components
      const hasBody = template.components.some(comp => comp.type === 'BODY');
      if (!hasBody) {
        errors.push('Template must have at least one BODY component');
      }

      template.components.forEach((component, index) => {
        if (!component.type) {
          errors.push(`Component ${index + 1}: type is required`);
        }

        if (component.type === 'BODY' && !component.text) {
          errors.push(`Component ${index + 1}: BODY component must have text`);
        }

        if (component.type === 'HEADER' && component.format === 'TEXT' && !component.text) {
          errors.push(`Component ${index + 1}: TEXT HEADER component must have text`);
        }

        if (component.type === 'BUTTONS') {
          if (!component.buttons || !Array.isArray(component.buttons)) {
            errors.push(`Component ${index + 1}: BUTTONS component must have buttons array`);
          } else if (component.buttons.length > 3) {
            errors.push(`Component ${index + 1}: Maximum 3 buttons allowed`);
          }
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get templates by category
   * @param {string} category - Template category
   * @returns {Array} Array of templates in category
   */
  getTemplatesByCategory(category) {
    return Array.from(this.templates.values())
      .filter(template => template.category === category);
  }

  /**
   * Search templates by name or content
   * @param {string} query - Search query
   * @returns {Array} Array of matching templates
   */
  searchTemplates(query) {
    const searchTerm = query.toLowerCase();
    return Array.from(this.templates.values())
      .filter(template => {
        const nameMatch = template.name.toLowerCase().includes(searchTerm);
        const contentMatch = template.components.some(component => 
          component.text && component.text.toLowerCase().includes(searchTerm)
        );
        return nameMatch || contentMatch;
      });
  }

  /**
   * Get template usage statistics
   * @returns {Object} Usage statistics
   */
  getTemplateStats() {
    const templates = Array.from(this.templates.values());
    const stats = {
      total: templates.length,
      byCategory: {},
      byStatus: {},
      byLanguage: {}
    };

    templates.forEach(template => {
      // Count by category
      stats.byCategory[template.category] = (stats.byCategory[template.category] || 0) + 1;
      
      // Count by status
      stats.byStatus[template.status || 'UNKNOWN'] = (stats.byStatus[template.status || 'UNKNOWN'] || 0) + 1;
      
      // Count by language
      stats.byLanguage[template.language] = (stats.byLanguage[template.language] || 0) + 1;
    });

    return stats;
  }

  /**
   * Export templates to JSON
   * @returns {string} JSON string of all templates
   */
  exportTemplates() {
    try {
      const templates = Array.from(this.templates.values());
      return JSON.stringify(templates, null, 2);
    } catch (error) {
      logger.error('Error exporting templates', 'TEMPLATE_SERVICE', error);
      return null;
    }
  }

  /**
   * Import templates from JSON
   * @param {string} jsonData - JSON string of templates
   * @returns {Object} Import result
   */
  importTemplates(jsonData) {
    try {
      const templates = JSON.parse(jsonData);
      let imported = 0;
      let errors = 0;

      if (!Array.isArray(templates)) {
        throw new Error('Invalid JSON format: expected array of templates');
      }

      templates.forEach(template => {
        const validation = this.validateTemplate(template);
        if (validation.valid) {
          this.setTemplate(template);
          imported++;
        } else {
          logger.error(`Invalid template: ${template.name}`, 'TEMPLATE_SERVICE', validation.errors);
          errors++;
        }
      });

      logger.success(`Imported ${imported} templates, ${errors} errors`, 'TEMPLATE_SERVICE');
      
      return {
        success: true,
        imported,
        errors,
        message: `Successfully imported ${imported} templates`
      };

    } catch (error) {
      logger.error('Error importing templates', 'TEMPLATE_SERVICE', error);
      return {
        success: false,
        imported: 0,
        errors: 1,
        message: error.message
      };
    }
  }
}

// Create singleton instance
const messageTemplateService = new MessageTemplateService();

module.exports = messageTemplateService;