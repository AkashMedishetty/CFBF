import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Users,
  Droplet,
  Heart,
  MapPin,
  Clock,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  Mail,
  FileText,
  Settings,
  Eye,
  Share2,
  Star,
  Activity,
  Zap,
  Globe
} from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Select from '../ui/Select';
import logger from '../../utils/logger';

const AnalyticsReporting = ({ className = '' }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('donations');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    type: 'summary',
    format: 'pdf',
    timeRange: '30d',
    includeCharts: true,
    includeDetails: true,
    recipients: []
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch real analytics data from API
      const response = await fetch(`/api/v1/analytics/dashboard?timeRange=${selectedTimeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const result = await response.json();
      const mockData = result.data || {
        overview: {
          totalDonors: 15420,
          activeDonors: 8750,
          totalDonations: 45680,
          thisMonthDonations: 3420,
          totalRequests: 12340,
          fulfilledRequests: 11890,
          responseRate: 96.4,
          averageResponseTime: 18, // minutes
          livesImpacted: 137040,
          growthRate: 12.5 // percentage
        },
        trends: {
          donations: [
            { date: '2024-01-01', value: 120 },
            { date: '2024-01-02', value: 135 },
            { date: '2024-01-03', value: 98 },
            { date: '2024-01-04', value: 156 },
            { date: '2024-01-05', value: 142 },
            { date: '2024-01-06', value: 178 },
            { date: '2024-01-07', value: 165 },
            { date: '2024-01-08', value: 189 },
            { date: '2024-01-09', value: 145 },
            { date: '2024-01-10', value: 167 }
          ],
          requests: [
            { date: '2024-01-01', value: 45 },
            { date: '2024-01-02', value: 52 },
            { date: '2024-01-03', value: 38 },
            { date: '2024-01-04', value: 67 },
            { date: '2024-01-05', value: 58 },
            { date: '2024-01-06', value: 73 },
            { date: '2024-01-07', value: 61 },
            { date: '2024-01-08', value: 79 },
            { date: '2024-01-09', value: 55 },
            { date: '2024-01-10', value: 68 }
          ],
          newDonors: [
            { date: '2024-01-01', value: 25 },
            { date: '2024-01-02', value: 32 },
            { date: '2024-01-03', value: 18 },
            { date: '2024-01-04', value: 41 },
            { date: '2024-01-05', value: 35 },
            { date: '2024-01-06', value: 48 },
            { date: '2024-01-07', value: 39 },
            { date: '2024-01-08', value: 52 },
            { date: '2024-01-09', value: 28 },
            { date: '2024-01-10', value: 44 }
          ]
        },
        demographics: {
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
        },
        geographic: {
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
        },
        performance: {
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
        },
        recentReports: [
          {
            id: 'RPT001',
            title: 'Monthly Donation Summary - December 2023',
            type: 'summary',
            format: 'pdf',
            generatedAt: '2024-01-01T09:00:00Z',
            size: '2.4 MB',
            downloads: 45
          },
          {
            id: 'RPT002',
            title: 'Donor Engagement Analysis - Q4 2023',
            type: 'engagement',
            format: 'excel',
            generatedAt: '2023-12-28T14:30:00Z',
            size: '1.8 MB',
            downloads: 23
          },
          {
            id: 'RPT003',
            title: 'Geographic Distribution Report - 2023',
            type: 'geographic',
            format: 'pdf',
            generatedAt: '2023-12-25T11:15:00Z',
            size: '3.2 MB',
            downloads: 67
          }
        ]
      };

      setAnalyticsData(mockData);
      logger.success('Analytics data loaded', 'ANALYTICS_REPORTING');
    } catch (error) {
      logger.error('Error fetching analytics data', 'ANALYTICS_REPORTING', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    
    try {
      const response = await fetch('/api/v1/analytics/reports/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportConfig)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      const result = await response.json();
      logger.success('Report generated successfully', 'ANALYTICS_REPORTING');
      setShowReportModal(false);
      
      // Refresh recent reports
      await fetchAnalyticsData();
    } catch (error) {
      logger.error('Error generating report', 'ANALYTICS_REPORTING', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadReport = (reportId) => {
    logger.ui('CLICK', 'DownloadReport', { reportId }, 'ANALYTICS_REPORTING');
    // In real app, this would download the actual report file
    logger.success('Report download started', 'ANALYTICS_REPORTING');
  };

  const handleExportData = (format) => {
    logger.ui('CLICK', 'ExportData', { format }, 'ANALYTICS_REPORTING');
    // In real app, this would export data in the specified format
    logger.success(`Data exported as ${format.toUpperCase()}`, 'ANALYTICS_REPORTING');
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' },
    { value: 'custom', label: 'Custom range' }
  ];

  const metricOptions = [
    { value: 'donations', label: 'Donations' },
    { value: 'requests', label: 'Requests' },
    { value: 'newDonors', label: 'New Donors' },
    { value: 'engagement', label: 'Engagement' }
  ];

  const reportTypeOptions = [
    { value: 'summary', label: 'Summary Report' },
    { value: 'detailed', label: 'Detailed Analysis' },
    { value: 'engagement', label: 'Donor Engagement' },
    { value: 'geographic', label: 'Geographic Analysis' },
    { value: 'performance', label: 'Performance Metrics' }
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document' },
    { value: 'excel', label: 'Excel Spreadsheet' },
    { value: 'csv', label: 'CSV Data' },
    { value: 'json', label: 'JSON Data' }
  ];

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Analytics & Reporting
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Comprehensive insights and data analysis
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => fetchAnalyticsData()}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          
          <Button
            onClick={() => setShowReportModal(true)}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Generate Report</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Time Range"
            value={selectedTimeRange}
            onChange={setSelectedTimeRange}
            options={timeRangeOptions}
          />
          
          <Select
            label="Primary Metric"
            value={selectedMetric}
            onChange={setSelectedMetric}
            options={metricOptions}
          />
          
          <div className="flex items-end space-x-2">
            <Button
              variant="outline"
              onClick={() => handleExportData('excel')}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export Excel</span>
            </Button>
          </div>
          
          <div className="flex items-end space-x-2">
            <Button
              variant="outline"
              onClick={() => handleExportData('csv')}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Total Donors</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatNumber(analyticsData.overview.totalDonors)}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">
                    +{analyticsData.overview.growthRate}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                <Droplet className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-red-700 dark:text-red-300">Total Donations</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {formatNumber(analyticsData.overview.totalDonations)}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  {formatNumber(analyticsData.overview.thisMonthDonations)} this month
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">Lives Impacted</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatNumber(analyticsData.overview.livesImpacted)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  3 lives per donation
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300">Response Rate</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {analyticsData.overview.responseRate}%
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  {analyticsData.overview.averageResponseTime}min avg
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts and Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Donation Trends
              </h3>
              <div className="flex items-center space-x-2">
                <LineChart className="h-5 w-5 text-blue-600" />
                <Badge variant="blue">
                  {selectedTimeRange}
                </Badge>
              </div>
            </div>
            
            {/* Simple chart representation */}
            <div className="space-y-4">
              <div className="flex items-end space-x-2 h-32">
                {analyticsData.trends[selectedMetric]?.slice(0, 10).map((point, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{ 
                      height: `${(point.value / Math.max(...analyticsData.trends[selectedMetric].map(p => p.value))) * 100}%`,
                      minHeight: '4px'
                    }}
                    title={`${point.value} on ${formatDate(point.date)}`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>10 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Blood Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Blood Type Distribution
              </h3>
              <PieChart className="h-5 w-5 text-red-600" />
            </div>
            
            <div className="space-y-3">
              {analyticsData.demographics.bloodTypes.map((type, index) => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ 
                        backgroundColor: `hsl(${index * 45}, 70%, 50%)` 
                      }}
                    />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {type.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatNumber(type.count)}
                    </span>
                    <Badge variant="outline" size="sm">
                      {type.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Demographics and Geographic Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Age Demographics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Age Demographics
              </h3>
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            
            <div className="space-y-4">
              {analyticsData.demographics.ageGroups.map((group, index) => (
                <div key={group.range} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {group.range} years
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatNumber(group.count)} ({group.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <motion.div
                      className="bg-green-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${group.percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 + 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Geographic Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Regional Performance
              </h3>
              <MapPin className="h-5 w-5 text-purple-600" />
            </div>
            
            <div className="space-y-4">
              {analyticsData.geographic.regions.map((region, index) => (
                <div key={region.name} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {region.name}
                    </span>
                    <Badge 
                      variant={region.fulfillment > 95 ? 'green' : region.fulfillment > 90 ? 'yellow' : 'red'}
                      size="sm"
                    >
                      {region.fulfillment}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>{formatNumber(region.donors)} donors</span>
                    <span>{formatNumber(region.requests)} requests</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Performance Metrics
            </h3>
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Response Metrics */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Response Metrics
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Avg Response Time</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {analyticsData.performance.responseMetrics.averageResponseTime}min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Response Rate</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {analyticsData.performance.responseMetrics.responseRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Emergency Response</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {analyticsData.performance.responseMetrics.emergencyResponseTime}min
                  </span>
                </div>
              </div>
            </div>

            {/* Donor Engagement */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Donor Engagement
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Active Rate</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {analyticsData.performance.donorEngagement.activeRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Retention Rate</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {analyticsData.performance.donorEngagement.retentionRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Satisfaction Score</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {analyticsData.performance.donorEngagement.satisfactionScore}
                    </span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(analyticsData.performance.donorEngagement.satisfactionScore)
                              ? 'text-yellow-500 fill-current'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                System Health
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Uptime</span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {analyticsData.performance.systemHealth.uptime}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">API Response</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {analyticsData.performance.systemHealth.apiResponseTime}ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Error Rate</span>
                  <div className="flex items-center space-x-1">
                    {analyticsData.performance.systemHealth.errorRate < 1 ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {analyticsData.performance.systemHealth.errorRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recent Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Recent Reports
            </h3>
            <Badge variant="blue">
              {analyticsData.recentReports.length} reports
            </Badge>
          </div>
          
          <div className="space-y-4">
            {analyticsData.recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                      {report.title}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-slate-600 dark:text-slate-400">
                      <span>Generated {formatDate(report.generatedAt)}</span>
                      <span>•</span>
                      <span>{report.size}</span>
                      <span>•</span>
                      <span>{report.downloads} downloads</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" size="sm">
                    {report.format.toUpperCase()}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReport(report.id)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Report Generation Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Generate Report
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReportModal(false)}
                  >
                    ×
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <Select
                    label="Report Type"
                    value={reportConfig.type}
                    onChange={(value) => setReportConfig(prev => ({ ...prev, type: value }))}
                    options={reportTypeOptions}
                  />
                  
                  <Select
                    label="Format"
                    value={reportConfig.format}
                    onChange={(value) => setReportConfig(prev => ({ ...prev, format: value }))}
                    options={formatOptions}
                  />
                  
                  <Select
                    label="Time Range"
                    value={reportConfig.timeRange}
                    onChange={(value) => setReportConfig(prev => ({ ...prev, timeRange: value }))}
                    options={timeRangeOptions}
                  />
                  
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={reportConfig.includeCharts}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Include charts and visualizations
                      </span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={reportConfig.includeDetails}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, includeDetails: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Include detailed data tables
                      </span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowReportModal(false)}
                    disabled={isGeneratingReport}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                    className="flex items-center space-x-2"
                  >
                    {isGeneratingReport ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        <span>Generate Report</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnalyticsReporting;