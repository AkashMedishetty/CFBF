const analyticsService = require('../services/analyticsService');
const reportingService = require('../services/reportingService');
const logger = require('../utils/logger');

class AnalyticsController {
  async getDashboardMetrics(req, res) {
    try {
      const timeRange = req.query.timeRange || '30d';
      const metrics = await analyticsService.getDashboardMetrics(timeRange);
      
      logger.info(`Dashboard metrics fetched for ${timeRange}`, 'ANALYTICS_CONTROLLER');
      
      res.json({
        success: true,
        data: metrics,
        meta: {
          timeRange,
          generatedAt: new Date().toISOString(),
          requestId: req.headers['x-request-id']
        }
      });
    } catch (error) {
      logger.error('Error in getDashboardMetrics', 'ANALYTICS_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'DASHBOARD_METRICS_ERROR',
          message: 'Failed to fetch dashboard metrics',
          requestId: req.headers['x-request-id']
        }
      });
    }
  }

  async getDonorEngagement(req, res) {
    try {
      const donorId = req.query.donorId;
      const metrics = await analyticsService.getDonorEngagementMetrics(donorId);
      
      logger.info(`Donor engagement metrics fetched${donorId ? ` for donor ${donorId}` : ''}`, 'ANALYTICS_CONTROLLER');
      
      res.json({
        success: true,
        data: metrics,
        meta: {
          donorId: donorId || 'all',
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error in getDonorEngagement', 'ANALYTICS_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'DONOR_ENGAGEMENT_ERROR',
          message: 'Failed to fetch donor engagement metrics'
        }
      });
    }
  }

  async getSystemHealth(req, res) {
    try {
      const metrics = await analyticsService.getSystemHealthMetrics();
      
      res.json({
        success: true,
        data: metrics,
        meta: {
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error in getSystemHealth', 'ANALYTICS_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'SYSTEM_HEALTH_ERROR',
          message: 'Failed to fetch system health metrics'
        }
      });
    }
  }

  async generateReport(req, res) {
    try {
      const reportConfig = {
        ...req.body,
        id: `RPT_${Date.now()}`,
        generatedBy: req.user.id,
        generatedAt: new Date().toISOString()
      };

      logger.info(`Generating report: ${reportConfig.name}`, 'ANALYTICS_CONTROLLER');
      
      const result = await reportingService.generateReport(reportConfig);
      
      res.json({
        success: true,
        data: {
          reportId: reportConfig.id,
          filename: result.filename,
          size: result.size,
          format: reportConfig.format,
          sections: reportConfig.sections.length,
          downloadUrl: `/api/v1/analytics/reports/${reportConfig.id}/download`
        },
        meta: {
          generatedAt: reportConfig.generatedAt,
          generatedBy: req.user.name || req.user.email
        }
      });
    } catch (error) {
      logger.error('Error in generateReport', 'ANALYTICS_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'REPORT_GENERATION_ERROR',
          message: 'Failed to generate report',
          details: error.message
        }
      });
    }
  }

  async scheduleReport(req, res) {
    try {
      const scheduleConfig = {
        ...req.body,
        id: `SCH_${Date.now()}`,
        createdBy: req.user.id,
        createdAt: new Date().toISOString()
      };

      logger.info(`Scheduling report: ${scheduleConfig.name} (${scheduleConfig.schedule})`, 'ANALYTICS_CONTROLLER');
      
      const result = await reportingService.scheduleReport(scheduleConfig);
      
      res.json({
        success: true,
        data: {
          ...result,
          name: scheduleConfig.name,
          schedule: scheduleConfig.schedule,
          recipients: scheduleConfig.recipients.length
        },
        meta: {
          createdAt: scheduleConfig.createdAt,
          createdBy: req.user.name || req.user.email
        }
      });
    } catch (error) {
      logger.error('Error in scheduleReport', 'ANALYTICS_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'SCHEDULE_ERROR',
          message: 'Failed to schedule report',
          details: error.message
        }
      });
    }
  }

  async getScheduledReports(req, res) {
    try {
      const reports = await reportingService.getScheduledReports();
      
      res.json({
        success: true,
        data: reports,
        meta: {
          count: reports.length,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error in getScheduledReports', 'ANALYTICS_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'SCHEDULED_REPORTS_ERROR',
          message: 'Failed to fetch scheduled reports'
        }
      });
    }
  }

  async unscheduleReport(req, res) {
    try {
      const { reportId } = req.params;
      const result = await reportingService.unscheduleReport(reportId);
      
      if (result) {
        logger.info(`Report unscheduled: ${reportId}`, 'ANALYTICS_CONTROLLER');
        res.json({
          success: true,
          message: 'Report unscheduled successfully',
          data: { reportId }
        });
      } else {
        res.status(404).json({
          error: {
            code: 'REPORT_NOT_FOUND',
            message: 'Scheduled report not found',
            details: { reportId }
          }
        });
      }
    } catch (error) {
      logger.error('Error in unscheduleReport', 'ANALYTICS_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'UNSCHEDULE_ERROR',
          message: 'Failed to unschedule report'
        }
      });
    }
  }

  async exportData(req, res) {
    try {
      const format = req.query.format || 'json';
      const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
      
      logger.info(`Exporting data in ${format} format`, 'ANALYTICS_CONTROLLER');
      
      const result = await reportingService.exportData(format, filters);
      
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('X-Export-Format', format);
      res.setHeader('X-Export-Size', result.data.length);
      
      res.send(result.data);
    } catch (error) {
      logger.error('Error in exportData', 'ANALYTICS_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to export data',
          details: error.message
        }
      });
    }
  }

  async clearCache(req, res) {
    try {
      analyticsService.clearCache();
      
      logger.info('Analytics cache cleared by admin', 'ANALYTICS_CONTROLLER');
      
      res.json({
        success: true,
        message: 'Analytics cache cleared successfully',
        meta: {
          clearedAt: new Date().toISOString(),
          clearedBy: req.user.name || req.user.email
        }
      });
    } catch (error) {
      logger.error('Error in clearCache', 'ANALYTICS_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'CACHE_CLEAR_ERROR',
          message: 'Failed to clear cache'
        }
      });
    }
  }

  async getReportHistory(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const type = req.query.type;
      
      // Mock implementation - in real app, this would query the database
      const mockHistory = [
        {
          id: 'RPT001',
          name: 'Monthly Donation Summary - January 2024',
          type: 'summary',
          format: 'pdf',
          generatedAt: '2024-01-31T09:00:00Z',
          generatedBy: 'Admin User',
          size: '2.4 MB',
          downloads: 45,
          status: 'completed'
        },
        {
          id: 'RPT002',
          name: 'Donor Engagement Analysis - Q4 2023',
          type: 'engagement',
          format: 'excel',
          generatedAt: '2024-01-28T14:30:00Z',
          generatedBy: 'Admin User',
          size: '1.8 MB',
          downloads: 23,
          status: 'completed'
        }
      ];
      
      res.json({
        success: true,
        data: mockHistory,
        pagination: {
          page,
          limit,
          total: mockHistory.length,
          pages: Math.ceil(mockHistory.length / limit)
        }
      });
    } catch (error) {
      logger.error('Error in getReportHistory', 'ANALYTICS_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'REPORT_HISTORY_ERROR',
          message: 'Failed to fetch report history'
        }
      });
    }
  }

  async downloadReport(req, res) {
    try {
      const { reportId } = req.params;
      
      // Mock implementation - in real app, this would serve the actual file
      logger.info(`Report download requested: ${reportId}`, 'ANALYTICS_CONTROLLER');
      
      res.status(404).json({
        error: {
          code: 'REPORT_NOT_FOUND',
          message: 'Report file not found or expired',
          details: { reportId }
        }
      });
    } catch (error) {
      logger.error('Error in downloadReport', 'ANALYTICS_CONTROLLER', error);
      res.status(500).json({
        error: {
          code: 'DOWNLOAD_ERROR',
          message: 'Failed to download report'
        }
      });
    }
  }
}

module.exports = new AnalyticsController();