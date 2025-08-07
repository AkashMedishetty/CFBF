const cron = require('node-cron');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class ReportingService {
  constructor() {
    this.scheduledReports = new Map();
    this.initializeScheduler();
  }

  initializeScheduler() {
    // Initialize cron jobs for scheduled reports
    logger.info('Initializing report scheduler', 'REPORTING_SERVICE');
  }

  async generateReport(config) {
    try {
      logger.info(`Generating report: ${config.name}`, 'REPORTING_SERVICE');
      
      const data = await this.fetchReportData(config);
      let reportBuffer;

      switch (config.format) {
        case 'pdf':
          reportBuffer = await this.generatePDFReport(data, config);
          break;
        case 'excel':
          reportBuffer = await this.generateExcelReport(data, config);
          break;
        case 'csv':
          reportBuffer = await this.generateCSVReport(data, config);
          break;
        default:
          throw new Error(`Unsupported format: ${config.format}`);
      }

      // Save report file
      const filename = `${config.name}_${new Date().toISOString().split('T')[0]}.${config.format}`;
      const filepath = path.join(__dirname, '../reports', filename);
      
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, reportBuffer);

      // Send to recipients if configured
      if (config.recipients && config.recipients.length > 0) {
        await this.emailReport(config, filepath, filename);
      }

      logger.success(`Report generated successfully: ${filename}`, 'REPORTING_SERVICE');
      return { filename, filepath, size: reportBuffer.length };

    } catch (error) {
      logger.error('Error generating report', 'REPORTING_SERVICE', error);
      throw error;
    }
  }

  async fetchReportData(config) {
    // Mock data fetching - in real implementation, this would query the database
    const mockData = {
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
      demographics: {
        bloodTypes: [
          { type: 'O+', count: 4850, percentage: 31.4 },
          { type: 'A+', count: 3920, percentage: 25.4 },
          { type: 'B+', count: 2780, percentage: 18.0 },
          { type: 'AB+', count: 1560, percentage: 10.1 }
        ],
        ageGroups: [
          { range: '18-25', count: 3850, percentage: 25.0 },
          { range: '26-35', count: 5420, percentage: 35.1 },
          { range: '36-45', count: 3680, percentage: 23.9 }
        ]
      },
      geographic: {
        regions: [
          { name: 'North Delhi', donors: 3420, requests: 890, fulfillment: 94.2 },
          { name: 'South Delhi', donors: 2890, requests: 750, fulfillment: 96.8 }
        ]
      },
      performance: {
        responseMetrics: {
          averageResponseTime: 18,
          responseRate: 96.4,
          emergencyResponseTime: 8
        },
        donorEngagement: {
          activeRate: 56.8,
          retentionRate: 78.5,
          satisfactionScore: 4.6
        }
      }
    };

    return mockData;
  }

  async generatePDFReport(data, config) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Header
        doc.fontSize(20).text(config.name, 50, 50);
        doc.fontSize(12).text(config.description || '', 50, 80);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 100);

        let yPosition = 140;

        // Overview Section
        if (config.sections.some(s => s.id === 'overview')) {
          doc.fontSize(16).text('Executive Summary', 50, yPosition);
          yPosition += 30;

          doc.fontSize(12);
          doc.text(`Total Donors: ${data.overview.totalDonors.toLocaleString()}`, 50, yPosition);
          yPosition += 20;
          doc.text(`Total Donations: ${data.overview.totalDonations.toLocaleString()}`, 50, yPosition);
          yPosition += 20;
          doc.text(`Response Rate: ${data.overview.responseRate}%`, 50, yPosition);
          yPosition += 20;
          doc.text(`Lives Impacted: ${data.overview.livesImpacted.toLocaleString()}`, 50, yPosition);
          yPosition += 40;
        }

        // Demographics Section
        if (config.sections.some(s => s.id === 'donors')) {
          doc.fontSize(16).text('Blood Type Distribution', 50, yPosition);
          yPosition += 30;

          data.demographics.bloodTypes.forEach(type => {
            doc.fontSize(12).text(`${type.type}: ${type.count.toLocaleString()} (${type.percentage}%)`, 50, yPosition);
            yPosition += 20;
          });
          yPosition += 20;
        }

        // Performance Section
        if (config.sections.some(s => s.id === 'performance')) {
          doc.fontSize(16).text('Performance Metrics', 50, yPosition);
          yPosition += 30;

          doc.fontSize(12);
          doc.text(`Average Response Time: ${data.performance.responseMetrics.averageResponseTime} minutes`, 50, yPosition);
          yPosition += 20;
          doc.text(`Donor Retention Rate: ${data.performance.donorEngagement.retentionRate}%`, 50, yPosition);
          yPosition += 20;
          doc.text(`Satisfaction Score: ${data.performance.donorEngagement.satisfactionScore}/5`, 50, yPosition);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateExcelReport(data, config) {
    const workbook = new ExcelJS.Workbook();
    
    // Overview Sheet
    if (config.sections.some(s => s.id === 'overview')) {
      const overviewSheet = workbook.addWorksheet('Overview');
      
      overviewSheet.addRow(['Metric', 'Value']);
      overviewSheet.addRow(['Total Donors', data.overview.totalDonors]);
      overviewSheet.addRow(['Active Donors', data.overview.activeDonors]);
      overviewSheet.addRow(['Total Donations', data.overview.totalDonations]);
      overviewSheet.addRow(['Response Rate', `${data.overview.responseRate}%`]);
      overviewSheet.addRow(['Lives Impacted', data.overview.livesImpacted]);
      
      // Style the header
      overviewSheet.getRow(1).font = { bold: true };
      overviewSheet.columns = [
        { width: 20 },
        { width: 15 }
      ];
    }

    // Demographics Sheet
    if (config.sections.some(s => s.id === 'donors')) {
      const demoSheet = workbook.addWorksheet('Demographics');
      
      demoSheet.addRow(['Blood Type', 'Count', 'Percentage']);
      data.demographics.bloodTypes.forEach(type => {
        demoSheet.addRow([type.type, type.count, `${type.percentage}%`]);
      });
      
      demoSheet.getRow(1).font = { bold: true };
      demoSheet.columns = [
        { width: 12 },
        { width: 12 },
        { width: 12 }
      ];
    }

    // Geographic Sheet
    if (config.sections.some(s => s.id === 'geographic')) {
      const geoSheet = workbook.addWorksheet('Geographic');
      
      geoSheet.addRow(['Region', 'Donors', 'Requests', 'Fulfillment Rate']);
      data.geographic.regions.forEach(region => {
        geoSheet.addRow([region.name, region.donors, region.requests, `${region.fulfillment}%`]);
      });
      
      geoSheet.getRow(1).font = { bold: true };
      geoSheet.columns = [
        { width: 15 },
        { width: 10 },
        { width: 10 },
        { width: 15 }
      ];
    }

    return await workbook.xlsx.writeBuffer();
  }

  async generateCSVReport(data, config) {
    let csvContent = '';
    
    // Overview data
    if (config.sections.some(s => s.id === 'overview')) {
      csvContent += 'Overview Metrics\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Donors,${data.overview.totalDonors}\n`;
      csvContent += `Active Donors,${data.overview.activeDonors}\n`;
      csvContent += `Total Donations,${data.overview.totalDonations}\n`;
      csvContent += `Response Rate,${data.overview.responseRate}%\n`;
      csvContent += `Lives Impacted,${data.overview.livesImpacted}\n\n`;
    }

    // Demographics data
    if (config.sections.some(s => s.id === 'donors')) {
      csvContent += 'Blood Type Distribution\n';
      csvContent += 'Blood Type,Count,Percentage\n';
      data.demographics.bloodTypes.forEach(type => {
        csvContent += `${type.type},${type.count},${type.percentage}%\n`;
      });
      csvContent += '\n';
    }

    // Geographic data
    if (config.sections.some(s => s.id === 'geographic')) {
      csvContent += 'Geographic Distribution\n';
      csvContent += 'Region,Donors,Requests,Fulfillment Rate\n';
      data.geographic.regions.forEach(region => {
        csvContent += `${region.name},${region.donors},${region.requests},${region.fulfillment}%\n`;
      });
    }

    return Buffer.from(csvContent, 'utf8');
  }

  async emailReport(config, filepath, filename) {
    try {
      for (const recipient of config.recipients) {
        await emailService.sendEmail({
          to: recipient.email,
          subject: `Automated Report: ${config.name}`,
          html: `
            <h2>Blood Donation Management System Report</h2>
            <p>Dear ${recipient.name || 'Team'},</p>
            <p>Please find attached the automated report: <strong>${config.name}</strong></p>
            <p>Report Details:</p>
            <ul>
              <li>Generated: ${new Date().toLocaleDateString()}</li>
              <li>Format: ${config.format.toUpperCase()}</li>
              <li>Sections: ${config.sections.map(s => s.name).join(', ')}</li>
            </ul>
            <p>Best regards,<br>BDMS Analytics Team</p>
          `,
          attachments: [{
            filename,
            path: filepath
          }]
        });
      }
      
      logger.success(`Report emailed to ${config.recipients.length} recipients`, 'REPORTING_SERVICE');
    } catch (error) {
      logger.error('Error emailing report', 'REPORTING_SERVICE', error);
      throw error;
    }
  }

  scheduleReport(config) {
    try {
      const cronExpression = this.getCronExpression(config.schedule);
      
      const job = cron.schedule(cronExpression, async () => {
        logger.info(`Running scheduled report: ${config.name}`, 'REPORTING_SERVICE');
        try {
          await this.generateReport(config);
        } catch (error) {
          logger.error(`Error in scheduled report: ${config.name}`, 'REPORTING_SERVICE', error);
        }
      }, {
        scheduled: false
      });

      this.scheduledReports.set(config.id, {
        job,
        config,
        nextRun: job.nextDate()
      });

      job.start();
      logger.success(`Report scheduled: ${config.name} (${config.schedule})`, 'REPORTING_SERVICE');
      
      return {
        id: config.id,
        scheduled: true,
        nextRun: job.nextDate()
      };
    } catch (error) {
      logger.error('Error scheduling report', 'REPORTING_SERVICE', error);
      throw error;
    }
  }

  getCronExpression(schedule) {
    switch (schedule) {
      case 'daily':
        return '0 9 * * *'; // 9 AM daily
      case 'weekly':
        return '0 9 * * 1'; // 9 AM every Monday
      case 'monthly':
        return '0 9 1 * *'; // 9 AM on 1st of every month
      case 'quarterly':
        return '0 9 1 */3 *'; // 9 AM on 1st of every 3rd month
      default:
        throw new Error(`Unsupported schedule: ${schedule}`);
    }
  }

  unscheduleReport(reportId) {
    const scheduledReport = this.scheduledReports.get(reportId);
    if (scheduledReport) {
      scheduledReport.job.stop();
      this.scheduledReports.delete(reportId);
      logger.info(`Report unscheduled: ${reportId}`, 'REPORTING_SERVICE');
      return true;
    }
    return false;
  }

  getScheduledReports() {
    const reports = [];
    for (const [id, report] of this.scheduledReports) {
      reports.push({
        id,
        name: report.config.name,
        schedule: report.config.schedule,
        nextRun: report.nextRun,
        recipients: report.config.recipients.length
      });
    }
    return reports;
  }

  async exportData(format, filters = {}) {
    try {
      const data = await this.fetchReportData({ filters });
      
      switch (format) {
        case 'json':
          return {
            data: JSON.stringify(data, null, 2),
            contentType: 'application/json',
            filename: `bdms_export_${Date.now()}.json`
          };
        case 'csv':
          const csvBuffer = await this.generateCSVReport(data, { sections: [{ id: 'overview' }, { id: 'donors' }, { id: 'geographic' }] });
          return {
            data: csvBuffer,
            contentType: 'text/csv',
            filename: `bdms_export_${Date.now()}.csv`
          };
        case 'excel':
          const excelBuffer = await this.generateExcelReport(data, { sections: [{ id: 'overview' }, { id: 'donors' }, { id: 'geographic' }] });
          return {
            data: excelBuffer,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            filename: `bdms_export_${Date.now()}.xlsx`
          };
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      logger.error('Error exporting data', 'REPORTING_SERVICE', error);
      throw error;
    }
  }
}

module.exports = new ReportingService();