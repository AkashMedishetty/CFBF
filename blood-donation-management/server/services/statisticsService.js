const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const Donation = require('../models/Donation');
const Institution = require('../models/Institution');
const logger = require('../utils/logger');

class StatisticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getPublicStats() {
    try {
      const cacheKey = 'public_stats';
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      // In a real implementation, these would be actual database queries
      const stats = await this.calculatePublicStats();
      this.setCache(cacheKey, stats);
      
      return stats;
    } catch (error) {
      logger.error('Error fetching public stats', 'STATISTICS_SERVICE', error);
      // Return fallback stats
      return this.getFallbackStats();
    }
  }

  async calculatePublicStats() {
    try {
      // These would be real database aggregations in production
      const [
        totalDonors,
        totalDonations,
        totalRequests,
        totalInstitutions,
        recentActivity
      ] = await Promise.all([
        this.getTotalDonors(),
        this.getTotalDonations(),
        this.getTotalRequests(),
        this.getTotalInstitutions(),
        this.getRecentActivity()
      ]);

      const fulfilledRequests = Math.floor(totalRequests * 0.964); // 96.4% fulfillment rate
      const livesImpacted = totalDonations * 3; // Each donation can save up to 3 lives
      const averageResponseTime = 18; // minutes

      return {
        totalDonors,
        totalDonations,
        totalRequests,
        fulfilledRequests,
        livesImpacted,
        averageResponseTime,
        totalInstitutions,
        fulfillmentRate: ((fulfilledRequests / totalRequests) * 100).toFixed(1),
        recentActivity,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error calculating public stats', 'STATISTICS_SERVICE', error);
      return this.getFallbackStats();
    }
  }

  async getTotalDonors() {
    try {
      // Mock implementation - in real app, this would be:
      // return await User.countDocuments({ role: 'donor', status: 'active' });
      return 15420 + Math.floor(Math.random() * 100); // Simulate growth
    } catch (error) {
      return 15420;
    }
  }

  async getTotalDonations() {
    try {
      // Mock implementation - in real app, this would be:
      // return await Donation.countDocuments({ status: 'completed' });
      return 45680 + Math.floor(Math.random() * 50); // Simulate growth
    } catch (error) {
      return 45680;
    }
  }

  async getTotalRequests() {
    try {
      // Mock implementation - in real app, this would be:
      // return await BloodRequest.countDocuments();
      return 12340 + Math.floor(Math.random() * 20); // Simulate growth
    } catch (error) {
      return 12340;
    }
  }

  async getTotalInstitutions() {
    try {
      // Mock implementation - in real app, this would be:
      // return await Institution.countDocuments({ status: 'active', verificationStatus: 'verified' });
      return 520 + Math.floor(Math.random() * 5); // Simulate growth
    } catch (error) {
      return 520;
    }
  }

  async getRecentActivity() {
    try {
      // Mock recent activity data
      const activities = [
        {
          type: 'donation',
          message: 'Rajesh K. donated blood in Delhi',
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          location: 'Delhi'
        },
        {
          type: 'request_fulfilled',
          message: 'Emergency request fulfilled in Mumbai',
          timestamp: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
          location: 'Mumbai'
        },
        {
          type: 'new_donor',
          message: 'Priya S. joined as a new donor',
          timestamp: new Date(Date.now() - 18 * 60 * 1000), // 18 minutes ago
          location: 'Bangalore'
        },
        {
          type: 'donation',
          message: 'Amit P. donated blood in Chennai',
          timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
          location: 'Chennai'
        },
        {
          type: 'request_fulfilled',
          message: 'Blood request fulfilled in Hyderabad',
          timestamp: new Date(Date.now() - 32 * 60 * 1000), // 32 minutes ago
          location: 'Hyderabad'
        }
      ];

      return activities;
    } catch (error) {
      return [];
    }
  }

  async getLocationStats(city, state) {
    try {
      const cacheKey = `location_stats_${city}_${state}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      // Mock location-specific stats
      const stats = {
        city,
        state,
        totalDonors: Math.floor(Math.random() * 2000) + 500,
        totalDonations: Math.floor(Math.random() * 5000) + 1000,
        totalInstitutions: Math.floor(Math.random() * 50) + 10,
        averageResponseTime: Math.floor(Math.random() * 20) + 10,
        lastUpdated: new Date().toISOString()
      };

      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      logger.error('Error fetching location stats', 'STATISTICS_SERVICE', error);
      return null;
    }
  }

  async getBloodTypeStats() {
    try {
      const cacheKey = 'blood_type_stats';
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      // Mock blood type distribution
      const stats = [
        { type: 'O+', donors: 4850, percentage: 31.4, demand: 'high' },
        { type: 'A+', donors: 3920, percentage: 25.4, demand: 'medium' },
        { type: 'B+', donors: 2780, percentage: 18.0, demand: 'medium' },
        { type: 'AB+', donors: 1560, percentage: 10.1, demand: 'low' },
        { type: 'O-', donors: 1240, percentage: 8.0, demand: 'critical' },
        { type: 'A-', donors: 680, percentage: 4.4, demand: 'high' },
        { type: 'B-', donors: 290, percentage: 1.9, demand: 'high' },
        { type: 'AB-', donors: 100, percentage: 0.6, demand: 'critical' }
      ];

      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      logger.error('Error fetching blood type stats', 'STATISTICS_SERVICE', error);
      return [];
    }
  }

  async getSuccessStories() {
    try {
      // Mock success stories
      const stories = [
        {
          id: 1,
          title: 'Life Saved in 12 Minutes',
          summary: 'Emergency blood request for accident victim fulfilled within 12 minutes',
          location: 'Delhi',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          donorCount: 3,
          bloodType: 'O-',
          verified: true
        },
        {
          id: 2,
          title: 'Cancer Patient Gets Hope',
          summary: 'Multiple donors came forward to help cancer patient during treatment',
          location: 'Mumbai',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          donorCount: 8,
          bloodType: 'A+',
          verified: true
        },
        {
          id: 3,
          title: 'Mother and Child Saved',
          summary: 'Emergency delivery complications resolved with timely blood donation',
          location: 'Bangalore',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          donorCount: 2,
          bloodType: 'B+',
          verified: true
        }
      ];

      return stories;
    } catch (error) {
      logger.error('Error fetching success stories', 'STATISTICS_SERVICE', error);
      return [];
    }
  }

  getFallbackStats() {
    return {
      totalDonors: 15420,
      totalDonations: 45680,
      totalRequests: 12340,
      fulfilledRequests: 11890,
      livesImpacted: 137040,
      averageResponseTime: 18,
      totalInstitutions: 520,
      fulfillmentRate: '96.4',
      recentActivity: [],
      lastUpdated: new Date().toISOString()
    };
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
    logger.info('Statistics cache cleared', 'STATISTICS_SERVICE');
  }

  async incrementStat(statType, value = 1) {
    try {
      // In a real implementation, this would update the database
      logger.info(`Stat incremented: ${statType} by ${value}`, 'STATISTICS_SERVICE');
      
      // Clear relevant cache entries
      this.cache.delete('public_stats');
      
      return true;
    } catch (error) {
      logger.error('Error incrementing stat', 'STATISTICS_SERVICE', error);
      return false;
    }
  }

  async getGrowthMetrics(timeRange = '30d') {
    try {
      // Mock growth metrics
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const metrics = {
        donorGrowth: [],
        donationGrowth: [],
        requestGrowth: []
      };

      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        metrics.donorGrowth.push({
          date: date.toISOString().split('T')[0],
          value: Math.floor(Math.random() * 50) + 20
        });
        
        metrics.donationGrowth.push({
          date: date.toISOString().split('T')[0],
          value: Math.floor(Math.random() * 100) + 50
        });
        
        metrics.requestGrowth.push({
          date: date.toISOString().split('T')[0],
          value: Math.floor(Math.random() * 30) + 15
        });
      }

      return metrics;
    } catch (error) {
      logger.error('Error fetching growth metrics', 'STATISTICS_SERVICE', error);
      return { donorGrowth: [], donationGrowth: [], requestGrowth: [] };
    }
  }
}

module.exports = new StatisticsService();