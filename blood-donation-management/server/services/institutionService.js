const Institution = require('../models/Institution');
const BloodInventory = require('../models/BloodInventory');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class InstitutionService {
  constructor() {
    this.bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  }

  async registerInstitution(institutionData, createdBy) {
    try {
      logger.info('Registering new institution', 'INSTITUTION_SERVICE');
      
      // Check if institution already exists
      const existingInstitution = await Institution.findOne({
        $or: [
          { registrationNumber: institutionData.registrationNumber },
          { 'contactInfo.email': institutionData.contactInfo.email }
        ]
      });

      if (existingInstitution) {
        throw new Error('Institution with this registration number or email already exists');
      }

      // Create new institution
      const institution = new Institution({
        ...institutionData,
        createdBy,
        verificationStatus: 'pending',
        partnershipStatus: 'inquiry'
      });

      await institution.save();

      // Initialize inventory if it's a blood bank
      if (institution.type === 'blood_bank' && institution.inventoryEnabled) {
        await this.initializeInventory(institution._id);
      }

      // Send welcome email
      await this.sendWelcomeEmail(institution);

      // Notify admins about new registration
      await this.notifyAdminsNewRegistration(institution);

      logger.success(`Institution registered: ${institution.name}`, 'INSTITUTION_SERVICE');
      
      return institution;
    } catch (error) {
      logger.error('Error registering institution', 'INSTITUTION_SERVICE', error);
      throw error;
    }
  }

  async initializeInventory(institutionId) {
    try {
      const inventoryPromises = this.bloodTypes.map(bloodType => {
        const inventory = new BloodInventory({
          institution: institutionId,
          bloodType,
          totalUnits: 0,
          availableUnits: 0,
          minimumThreshold: 10,
          criticalThreshold: 5
        });
        return inventory.save();
      });

      await Promise.all(inventoryPromises);
      logger.success(`Inventory initialized for institution: ${institutionId}`, 'INSTITUTION_SERVICE');
    } catch (error) {
      logger.error('Error initializing inventory', 'INSTITUTION_SERVICE', error);
      throw error;
    }
  }

  async verifyInstitution(institutionId, verificationData, verifiedBy) {
    try {
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        throw new Error('Institution not found');
      }

      institution.verificationStatus = verificationData.status;
      institution.verificationNotes = verificationData.notes;
      institution.verifiedBy = verifiedBy;
      
      if (verificationData.status === 'verified') {
        institution.verificationDate = new Date();
        institution.partnershipStatus = 'active';
        institution.partnershipDate = new Date();
      }

      await institution.save();

      // Send verification email
      await this.sendVerificationEmail(institution, verificationData.status);

      logger.success(`Institution verification updated: ${institution.name} - ${verificationData.status}`, 'INSTITUTION_SERVICE');
      
      return institution;
    } catch (error) {
      logger.error('Error verifying institution', 'INSTITUTION_SERVICE', error);
      throw error;
    }
  }

  async findNearbyInstitutions(coordinates, maxDistance = 50000, filters = {}) {
    try {
      const query = {
        'address.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [coordinates.longitude, coordinates.latitude]
            },
            $maxDistance: maxDistance
          }
        },
        status: 'active',
        verificationStatus: 'verified',
        ...filters
      };

      const institutions = await Institution.find(query)
        .select('name type address contactInfo services rating operatingHours')
        .limit(50);

      return institutions;
    } catch (error) {
      logger.error('Error finding nearby institutions', 'INSTITUTION_SERVICE', error);
      throw error;
    }
  }

  async searchInstitutions(searchParams) {
    try {
      const {
        query,
        type,
        city,
        state,
        services,
        verificationStatus = 'verified',
        page = 1,
        limit = 20
      } = searchParams;

      const searchQuery = {
        status: 'active',
        verificationStatus
      };

      // Text search
      if (query) {
        searchQuery.$or = [
          { name: { $regex: query, $options: 'i' } },
          { 'address.city': { $regex: query, $options: 'i' } },
          { 'address.state': { $regex: query, $options: 'i' } }
        ];
      }

      // Filter by type
      if (type) {
        searchQuery.type = type;
      }

      // Filter by location
      if (city) {
        searchQuery['address.city'] = { $regex: city, $options: 'i' };
      }
      if (state) {
        searchQuery['address.state'] = { $regex: state, $options: 'i' };
      }

      // Filter by services
      if (services && services.length > 0) {
        searchQuery.services = { $in: services };
      }

      const skip = (page - 1) * limit;
      
      const [institutions, total] = await Promise.all([
        Institution.find(searchQuery)
          .select('name type address contactInfo services rating operatingHours capacity')
          .sort({ 'rating.average': -1, name: 1 })
          .skip(skip)
          .limit(limit),
        Institution.countDocuments(searchQuery)
      ]);

      return {
        institutions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error searching institutions', 'INSTITUTION_SERVICE', error);
      throw error;
    }
  }

  async getInstitutionProfile(institutionId, includeInventory = false) {
    try {
      const institution = await Institution.findById(institutionId)
        .populate('createdBy', 'name email')
        .populate('verifiedBy', 'name email');

      if (!institution) {
        throw new Error('Institution not found');
      }

      const profile = institution.toObject();

      if (includeInventory && institution.inventoryEnabled) {
        const inventory = await BloodInventory.find({ institution: institutionId })
          .select('bloodType totalUnits availableUnits status');
        profile.inventory = inventory;
      }

      return profile;
    } catch (error) {
      logger.error('Error getting institution profile', 'INSTITUTION_SERVICE', error);
      throw error;
    }
  }

  async updateInstitutionProfile(institutionId, updateData, updatedBy) {
    try {
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        throw new Error('Institution not found');
      }

      // Update fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          institution[key] = updateData[key];
        }
      });

      institution.lastUpdatedBy = updatedBy;
      await institution.save();

      logger.success(`Institution profile updated: ${institution.name}`, 'INSTITUTION_SERVICE');
      
      return institution;
    } catch (error) {
      logger.error('Error updating institution profile', 'INSTITUTION_SERVICE', error);
      throw error;
    }
  }

  async getInstitutionStats(institutionId, timeRange = '30d') {
    try {
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        throw new Error('Institution not found');
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
      }

      // Mock statistics - in real implementation, this would query actual data
      const stats = {
        overview: {
          totalDonationsReceived: institution.stats.totalDonationsReceived,
          totalRequestsFulfilled: institution.stats.totalRequestsFulfilled,
          averageResponseTime: institution.stats.averageResponseTime,
          rating: institution.rating.average,
          ratingCount: institution.rating.count
        },
        trends: {
          donations: this.generateMockTrendData(timeRange, 'donations'),
          requests: this.generateMockTrendData(timeRange, 'requests'),
          responseTime: this.generateMockTrendData(timeRange, 'responseTime')
        },
        inventory: null
      };

      // Add inventory stats if enabled
      if (institution.inventoryEnabled) {
        const inventory = await BloodInventory.find({ institution: institutionId });
        stats.inventory = {
          totalUnits: inventory.reduce((sum, inv) => sum + inv.totalUnits, 0),
          availableUnits: inventory.reduce((sum, inv) => sum + inv.availableUnits, 0),
          lowStockItems: inventory.filter(inv => inv.status === 'low' || inv.status === 'critical').length,
          bloodTypeDistribution: inventory.map(inv => ({
            bloodType: inv.bloodType,
            available: inv.availableUnits,
            status: inv.status
          }))
        };
      }

      return stats;
    } catch (error) {
      logger.error('Error getting institution stats', 'INSTITUTION_SERVICE', error);
      throw error;
    }
  }

  generateMockTrendData(timeRange, type) {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      let value;
      switch (type) {
        case 'donations':
          value = Math.floor(Math.random() * 20) + 5;
          break;
        case 'requests':
          value = Math.floor(Math.random() * 15) + 3;
          break;
        case 'responseTime':
          value = Math.floor(Math.random() * 30) + 10;
          break;
        default:
          value = Math.floor(Math.random() * 10);
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        value
      });
    }

    return data;
  }

  async sendWelcomeEmail(institution) {
    try {
      await emailService.sendEmail({
        to: institution.contactInfo.email,
        subject: 'Welcome to Blood Donation Management System',
        html: `
          <h2>Welcome to BDMS Partnership Program</h2>
          <p>Dear ${institution.adminContact.name},</p>
          <p>Thank you for registering <strong>${institution.name}</strong> with our Blood Donation Management System.</p>
          <p>Your registration details:</p>
          <ul>
            <li>Institution Type: ${institution.type.replace('_', ' ').toUpperCase()}</li>
            <li>Registration Number: ${institution.registrationNumber}</li>
            <li>Status: Pending Verification</li>
          </ul>
          <p>Our team will review your application and contact you within 2-3 business days.</p>
          <p>Best regards,<br>BDMS Partnership Team</p>
        `
      });
    } catch (error) {
      logger.error('Error sending welcome email', 'INSTITUTION_SERVICE', error);
    }
  }

  async sendVerificationEmail(institution, status) {
    try {
      const subject = status === 'verified' 
        ? 'Institution Verification Approved' 
        : 'Institution Verification Update';
        
      const message = status === 'verified'
        ? 'Congratulations! Your institution has been verified and approved for partnership.'
        : `Your institution verification status has been updated to: ${status}`;

      await emailService.sendEmail({
        to: institution.contactInfo.email,
        subject,
        html: `
          <h2>Institution Verification Update</h2>
          <p>Dear ${institution.adminContact.name},</p>
          <p>${message}</p>
          <p>Institution: <strong>${institution.name}</strong></p>
          <p>Status: <strong>${status.toUpperCase()}</strong></p>
          ${institution.verificationNotes ? `<p>Notes: ${institution.verificationNotes}</p>` : ''}
          <p>Best regards,<br>BDMS Verification Team</p>
        `
      });
    } catch (error) {
      logger.error('Error sending verification email', 'INSTITUTION_SERVICE', error);
    }
  }

  async notifyAdminsNewRegistration(institution) {
    try {
      // This would typically fetch admin emails from database
      const adminEmails = ['info@callforbloodfoundation.com'];
      
      for (const email of adminEmails) {
        await emailService.sendEmail({
          to: email,
          subject: 'New Institution Registration',
          html: `
            <h2>New Institution Registration</h2>
            <p>A new institution has registered for partnership:</p>
            <ul>
              <li>Name: ${institution.name}</li>
              <li>Type: ${institution.type.replace('_', ' ').toUpperCase()}</li>
              <li>Location: ${institution.address.city}, ${institution.address.state}</li>
              <li>Contact: ${institution.contactInfo.email}</li>
            </ul>
            <p>Please review and verify the institution in the admin panel.</p>
          `
        });
      }
    } catch (error) {
      logger.error('Error notifying admins', 'INSTITUTION_SERVICE', error);
    }
  }

  async getInstitutionDirectory(filters = {}) {
    try {
      const {
        type,
        city,
        state,
        services,
        page = 1,
        limit = 20
      } = filters;

      const query = {
        status: 'active',
        verificationStatus: 'verified'
      };

      if (type) query.type = type;
      if (city) query['address.city'] = { $regex: city, $options: 'i' };
      if (state) query['address.state'] = { $regex: state, $options: 'i' };
      if (services && services.length > 0) query.services = { $in: services };

      const skip = (page - 1) * limit;

      const [institutions, total] = await Promise.all([
        Institution.find(query)
          .select('name type address contactInfo services rating operatingHours')
          .sort({ 'rating.average': -1, name: 1 })
          .skip(skip)
          .limit(limit),
        Institution.countDocuments(query)
      ]);

      return {
        institutions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting institution directory', 'INSTITUTION_SERVICE', error);
      throw error;
    }
  }

  async updateInstitutionRating(institutionId, rating, reviewData) {
    try {
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        throw new Error('Institution not found');
      }

      await institution.updateRating(rating);
      
      // Here you would typically save the review data to a separate reviews collection
      logger.success(`Rating updated for institution: ${institution.name}`, 'INSTITUTION_SERVICE');
      
      return institution;
    } catch (error) {
      logger.error('Error updating institution rating', 'INSTITUTION_SERVICE', error);
      throw error;
    }
  }
}

module.exports = new InstitutionService();