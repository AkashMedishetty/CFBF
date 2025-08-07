const cron = require('node-cron');
const inventoryAlertService = require('./inventoryAlertService');
const analyticsService = require('./analyticsService');
const reportingService = require('./reportingService');
const logger = require('../utils/logger');

class CronJobService {
  constructor() {
    this.jobs = new Map();
    this.initializeJobs();
  }

  initializeJobs() {
    // Clear analytics cache every hour
    this.scheduleJob('clear-analytics-cache', '0 * * * *', async () => {
      analyticsService.clearCache();
      logger.info('Analytics cache cleared', 'CRON_SERVICE');
    });

    // Generate daily summary report at 6 AM
    this.scheduleJob('daily-summary-report', '0 6 * * *', async () => {
      await this.generateDailySummaryReport();
    });

    // Generate weekly report every Monday at 8 AM
    this.scheduleJob('weekly-report', '0 8 * * 1', async () => {
      await this.generateWeeklyReport();
    });

    // Generate monthly report on the 1st of each month at 9 AM
    this.scheduleJob('monthly-report', '0 9 1 * *', async () => {
      await this.generateMonthlyReport();
    });

    // Clean up old logs and temporary files daily at 2 AM
    this.scheduleJob('cleanup-old-files', '0 2 * * *', async () => {
      await this.cleanupOldFiles();
    });

    // Health check every 15 minutes
    this.scheduleJob('health-check', '*/15 * * * *', async () => {
      await this.performHealthCheck();
    });

    // Update system statistics every 30 minutes
    this.scheduleJob('update-statistics', '*/30 * * * *', async () => {
      await this.updateSystemStatistics();
    });

    logger.info('Cron jobs initialized successfully', 'CRON_SERVICE');
  }

  scheduleJob(name, schedule, task) {
    try {
      const job = cron.schedule(schedule, async () => {
        const startTime = Date.now();
        logger.info(`Starting cron job: ${name}`, 'CRON_SERVICE');
        
        try {
          await task();
          const duration = Date.now() - startTime;
          logger.info(`Completed cron job: ${name} (${duration}ms)`, 'CRON_SERVICE');
        } catch (error) {
          logger.error(`Error in cron job: ${name}`, 'CRON_SERVICE', error);
        }
      }, {
        scheduled: false
      });

      this.jobs.set(name, {
        job,
        schedule,
        task,
        lastRun: null,
        nextRun: null,
        status: 'stopped'
      });

      job.start();
      this.jobs.get(name).status = 'running';
      this.jobs.get(name).nextRun = job.nextDate();

      logger.info(`Scheduled job: ${name} (${schedule})`, 'CRON_SERVICE');
    } catch (error) {
      logger.error(`Error scheduling job: ${name}`, 'CRON_SERVICE', error);
    }
  }

  async generateDailySummaryReport() {
    try {
      const reportConfig = {
        id: `DAILY_${Date.now()}`,
        name: `Daily Summary Report - ${new Date().toLocaleDateString()}`,
        type: 'summary',
        format: 'pdf',
        sections: [
          { id: 'overview', name: 'System Overview' },
          { id: 'donations', name: 'Daily Donations' },
          { id: 'requests', name: 'Blood Requests' },
          { id: 'inventory', name: 'Inventory Status' }
        ],
        recipients: process.env.DAILY_REPORT_RECIPIENTS ? 
          process.env.DAILY_REPORT_RECIPIENTS.split(',').map(email => ({ email: email.trim() })) : 
          [],
        generatedBy: 'system',
        generatedAt: new Date().toISOString()
      };

      await reportingService.generateReport(reportConfig);
      logger.info('Daily summary report generated', 'CRON_SERVICE');
    } catch (error) {
      logger.error('Error generating daily summary report', 'CRON_SERVICE', error);
    }
  }

  async generateWeeklyReport() {
    try {
      const reportConfig = {
        id: `WEEKLY_${Date.now()}`,
        name: `Weekly Analytics Report - Week of ${new Date().toLocaleDateString()}`,
        type: 'analytics',
        format: 'excel',
        sections: [
          { id: 'overview', name: 'Weekly Overview' },
          { id: 'trends', name: 'Trend Analysis' },
          { id: 'performance', name: 'Performance Metrics' },
          { id: 'geographic', name: 'Geographic Analysis' }
        ],
        recipients: process.env.WEEKLY_REPORT_RECIPIENTS ? 
          process.env.WEEKLY_REPORT_RECIPIENTS.split(',').map(email => ({ email: email.trim() })) : 
          [],
        generatedBy: 'system',
        generatedAt: new Date().toISOString()
      };

      await reportingService.generateReport(reportConfig);
      logger.info('Weekly analytics report generated', 'CRON_SERVICE');
    } catch (error) {
      logger.error('Error generating weekly report', 'CRON_SERVICE', error);
    }
  }

  async generateMonthlyReport() {
    try {
      const reportConfig = {
        id: `MONTHLY_${Date.now()}`,
        name: `Monthly Comprehensive Report - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        type: 'comprehensive',
        format: 'pdf',
        sections: [
          { id: 'overview', name: 'Monthly Overview' },
          { id: 'donations', name: 'Donation Analytics' },
          { id: 'donors', name: 'Donor Engagement' },
          { id: 'requests', name: 'Request Analysis' },
          { id: 'geographic', name: 'Geographic Distribution' },
          { id: 'performance', name: 'Performance Metrics' },
          { id: 'trends', name: 'Trend Analysis' }
        ],
        recipients: process.env.MONTHLY_REPORT_RECIPIENTS ? 
          process.env.MONTHLY_REPORT_RECIPIENTS.split(',').map(email => ({ email: email.trim() })) : 
          [],
        generatedBy: 'system',
        generatedAt: new Date().toISOString()
      };

      await reportingService.generateReport(reportConfig);
      logger.info('Monthly comprehensive report generated', 'CRON_SERVICE');
    } catch (error) {
      logger.error('Error generating monthly report', 'CRON_SERVICE', error);
    }
  }

  async cleanupOldFiles() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // Clean up old report files (older than 30 days)
      const reportsDir = path.join(__dirname, '../reports');
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      try {
        const files = await fs.readdir(reportsDir);
        let deletedCount = 0;
        
        for (const file of files) {
          const filePath = path.join(reportsDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime.getTime() < thirtyDaysAgo) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
        
        logger.info(`Cleaned up ${deletedCount} old report files`, 'CRON_SERVICE');
      } catch (error) {
        // Reports directory might not exist yet
        logger.info('Reports directory not found, skipping cleanup', 'CRON_SERVICE');
      }

      // Clean up old log files (older than 7 days)
      const logsDir = path.join(__dirname, '../logs');
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      try {
        const files = await fs.readdir(logsDir);
        let deletedCount = 0;
        
        for (const file of files) {
          if (file.endsWith('.log')) {
            const filePath = path.join(logsDir, file);
            const stats = await fs.stat(filePath);
            
            if (stats.mtime.getTime() < sevenDaysAgo) {
              await fs.unlink(filePath);
              deletedCount++;
            }
          }
        }
        
        logger.info(`Cleaned up ${deletedCount} old log files`, 'CRON_SERVICE');
      } catch (error) {
        // Logs directory might not exist yet
        logger.info('Logs directory not found, skipping cleanup', 'CRON_SERVICE');
      }
    } catch (error) {
      logger.error('Error during file cleanup', 'CRON_SERVICE', error);
    }
  }

  async performHealthCheck() {
    try {
      const healthStatus = {
        timestamp: new Date().toISOString(),
        services: {
          database: 'unknown',
          whatsapp: 'unknown',
          email: 'unknown',
          inventory: 'unknown'
        },
        memory: process.memoryUsage(),
        uptime: process.uptime()
      };

      // Check database connection
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
          healthStatus.services.database = 'healthy';
        } else {
          healthStatus.services.database = 'unhealthy';
        }
      } catch (error) {
        healthStatus.services.database = 'error';
      }

      // Check inventory service
      try {
        await inventoryAlertService.getAlertStatistics('1d');
        healthStatus.services.inventory = 'healthy';
      } catch (error) {
        healthStatus.services.inventory = 'error';
      }

      // Log health status (only log if there are issues)
      const hasIssues = Object.values(healthStatus.services).some(status => 
        status === 'unhealthy' || status === 'error'
      );

      if (hasIssues) {
        logger.warning('Health check detected issues', 'CRON_SERVICE', healthStatus);
      }

      // Store health status for monitoring dashboard
      // In a real implementation, this would be stored in a monitoring system
      
    } catch (error) {
      logger.error('Error during health check', 'CRON_SERVICE', error);
    }
  }

  async updateSystemStatistics() {
    try {
      // Update cached system statistics
      // This would typically update a cache or database with current system stats
      
      const stats = {
        timestamp: new Date().toISOString(),
        activeUsers: Math.floor(Math.random() * 100) + 50, // Mock data
        totalDonors: Math.floor(Math.random() * 1000) + 15000, // Mock data
        pendingRequests: Math.floor(Math.random() * 20) + 5, // Mock data
        systemLoad: process.cpuUsage(),
        memoryUsage: process.memoryUsage()
      };

      // In a real implementation, this would update a cache or database
      logger.debug('System statistics updated', 'CRON_SERVICE', stats);
      
    } catch (error) {
      logger.error('Error updating system statistics', 'CRON_SERVICE', error);
    }
  }

  // Manual job control methods
  startJob(jobName) {
    const jobInfo = this.jobs.get(jobName);
    if (jobInfo && jobInfo.status === 'stopped') {
      jobInfo.job.start();
      jobInfo.status = 'running';
      jobInfo.nextRun = jobInfo.job.nextDate();
      logger.info(`Started job: ${jobName}`, 'CRON_SERVICE');
      return true;
    }
    return false;
  }

  stopJob(jobName) {
    const jobInfo = this.jobs.get(jobName);
    if (jobInfo && jobInfo.status === 'running') {
      jobInfo.job.stop();
      jobInfo.status = 'stopped';
      jobInfo.nextRun = null;
      logger.info(`Stopped job: ${jobName}`, 'CRON_SERVICE');
      return true;
    }
    return false;
  }

  getJobStatus(jobName) {
    const jobInfo = this.jobs.get(jobName);
    if (jobInfo) {
      return {
        name: jobName,
        schedule: jobInfo.schedule,
        status: jobInfo.status,
        lastRun: jobInfo.lastRun,
        nextRun: jobInfo.nextRun
      };
    }
    return null;
  }

  getAllJobsStatus() {
    const jobsStatus = [];
    for (const [name, info] of this.jobs) {
      jobsStatus.push({
        name,
        schedule: info.schedule,
        status: info.status,
        lastRun: info.lastRun,
        nextRun: info.nextRun
      });
    }
    return jobsStatus;
  }

  // Method to run a job immediately (for testing or manual triggers)
  async runJobNow(jobName) {
    const jobInfo = this.jobs.get(jobName);
    if (jobInfo) {
      logger.info(`Manually triggering job: ${jobName}`, 'CRON_SERVICE');
      try {
        await jobInfo.task();
        jobInfo.lastRun = new Date();
        logger.info(`Manually triggered job completed: ${jobName}`, 'CRON_SERVICE');
        return true;
      } catch (error) {
        logger.error(`Error in manually triggered job: ${jobName}`, 'CRON_SERVICE', error);
        throw error;
      }
    }
    return false;
  }

  // Graceful shutdown
  shutdown() {
    logger.info('Shutting down cron jobs', 'CRON_SERVICE');
    for (const [name, info] of this.jobs) {
      if (info.status === 'running') {
        info.job.stop();
        logger.info(`Stopped job: ${name}`, 'CRON_SERVICE');
      }
    }
    this.jobs.clear();
  }
}

module.exports = new CronJobService();