const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const reportingService = require('../services/reportingService');
const { auth } = require('../middleware/auth');
const { body, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Middleware to check admin permissions
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Admin access required'
      }
    });
  }
  next();
};

// Get dashboard metrics
router.get('/dashboard', 
  auth, 
  requireAdmin,
  query('timeRange').optional().isIn(['7d', '30d', '90d', '1y']),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid parameters',
            details: errors.array()
          }
        });
      }

      const timeRange = req.query.timeRange || '30d';
      const metrics = await analyticsService.getDashboardMetrics(timeRange);
      
      res.json({
        success: true,
        data: metrics,
        meta: {
          timeRange,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error fetching dashboard metrics', 'ANALYTICS_API', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch dashboard metrics'
        }
      });
    }
  }
);

// Inventory analytics (admin)
router.get('/inventory/overview', auth, requireAdmin, async (req, res) => {
  try {
    const BloodRequest = require('../models/BloodRequest');
    const overviewAgg = await BloodRequest.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $in: ['$status', ['pending','active','matched']] }, 1, 0] } },
          fulfilled: { $sum: { $cond: [{ $eq: ['$status', 'fulfilled'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$request.urgency', 'critical'] }, 1, 0] } }
        }
      }
    ]);
    res.json({ success: true, data: { overview: overviewAgg[0] || { total: 0, active: 0, fulfilled: 0, critical: 0 } } });
  } catch (error) {
    logger.error('Error fetching inventory overview', 'ANALYTICS_API', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// Low-stock and expiry alerts (admin)
router.get('/inventory/alerts', auth, requireAdmin, async (req, res) => {
  try {
    const Hospital = require('../models/Hospital');
    const hospitals = await Hospital.find({ isActive: true }).select('name inventory address contactInfo');
    const lowStock = [];
    const expiringSoon = [];
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    hospitals.forEach(h => {
      h.inventory.forEach(item => {
        if (item.unitsAvailable <= item.minimumThreshold) {
          lowStock.push({ hospital: { id: h._id, name: h.name }, bloodType: item.bloodType, unitsAvailable: item.unitsAvailable, minimumThreshold: item.minimumThreshold, lastUpdated: item.lastUpdated });
        }
        const soon = (item.expirationDates || []).filter(d => new Date(d) <= sevenDaysFromNow).length;
        if (soon > 0) {
          expiringSoon.push({ hospital: { id: h._id, name: h.name }, bloodType: item.bloodType, expiringSoonCount: soon });
        }
      });
    });
    res.json({ success: true, data: { lowStock, expiringSoon } });
  } catch (error) {
    logger.error('Error fetching inventory alerts', 'ANALYTICS_API', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// Get donor engagement metrics
router.get('/donors/engagement',
  auth,
  requireAdmin,
  query('donorId').optional().isString(),
  async (req, res) => {
    try {
      const donorId = req.query.donorId;
      const metrics = await analyticsService.getDonorEngagementMetrics(donorId);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error fetching donor engagement metrics', 'ANALYTICS_API', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch donor engagement metrics'
        }
      });
    }
  }
);

// Get system health metrics
router.get('/system/health',
  auth,
  requireAdmin,
  async (req, res) => {
    try {
      const metrics = await analyticsService.getSystemHealthMetrics();
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error fetching system health metrics', 'ANALYTICS_API', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch system health metrics'
        }
      });
    }
  }
);

// Generate custom report
router.post('/reports/generate',
  auth,
  requireAdmin,
  [
    body('name').notEmpty().withMessage('Report name is required'),
    body('format').isIn(['pdf', 'excel', 'csv']).withMessage('Invalid format'),
    body('sections').isArray().withMessage('Sections must be an array'),
    body('recipients').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid report configuration',
            details: errors.array()
          }
        });
      }

      const reportConfig = {
        ...req.body,
        id: `RPT_${Date.now()}`,
        generatedBy: req.user.id,
        generatedAt: new Date().toISOString()
      };

      const result = await reportingService.generateReport(reportConfig);
      
      res.json({
        success: true,
        data: {
          reportId: reportConfig.id,
          filename: result.filename,
          size: result.size,
          downloadUrl: `/api/v1/analytics/reports/${reportConfig.id}/download`
        }
      });
    } catch (error) {
      logger.error('Error generating report', 'ANALYTICS_API', error);
      res.status(500).json({
        error: {
          code: 'REPORT_GENERATION_FAILED',
          message: 'Failed to generate report'
        }
      });
    }
  }
);

// Schedule automated report
router.post('/reports/schedule',
  auth,
  requireAdmin,
  [
    body('name').notEmpty().withMessage('Report name is required'),
    body('schedule').isIn(['daily', 'weekly', 'monthly', 'quarterly']).withMessage('Invalid schedule'),
    body('format').isIn(['pdf', 'excel', 'csv']).withMessage('Invalid format'),
    body('sections').isArray().withMessage('Sections must be an array'),
    body('recipients').isArray().withMessage('Recipients must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid schedule configuration',
            details: errors.array()
          }
        });
      }

      const scheduleConfig = {
        ...req.body,
        id: `SCH_${Date.now()}`,
        createdBy: req.user.id,
        createdAt: new Date().toISOString()
      };

      const result = await reportingService.scheduleReport(scheduleConfig);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error scheduling report', 'ANALYTICS_API', error);
      res.status(500).json({
        error: {
          code: 'SCHEDULE_FAILED',
          message: 'Failed to schedule report'
        }
      });
    }
  }
);

// Get scheduled reports
router.get('/reports/scheduled',
  auth,
  requireAdmin,
  async (req, res) => {
    try {
      const scheduledReports = await reportingService.getScheduledReports();
      
      res.json({
        success: true,
        data: scheduledReports
      });
    } catch (error) {
      logger.error('Error fetching scheduled reports', 'ANALYTICS_API', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch scheduled reports'
        }
      });
    }
  }
);

// Unschedule report
router.delete('/reports/scheduled/:reportId',
  auth,
  requireAdmin,
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const result = await reportingService.unscheduleReport(reportId);
      
      if (result) {
        res.json({
          success: true,
          message: 'Report unscheduled successfully'
        });
      } else {
        res.status(404).json({
          error: {
            code: 'REPORT_NOT_FOUND',
            message: 'Scheduled report not found'
          }
        });
      }
    } catch (error) {
      logger.error('Error unscheduling report', 'ANALYTICS_API', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to unschedule report'
        }
      });
    }
  }
);

// Export data
router.get('/export',
  auth,
  requireAdmin,
  query('format').isIn(['json', 'csv', 'excel']).withMessage('Invalid format'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid export parameters',
            details: errors.array()
          }
        });
      }

      const format = req.query.format || 'json';
      const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
      
      const result = await reportingService.exportData(format, filters);
      
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } catch (error) {
      logger.error('Error exporting data', 'ANALYTICS_API', error);
      res.status(500).json({
        error: {
          code: 'EXPORT_FAILED',
          message: 'Failed to export data'
        }
      });
    }
  }
);

// Clear analytics cache
router.post('/cache/clear',
  auth,
  requireAdmin,
  async (req, res) => {
    try {
      analyticsService.clearCache();
      
      res.json({
        success: true,
        message: 'Analytics cache cleared successfully'
      });
    } catch (error) {
      logger.error('Error clearing cache', 'ANALYTICS_API', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to clear cache'
        }
      });
    }
  }
);

module.exports = router;