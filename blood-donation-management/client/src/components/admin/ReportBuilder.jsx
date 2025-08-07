import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Minus, 
  Calendar, 
  Filter, 
  Download,
  Eye,
  Save,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Table,
  FileText,
  Mail,
  Clock,
  Users,
  Droplet,
  MapPin,
  Target,
  TrendingUp,
  CheckCircle,
  X
} from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Select from '../ui/Select';
import logger from '../../utils/logger';

const ReportBuilder = ({ onSave, onCancel, className = '' }) => {
  const [reportConfig, setReportConfig] = useState({
    name: '',
    description: '',
    type: 'custom',
    schedule: 'manual',
    format: 'pdf',
    sections: [],
    filters: {
      dateRange: {
        type: 'last_30_days',
        startDate: '',
        endDate: ''
      },
      regions: [],
      bloodTypes: [],
      donorTypes: []
    },
    recipients: [],
    settings: {
      includeCharts: true,
      includeDetails: true,
      includeComparisons: false,
      pageBreaks: true,
      watermark: true
    }
  });

  const [availableSections, setAvailableSections] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    initializeAvailableSections();
  }, []);

  const initializeAvailableSections = () => {
    const sections = [
      {
        id: 'overview',
        name: 'Executive Summary',
        description: 'High-level metrics and key performance indicators',
        icon: TrendingUp,
        type: 'summary',
        required: false
      },
      {
        id: 'donations',
        name: 'Donation Analytics',
        description: 'Detailed donation trends and statistics',
        icon: Droplet,
        type: 'chart',
        required: false
      },
      {
        id: 'donors',
        name: 'Donor Demographics',
        description: 'Donor profiles, engagement, and retention metrics',
        icon: Users,
        type: 'chart',
        required: false
      },
      {
        id: 'requests',
        name: 'Request Analysis',
        description: 'Blood request patterns and fulfillment rates',
        icon: Target,
        type: 'chart',
        required: false
      },
      {
        id: 'geographic',
        name: 'Geographic Distribution',
        description: 'Regional performance and coverage analysis',
        icon: MapPin,
        type: 'map',
        required: false
      },
      {
        id: 'performance',
        name: 'Performance Metrics',
        description: 'Response times, efficiency, and system health',
        icon: BarChart3,
        type: 'metrics',
        required: false
      },
      {
        id: 'trends',
        name: 'Trend Analysis',
        description: 'Historical trends and forecasting',
        icon: LineChart,
        type: 'chart',
        required: false
      },
      {
        id: 'detailed_data',
        name: 'Detailed Data Tables',
        description: 'Raw data tables with filtering and sorting',
        icon: Table,
        type: 'table',
        required: false
      }
    ];

    setAvailableSections(sections);
  };

  const handleAddSection = (sectionId) => {
    const section = availableSections.find(s => s.id === sectionId);
    if (section && !reportConfig.sections.find(s => s.id === sectionId)) {
      setReportConfig(prev => ({
        ...prev,
        sections: [...prev.sections, {
          ...section,
          order: prev.sections.length,
          settings: {
            chartType: 'bar',
            showComparisons: false,
            includeSubtotals: true,
            pageBreak: false
          }
        }]
      }));
    }
  };

  const handleRemoveSection = (sectionId) => {
    setReportConfig(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }));
  };

  const handleMoveSectionUp = (index) => {
    if (index > 0) {
      setReportConfig(prev => {
        const newSections = [...prev.sections];
        [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
        return { ...prev, sections: newSections };
      });
    }
  };

  const handleMoveSectionDown = (index) => {
    if (index < reportConfig.sections.length - 1) {
      setReportConfig(prev => {
        const newSections = [...prev.sections];
        [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
        return { ...prev, sections: newSections };
      });
    }
  };

  const handleSectionSettingChange = (sectionId, setting, value) => {
    setReportConfig(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, settings: { ...section.settings, [setting]: value } }
          : section
      )
    }));
  };

  const handleAddRecipient = () => {
    const email = prompt('Enter email address:');
    if (email && email.includes('@')) {
      setReportConfig(prev => ({
        ...prev,
        recipients: [...prev.recipients, { email, name: email.split('@')[0] }]
      }));
    }
  };

  const handleRemoveRecipient = (email) => {
    setReportConfig(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r.email !== email)
    }));
  };

  const handleSaveReport = async () => {
    if (!reportConfig.name.trim()) {
      logger.warning('Please enter a report name', 'REPORT_BUILDER');
      return;
    }

    if (reportConfig.sections.length === 0) {
      logger.warning('Please add at least one section to the report', 'REPORT_BUILDER');
      return;
    }

    setIsSaving(true);

    try {
      const endpoint = reportConfig.schedule === 'manual' 
        ? '/api/v1/analytics/reports/generate'
        : '/api/v1/analytics/reports/schedule';
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportConfig)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save report template');
      }
      
      const result = await response.json();
      
      if (onSave) {
        await onSave(reportConfig);
      }
      
      logger.success('Report template saved successfully', 'REPORT_BUILDER');
    } catch (error) {
      logger.error('Error saving report template', 'REPORT_BUILDER', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewReport = () => {
    setIsPreviewMode(true);
    logger.ui('CLICK', 'PreviewReport', { reportName: reportConfig.name }, 'REPORT_BUILDER');
  };

  const scheduleOptions = [
    { value: 'manual', label: 'Manual Generation' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' }
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document' },
    { value: 'excel', label: 'Excel Spreadsheet' },
    { value: 'csv', label: 'CSV Data' },
    { value: 'html', label: 'HTML Report' }
  ];

  const dateRangeOptions = [
    { value: 'last_7_days', label: 'Last 7 days' },
    { value: 'last_30_days', label: 'Last 30 days' },
    { value: 'last_90_days', label: 'Last 3 months' },
    { value: 'last_year', label: 'Last year' },
    { value: 'custom', label: 'Custom range' }
  ];

  const chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'area', label: 'Area Chart' }
  ];

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Custom Report Builder
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Create custom reports with flexible sections and scheduling
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handlePreviewReport}
              disabled={reportConfig.sections.length === 0}
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </Button>
            
            <Button
              onClick={handleSaveReport}
              loading={isSaving}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Template</span>
            </Button>
            
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Report Information
              </h3>
              
              <div className="space-y-4">
                <Input
                  label="Report Name"
                  value={reportConfig.name}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter report name..."
                  required
                />
                
                <Input
                  label="Description"
                  value={reportConfig.description}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the report..."
                  multiline
                  rows={2}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Schedule"
                    value={reportConfig.schedule}
                    onChange={(value) => setReportConfig(prev => ({ ...prev, schedule: value }))}
                    options={scheduleOptions}
                  />
                  
                  <Select
                    label="Format"
                    value={reportConfig.format}
                    onChange={(value) => setReportConfig(prev => ({ ...prev, format: value }))}
                    options={formatOptions}
                  />
                </div>
              </div>
            </Card>

            {/* Report Sections */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Report Sections
                </h3>
                <Badge variant="blue">
                  {reportConfig.sections.length} sections
                </Badge>
              </div>
              
              {/* Available Sections */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Available Sections
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableSections
                    .filter(section => !reportConfig.sections.find(s => s.id === section.id))
                    .map((section) => {
                      const Icon = section.icon;
                      return (
                        <button
                          key={section.id}
                          onClick={() => handleAddSection(section.id)}
                          className="p-3 text-left border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {section.name}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-400">
                                {section.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
              
              {/* Selected Sections */}
              {reportConfig.sections.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Selected Sections
                  </h4>
                  <div className="space-y-3">
                    {reportConfig.sections.map((section, index) => {
                      const Icon = section.icon;
                      return (
                        <div key={section.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-white">
                                  {section.name}
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                  {section.description}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveSectionUp(index)}
                                disabled={index === 0}
                              >
                                ↑
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveSectionDown(index)}
                                disabled={index === reportConfig.sections.length - 1}
                              >
                                ↓
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSection(section.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Section Settings */}
                          {section.type === 'chart' && (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                              <div className="grid grid-cols-2 gap-3">
                                <Select
                                  label="Chart Type"
                                  value={section.settings.chartType}
                                  onChange={(value) => handleSectionSettingChange(section.id, 'chartType', value)}
                                  options={chartTypeOptions}
                                  size="sm"
                                />
                                <div className="flex items-center space-x-2 pt-6">
                                  <input
                                    type="checkbox"
                                    id={`comparisons-${section.id}`}
                                    checked={section.settings.showComparisons}
                                    onChange={(e) => handleSectionSettingChange(section.id, 'showComparisons', e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <label
                                    htmlFor={`comparisons-${section.id}`}
                                    className="text-xs text-slate-700 dark:text-slate-300"
                                  >
                                    Show comparisons
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

            {/* Filters */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Filters & Parameters
              </h3>
              
              <div className="space-y-4">
                <Select
                  label="Date Range"
                  value={reportConfig.filters.dateRange.type}
                  onChange={(value) => setReportConfig(prev => ({
                    ...prev,
                    filters: {
                      ...prev.filters,
                      dateRange: { ...prev.filters.dateRange, type: value }
                    }
                  }))}
                  options={dateRangeOptions}
                />
                
                {reportConfig.filters.dateRange.type === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Start Date"
                      type="date"
                      value={reportConfig.filters.dateRange.startDate}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        filters: {
                          ...prev.filters,
                          dateRange: { ...prev.filters.dateRange, startDate: e.target.value }
                        }
                      }))}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={reportConfig.filters.dateRange.endDate}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        filters: {
                          ...prev.filters,
                          dateRange: { ...prev.filters.dateRange, endDate: e.target.value }
                        }
                      }))}
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Report Settings */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Report Settings
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={reportConfig.settings.includeCharts}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      settings: { ...prev.settings, includeCharts: e.target.checked }
                    }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Include charts and visualizations
                  </span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={reportConfig.settings.includeDetails}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      settings: { ...prev.settings, includeDetails: e.target.checked }
                    }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Include detailed data tables
                  </span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={reportConfig.settings.includeComparisons}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      settings: { ...prev.settings, includeComparisons: e.target.checked }
                    }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Include period comparisons
                  </span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={reportConfig.settings.pageBreaks}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      settings: { ...prev.settings, pageBreaks: e.target.checked }
                    }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Add page breaks between sections
                  </span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={reportConfig.settings.watermark}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      settings: { ...prev.settings, watermark: e.target.checked }
                    }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Add watermark to pages
                  </span>
                </label>
              </div>
            </Card>

            {/* Recipients */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Recipients
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRecipient}
                  className="flex items-center space-x-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add</span>
                </Button>
              </div>
              
              {reportConfig.recipients.length > 0 ? (
                <div className="space-y-2">
                  {reportConfig.recipients.map((recipient) => (
                    <div key={recipient.email} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-slate-900 dark:text-white">
                          {recipient.email}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRecipient(recipient.email)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No recipients added. Reports will be available for download only.
                </p>
              )}
            </Card>

            {/* Schedule Info */}
            {reportConfig.schedule !== 'manual' && (
              <Card className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Schedule
                  </h3>
                </div>
                
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <p>This report will be generated {reportConfig.schedule}.</p>
                  {reportConfig.recipients.length > 0 && (
                    <p>Reports will be automatically sent to {reportConfig.recipients.length} recipient(s).</p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {isPreviewMode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-lg overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Report Preview: {reportConfig.name}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPreviewMode(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-6">
                    {/* Report Header */}
                    <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-4">
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {reportConfig.name}
                      </h1>
                      {reportConfig.description && (
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                          {reportConfig.description}
                        </p>
                      )}
                      <p className="text-sm text-slate-500 mt-2">
                        Generated on {new Date().toLocaleDateString()}
                      </p>
                    </div>

                    {/* Section Previews */}
                    {reportConfig.sections.map((section, index) => {
                      const Icon = section.icon;
                      return (
                        <div key={section.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                              {index + 1}. {section.name}
                            </h2>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            {section.description}
                          </p>
                          
                          {/* Mock content based on section type */}
                          {section.type === 'chart' && (
                            <div className="h-32 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center">
                              <span className="text-slate-500">
                                {section.settings.chartType.charAt(0).toUpperCase() + section.settings.chartType.slice(1)} Chart Preview
                              </span>
                            </div>
                          )}
                          
                          {section.type === 'table' && (
                            <div className="border border-slate-200 dark:border-slate-700 rounded">
                              <div className="grid grid-cols-4 gap-2 p-2 bg-slate-50 dark:bg-slate-700 text-xs font-medium">
                                <span>Date</span>
                                <span>Metric</span>
                                <span>Value</span>
                                <span>Change</span>
                              </div>
                              <div className="p-2 text-xs text-slate-600 dark:text-slate-400">
                                [Data table content would appear here]
                              </div>
                            </div>
                          )}
                          
                          {section.type === 'summary' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {['Metric 1', 'Metric 2', 'Metric 3', 'Metric 4'].map((metric) => (
                                <div key={metric} className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded">
                                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                                    1,234
                                  </div>
                                  <div className="text-xs text-slate-600 dark:text-slate-400">
                                    {metric}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ReportBuilder;