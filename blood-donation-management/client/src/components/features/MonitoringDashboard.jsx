/**
 * Monitoring Dashboard Component
 * Real-time monitoring and analytics dashboard
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Zap,
  Globe,
  Smartphone,
  Wifi,
  Info,
  Download
} from 'lucide-react';

import analytics from '../../utils/analytics';
import { useAnalytics } from '../../hooks/useAnalytics';

const MonitoringDashboard = () => {
  const { track } = useAnalytics();
  const [metrics, setMetrics] = useState({
    session: null,
    performance: null,
    engagement: null,
    realTime: {
      activeUsers: 0,
      pageViews: 0,
      errors: 0,
      notifications: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update every 30 seconds
    
    track('monitoring_dashboard_viewed');
    
    return () => clearInterval(interval);
  }, [track]);

  const loadMetrics = async () => {
    try {
      const sessionSummary = analytics.getSessionSummary();
      const performanceReport = analytics.getPerformanceReport();
      const engagementReport = analytics.getEngagementReport();
      
      // Simulate real-time metrics (in production, these would come from API)
      const realTimeMetrics = {
        activeUsers: Math.floor(Math.random() * 50) + 10,
        pageViews: sessionSummary.pageViews + Math.floor(Math.random() * 100),
        errors: Math.floor(Math.random() * 5),
        notifications: Math.floor(Math.random() * 20) + 5
      };

      setMetrics({
        session: sessionSummary,
        performance: performanceReport,
        engagement: engagementReport,
        realTime: realTimeMetrics
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      setIsLoading(false);
    }
  };

  const exportData = () => {
    const data = analytics.exportAnalyticsData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    track('analytics_data_exported');
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Utility function for formatting bytes (currently unused but kept for future use)
  // const formatBytes = (bytes) => {
  //   if (bytes === 0) return '0 Bytes';
  //   const k = 1024;
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Monitoring Dashboard
        </h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Live</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={exportData}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </motion.button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Real-time Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Active Users</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {metrics.realTime.activeUsers}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Page Views</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {metrics.realTime.pageViews}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-600 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Errors</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {metrics.realTime.errors}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Notifications</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {metrics.realTime.notifications}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Session Information */}
      {metrics.session && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Current Session
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h4 className="font-medium text-slate-900 dark:text-white">Duration</h4>
              </div>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                {formatDuration(metrics.session.duration)}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h4 className="font-medium text-slate-900 dark:text-white">Interactions</h4>
              </div>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                {metrics.session.interactions}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h4 className="font-medium text-slate-900 dark:text-white">Features Used</h4>
              </div>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                {metrics.session.featuresUsed.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {metrics.performance && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Performance Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.performance.webVitals.lcp && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                  Largest Contentful Paint
                </h4>
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  {Math.round(metrics.performance.webVitals.lcp)}ms
                </p>
                <div className={`text-xs mt-1 ${
                  metrics.performance.webVitals.lcp < 2500 ? 'text-green-600' : 
                  metrics.performance.webVitals.lcp < 4000 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.performance.webVitals.lcp < 2500 ? 'Good' : 
                   metrics.performance.webVitals.lcp < 4000 ? 'Needs Improvement' : 'Poor'}
                </div>
              </div>
            )}

            {metrics.performance.webVitals.fid && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                  First Input Delay
                </h4>
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  {Math.round(metrics.performance.webVitals.fid)}ms
                </p>
                <div className={`text-xs mt-1 ${
                  metrics.performance.webVitals.fid < 100 ? 'text-green-600' : 
                  metrics.performance.webVitals.fid < 300 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.performance.webVitals.fid < 100 ? 'Good' : 
                   metrics.performance.webVitals.fid < 300 ? 'Needs Improvement' : 'Poor'}
                </div>
              </div>
            )}

            {metrics.performance.webVitals.cls && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                  Cumulative Layout Shift
                </h4>
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  {metrics.performance.webVitals.cls.toFixed(3)}
                </p>
                <div className={`text-xs mt-1 ${
                  metrics.performance.webVitals.cls < 0.1 ? 'text-green-600' : 
                  metrics.performance.webVitals.cls < 0.25 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.performance.webVitals.cls < 0.1 ? 'Good' : 
                   metrics.performance.webVitals.cls < 0.25 ? 'Needs Improvement' : 'Poor'}
                </div>
              </div>
            )}

            {metrics.performance.pageLoadTime && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                  Page Load Time
                </h4>
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  {Math.round(metrics.performance.pageLoadTime)}ms
                </p>
                <div className={`text-xs mt-1 ${
                  metrics.performance.pageLoadTime < 2000 ? 'text-green-600' : 
                  metrics.performance.pageLoadTime < 4000 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.performance.pageLoadTime < 2000 ? 'Fast' : 
                   metrics.performance.pageLoadTime < 4000 ? 'Average' : 'Slow'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Engagement */}
      {metrics.engagement && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            User Engagement
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 dark:text-white mb-3">
                Engagement Score
              </h4>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(metrics.engagement.engagementScore / 10, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  {metrics.engagement.engagementScore}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 dark:text-white mb-3">
                Features Used
              </h4>
              <div className="flex flex-wrap gap-2">
                {metrics.engagement.featuresUsed.slice(0, 6).map((feature, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                  >
                    {feature}
                  </span>
                ))}
                {metrics.engagement.featuresUsed.length > 6 && (
                  <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                    +{metrics.engagement.featuresUsed.length - 6} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">PWA Status</p>
              <p className="text-xs text-green-700 dark:text-green-300">Active</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Wifi className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Connection</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {navigator.onLine ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Smartphone className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Device</p>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                {/Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'Mobile' : 'Desktop'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <Globe className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Location</p>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                {navigator.language || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Monitoring Features:</p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-400">
              <li>• Real-time user activity and engagement tracking</li>
              <li>• Core Web Vitals monitoring (LCP, FID, CLS)</li>
              <li>• PWA-specific metrics and offline capability tracking</li>
              <li>• Error monitoring and performance bottleneck detection</li>
              <li>• User journey analytics and conversion tracking</li>
              <li>• Notification delivery and response rate monitoring</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;