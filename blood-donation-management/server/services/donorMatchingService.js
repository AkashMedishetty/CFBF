const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

class DonorMatchingService {
  constructor() {
    this.matchingQueue = new Map(); // In-memory queue (use Redis in production)
    this.isProcessing = false;
    this.batchSize = 20; // Number of donors to notify per batch
    this.maxRadius = 100; // Maximum search radius in km
    this.radiusIncrement = 10; // Radius increment for escalation
    this.escalationDelay = 20 * 60 * 1000; // 20 minutes between escalations
    
    // Start processing queue
    this.startQueueProcessor();
    
    logger.success('Donor Matching Service initialized', 'DONOR_MATCHING_SERVICE');
  }

  /**
   * Start donor matching for a blood request
   * @param {Object} bloodRequest - Blood request object
   * @returns {Promise<Object>} Matching result
   */
  async startMatching(bloodRequest) {
    try {
      logger.info(`Starting donor matching for request: ${bloodRequest.requestId}`, 'DONOR_MATCHING_SERVICE');

      // Add to matching queue
      const matchingId = this.generateMatchingId();
      const matchingData = {
        id: matchingId,
        bloodRequest,
        currentRadius: bloodRequest.location.searchRadius || 15,
        notificationRound: 1,
        totalNotified: 0,
        totalResponded: 0,
        positiveResponses: 0,
        createdAt: new Date(),
        lastNotificationAt: null,
        nextEscalationAt: new Date(Date.now() + this.escalationDelay),
        status: 'active'
      };

      this.matchingQueue.set(matchingId, matchingData);

      // Start immediate matching
      const result = await this.processMatching(matchingData);

      logger.success(`Donor matching initiated for request: ${bloodRequest.requestId}`, 'DONOR_MATCHING_SERVICE');

      return {
        success: true,
        matchingId,
        donorsNotified: result.donorsNotified,
        searchRadius: result.searchRadius
      };

    } catch (error) {
      logger.error('Error starting donor matching', 'DONOR_MATCHING_SERVICE', error);
      return {
        success: false,
        error: 'MATCHING_START_ERROR',
        message: error.message
      };
    }
  }

  /**
   * Process donor matching for a specific request
   * @param {Object} matchingData - Matching data object
   * @returns {Promise<Object>} Processing result
   */
  async processMatching(matchingData) {
    try {
      const { bloodRequest, currentRadius, notificationRound } = matchingData;

      logger.info(`Processing matching round ${notificationRound} for request: ${bloodRequest.requestId}`, 'DONOR_MATCHING_SERVICE');

      // Get compatible blood types
      const compatibleTypes = bloodRequest.getCompatibleBloodTypes();

      // Find eligible donors
      const eligibleDonors = await this.findEligibleDonors(
        bloodRequest,
        compatibleTypes,
        currentRadius
      );

      if (eligibleDonors.length === 0) {
        logger.warn(`No eligible donors found for request: ${bloodRequest.requestId} within ${currentRadius}km`, 'DONOR_MATCHING_SERVICE');
        
        // Schedule escalation if within max radius
        if (currentRadius < this.maxRadius) {
          await this.scheduleEscalation(matchingData);
        } else {
          await this.markMatchingComplete(matchingData, 'no_donors_found');
        }

        return {
          donorsNotified: 0,
          searchRadius: currentRadius,
          escalationScheduled: currentRadius < this.maxRadius
        };
      }

      // Score and sort donors
      const scoredDonors = await this.scoreDonors(eligibleDonors, bloodRequest);

      // Determine notification batch size based on urgency
      const batchSize = this.getBatchSize(bloodRequest.request.urgency, notificationRound);
      const donorsToNotify = scoredDonors.slice(0, batchSize);

      logger.info(`Notifying ${donorsToNotify.length} donors for request: ${bloodRequest.requestId}`, 'DONOR_MATCHING_SERVICE');

      // Send notifications
      const notificationResult = await this.sendDonorNotifications(
        donorsToNotify,
        bloodRequest
      );

      // Update matching data
      matchingData.totalNotified += notificationResult.successful;
      matchingData.lastNotificationAt = new Date();

      // Update blood request
      await this.updateBloodRequestMatching(bloodRequest, {
        totalNotified: matchingData.totalNotified,
        lastNotificationSent: new Date(),
        notificationRounds: notificationRound,
        currentRadius: currentRadius
      });

      // Schedule next escalation if needed
      if (notificationResult.successful > 0) {
        await this.scheduleEscalation(matchingData);
      }

      return {
        donorsNotified: notificationResult.successful,
        searchRadius: currentRadius,
        batchSize: donorsToNotify.length
      };

    } catch (error) {
      logger.error('Error processing donor matching', 'DONOR_MATCHING_SERVICE', error);
      throw error;
    }
  }

  /**
   * Find eligible donors for blood request
   * @param {Object} bloodRequest - Blood request object
   * @param {Array} compatibleTypes - Compatible blood types
   * @param {number} radius - Search radius in km
   * @returns {Promise<Array>} Array of eligible donors
   */
  async findEligibleDonors(bloodRequest, compatibleTypes, radius) {
    try {
      const maxDistance = radius * 1000; // Convert km to meters
      const now = new Date();
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Build query for eligible donors
      const query = {
        role: 'donor',
        status: 'active',
        bloodType: { $in: compatibleTypes },
        'verification.medicallyCleared': true,
        'availability.isAvailable': true,
        
        // Location-based filtering
        'location.coordinates': {
          $near: {
            $geometry: bloodRequest.location.hospital.coordinates,
            $maxDistance: maxDistance
          }
        },

        // Exclude donors who already responded to this request
        _id: {
          $nin: bloodRequest.matching.matchedDonors.map(d => d.donorId)
        },

        // Check last donation date (3 months minimum gap)
        $or: [
          { 'donationHistory.lastDonationDate': { $exists: false } },
          { 'donationHistory.lastDonationDate': null },
          { 'donationHistory.lastDonationDate': { $lt: threeMonthsAgo } }
        ]
      };

      // Add time-based availability filtering
      const currentHour = now.getHours();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Check if current time is within donor's preferred notification hours
      query.$or = [
        { 'preferences.notificationHours': { $exists: false } },
        {
          $and: [
            { 'preferences.notificationHours.start': { $lte: currentHour } },
            { 'preferences.notificationHours.end': { $gte: currentHour } }
          ]
        }
      ];

      const eligibleDonors = await User.find(query)
        .select('name phoneNumber email bloodType location donationHistory preferences')
        .limit(100) // Limit to prevent overwhelming the system
        .lean();

      logger.debug(`Found ${eligibleDonors.length} eligible donors within ${radius}km`, 'DONOR_MATCHING_SERVICE');

      return eligibleDonors;

    } catch (error) {
      logger.error('Error finding eligible donors', 'DONOR_MATCHING_SERVICE', error);
      return [];
    }
  }

  /**
   * Score donors based on various criteria
   * @param {Array} donors - Array of donor objects
   * @param {Object} bloodRequest - Blood request object
   * @returns {Promise<Array>} Array of scored donors
   */
  async scoreDonors(donors, bloodRequest) {
    try {
      const hospitalCoords = bloodRequest.location.hospital.coordinates.coordinates;

      const scoredDonors = donors.map(donor => {
        let score = 0;

        // Distance score (closer is better)
        const distance = this.calculateDistance(
          hospitalCoords,
          donor.location.coordinates.coordinates
        );
        const distanceScore = Math.max(0, 100 - (distance * 2)); // Max 100 points, -2 per km
        score += distanceScore;

        // Blood type compatibility score
        const compatibilityScore = this.getBloodTypeCompatibilityScore(
          donor.bloodType,
          bloodRequest.patient.bloodType
        );
        score += compatibilityScore;

        // Donation history score (more donations = higher score)
        const donationCount = donor.donationHistory?.totalDonations || 0;
        const historyScore = Math.min(donationCount * 5, 50); // Max 50 points
        score += historyScore;

        // Availability score
        const availabilityScore = donor.availability?.isAvailable ? 20 : 0;
        score += availabilityScore;

        // Response history score (good responders get priority)
        const responseRate = donor.donationHistory?.responseRate || 0;
        const responseScore = responseRate * 30; // Max 30 points
        score += responseScore;

        // Urgency bonus for critical requests
        if (bloodRequest.request.urgency === 'critical') {
          score += 25;
        } else if (bloodRequest.request.urgency === 'urgent') {
          score += 15;
        }

        return {
          ...donor,
          distance,
          score: Math.round(score)
        };
      });

      // Sort by score (highest first)
      scoredDonors.sort((a, b) => b.score - a.score);

      logger.debug(`Scored ${scoredDonors.length} donors, top score: ${scoredDonors[0]?.score}`, 'DONOR_MATCHING_SERVICE');

      return scoredDonors;

    } catch (error) {
      logger.error('Error scoring donors', 'DONOR_MATCHING_SERVICE', error);
      return donors.map(donor => ({ ...donor, score: 0, distance: 0 }));
    }
  }

  /**
   * Send notifications to selected donors
   * @param {Array} donors - Array of donor objects
   * @param {Object} bloodRequest - Blood request object
   * @returns {Promise<Object>} Notification result
   */
  async sendDonorNotifications(donors, bloodRequest) {
    try {
      const notifications = donors.map(donor => ({
        phoneNumber: donor.phoneNumber,
        email: donor.email,
        message: this.formatBloodRequestMessage(bloodRequest, donor),
        type: 'blood_request',
        priority: bloodRequest.request.urgency,
        channels: ['push', 'whatsapp', 'sms'],
        templateName: `blood_request_${bloodRequest.request.urgency}`,
        templateParams: [
          bloodRequest.patient.bloodType,
          bloodRequest.patient.name || 'Patient',
          bloodRequest.location.hospital.name,
          `${bloodRequest.location.hospital.address.city}, ${bloodRequest.location.hospital.address.state}`,
          bloodRequest.location.hospital.contactNumber,
          `${donor.distance.toFixed(1)}km away`
        ],
        userPreferences: {
          preferredChannel: donor.preferences?.notificationChannel || 'whatsapp'
        },
        metadata: {
          requestId: bloodRequest.requestId,
          donorId: donor._id,
          distance: donor.distance,
          score: donor.score
        },
        userId: donor._id
      }));

      const result = await notificationService.sendBulkNotifications(notifications, {
        batchSize: 5, // Send in smaller batches to avoid overwhelming services
        delayBetweenBatches: 2000 // 2 second delay between batches
      });

      logger.success(`Sent notifications to ${result.successful}/${donors.length} donors`, 'DONOR_MATCHING_SERVICE');

      return result;

    } catch (error) {
      logger.error('Error sending donor notifications', 'DONOR_MATCHING_SERVICE', error);
      return { successful: 0, failed: donors.length, results: [] };
    }
  }

  /**
   * Get batch size based on urgency and round
   * @param {string} urgency - Request urgency
   * @param {number} round - Notification round
   * @returns {number} Batch size
   */
  getBatchSize(urgency, round) {
    const baseSizes = {
      critical: 30,
      urgent: 20,
      scheduled: 10
    };

    const baseSize = baseSizes[urgency] || 15;
    
    // Increase batch size with each round
    return Math.min(baseSize + (round - 1) * 10, 50);
  }

  /**
   * Calculate distance between two coordinates
   * @param {Array} coord1 - [longitude, latitude]
   * @param {Array} coord2 - [longitude, latitude]
   * @returns {number} Distance in kilometers
   */
  calculateDistance(coord1, coord2) {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;

    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Degrees
   * @returns {number} Radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get blood type compatibility score
   * @param {string} donorType - Donor blood type
   * @param {string} patientType - Patient blood type
   * @returns {number} Compatibility score
   */
  getBloodTypeCompatibilityScore(donorType, patientType) {
    // Perfect match gets highest score
    if (donorType === patientType) {
      return 50;
    }

    // Universal donors get high score
    if (donorType === 'O-') {
      return 45;
    }

    // Other compatible types get moderate score
    const compatibility = {
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      'AB-': ['A-', 'B-', 'AB-', 'O-'],
      'O+': ['O+', 'O-'],
      'O-': ['O-']
    };

    const compatibleTypes = compatibility[patientType] || [];
    return compatibleTypes.includes(donorType) ? 30 : 0;
  }

  /**
   * Format blood request message for donor
   * @param {Object} bloodRequest - Blood request object
   * @param {Object} donor - Donor object
   * @returns {string} Formatted message
   */
  formatBloodRequestMessage(bloodRequest, donor) {
    const urgencyEmoji = {
      'critical': '🚨',
      'urgent': '⚡',
      'scheduled': '📅'
    };

    const emoji = urgencyEmoji[bloodRequest.request.urgency] || '🩸';

    return `${emoji} BLOOD DONATION REQUEST

Dear ${donor.name},

Blood Type Needed: ${bloodRequest.patient.bloodType}
Patient: ${bloodRequest.patient.name} (${bloodRequest.patient.age}y)
Hospital: ${bloodRequest.location.hospital.name}
Distance: ${donor.distance.toFixed(1)}km from you
Contact: ${bloodRequest.location.hospital.contactNumber}

Urgency: ${bloodRequest.request.urgency.toUpperCase()}
Units Needed: ${bloodRequest.request.unitsNeeded}

Can you help save a life?
Reply YES to donate or NO if unavailable.

Your quick response can make the difference!

Call For Blood Foundation`;
  }

  /**
   * Schedule escalation for matching
   * @param {Object} matchingData - Matching data object
   */
  async scheduleEscalation(matchingData) {
    try {
      const newRadius = Math.min(
        matchingData.currentRadius + this.radiusIncrement,
        this.maxRadius
      );

      matchingData.currentRadius = newRadius;
      matchingData.notificationRound += 1;
      matchingData.nextEscalationAt = new Date(Date.now() + this.escalationDelay);

      logger.info(`Scheduled escalation for request: ${matchingData.bloodRequest.requestId} to ${newRadius}km`, 'DONOR_MATCHING_SERVICE');

    } catch (error) {
      logger.error('Error scheduling escalation', 'DONOR_MATCHING_SERVICE', error);
    }
  }

  /**
   * Update blood request matching data
   * @param {Object} bloodRequest - Blood request object
   * @param {Object} updates - Updates to apply
   */
  async updateBloodRequestMatching(bloodRequest, updates) {
    try {
      await BloodRequest.findByIdAndUpdate(
        bloodRequest._id,
        {
          $set: {
            'matching.totalNotified': updates.totalNotified,
            'matching.lastNotificationSent': updates.lastNotificationSent,
            'matching.notificationRounds': updates.notificationRounds,
            'matching.currentRadius': updates.currentRadius,
            status: 'active'
          }
        }
      );

    } catch (error) {
      logger.error('Error updating blood request matching data', 'DONOR_MATCHING_SERVICE', error);
    }
  }

  /**
   * Mark matching as complete
   * @param {Object} matchingData - Matching data object
   * @param {string} reason - Completion reason
   */
  async markMatchingComplete(matchingData, reason) {
    try {
      matchingData.status = 'completed';
      matchingData.completedAt = new Date();
      matchingData.completionReason = reason;

      logger.info(`Matching completed for request: ${matchingData.bloodRequest.requestId}, reason: ${reason}`, 'DONOR_MATCHING_SERVICE');

    } catch (error) {
      logger.error('Error marking matching complete', 'DONOR_MATCHING_SERVICE', error);
    }
  }

  /**
   * Start queue processor
   */
  startQueueProcessor() {
    setInterval(() => {
      this.processQueue();
    }, 60000); // Process every minute

    logger.debug('Started donor matching queue processor', 'DONOR_MATCHING_SERVICE');
  }

  /**
   * Process matching queue
   */
  async processQueue() {
    if (this.isProcessing) {
      return;
    }

    try {
      this.isProcessing = true;
      const now = new Date();

      const escalationItems = Array.from(this.matchingQueue.values())
        .filter(item => 
          item.status === 'active' && 
          item.nextEscalationAt <= now
        );

      if (escalationItems.length === 0) {
        return;
      }

      logger.info(`Processing ${escalationItems.length} escalation items`, 'DONOR_MATCHING_SERVICE');

      for (const item of escalationItems) {
        try {
          await this.processMatching(item);
        } catch (error) {
          logger.error(`Error processing escalation for ${item.bloodRequest.requestId}`, 'DONOR_MATCHING_SERVICE', error);
        }
      }

    } catch (error) {
      logger.error('Error processing matching queue', 'DONOR_MATCHING_SERVICE', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Generate matching ID
   * @returns {string} Matching ID
   */
  generateMatchingId() {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Get matching statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const activeMatching = Array.from(this.matchingQueue.values())
      .filter(item => item.status === 'active');

    return {
      totalMatching: this.matchingQueue.size,
      activeMatching: activeMatching.length,
      completedMatching: this.matchingQueue.size - activeMatching.length,
      averageRadius: activeMatching.length > 0 
        ? activeMatching.reduce((sum, item) => sum + item.currentRadius, 0) / activeMatching.length 
        : 0,
      averageNotificationRound: activeMatching.length > 0
        ? activeMatching.reduce((sum, item) => sum + item.notificationRound, 0) / activeMatching.length
        : 0
    };
  }

  /**
   * Stop matching for a request
   * @param {string} requestId - Blood request ID
   * @returns {boolean} Success status
   */
  stopMatching(requestId) {
    try {
      for (const [matchingId, matchingData] of this.matchingQueue.entries()) {
        if (matchingData.bloodRequest.requestId === requestId) {
          this.markMatchingComplete(matchingData, 'manually_stopped');
          this.matchingQueue.delete(matchingId);
          
          logger.info(`Stopped matching for request: ${requestId}`, 'DONOR_MATCHING_SERVICE');
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Error stopping matching', 'DONOR_MATCHING_SERVICE', error);
      return false;
    }
  }
}

// Create singleton instance
const donorMatchingService = new DonorMatchingService();

module.exports = donorMatchingService;