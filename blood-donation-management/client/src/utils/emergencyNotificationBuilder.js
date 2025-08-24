import logger from './logger';

class EmergencyNotificationBuilder {
  constructor() {
    this.urgencyLevels = {
      critical: {
        priority: 1,
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
        sound: 'emergency-critical.mp3',
        badge: 'urgent',
        color: '#dc2626',
        timeout: 0 // Never auto-dismiss
      },
      urgent: {
        priority: 2,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        sound: 'emergency-urgent.mp3',
        badge: 'urgent',
        color: '#ea580c',
        timeout: 30000 // 30 seconds
      },
      high: {
        priority: 3,
        requireInteraction: false,
        vibrate: [100, 50, 100],
        sound: 'notification.mp3',
        badge: 'normal',
        color: '#2563eb',
        timeout: 15000 // 15 seconds
      },
      normal: {
        priority: 4,
        requireInteraction: false,
        vibrate: [100],
        sound: 'notification.mp3',
        badge: 'normal',
        color: '#059669',
        timeout: 10000 // 10 seconds
      }
    };

    logger.info('EmergencyNotificationBuilder initialized', 'EMERGENCY_NOTIFICATION');
  }

  // Build emergency blood request notification
  buildBloodRequestNotification(requestData) {
    try {
      const {
        requestId,
        bloodType,
        urgency = 'urgent',
        patientInfo,
        hospitalInfo,
        location,
        timeRemaining,
        donorsNeeded = 1,
        additionalInfo
      } = requestData;

      const urgencyConfig = this.urgencyLevels[urgency] || this.urgencyLevels.urgent;
      
      // Build title based on urgency
      const title = this.buildTitle(urgency, bloodType, patientInfo);
      
      // Build body message
      const body = this.buildBodyMessage(requestData);
      
      // Build notification options
      const options = {
        body,
        icon: '/Logo/android-chrome-192x192.png',
        badge: '/badge-urgent.png',
        image: hospitalInfo?.image || '/images/hospital-default.jpg',
        data: {
          type: 'blood_request',
          requestId,
          bloodType,
          urgency,
          hospitalInfo,
          location,
          timestamp: Date.now(),
          patientInfo: this.sanitizePatientInfo(patientInfo),
          responseUrl: `/api/v1/blood-requests/${requestId}/respond`,
          detailsUrl: `/emergency/${requestId}`,
          hospitalPhone: hospitalInfo?.phone,
          expiresAt: Date.now() + (timeRemaining || 3600000) // Default 1 hour
        },
        tag: `blood-request-${requestId}`,
        renotify: true,
        requireInteraction: urgencyConfig.requireInteraction,
        silent: false,
        vibrate: urgencyConfig.vibrate,
        timestamp: Date.now(),
        actions: this.buildActionButtons(urgency, hospitalInfo),
        dir: 'ltr',
        lang: 'en'
      };

      // Add urgency-specific styling
      if (urgencyConfig.color) {
        options.data.color = urgencyConfig.color;
      }

      logger.success('Blood request notification built', 'EMERGENCY_NOTIFICATION', {
        requestId,
        urgency,
        bloodType,
        actionsCount: options.actions.length
      });

      return {
        title,
        options,
        urgency,
        metadata: {
          built: Date.now(),
          type: 'blood_request',
          priority: urgencyConfig.priority
        }
      };

    } catch (error) {
      logger.error('Failed to build blood request notification', 'EMERGENCY_NOTIFICATION', error);
      return this.buildFallbackNotification(requestData);
    }
  }

  // Build notification title
  buildTitle(urgency, bloodType, patientInfo) {
    const urgencyText = {
      critical: 'CRITICAL',
  urgent: 'URGENT',
  high: 'HIGH PRIORITY',
  normal: 'Blood Needed'
    };

    const baseTitle = urgencyText[urgency] || urgencyText.normal;
    
    if (patientInfo?.age && patientInfo?.gender) {
      return `${baseTitle}: ${bloodType} for ${patientInfo.gender}, ${patientInfo.age}`;
    }
    
    return `${baseTitle}: ${bloodType} Blood Needed`;
  }

  // Build notification body message
  buildBodyMessage(requestData) {
    const {
      hospitalInfo,
      location,
      timeRemaining,
      patientInfo,
      urgency,
      additionalInfo
    } = requestData;

    let message = '';

    // Hospital information
    if (hospitalInfo?.name) {
      message += `Hospital: ${hospitalInfo.name}`;
      if (location?.distance) {
        message += ` (${location.distance}km away)`;
      }
      message += '\n';
    }

    // Time urgency
    if (timeRemaining) {
      const hours = Math.floor(timeRemaining / 3600000);
      const minutes = Math.floor((timeRemaining % 3600000) / 60000);
      
      if (hours > 0) {
        message += `⏰ Needed within ${hours}h ${minutes}m\n`;
      } else {
        message += `⏰ Needed within ${minutes} minutes\n`;
      }
    }

    // Patient context (anonymized)
    if (patientInfo?.condition && urgency === 'critical') {
      message += `🩺 Emergency: ${patientInfo.condition}\n`;
    }

    // Additional context
    if (additionalInfo?.reason) {
      message += `📋 ${additionalInfo.reason}\n`;
    }

    // Call to action
    message += '\n💝 Your donation can save a life!';

    return message.trim();
  }

  // Build action buttons based on urgency and context
  buildActionButtons(urgency, hospitalInfo) {
    const actions = [];

    // Primary action - Accept
    actions.push({
      action: 'accept',
      title: 'I Can Help',
      icon: '/icons/accept.png'
    });

    // Secondary action - Decline
    actions.push({
      action: 'decline',
      title: 'Cannot Help',
      icon: '/icons/decline.png'
    });

    // For critical/urgent cases, add more actions
    if (urgency === 'critical' || urgency === 'urgent') {
      // View details
      actions.push({
        action: 'view_details',
        title: 'View Details',
        icon: '/icons/view.png'
      });

      // Call hospital directly
      if (hospitalInfo?.phone) {
        actions.push({
          action: 'call_hospital',
          title: '📞 Call',
          icon: '/icons/call.png'
        });
      }
    }

    // Share with network (for all urgency levels)
    actions.push({
      action: 'share',
      title: '📤 Share',
      icon: '/icons/share.png'
    });

    // Limit to 3 actions for better UX (browser limitation)
    return actions.slice(0, 3);
  }

  // Sanitize patient information for privacy
  sanitizePatientInfo(patientInfo) {
    if (!patientInfo) return null;

    return {
      age: patientInfo.age,
      gender: patientInfo.gender,
      condition: patientInfo.condition,
      // Remove any PII
      id: null,
      name: null,
      phone: null,
      address: null
    };
  }

  // Build donation reminder notification
  buildDonationReminderNotification(reminderData) {
    try {
      const {
        donorName,
        lastDonation,
        eligibleDate,
        nearbyRequests = 0,
        personalizedMessage
      } = reminderData;

      const daysSinceLastDonation = lastDonation 
        ? Math.floor((Date.now() - new Date(lastDonation).getTime()) / (24 * 60 * 60 * 1000))
        : null;

      const title = 'Ready to Donate Again?';
      
      let body = `Hi ${donorName}! `;
      
      if (daysSinceLastDonation) {
        body += `It's been ${daysSinceLastDonation} days since your last donation. `;
      }
      
      if (nearbyRequests > 0) {
        body += `There are ${nearbyRequests} active blood requests in your area. `;
      }
      
      body += 'Your donation can make a difference!';

      if (personalizedMessage) {
        body += `\n\n${personalizedMessage}`;
      }

      const options = {
        body,
        icon: '/Logo/android-chrome-192x192.png',
        badge: '/badge-reminder.png',
        data: {
          type: 'donation_reminder',
          donorName,
          lastDonation,
          eligibleDate,
          nearbyRequests,
          timestamp: Date.now()
        },
        tag: 'donation-reminder',
        requireInteraction: false,
        vibrate: [100, 50, 100],
        actions: [
          {
            action: 'schedule',
            title: '📅 Schedule',
            icon: '/icons/schedule.png'
          },
          {
            action: 'find_requests',
            title: '🔍 Find Requests',
            icon: '/icons/search.png'
          },
          {
            action: 'remind_later',
            title: '⏰ Remind Later',
            icon: '/icons/remind.png'
          }
        ]
      };

      return {
        title,
        options,
        urgency: 'normal',
        metadata: {
          built: Date.now(),
          type: 'donation_reminder',
          priority: 4
        }
      };

    } catch (error) {
      logger.error('Failed to build donation reminder notification', 'EMERGENCY_NOTIFICATION', error);
      return null;
    }
  }

  // Build system notification (updates, maintenance, etc.)
  buildSystemNotification(systemData) {
    try {
      const {
        type,
        title,
        message,
        urgency = 'normal',
        actionUrl,
        actionText = 'View Details'
      } = systemData;

      const options = {
        body: message,
        icon: '/Logo/android-chrome-192x192.png',
        badge: '/badge-system.png',
        data: {
          type: 'system_notification',
          systemType: type,
          actionUrl,
          timestamp: Date.now()
        },
        tag: `system-${type}`,
        requireInteraction: urgency === 'critical',
        vibrate: this.urgencyLevels[urgency]?.vibrate || [100],
        actions: actionUrl ? [
          {
            action: 'view_details',
            title: actionText,
            icon: '/icons/view.png'
          }
        ] : []
      };

      return {
        title,
        options,
        urgency,
        metadata: {
          built: Date.now(),
          type: 'system_notification',
          priority: this.urgencyLevels[urgency]?.priority || 4
        }
      };

    } catch (error) {
      logger.error('Failed to build system notification', 'EMERGENCY_NOTIFICATION', error);
      return null;
    }
  }

  // Build fallback notification for errors
  buildFallbackNotification(originalData) {
    logger.warn('Building fallback notification', 'EMERGENCY_NOTIFICATION');

    return {
      title: 'Blood Donation Request',
      options: {
        body: 'A blood donation request needs your attention. Tap to view details.',
        icon: '/Logo/android-chrome-192x192.png',
        badge: '/badge-urgent.png',
        data: {
          type: 'fallback',
          originalData,
          timestamp: Date.now()
        },
        tag: 'fallback-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: [
          {
            action: 'view_details',
            title: 'View Details',
            icon: '/icons/view.png'
          }
        ]
      },
      urgency: 'urgent',
      metadata: {
        built: Date.now(),
        type: 'fallback',
        priority: 2
      }
    };
  }

  // Validate notification data
  validateNotificationData(notificationData) {
    const { title, options } = notificationData;

    if (!title || typeof title !== 'string') {
      throw new Error('Notification title is required and must be a string');
    }

    if (!options || typeof options !== 'object') {
      throw new Error('Notification options are required and must be an object');
    }

    if (!options.body || typeof options.body !== 'string') {
      throw new Error('Notification body is required and must be a string');
    }

    // Validate actions
    if (options.actions && Array.isArray(options.actions)) {
      if (options.actions.length > 3) {
        logger.warn('Too many notification actions, limiting to 3', 'EMERGENCY_NOTIFICATION');
        options.actions = options.actions.slice(0, 3);
      }

      options.actions.forEach((action, index) => {
        if (!action.action || !action.title) {
          throw new Error(`Action ${index} must have 'action' and 'title' properties`);
        }
      });
    }

    return true;
  }

  // Get notification priority score
  getNotificationPriority(urgency) {
    return this.urgencyLevels[urgency]?.priority || 4;
  }

  // Check if notification should bypass Do Not Disturb
  shouldBypassDND(urgency) {
    return urgency === 'critical';
  }

  // Get notification sound based on urgency
  getNotificationSound(urgency) {
    return this.urgencyLevels[urgency]?.sound || 'notification.mp3';
  }

  // Build notification for testing
  buildTestNotification() {
    return this.buildBloodRequestNotification({
      requestId: 'test-123',
      bloodType: 'O+',
      urgency: 'urgent',
      patientInfo: {
        age: 35,
        gender: 'Male',
        condition: 'Surgery'
      },
      hospitalInfo: {
        name: 'Test Hospital',
        phone: '+1234567890'
      },
      location: {
        distance: 5.2
      },
      timeRemaining: 7200000, // 2 hours
      additionalInfo: {
        reason: 'Emergency surgery required'
      }
    });
  }
}

// Create singleton instance
const emergencyNotificationBuilder = new EmergencyNotificationBuilder();

export default emergencyNotificationBuilder;