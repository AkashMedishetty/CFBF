const Hospital = require('../models/Hospital');
const User = require('../models/User');
const logger = require('../utils/logger');
const { sendEmail } = require('./emailService');
const { sendWhatsAppMessage } = require('./whatsappService');

class HospitalService {
  /**
   * Register a new hospital/blood bank
   */
  async registerHospital(hospitalData, adminUserData) {
    try {
      // Create admin user first
      const adminUser = new User({
        ...adminUserData,
        role: 'hospital',
        isVerified: false
      });
      await adminUser.save();

      // Create hospital with admin user reference
      const hospital = new Hospital({
        ...hospitalData,
        adminUser: adminUser._id,
        verificationStatus: 'pending'
      });

      await hospital.save();

      // Send verification email to admin
      await this.sendVerificationEmail(hospital, adminUser);

      logger.info(`Hospital registered: ${hospital.name}`, {
        hospitalId: hospital._id,
        adminUserId: adminUser._id
      });

      return {
        hospital: hospital.toObject(),
        adminUser: {
          id: adminUser._id,
          email: adminUser.email,
          phone: adminUser.phone
        }
      };
    } catch (error) {
      logger.error('Error registering hospital:', error);
      throw error;
    }
  }

  /**
   * Get hospital by ID with populated data
   */
  async getHospitalById(hospitalId, includeInventory = true) {
    try {
      let query = Hospital.findById(hospitalId).populate('adminUser', 'name email phone');
      
      if (!includeInventory) {
        query = query.select('-inventory');
      }

      const hospital = await query.exec();
      
      if (!hospital) {
        throw new Error('Hospital not found');
      }

      return hospital;
    } catch (error) {
      logger.error('Error fetching hospital:', error);
      throw error;
    }
  }

  /**
   * Update hospital profile
   */
  async updateHospitalProfile(hospitalId, updateData, adminUserId) {
    try {
      const hospital = await Hospital.findById(hospitalId);
      
      if (!hospital) {
        throw new Error('Hospital not found');
      }

      // Verify admin user has permission
      if (hospital.adminUser.toString() !== adminUserId.toString()) {
        throw new Error('Unauthorized to update this hospital');
      }

      // Update hospital data
      Object.assign(hospital, updateData);
      await hospital.save();

      logger.info(`Hospital profile updated: ${hospital.name}`, {
        hospitalId: hospital._id,
        updatedBy: adminUserId
      });

      return hospital;
    } catch (error) {
      logger.error('Error updating hospital profile:', error);
      throw error;
    }
  }

  /**
   * Find nearby hospitals
   */
  async findNearbyHospitals(longitude, latitude, maxDistance = 10000, filters = {}) {
    try {
      const hospitals = await Hospital.findNearby(longitude, latitude, maxDistance, filters.type);
      
      // Apply additional filters
      let filteredHospitals = hospitals;
      
      if (filters.services && filters.services.length > 0) {
        filteredHospitals = hospitals.filter(hospital => 
          filters.services.some(service => hospital.services.includes(service))
        );
      }

      if (filters.minRating) {
        filteredHospitals = filteredHospitals.filter(hospital => 
          hospital.averageRating >= filters.minRating
        );
      }

      if (filters.hasInventory) {
        filteredHospitals = filteredHospitals.filter(hospital => 
          hospital.inventory.some(item => item.unitsAvailable > 0)
        );
      }

      return filteredHospitals;
    } catch (error) {
      logger.error('Error finding nearby hospitals:', error);
      throw error;
    }
  }

  /**
   * Search hospitals by text
   */
  async searchHospitals(searchTerm, filters = {}, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      let hospitals;
      if (searchTerm) {
        hospitals = await Hospital.searchHospitals(searchTerm, filters)
                                  .skip(skip)
                                  .limit(limit)
                                  .populate('adminUser', 'name email phone');
      } else {
        hospitals = await Hospital.find({ isActive: true, verificationStatus: 'verified', ...filters })
                                  .skip(skip)
                                  .limit(limit)
                                  .populate('adminUser', 'name email phone')
                                  .sort({ averageRating: -1, totalRatings: -1 });
      }

      const total = await Hospital.countDocuments({ isActive: true, verificationStatus: 'verified', ...filters });

      return {
        hospitals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error searching hospitals:', error);
      throw error;
    }
  }

  /**
   * Update blood inventory
   */
  async updateInventory(hospitalId, bloodType, unitsToAdd, expirationDate, adminUserId) {
    try {
      const hospital = await Hospital.findById(hospitalId);
      
      if (!hospital) {
        throw new Error('Hospital not found');
      }

      // Verify admin user has permission
      if (hospital.adminUser.toString() !== adminUserId.toString()) {
        throw new Error('Unauthorized to update inventory');
      }

      await hospital.updateInventory(bloodType, unitsToAdd, expirationDate);

      // Check for low inventory alerts
      const lowInventoryItems = hospital.lowInventoryAlerts;
      if (lowInventoryItems.length > 0) {
        await this.sendLowInventoryAlert(hospital, lowInventoryItems);
      }

      logger.info(`Inventory updated for ${hospital.name}`, {
        hospitalId: hospital._id,
        bloodType,
        unitsAdded: unitsToAdd
      });

      return hospital;
    } catch (error) {
      logger.error('Error updating inventory:', error);
      throw error;
    }
  }

  /**
   * Consume blood inventory
   */
  async consumeInventory(hospitalId, bloodType, unitsToConsume, adminUserId) {
    try {
      const hospital = await Hospital.findById(hospitalId);
      
      if (!hospital) {
        throw new Error('Hospital not found');
      }

      // Verify admin user has permission
      if (hospital.adminUser.toString() !== adminUserId.toString()) {
        throw new Error('Unauthorized to update inventory');
      }

      await hospital.consumeInventory(bloodType, unitsToConsume);

      logger.info(`Inventory consumed for ${hospital.name}`, {
        hospitalId: hospital._id,
        bloodType,
        unitsConsumed: unitsToConsume
      });

      return hospital;
    } catch (error) {
      logger.error('Error consuming inventory:', error);
      throw error;
    }
  }

  /**
   * Add rating and review
   */
  async addRating(hospitalId, userId, rating, review, category = 'overall') {
    try {
      const hospital = await Hospital.findById(hospitalId);
      
      if (!hospital) {
        throw new Error('Hospital not found');
      }

      await hospital.addRating(userId, rating, review, category);

      logger.info(`Rating added for ${hospital.name}`, {
        hospitalId: hospital._id,
        userId,
        rating,
        category
      });

      return hospital;
    } catch (error) {
      logger.error('Error adding rating:', error);
      throw error;
    }
  }

  /**
   * Verify hospital (admin function)
   */
  async verifyHospital(hospitalId, verificationStatus, adminNotes = '') {
    try {
      const hospital = await Hospital.findById(hospitalId).populate('adminUser');
      
      if (!hospital) {
        throw new Error('Hospital not found');
      }

      hospital.verificationStatus = verificationStatus;
      await hospital.save();

      // Update admin user verification status
      if (verificationStatus === 'verified') {
        hospital.adminUser.isVerified = true;
        await hospital.adminUser.save();
      }

      // Send notification to hospital admin
      await this.sendVerificationStatusUpdate(hospital, verificationStatus, adminNotes);

      logger.info(`Hospital verification status updated: ${hospital.name}`, {
        hospitalId: hospital._id,
        status: verificationStatus
      });

      return hospital;
    } catch (error) {
      logger.error('Error verifying hospital:', error);
      throw error;
    }
  }

  /**
   * Get hospitals pending verification
   */
  async getPendingVerifications(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const hospitals = await Hospital.find({ verificationStatus: 'pending' })
                                     .populate('adminUser', 'name email phone')
                                     .skip(skip)
                                     .limit(limit)
                                     .sort({ createdAt: -1 });

      const total = await Hospital.countDocuments({ verificationStatus: 'pending' });

      return {
        hospitals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching pending verifications:', error);
      throw error;
    }
  }

  /**
   * Get hospital analytics
   */
  async getHospitalAnalytics(hospitalId, timeRange = '30d') {
    try {
      const hospital = await Hospital.findById(hospitalId);
      
      if (!hospital) {
        throw new Error('Hospital not found');
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get analytics data (this would typically involve aggregating from other collections)
      const analytics = {
        overview: {
          totalInventory: hospital.inventory.reduce((sum, item) => sum + item.unitsAvailable, 0),
          lowInventoryItems: hospital.lowInventoryAlerts.length,
          averageRating: hospital.averageRating,
          totalRatings: hospital.totalRatings,
          totalDonationsReceived: hospital.totalDonationsReceived,
          totalRequestsFulfilled: hospital.totalRequestsFulfilled
        },
        inventory: hospital.inventory.map(item => ({
          bloodType: item.bloodType,
          unitsAvailable: item.unitsAvailable,
          minimumThreshold: item.minimumThreshold,
          isLow: item.unitsAvailable <= item.minimumThreshold,
          lastUpdated: item.lastUpdated
        })),
        recentRatings: hospital.ratings
                              .sort((a, b) => b.createdAt - a.createdAt)
                              .slice(0, 10)
      };

      return analytics;
    } catch (error) {
      logger.error('Error fetching hospital analytics:', error);
      throw error;
    }
  }

  /**
   * Send verification email to hospital admin
   */
  async sendVerificationEmail(hospital, adminUser) {
    try {
      const emailData = {
        to: adminUser.email,
        subject: 'Hospital Registration - Verification Required',
        template: 'hospital-verification',
        data: {
          hospitalName: hospital.name,
          adminName: adminUser.name,
          registrationNumber: hospital.registrationNumber,
          verificationLink: `${process.env.CLIENT_URL}/hospital/verify/${hospital._id}`
        }
      };

      await sendEmail(emailData);
    } catch (error) {
      logger.error('Error sending verification email:', error);
    }
  }

  /**
   * Send verification status update
   */
  async sendVerificationStatusUpdate(hospital, status, notes) {
    try {
      const emailData = {
        to: hospital.adminUser.email,
        subject: `Hospital Verification ${status === 'verified' ? 'Approved' : 'Update'}`,
        template: 'hospital-verification-status',
        data: {
          hospitalName: hospital.name,
          adminName: hospital.adminUser.name,
          status,
          notes,
          dashboardLink: `${process.env.CLIENT_URL}/hospital/dashboard`
        }
      };

      await sendEmail(emailData);

      // Also send WhatsApp notification if phone is available
      if (hospital.adminUser.phone) {
        const message = `Hospital ${hospital.name} verification status: ${status}. ${notes ? 'Notes: ' + notes : ''}`;
        await sendWhatsAppMessage(hospital.adminUser.phone, 'verification_status', { message });
      }
    } catch (error) {
      logger.error('Error sending verification status update:', error);
    }
  }

  /**
   * Send low inventory alert
   */
  async sendLowInventoryAlert(hospital, lowInventoryItems) {
    try {
      const emailData = {
        to: hospital.adminUser.email,
        subject: 'Low Blood Inventory Alert',
        template: 'low-inventory-alert',
        data: {
          hospitalName: hospital.name,
          lowInventoryItems: lowInventoryItems.map(item => ({
            bloodType: item.bloodType,
            currentUnits: item.unitsAvailable,
            minimumThreshold: item.minimumThreshold
          })),
          dashboardLink: `${process.env.CLIENT_URL}/hospital/dashboard`
        }
      };

      await sendEmail(emailData);
    } catch (error) {
      logger.error('Error sending low inventory alert:', error);
    }
  }
}

module.exports = new HospitalService();