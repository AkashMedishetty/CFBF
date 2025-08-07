const logger = require('../utils/logger');

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getDashboardMetrics(timeRange = '30d') {
    try {
      const cacheKey = `dashboard_metrics_${timeRange}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const metrics = await this.calculateDashboardMetrics(timeRange);
      this.setCache(cacheKey, metrics);
      
      return metrics;
    } catch (error) {
      logger.error('Error fetching dashboard metrics', 'ANALYTICS_SERVICE', error);
      throw error;
    }
  }

  async calculateDashboardMetrics(timeRange) {
    // Mock implementation - in real app, this would query the database
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

    // Mock data - replace with actual database queries
    return {
      overview: {
        totalDonors: 15420,
        activeDonors: 8750,
        totalDonations: 45680,
        thisMonthDonations: 3420,
        totalRequests: 12340,
        fulfilledRequests: 11890,
        responseRate: 96.4,
        averageResponseTime: 18,
        livesImpacted: 137040,
        growthRate: 12.5
      },
      trends: await this.getTrendData(timeRange),
      demographics: await this.getDemographicsData(),
      geographic: await this.getGeographicData(),
      performance: await this.getPerformanceMetrics()
    };
  }

  async getTrendData(timeRange) {
    // Generate mock trend data
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const donations = [];
    const requests = [];
    const newDonors = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      donations.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 100) + 100
      });
      
      requests.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 50) + 30
      });
      
      newDonors.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 30) + 10
      });
    }

    return { donations, requests, newDonors };
  }

  async getDemographicsData() {
    return {
      bloodTypes: [
        { type: 'O+', count: 4850, percentage: 31.4 },
        { type: 'A+', count: 3920, percentage: 25.4 },
        { type: 'B+', count: 2780, percentage: 18.0 },
        { type: 'AB+', count: 1560, percentage: 10.1 },
        { type: 'O-', count: 1240, percentage: 8.0 },
        { type: 'A-', count: 680, percentage: 4.4 },
        { type: 'B-', count: 290, percentage: 1.9 },
        { type: 'AB-', count: 100, percentage: 0.6 }
      ],
      ageGroups: [
        { range: '18-25', count: 3850, percentage: 25.0 },
        { range: '26-35', count: 5420, percentage: 35.1 },
        { range: '36-45', count: 3680, percentage: 23.9 },
        { range: '46-55', count: 1890, percentage: 12.3 },
        { range: '56-65', count: 580, percentage: 3.8 }
      ],
      genderDistribution: [
        { gender: 'Male', count: 9250, percentage: 60.0 },
        { gender: 'Female', count: 6170, percentage: 40.0 }
      ]
    };
  }

  async getGeographicData() {
    return {
      regions: [
        { name: 'North Delhi', donors: 3420, requests: 890, fulfillment: 94.2 },
        { name: 'South Delhi', donors: 2890, requests: 750, fulfillment: 96.8 },
        { name: 'East Delhi', donors: 2150, requests: 680, fulfillment: 91.5 },
        { name: 'West Delhi', donors: 2680, requests: 720, fulfillment: 95.1 },
        { name: 'Central Delhi', donors: 1890, requests: 520, fulfillment: 97.3 },
        { name: 'New Delhi', donors: 2390, requests: 640, fulfillment: 93.8 }
      ],
      topCities: [
        { city: 'Delhi', donors: 15420, donations: 45680 },
        { city: 'Mumbai', donors: 12890, donations: 38450 },
        { city: 'Bangalore', donors: 9650, donations: 28920 },
        { city: 'Chennai', donors: 8420, donations: 25180 },
        { city: 'Hyderabad', donors: 7230, donations: 21650 }
      ]
    };
  }

  async getPerformanceMetrics() {
    return {
      responseMetrics: {
        averageResponseTime: 18,
        medianResponseTime: 12,
        responseRate: 96.4,
        emergencyResponseTime: 8,
        routineResponseTime: 25
      },
      donorEngagement: {
        activeRate: 56.8,
        retentionRate: 78.5,
        referralRate: 23.4,
        satisfactionScore: 4.6
      },
      systemHealth: {
        uptime: 99.8,
        apiResponseTime: 145,
        errorRate: 0.2,
        throughput: 1250
      }
    };
  }

  async getDonorEngagementMetrics(donorId = null) {
    try {
      if (donorId) {
        return await this.getIndividualDonorMetrics(donorId);
      }
      
      return {
        totalDonors: 15420,
        activeDonors: 8750,
        inactiveDonors: 6670,
        newDonorsThisMonth: 420,
        averageDonationsPerDonor: 2.96,
        topDonors: [
          { id: 'D001', name: 'Rajesh Kumar', donations: 25, lastDonation: '2024-01-10' },
          { id: 'D002', name: 'Priya Sharma', donations: 22, lastDonation: '2024-01-08' },
          { id: 'D003', name: 'Amit Singh', donations: 20, lastDonation: '2024-01-05' }
        ],
        engagementTrends: {
          responseRate: 96.4,
          averageResponseTime: 18,
          retentionRate: 78.5,
          referralRate: 23.4
        }
      };
    } catch (error) {
      logger.error('Error fetching donor engagement metrics', 'ANALYTICS_SERVICE', error);
      throw error;
    }
  }

  async getIndividualDonorMetrics(donorId) {
    // Mock individual donor metrics
    return {
      donorId,
      totalDonations: 11,
      lastDonation: '2024-01-10T00:00:00Z',
      averageResponseTime: 15,
      responseRate: 98.5,
      preferredDonationTime: 'morning',
      donationFrequency: 'quarterly',
      impactScore: 33, // lives saved
      badges: ['Regular Donor', 'Quick Responder', 'Life Saver'],
      engagementScore: 92
    };
  }

  async getSystemHealthMetrics() {
    return {
      uptime: 99.8,
      responseTime: {
        api: 145,
        database: 45,
        whatsapp: 2800
      },
      errorRates: {
        api: 0.2,
        whatsapp: 1.5,
        sms: 0.8,
        email: 0.1
      },
      throughput: {
        requests: 1250,
        notifications: 850,
        donations: 120
      },
      resources: {
        cpu: 45,
        memory: 68,
        disk: 32,
        network: 15
      }
    };
  }

  async generateCustomReport(config) {
    try {
      const data = {};
      
      for (const section of config.sections) {
        switch (section.id) {
          case 'overview':
            data.overview = (await this.getDashboardMetrics()).overview;
            break;
          case 'donations':
            data.donations = (await this.getDashboardMetrics()).trends.donations;
            break;
          case 'donors':
            data.donors = await this.getDonorEngagementMetrics();
            break;
          case 'requests':
            data.requests = (await this.getDashboardMetrics()).trends.requests;
            break;
          case 'geographic':
            data.geographic = (await this.getDashboardMetrics()).geographic;
            break;
          case 'performance':
            data.performance = (await this.getDashboardMetrics()).performance;
            break;
          case 'trends':
            data.trends = (await this.getDashboardMetrics()).trends;
            break;
        }
      }
      
      return data;
    } catch (error) {
      logger.error('Error generating custom report data', 'ANALYTICS_SERVICE', error);
      throw error;
    }
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
    logger.info('Analytics cache cleared', 'ANALYTICS_SERVICE');
  }
}

module.exports = new AnalyticsService();