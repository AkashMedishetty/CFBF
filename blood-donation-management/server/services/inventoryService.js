const Hospital = require('../models/Hospital');
const logger = require('../utils/logger');
const { sendEmail } = require('./emailService');
const { sendWhatsAppMessage } = require('./whatsappService');

class InventoryService {
  /**
   * Get inventory for a hospital
   */
  async getHospitalInventory(hospitalId) {
    try {
      const hospital = await Hospital.findById(hospitalId).select('inventory lastInventoryUpdate');
      
      if (!hospital) {
        throw new Error('Hospital not found');
      }

      // Calculate inventory statistics
      const totalUnits = hospital.inventory.reduce((sum, item) => sum + item.unitsAvailable, 0);
      const lowStockItems = hospital.inventory.filter(item => item.unitsAvailable <= item.minimumThreshold);
      const expiringSoon = this.getExpiringSoonItems(hospital.inventory);

      return {
        inventory: hospital.inventory,
        statistics: {
          totalUnits,
          totalBloodTypes: hospital.inventory.length,
          lowStockCount: lowStockItems.length,
          expiringSoonCount: expiringSoon.length
        },
        alerts: {
          lowStock: lowStockItems,
          expiringSoon
        },
        lastUpdated: hospital.lastInventoryUpdate
      };
    } catch (error) {
      logger.error('Error fetching hospital inventory:', error);
      throw error;
    }
  }

  /**
   * Update inventory for a specific blood type
   */
  async updateInventory(hospitalId, bloodType, unitsToAdd, expirationDate, adminUserId) {
    try {
      const hospital = await Hospital.findById(hospitalId).populate('adminUser');
      
      if (!hospital) {
        throw new Error('Hospital not found');
      }

      // Verify admin user has permission
      if (hospital.adminUser._id.toString() !== adminUserId.toString()) {
        throw new Error('Unauthorized to update inventory');
      }

      await hospital.updateInventory(bloodType, unitsToAdd, new Date(expirationDate));

      // Check for alerts after update
      await this.checkAndSendAlerts(hospital);

      logger.info(`Inventory updated for ${hospital.name}`, {
        hospitalId: hospital._id,
        bloodType,
        unitsAdded: unitsToAdd,
        updatedBy: adminUserId
      });

      return await this.getHospitalInventory(hospitalId);
    } catch (error) {
      logger.error('Error updating inventory:', error);
      throw error;
    }
  }

  /**
   * Consume inventory (when blood is used)
   */
  async consumeInventory(hospitalId, bloodType, unitsToConsume, reason, adminUserId) {
    try {
      const hospital = await Hospital.findById(hospitalId).populate('adminUser');
      
      if (!hospital) {
        throw new Error('Hospital not found');
      }

      // Verify admin user has permission
      if (hospital.adminUser._id.toString() !== adminUserId.toString()) {
        throw new Error('Unauthorized to update inventory');
      }

      await hospital.consumeInventory(bloodType, unitsToConsume);

      // Log the consumption
      await this.logInventoryTransaction(hospitalId, {
        type: 'consumption',
        bloodType,
        units: unitsToConsume,
        reason,
        performedBy: adminUserId,
        timestamp: new Date()
      });

      // Check for low stock alerts
      await this.checkAndSendAlerts(hospital);

      logger.info(`Inventory consumed for ${hospital.name}`, {
        hospitalId: hospital._id,
        bloodType,
        unitsConsumed: unitsToConsume,
        reason,
        updatedBy: adminUserId
      });

      return await this.getHospitalInventory(hospitalId);
    } catch (error) {
      logger.error('Error consuming inventory:', error);
      throw error;
    }
  }

  /**
   * Set minimum threshold for blood type
   */
  async setMinimumThreshold(hospitalId, bloodType, threshold, adminUserId) {
    try {
      const hospital = await Hospital.findById(hospitalId);
      
      if (!hospital) {
        throw new Error('Hospital not found');
      }

      // Verify admin user has permission
      if (hospital.adminUser.toString() !== adminUserId.toString()) {
        throw new Error('Unauthorized to update inventory settings');
      }

      const inventoryItem = hospital.inventory.find(item => item.bloodType === bloodType);
      
      if (inventoryItem) {
        inventoryItem.minimumThreshold = threshold;
        inventoryItem.lastUpdated = new Date();
      } else {
        // Create new inventory item if it doesn't exist
        hospital.inventory.push({
          bloodType,
          unitsAvailable: 0,
          expirationDates: [],
          minimumThreshold: threshold,
          lastUpdated: new Date()
        });
      }

      await hospital.save();

      logger.info(`Minimum threshold updated for ${hospital.name}`, {
        hospitalId: hospital._id,
        bloodType,
        threshold,
        updatedBy: adminUserId
      });

      return await this.getHospitalInventory(hospitalId);
    } catch (error) {
      logger.error('Error setting minimum threshold:', error);
      throw error;
    }
  }

  /**
   * Get inventory analytics
   */
  async getInventoryAnalytics(hospitalId, timeRange = '30d') {
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

      // Get inventory transactions (this would typically be from a separate collection)
      const transactions = await this.getInventoryTransactions(hospitalId, startDate, endDate);

      // Calculate analytics
      const analytics = {
        overview: {
          totalUnits: hospital.inventory.reduce((sum, item) => sum + item.unitsAvailable, 0),
          totalBloodTypes: hospital.inventory.length,
          lowStockItems: hospital.inventory.filter(item => item.unitsAvailable <= item.minimumThreshold).length,
          expiringSoon: this.getExpiringSoonItems(hospital.inventory).length
        },
        bloodTypeBreakdown: hospital.inventory.map(item => ({
          bloodType: item.bloodType,
          unitsAvailable: item.unitsAvailable,
          minimumThreshold: item.minimumThreshold,
          isLowStock: item.unitsAvailable <= item.minimumThreshold,
          daysUntilExpiry: this.getDaysUntilExpiry(item.expirationDates),
          lastUpdated: item.lastUpdated
        })),
        trends: this.calculateInventoryTrends(transactions, timeRange),
        alerts: {
          lowStock: hospital.inventory.filter(item => item.unitsAvailable <= item.minimumThreshold),
          expiringSoon: this.getExpiringSoonItems(hospital.inventory),
          zeroStock: hospital.inventory.filter(item => item.unitsAvailable === 0)
        }
      };

      return analytics;
    } catch (error) {
      logger.error('Error fetching inventory analytics:', error);
      throw error;
    }
  }

  /**
   * Get hospitals with low inventory for specific blood type
   */
  async getHospitalsWithLowInventory(bloodType, location = null, radius = 50000) {
    try {
      let query = {
        'inventory.bloodType': bloodType,
        'inventory.unitsAvailable': { $lte: 5 }, // Low stock threshold
        isActive: true,
        verificationStatus: 'verified'
      };

      let hospitals;
      
      if (location && location.coordinates) {
        hospitals = await Hospital.find({
          ...query,
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: location.coordinates
              },
              $maxDistance: radius
            }
          }
        }).populate('adminUser', 'name email phone');
      } else {
        hospitals = await Hospital.find(query).populate('adminUser', 'name email phone');
      }

      return hospitals.map(hospital => {
        const inventoryItem = hospital.inventory.find(item => item.bloodType === bloodType);
        return {
          hospital: {
            id: hospital._id,
            name: hospital.name,
            address: hospital.address,
            contactInfo: hospital.contactInfo,
            adminUser: hospital.adminUser
          },
          inventory: {
            bloodType,
            unitsAvailable: inventoryItem.unitsAvailable,
            minimumThreshold: inventoryItem.minimumThreshold,
            lastUpdated: inventoryItem.lastUpdated
          }
        };
      });
    } catch (error) {
      logger.error('Error fetching hospitals with low inventory:', error);
      throw error;
    }
  }

  /**
   * Redistribute blood between hospitals
   */
  async redistributeBlood(fromHospitalId, toHospitalId, bloodType, units, adminUserId) {
    try {
      const fromHospital = await Hospital.findById(fromHospitalId);
      const toHospital = await Hospital.findById(toHospitalId);

      if (!fromHospital || !toHospital) {
        throw new Error('One or both hospitals not found');
      }

      // Check if source hospital has enough inventory
      const sourceInventory = fromHospital.inventory.find(item => item.bloodType === bloodType);
      if (!sourceInventory || sourceInventory.unitsAvailable < units) {
        throw new Error('Insufficient inventory at source hospital');
      }

      // Consume from source hospital
      await fromHospital.consumeInventory(bloodType, units);

      // Add to destination hospital (use earliest expiration date from source)
      const earliestExpiryDate = sourceInventory.expirationDates.sort((a, b) => a - b)[0];
      await toHospital.updateInventory(bloodType, units, earliestExpiryDate);

      // Log the redistribution
      await this.logInventoryTransaction(fromHospitalId, {
        type: 'redistribution_out',
        bloodType,
        units,
        relatedHospital: toHospitalId,
        performedBy: adminUserId,
        timestamp: new Date()
      });

      await this.logInventoryTransaction(toHospitalId, {
        type: 'redistribution_in',
        bloodType,
        units,
        relatedHospital: fromHospitalId,
        performedBy: adminUserId,
        timestamp: new Date()
      });

      logger.info(`Blood redistributed between hospitals`, {
        fromHospital: fromHospitalId,
        toHospital: toHospitalId,
        bloodType,
        units,
        performedBy: adminUserId
      });

      return {
        success: true,
        message: 'Blood redistributed successfully'
      };
    } catch (error) {
      logger.error('Error redistributing blood:', error);
      throw error;
    }
  }

  /**
   * Get items expiring soon (within 7 days)
   */
  getExpiringSoonItems(inventory) {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return inventory.filter(item => {
      return item.expirationDates.some(date => date <= sevenDaysFromNow);
    }).map(item => ({
      ...item.toObject(),
      expiringSoonCount: item.expirationDates.filter(date => date <= sevenDaysFromNow).length
    }));
  }

  /**
   * Get days until expiry for the earliest expiring units
   */
  getDaysUntilExpiry(expirationDates) {
    if (!expirationDates || expirationDates.length === 0) return null;
    
    const earliestDate = new Date(Math.min(...expirationDates.map(date => new Date(date))));
    const today = new Date();
    const diffTime = earliestDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Check and send alerts for low inventory and expiring items
   */
  async checkAndSendAlerts(hospital) {
    try {
      const lowStockItems = hospital.inventory.filter(item => item.unitsAvailable <= item.minimumThreshold);
      const expiringSoonItems = this.getExpiringSoonItems(hospital.inventory);

      if (lowStockItems.length > 0) {
        await this.sendLowInventoryAlert(hospital, lowStockItems);
      }

      if (expiringSoonItems.length > 0) {
        await this.sendExpiryAlert(hospital, expiringSoonItems);
      }
    } catch (error) {
      logger.error('Error checking and sending alerts:', error);
    }
  }

  /**
   * Send low inventory alert
   */
  async sendLowInventoryAlert(hospital, lowStockItems) {
    try {
      const emailData = {
        to: hospital.adminUser.email,
        subject: 'Low Blood Inventory Alert',
        template: 'low-inventory-alert',
        data: {
          hospitalName: hospital.name,
          lowStockItems: lowStockItems.map(item => ({
            bloodType: item.bloodType,
            currentUnits: item.unitsAvailable,
            minimumThreshold: item.minimumThreshold
          })),
          dashboardLink: `${process.env.CLIENT_URL}/hospital/dashboard`
        }
      };

      await sendEmail(emailData);

      // Also send WhatsApp notification
      if (hospital.adminUser.phone) {
        const bloodTypes = lowStockItems.map(item => item.bloodType).join(', ');
        const message = `Low inventory alert for ${hospital.name}. Blood types running low: ${bloodTypes}. Please restock soon.`;
        await sendWhatsAppMessage(hospital.adminUser.phone, 'inventory_alert', { message });
      }
    } catch (error) {
      logger.error('Error sending low inventory alert:', error);
    }
  }

  /**
   * Send expiry alert
   */
  async sendExpiryAlert(hospital, expiringSoonItems) {
    try {
      const emailData = {
        to: hospital.adminUser.email,
        subject: 'Blood Units Expiring Soon',
        template: 'expiry-alert',
        data: {
          hospitalName: hospital.name,
          expiringSoonItems: expiringSoonItems.map(item => ({
            bloodType: item.bloodType,
            expiringSoonCount: item.expiringSoonCount,
            daysUntilExpiry: this.getDaysUntilExpiry(item.expirationDates)
          })),
          dashboardLink: `${process.env.CLIENT_URL}/hospital/dashboard`
        }
      };

      await sendEmail(emailData);
    } catch (error) {
      logger.error('Error sending expiry alert:', error);
    }
  }

  /**
   * Log inventory transaction (this would typically use a separate collection)
   */
  async logInventoryTransaction(hospitalId, transaction) {
    try {
      // In a real implementation, this would save to an InventoryTransaction collection
      logger.info('Inventory transaction logged', {
        hospitalId,
        ...transaction
      });
    } catch (error) {
      logger.error('Error logging inventory transaction:', error);
    }
  }

  /**
   * Get inventory transactions (mock implementation)
   */
  async getInventoryTransactions(hospitalId, startDate, endDate) {
    // This would typically query an InventoryTransaction collection
    // For now, returning mock data based on date range
    const mockTransactions = [
      {
        id: 'TXN001',
        type: 'addition',
        bloodType: 'O+',
        units: 10,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        performedBy: 'Admin User',
        reason: 'New donation received'
      },
      {
        id: 'TXN002',
        type: 'consumption',
        bloodType: 'A+',
        units: 3,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        performedBy: 'Admin User',
        reason: 'Patient transfusion'
      },
      {
        id: 'TXN003',
        type: 'addition',
        bloodType: 'B+',
        units: 5,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        performedBy: 'Admin User',
        reason: 'Blood drive collection'
      }
    ];

    return mockTransactions.filter(txn => 
      txn.timestamp >= startDate && txn.timestamp <= endDate
    );
  }

  /**
   * Calculate inventory trends (enhanced implementation)
   */
  calculateInventoryTrends(transactions, timeRange) {
    const additions = transactions
      .filter(txn => txn.type === 'addition')
      .reduce((acc, txn) => {
        const date = txn.timestamp.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + txn.units;
        return acc;
      }, {});

    const consumptions = transactions
      .filter(txn => txn.type === 'consumption')
      .reduce((acc, txn) => {
        const date = txn.timestamp.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + txn.units;
        return acc;
      }, {});

    const redistributions = transactions
      .filter(txn => txn.type === 'redistribution_out' || txn.type === 'redistribution_in')
      .reduce((acc, txn) => {
        const date = txn.timestamp.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + txn.units;
        return acc;
      }, {});

    return {
      additions: Object.entries(additions).map(([date, units]) => ({ date, units })),
      consumptions: Object.entries(consumptions).map(([date, units]) => ({ date, units })),
      redistributions: Object.entries(redistributions).map(([date, units]) => ({ date, units }))
    };
  }

  /**
   * Get expiry alerts for all hospitals (admin function)
   */
  async getSystemWideExpiryAlerts() {
    try {
      const hospitals = await Hospital.find({
        isActive: true,
        verificationStatus: 'verified'
      }).populate('adminUser', 'name email phone');

      const alerts = [];
      
      for (const hospital of hospitals) {
        const expiringSoonItems = this.getExpiringSoonItems(hospital.inventory);
        
        if (expiringSoonItems.length > 0) {
          alerts.push({
            hospital: {
              id: hospital._id,
              name: hospital.name,
              contactInfo: hospital.contactInfo,
              adminUser: hospital.adminUser
            },
            expiringSoonItems
          });
        }
      }

      return alerts;
    } catch (error) {
      logger.error('Error fetching system-wide expiry alerts:', error);
      throw error;
    }
  }

  /**
   * Get low stock alerts for all hospitals (admin function)
   */
  async getSystemWideLowStockAlerts() {
    try {
      const hospitals = await Hospital.find({
        isActive: true,
        verificationStatus: 'verified'
      }).populate('adminUser', 'name email phone');

      const alerts = [];
      
      for (const hospital of hospitals) {
        const lowStockItems = hospital.inventory.filter(item => 
          item.unitsAvailable <= item.minimumThreshold
        );
        
        if (lowStockItems.length > 0) {
          alerts.push({
            hospital: {
              id: hospital._id,
              name: hospital.name,
              contactInfo: hospital.contactInfo,
              adminUser: hospital.adminUser
            },
            lowStockItems
          });
        }
      }

      return alerts;
    } catch (error) {
      logger.error('Error fetching system-wide low stock alerts:', error);
      throw error;
    }
  }

  /**
   * Process expired inventory across all hospitals
   */
  async processExpiredInventory() {
    try {
      const hospitals = await Hospital.find({
        isActive: true,
        verificationStatus: 'verified'
      });

      let totalExpiredUnits = 0;
      const expiredByHospital = [];

      for (const hospital of hospitals) {
        let hospitalExpiredUnits = 0;
        
        hospital.inventory.forEach(inventoryItem => {
          const now = new Date();
          const expiredDates = inventoryItem.expirationDates.filter(date => date <= now);
          
          if (expiredDates.length > 0) {
            // In a real implementation, this would properly track which units expired
            // For now, we'll assume 1 unit per expired date
            const expiredUnits = expiredDates.length;
            hospitalExpiredUnits += expiredUnits;
            
            // Remove expired dates and reduce available units
            inventoryItem.expirationDates = inventoryItem.expirationDates.filter(date => date > now);
            inventoryItem.unitsAvailable = Math.max(0, inventoryItem.unitsAvailable - expiredUnits);
          }
        });

        if (hospitalExpiredUnits > 0) {
          await hospital.save();
          totalExpiredUnits += hospitalExpiredUnits;
          
          expiredByHospital.push({
            hospitalId: hospital._id,
            hospitalName: hospital.name,
            expiredUnits: hospitalExpiredUnits
          });

          // Log the expiry processing
          await this.logInventoryTransaction(hospital._id, {
            type: 'expiry_processing',
            units: hospitalExpiredUnits,
            reason: 'Automated expiry processing',
            performedBy: 'system',
            timestamp: new Date()
          });
        }
      }

      logger.info(`Processed expired inventory: ${totalExpiredUnits} units across ${expiredByHospital.length} hospitals`);
      
      return {
        totalExpiredUnits,
        affectedHospitals: expiredByHospital.length,
        details: expiredByHospital
      };
    } catch (error) {
      logger.error('Error processing expired inventory:', error);
      throw error;
    }
  }
}

module.exports = new InventoryService();