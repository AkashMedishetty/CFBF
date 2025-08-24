/**
 * Emergency Notification Response Manager
 * Handles comprehensive emergency notification response system including
 * hospital contact integration, donor coordination, and fallback delivery
 */

class EmergencyNotificationResponseManager {
  constructor() {
    this.activeEmergencies = new Map();
    this.donorResponses = new Map();
    this.hospitalContacts = new Map();
    this.notificationQueue = [];
    this.deliveryAttempts = new Map();
    this.analytics = {
      totalEmergencies: 0,
      successfulMatches: 0,
      averageResponseTime: 0,
      deliveryFailures: 0,
      hospitalContacts: 0
    };
    this.isInitialized = false;
  }

  // Initialize the emergency response manager
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('[EmergencyResponseManager] Initializing emergency response system');

      // Load stored data from IndexedDB
      await this.loadStoredData();

      // Set up real-time coordination
      await this.setupRealtimeCoordination();

      // Initialize hospital contact system
      await this.initializeHospitalContacts();

      // Set up notification delivery monitoring
      this.setupDeliveryMonitoring();

      // Initialize analytics tracking
      this.initializeAnalytics();

      this.isInitialized = true;
      console.log('[EmergencyResponseManager] Emergency response system initialized');

    } catch (error) {
      console.error('[EmergencyResponseManager] Initialization failed:', error);
      throw error;
    }
  }

  // Create emergency blood request with comprehensive response handling
  async createEmergencyRequest(bloodRequest) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const emergencyId = `emergency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const emergency = {
        id: emergencyId,
        ...bloodRequest,
        createdAt: new Date().toISOString(),
        status: 'active',
        priority: this.calculatePriority(bloodRequest),
        selectedDonors: [],
        responses: [],
        hospitalContacted: false,
        deliveryAttempts: 0,
        analytics: {
          notificationsSent: 0,
          responsesReceived: 0,
          averageResponseTime: 0,
          deliverySuccessRate: 0
        }
      };

      // Store emergency
      this.activeEmergencies.set(emergencyId, emergency);

      // Find and notify compatible donors
      const donors = await this.findCompatibleDonors(emergency);
      
      // Send notifications with multiple delivery channels
      await this.sendEmergencyNotifications(emergency, donors);

      // Set up automatic escalation
      this.setupAutomaticEscalation(emergency);

      // Update analytics
      this.analytics.totalEmergencies++;

      console.log(`[EmergencyResponseManager] Emergency request created: ${emergencyId}`);
      return emergencyId;

    } catch (error) {
      console.error('[EmergencyResponseManager] Failed to create emergency request:', error);
      throw error;
    }
  }

  // Calculate emergency priority based on multiple factors
  calculatePriority(bloodRequest) {
    let priority = 0;

    // Urgency level
    switch (bloodRequest.urgency) {
      case 'critical':
        priority += 100;
        break;
      case 'urgent':
        priority += 75;
        break;
      case 'normal':
        priority += 50;
        break;
      default:
        priority += 25;
    }

    // Blood type rarity
    const rareTypes = ['AB-', 'B-', 'A-', 'O-'];
    if (rareTypes.includes(bloodRequest.bloodType)) {
      priority += 25;
    }

    // Patient age (children get higher priority)
    if (bloodRequest.patient && bloodRequest.patient.age < 18) {
      priority += 20;
    }

    // Time sensitivity
    if (bloodRequest.neededBy) {
      const timeUntilNeeded = new Date(bloodRequest.neededBy) - new Date();
      const hoursUntilNeeded = timeUntilNeeded / (1000 * 60 * 60);
      
      if (hoursUntilNeeded < 2) {
        priority += 30;
      } else if (hoursUntilNeeded < 6) {
        priority += 15;
      }
    }

    return Math.min(priority, 200); // Cap at 200
  }

  // Find compatible donors using intelligent matching
  async findCompatibleDonors(emergency) {
    try {
      // This would typically call the backend API
      // For now, we'll simulate the donor matching process
      
      const matchingCriteria = {
        bloodType: emergency.bloodType,
        location: emergency.hospital.location,
        radius: this.calculateSearchRadius(emergency.priority),
        availability: 'available',
        lastDonation: { $gte: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000) } // 8 weeks ago
      };

      // Simulate API call to find donors
      const response = await fetch('/api/v1/donors/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          emergencyId: emergency.id,
          criteria: matchingCriteria,
          priority: emergency.priority
        })
      });

      if (!response.ok) {
        throw new Error(`Donor matching failed: ${response.statusText}`);
      }

      const donors = await response.json();
      
      // Sort donors by compatibility score
      return donors.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    } catch (error) {
      console.error('[EmergencyResponseManager] Failed to find compatible donors:', error);
      
      // Fallback: return mock donors for testing
      return this.getMockDonors(emergency);
    }
  }

  // Calculate search radius based on priority
  calculateSearchRadius(priority) {
    if (priority >= 150) return 50; // Critical - expand to 50km
    if (priority >= 100) return 30; // Urgent - expand to 30km
    if (priority >= 75) return 20;  // High - expand to 20km
    return 15; // Normal - standard 15km
  }

  // Send emergency notifications through multiple channels
  async sendEmergencyNotifications(emergency, donors) {
    const notificationPromises = [];

    for (const donor of donors) {
      // Primary: Push notification
      notificationPromises.push(
        this.sendPushNotification(emergency, donor)
          .catch(error => {
            console.log(`[EmergencyResponseManager] Push notification failed for donor ${donor.id}:`, error);
            // Fallback to SMS
            return this.sendSMSNotification(emergency, donor);
          })
          .catch(error => {
            console.log(`[EmergencyResponseManager] SMS notification failed for donor ${donor.id}:`, error);
            // Final fallback to email
            return this.sendEmailNotification(emergency, donor);
          })
      );
    }

    // Wait for all notifications to be sent
    const results = await Promise.allSettled(notificationPromises);
    
    // Update analytics
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    emergency.analytics.notificationsSent = successful;
    this.analytics.deliveryFailures += failed;

    console.log(`[EmergencyResponseManager] Notifications sent: ${successful} successful, ${failed} failed`);
  }

  // Send push notification with action buttons
  async sendPushNotification(emergency, donor) {
    const notification = {
      title: `URGENT: ${emergency.bloodType} Blood Needed ${emergency.urgency === 'critical' ? 'CRITICALLY' : ''}`,
      body: `Emergency at ${emergency.hospital.name} - ${emergency.distance || 'Unknown'}km away`,
      icon: '/icons/emergency-blood.png',
      badge: '/icons/badge-emergency.png',
      tag: `emergency-${emergency.id}`,
      requireInteraction: emergency.priority >= 150,
      data: {
        emergencyId: emergency.id,
        donorId: donor.id,
        type: 'emergency_blood_request',
        hospitalPhone: emergency.hospital.phone,
        priority: emergency.priority
      },
      actions: [
        {
          action: 'accept_emergency',
          title: 'Accept Emergency',
          icon: '/icons/accept-emergency.png'
        },
        {
          action: 'call_hospital',
          title: '📞 Call Hospital',
          icon: '/icons/call.png'
        },
        {
          action: 'share_emergency',
          title: '📤 Share with Network',
          icon: '/icons/share.png'
        },
        {
          action: 'decline_emergency',
          title: 'Cannot Help',
          icon: '/icons/decline.png'
        }
      ]
    };

    // Send through service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(notification.title, notification);
    }

    // Track delivery attempt
    this.trackDeliveryAttempt(emergency.id, donor.id, 'push', 'sent');
  }

  // Send SMS notification as fallback
  async sendSMSNotification(emergency, donor) {
    try {
      const message = `EMERGENCY: ${emergency.bloodType} blood needed at ${emergency.hospital.name}. Can you help? Reply YES to accept or call ${emergency.hospital.phone}. Emergency ID: ${emergency.id}`;

      const response = await fetch('/api/v1/notifications/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          to: donor.phone,
          message: message,
          emergencyId: emergency.id,
          donorId: donor.id
        })
      });

      if (!response.ok) {
        throw new Error(`SMS sending failed: ${response.statusText}`);
      }

      this.trackDeliveryAttempt(emergency.id, donor.id, 'sms', 'sent');

    } catch (error) {
      this.trackDeliveryAttempt(emergency.id, donor.id, 'sms', 'failed');
      throw error;
    }
  }

  // Send email notification as final fallback
  async sendEmailNotification(emergency, donor) {
    try {
      const emailData = {
        to: donor.email,
        subject: `Emergency Blood Request - ${emergency.bloodType} Needed`,
        template: 'emergency_blood_request',
        data: {
          donorName: donor.name,
          bloodType: emergency.bloodType,
          hospitalName: emergency.hospital.name,
          hospitalPhone: emergency.hospital.phone,
          urgency: emergency.urgency,
          emergencyId: emergency.id,
          acceptUrl: `${window.location.origin}/emergency/${emergency.id}/respond?action=accept&donor=${donor.id}`,
          declineUrl: `${window.location.origin}/emergency/${emergency.id}/respond?action=decline&donor=${donor.id}`
        }
      };

      const response = await fetch('/api/v1/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error(`Email sending failed: ${response.statusText}`);
      }

      this.trackDeliveryAttempt(emergency.id, donor.id, 'email', 'sent');

    } catch (error) {
      this.trackDeliveryAttempt(emergency.id, donor.id, 'email', 'failed');
      throw error;
    }
  }

  // Handle donor response to emergency request
  async handleDonorResponse(emergencyId, donorId, response, responseData = {}) {
    try {
      const emergency = this.activeEmergencies.get(emergencyId);
      if (!emergency) {
        throw new Error(`Emergency ${emergencyId} not found`);
      }

      const responseRecord = {
        donorId,
        response,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - new Date(emergency.createdAt).getTime(),
        ...responseData
      };

      emergency.responses.push(responseRecord);
      emergency.analytics.responsesReceived++;

      // Update average response time
      const totalResponseTime = emergency.responses.reduce((sum, r) => sum + r.responseTime, 0);
      emergency.analytics.averageResponseTime = totalResponseTime / emergency.responses.length;

      if (response === 'accept') {
        await this.handleDonorAcceptance(emergency, donorId, responseRecord);
      } else if (response === 'decline') {
        await this.handleDonorDecline(emergency, donorId, responseRecord);
      }

      // Send confirmation notification to donor
      await this.sendResponseConfirmation(emergency, donorId, response);

      // Update emergency status
      await this.updateEmergencyStatus(emergency);

      console.log(`[EmergencyResponseManager] Donor response processed: ${emergencyId} - ${response}`);

    } catch (error) {
      console.error('[EmergencyResponseManager] Failed to handle donor response:', error);
      throw error;
    }
  }

  // Handle donor acceptance
  async handleDonorAcceptance(emergency, donorId, responseRecord) {
    try {
      // Add donor to selected list
      emergency.selectedDonors.push({
        donorId,
        selectedAt: new Date().toISOString(),
        status: 'selected',
        responseTime: responseRecord.responseTime
      });

      // Contact hospital immediately
      await this.contactHospital(emergency, donorId);

      // Send follow-up notifications to donor
      await this.sendDonorFollowUp(emergency, donorId);

      // If we have enough donors, start coordination
      if (emergency.selectedDonors.length >= (emergency.unitsNeeded || 1)) {
        await this.coordinateMultipleDonors(emergency);
      }

      this.analytics.successfulMatches++;

    } catch (error) {
      console.error('[EmergencyResponseManager] Failed to handle donor acceptance:', error);
      throw error;
    }
  }

  // Handle donor decline
  async handleDonorDecline(emergency, donorId, responseRecord) {
    try {
      // Log the decline reason if provided
      if (responseRecord.reason) {
        console.log(`[EmergencyResponseManager] Donor ${donorId} declined: ${responseRecord.reason}`);
      }

      // If we're running low on responses, expand search
      const acceptedCount = emergency.responses.filter(r => r.response === 'accept').length;
      const totalResponses = emergency.responses.length;
      
      if (totalResponses >= 10 && acceptedCount === 0) {
        await this.expandEmergencySearch(emergency);
      }

    } catch (error) {
      console.error('[EmergencyResponseManager] Failed to handle donor decline:', error);
    }
  }

  // Contact hospital with donor information
  async contactHospital(emergency, donorId) {
    try {
      if (emergency.hospitalContacted) return;

      const hospitalContactData = {
        emergencyId: emergency.id,
        hospitalId: emergency.hospital.id,
        donorId: donorId,
        bloodType: emergency.bloodType,
        urgency: emergency.urgency,
        estimatedArrival: this.calculateEstimatedArrival(emergency, donorId)
      };

      // Send to hospital system
      const response = await fetch('/api/v1/hospitals/emergency-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(hospitalContactData)
      });

      if (response.ok) {
        emergency.hospitalContacted = true;
        this.analytics.hospitalContacts++;
        
        // Store hospital contact for tracking
        this.hospitalContacts.set(emergency.id, {
          contactedAt: new Date().toISOString(),
          donorId,
          response: await response.json()
        });

        console.log(`[EmergencyResponseManager] Hospital contacted for emergency ${emergency.id}`);
      }

    } catch (error) {
      console.error('[EmergencyResponseManager] Failed to contact hospital:', error);
    }
  }

  // Send follow-up notification to selected donor
  async sendDonorFollowUp(emergency, donorId) {
    try {
      const followUpData = {
        emergencyId: emergency.id,
        donorId: donorId,
        hospitalName: emergency.hospital.name,
        hospitalAddress: emergency.hospital.address,
        hospitalPhone: emergency.hospital.phone,
        appointmentTime: this.calculateAppointmentTime(emergency),
        specialInstructions: emergency.specialInstructions || 'Please bring a valid ID and eat a good meal before donating.'
      };

      // Send detailed follow-up notification
      await this.sendFollowUpNotification(followUpData);

      // Schedule reminder notifications
      await this.scheduleReminderNotifications(followUpData);

    } catch (error) {
      console.error('[EmergencyResponseManager] Failed to send donor follow-up:', error);
    }
  }

  // Coordinate multiple donors for the same emergency
  async coordinateMultipleDonors(emergency) {
    try {
      const selectedDonors = emergency.selectedDonors;
      
      // Sort donors by response time (fastest first)
      selectedDonors.sort((a, b) => a.responseTime - b.responseTime);

      // Assign time slots to avoid overcrowding
      const timeSlots = this.generateTimeSlots(emergency, selectedDonors.length);
      
      for (let i = 0; i < selectedDonors.length; i++) {
        const donor = selectedDonors[i];
        donor.assignedTimeSlot = timeSlots[i];
        
        // Send time slot notification
        await this.sendTimeSlotNotification(emergency, donor.donorId, timeSlots[i]);
      }

      // Update emergency status
      emergency.status = 'coordinated';

      console.log(`[EmergencyResponseManager] Coordinated ${selectedDonors.length} donors for emergency ${emergency.id}`);

    } catch (error) {
      console.error('[EmergencyResponseManager] Failed to coordinate multiple donors:', error);
    }
  }

  // Expand emergency search when not enough responses
  async expandEmergencySearch(emergency) {
    try {
      console.log(`[EmergencyResponseManager] Expanding search for emergency ${emergency.id}`);

      // Increase search radius
      const newRadius = this.calculateSearchRadius(emergency.priority) * 1.5;
      
      // Find additional donors
      const additionalDonors = await this.findCompatibleDonors({
        ...emergency,
        searchRadius: newRadius
      });

      // Filter out donors who already received notifications
      const notifiedDonorIds = new Set(emergency.responses.map(r => r.donorId));
      const newDonors = additionalDonors.filter(d => !notifiedDonorIds.has(d.id));

      if (newDonors.length > 0) {
        await this.sendEmergencyNotifications(emergency, newDonors);
        console.log(`[EmergencyResponseManager] Notified ${newDonors.length} additional donors`);
      }

    } catch (error) {
      console.error('[EmergencyResponseManager] Failed to expand emergency search:', error);
    }
  }

  // Set up automatic escalation for emergencies
  setupAutomaticEscalation(emergency) {
    // Escalate after 15 minutes if no responses for critical emergencies
    if (emergency.priority >= 150) {
      setTimeout(() => {
        const currentEmergency = this.activeEmergencies.get(emergency.id);
        if (currentEmergency && currentEmergency.responses.length === 0) {
          this.escalateEmergency(currentEmergency);
        }
      }, 15 * 60 * 1000); // 15 minutes
    }

    // Escalate after 30 minutes for urgent emergencies
    if (emergency.priority >= 100) {
      setTimeout(() => {
        const currentEmergency = this.activeEmergencies.get(emergency.id);
        if (currentEmergency && currentEmergency.selectedDonors.length === 0) {
          this.escalateEmergency(currentEmergency);
        }
      }, 30 * 60 * 1000); // 30 minutes
    }
  }

  // Escalate emergency when no adequate response
  async escalateEmergency(emergency) {
    try {
      console.log(`[EmergencyResponseManager] Escalating emergency ${emergency.id}`);

      // Increase priority
      emergency.priority = Math.min(emergency.priority + 25, 200);

      // Expand search to nearby regions
      await this.expandEmergencySearch(emergency);

      // Notify emergency contacts
      await this.notifyEmergencyContacts(emergency);

      // Alert nearby hospitals
      await this.alertNearbyHospitals(emergency);

    } catch (error) {
      console.error('[EmergencyResponseManager] Failed to escalate emergency:', error);
    }
  }

  // Track delivery attempts for analytics
  trackDeliveryAttempt(emergencyId, donorId, channel, status) {
    const key = `${emergencyId}-${donorId}-${channel}`;
    
    if (!this.deliveryAttempts.has(key)) {
      this.deliveryAttempts.set(key, []);
    }
    
    this.deliveryAttempts.get(key).push({
      timestamp: new Date().toISOString(),
      status,
      channel
    });
  }

  // Get comprehensive analytics
  getAnalytics() {
    const activeEmergenciesCount = this.activeEmergencies.size;
    const totalResponses = Array.from(this.activeEmergencies.values())
      .reduce((sum, e) => sum + e.responses.length, 0);
    
    const averageResponseTime = Array.from(this.activeEmergencies.values())
      .filter(e => e.analytics.averageResponseTime > 0)
      .reduce((sum, e, _, arr) => sum + e.analytics.averageResponseTime / arr.length, 0);

    return {
      ...this.analytics,
      activeEmergencies: activeEmergenciesCount,
      totalResponses,
      averageResponseTime: Math.round(averageResponseTime / 1000), // Convert to seconds
      responseRate: totalResponses > 0 ? (this.analytics.successfulMatches / totalResponses * 100) : 0,
      deliverySuccessRate: this.calculateDeliverySuccessRate()
    };
  }

  // Calculate delivery success rate
  calculateDeliverySuccessRate() {
    const allAttempts = Array.from(this.deliveryAttempts.values()).flat();
    if (allAttempts.length === 0) return 100;
    
    const successful = allAttempts.filter(a => a.status === 'sent').length;
    return (successful / allAttempts.length * 100);
  }

  // Utility methods
  async getAuthToken() {
    // Get authentication token from storage or context
    try {
      const token = localStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('[EmergencyResponseManager] Failed to get auth token:', error);
      return null;
    }
  }

  getMockDonors(emergency) {
    // Mock donors for testing
    return [
      {
        id: 'donor-1',
        name: 'John Doe',
        bloodType: emergency.bloodType,
        phone: '+1-555-0101',
        email: 'john@example.com',
        distance: 2.5,
        compatibilityScore: 95
      },
      {
        id: 'donor-2',
        name: 'Jane Smith',
        bloodType: emergency.bloodType,
        phone: '+1-555-0102',
        email: 'jane@example.com',
        distance: 3.8,
        compatibilityScore: 90
      }
    ];
  }

  calculateEstimatedArrival(emergency, donorId) {
    // Calculate estimated arrival time based on distance and traffic
    const baseTime = 30; // 30 minutes base time
    const distance = emergency.distance || 5;
    const travelTime = distance * 3; // 3 minutes per km
    
    return new Date(Date.now() + (baseTime + travelTime) * 60 * 1000).toISOString();
  }

  calculateAppointmentTime(emergency) {
    // Calculate appointment time (usually 1 hour from now for emergencies)
    return new Date(Date.now() + 60 * 60 * 1000).toISOString();
  }

  generateTimeSlots(emergency, donorCount) {
    const slots = [];
    const startTime = new Date(Date.now() + 60 * 60 * 1000); // Start in 1 hour
    
    for (let i = 0; i < donorCount; i++) {
      const slotTime = new Date(startTime.getTime() + i * 30 * 60 * 1000); // 30 minutes apart
      slots.push(slotTime.toISOString());
    }
    
    return slots;
  }

  // Placeholder methods for additional functionality
  async loadStoredData() {
    // Load data from IndexedDB
    console.log('[EmergencyResponseManager] Loading stored data');
  }

  async setupRealtimeCoordination() {
    // Set up WebSocket or Server-Sent Events for real-time updates
    console.log('[EmergencyResponseManager] Setting up real-time coordination');
  }

  async initializeHospitalContacts() {
    // Initialize hospital contact system
    console.log('[EmergencyResponseManager] Initializing hospital contacts');
  }

  setupDeliveryMonitoring() {
    // Set up monitoring for notification delivery
    console.log('[EmergencyResponseManager] Setting up delivery monitoring');
  }

  initializeAnalytics() {
    // Initialize analytics tracking
    console.log('[EmergencyResponseManager] Initializing analytics');
  }

  async sendResponseConfirmation(emergency, donorId, response) {
    console.log(`[EmergencyResponseManager] Sending response confirmation: ${response}`);
  }

  async updateEmergencyStatus(emergency) {
    console.log(`[EmergencyResponseManager] Updating emergency status: ${emergency.id}`);
  }

  async sendFollowUpNotification(followUpData) {
    console.log('[EmergencyResponseManager] Sending follow-up notification');
  }

  async scheduleReminderNotifications(followUpData) {
    console.log('[EmergencyResponseManager] Scheduling reminder notifications');
  }

  async sendTimeSlotNotification(emergency, donorId, timeSlot) {
    console.log(`[EmergencyResponseManager] Sending time slot notification: ${timeSlot}`);
  }

  async notifyEmergencyContacts(emergency) {
    console.log('[EmergencyResponseManager] Notifying emergency contacts');
  }

  async alertNearbyHospitals(emergency) {
    console.log('[EmergencyResponseManager] Alerting nearby hospitals');
  }
}

// Create singleton instance
const emergencyNotificationResponseManager = new EmergencyNotificationResponseManager();

export default emergencyNotificationResponseManager;