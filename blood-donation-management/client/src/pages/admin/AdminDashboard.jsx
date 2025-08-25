import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Droplet,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Bell,
  Settings,
  Phone,
  Shield
} from 'lucide-react';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Map from '../../components/ui/Map';
import Tabs from '../../components/ui/Tabs';
import DonorManagement from '../../components/admin/DonorManagement';
import logger from '../../utils/logger';
import { adminApi } from '../../utils/api';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 0,
    pendingRequests: 0,
    systemHealth: 100
  });
  const [emailStatus, setEmailStatus] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [notifSettings, setNotifSettings] = useState(null);
  const [channelOrder, setChannelOrder] = useState(['push', 'email']);
  const [escalateWhatsApp, setEscalateWhatsApp] = useState([]);
  const [escalateSMS, setEscalateSMS] = useState([]);
  const [escalateAfterMs, setEscalateAfterMs] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchNotificationSettings = async () => {
    try {
      const res = await adminApi.getNotificationSettings();
      const s = res?.data || null;
      setNotifSettings(s);
      if (s) {
        setChannelOrder(s.channelOrder || ['push', 'email']);
        setEscalateWhatsApp(s.escalateToWhatsAppOnPriority || []);
        setEscalateSMS(s.escalateToSMSOnPriority || []);
        setEscalateAfterMs(s.escalateAfterMs || 0);
      }
    } catch (e) {
      logger.warn('Failed to fetch notification settings', 'ADMIN_DASHBOARD', e);
    }
  };

  const handleToggleWhatsApp = async () => {
    try {
      const updated = await adminApi.updateNotificationSettings({ enableWhatsApp: !(notifSettings?.enableWhatsApp) });
      setNotifSettings(updated?.data || notifSettings);
    } catch (e) {
      logger.error('Failed to update notification settings', 'ADMIN_DASHBOARD', e);
    }
  };

  const handleToggleSMS = async () => {
    try {
      const updated = await adminApi.updateNotificationSettings({ enableSMS: !(notifSettings?.enableSMS) });
      setNotifSettings(updated?.data || notifSettings);
    } catch (e) {
      logger.error('Failed to update notification settings', 'ADMIN_DASHBOARD', e);
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      const payload = {
        channelOrder,
        escalateToWhatsAppOnPriority: escalateWhatsApp,
        escalateToSMSOnPriority: escalateSMS,
        escalateAfterMs
      };
      const updated = await adminApi.updateNotificationSettings(payload);
      setNotifSettings(updated?.data || notifSettings);
      logger.success('Notification settings updated', 'ADMIN_DASHBOARD');
    } catch (e) {
      logger.error('Failed to save notification settings', 'ADMIN_DASHBOARD', e);
    }
  };

  useEffect(() => {
    logger.componentMount('AdminDashboard');
    fetchDashboardData();
    fetchEmailStatus();
    fetchNotificationSettings();

    // Set up real-time updates
    const interval = setInterval(updateRealTimeData, 5000);

    return () => {
      clearInterval(interval);
      logger.componentUnmount('AdminDashboard');
    };
  }, [selectedTimeRange]);
  const fetchEmailStatus = async () => {
    try {
      const res = await adminApi.getEmailStatus();
      setEmailStatus(res?.data || null);
    } catch (e) {
      logger.warn('Failed to fetch email status', 'ADMIN_DASHBOARD', e);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) return;
    try {
      const res = await adminApi.sendTestEmail(testEmail);
      if (res?.data?.success) {
        logger.success('Test email sent', 'ADMIN_DASHBOARD');
      } else {
        logger.warn('Test email request did not succeed', 'ADMIN_DASHBOARD', res);
      }
    } catch (e) {
      logger.error('Failed to send test email', 'ADMIN_DASHBOARD', e);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);

    try {
      const [donorStatsRes, pendingRes, activityRes, requestsRes] = await Promise.all([
        adminApi.getDonorStats(),
        adminApi.getPendingDonors(),
        adminApi.getRecentActivity(),
        adminApi.getRequestsSummary()
      ]);

      const overview = {
        totalDonors: donorStatsRes?.data?.stats?.total || 0,
        activeDonors: donorStatsRes?.data?.stats?.active || 0,
        pendingVerifications: pendingRes?.data?.count || 0,
        totalRequests: requestsRes?.data?.overview?.totalRequests || 0,
        activeRequests: requestsRes?.data?.overview?.activeRequests || 0,
        fulfilledRequests: requestsRes?.data?.overview?.fulfilledRequests || 0,
        criticalRequests: requestsRes?.data?.overview?.criticalRequests || 0,
        systemUptime: 99,
        responseTime: 0
      };

      const recentActivity = (activityRes?.data?.recent || []).map((e, i) => ({
        id: e._id || i,
        type: e.event || 'system',
        title: e.event || 'Event',
        description: e.details || e.message || '',
        timestamp: e.timestamp || e.createdAt,
        priority: (e.success === false ? 'high' : 'normal'),
        location: e.metadata?.location || '—'
      }));

      const activeRequests = (requestsRes?.data?.activeRequests || []).map((r) => ({
        id: r.requestId,
        bloodType: r.patient?.bloodType,
        urgency: r.request?.urgency,
        hospital: r.location?.hospital?.name,
        location: [
          r.location?.hospital?.coordinates?.coordinates?.[1] ?? 0,
          r.location?.hospital?.coordinates?.coordinates?.[0] ?? 0
        ],
        timeRemaining: '—',
        donorsNotified: r.matching?.totalNotified || 0,
        responses: r.matching?.totalResponded || 0,
        status: r.status
      }));

      const systemMetrics = {
        serverHealth: 99.8,
        databaseHealth: 99,
        whatsappService: 95,
        smsService: 97,
        emailService: 100,
        averageResponseTime: 0,
        errorRate: 0,
        throughput: 0
      };

      const geographicData = [];

      setDashboardData({ overview, recentActivity, activeRequests, systemMetrics, geographicData });
      logger.success('Admin dashboard data loaded (API)', 'ADMIN_DASHBOARD');
    } catch (error) {
      logger.error('Error fetching dashboard data', 'ADMIN_DASHBOARD', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRealTimeData = () => {
    setRealTimeData(prev => ({
      activeUsers: prev.activeUsers + Math.floor(Math.random() * 3) - 1,
      pendingRequests: Math.max(0, prev.pendingRequests + Math.floor(Math.random() * 2) - 1),
      systemHealth: Math.max(95, Math.min(100, prev.systemHealth + (Math.random() - 0.5) * 2))
    }));
  };

  const getActivityIcon = (type) => {
    const icons = {
      new_donor: Users,
      urgent_request: AlertTriangle,
      donation_completed: CheckCircle,
      system_alert: Bell
    };
    return icons[type] || Activity;
  };

  const getActivityColor = (priority) => {
    const colors = {
      critical: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      high: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
      normal: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    };
    return colors[priority] || colors.normal;
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: 'red',
      urgent: 'orange',
      scheduled: 'blue'
    };
    return colors[urgency] || 'gray';
  };

  const getMapMarkers = () => {
    if (!dashboardData) return [];

    return [
      // Active requests
      ...dashboardData.activeRequests.map(request => ({
        position: request.location,
        title: `${request.bloodType} Request`,
        description: `${request.hospital} • ${request.urgency}`,
        type: 'request',
        color: request.urgency === 'critical' ? '#dc2626' : request.urgency === 'urgent' ? '#ea580c' : '#2563eb',
        icon: '🩸'
      })),
      // Geographic data
      ...dashboardData.geographicData.map(region => ({
        position: region.coordinates,
        title: region.region,
        description: `${region.activeDonors} donors • ${region.activeRequests} requests`,
        type: 'region',
        color: '#16a34a',
        icon: '📍'
      }))
    ];
  };

  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Real-time system monitoring and management
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Select
              value={selectedTimeRange}
              onChange={setSelectedTimeRange}
              options={timeRangeOptions}
              className="w-40"
            />

            <Button variant="outline" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Button>

            <Button className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Alerts</span>
              {dashboardData?.overview.criticalRequests > 0 && (
                <Badge variant="red" size="sm">
                  {dashboardData.overview.criticalRequests}
                </Badge>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs
            tabs={[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'donors', label: 'Donor Management', icon: Users, count: dashboardData?.overview.totalDonors },
              { id: 'requests', label: 'Blood Requests', icon: Droplet, count: dashboardData?.overview.activeRequests },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="default"
            size="md"
          />
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Dashboard</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('donors')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'donors'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>View All Donors</span>
                </div>
              </button>
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Key Metrics */}
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
                      <p className="text-sm text-blue-700 dark:text-blue-300">Active Donors</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {dashboardData?.overview.activeDonors.toLocaleString()}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {realTimeData.activeUsers} online now
                      </p>
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
                      <p className="text-sm text-red-700 dark:text-red-300">Active Requests</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                        {dashboardData?.overview.activeRequests}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {dashboardData?.overview.criticalRequests} critical
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
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-300">Success Rate</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {Math.round((dashboardData?.overview.fulfilledRequests / dashboardData?.overview.totalRequests) * 100)}%
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {dashboardData?.overview.fulfilledRequests} fulfilled
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
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-700 dark:text-purple-300">System Health</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {realTimeData.systemHealth.toFixed(1)}%
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        {dashboardData?.overview.responseTime}ms avg
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Geographic Map */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2"
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Real-time Activity Map
                    </h2>
                    <div className="flex items-center space-x-4">
                      <Badge variant="red">
                        {dashboardData?.activeRequests.length} Active Requests
                      </Badge>
                      <Badge variant="green">
                        {dashboardData?.geographicData.length} Regions
                      </Badge>
                    </div>
                  </div>

                  <Map
                    center={[28.6139, 77.2090]}
                    zoom={10}
                    height="400px"
                    markers={getMapMarkers()}
                    showSearch={false}
                    showControls={true}
                    showCurrentLocation={false}
                  />
                </Card>
              </motion.div>

              {/* System Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-6"
              >
                {/* System Health */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    System Health
                  </h3>

                  <div className="space-y-4">
                    {Object.entries(dashboardData?.systemMetrics || {}).slice(0, 5).map(([key, value]) => {
                      const isPercentage = ['serverHealth', 'databaseHealth', 'whatsappService', 'smsService', 'emailService'].includes(key);
                      const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {displayName}
                            </span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {isPercentage ? `${value}%` : value}
                            </span>
                          </div>
                          {isPercentage && (
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${value >= 95 ? 'bg-green-500' : value >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                style={{ width: `${value}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Pending Actions & Quick Tools */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Quick Actions
                    </h3>
                    <Badge variant="yellow">
                      {dashboardData?.overview.pendingVerifications}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            Donor Verifications
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {dashboardData?.overview.pendingVerifications} pending
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => (window.location.href = '/admin/verification')}>
                        Review
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            Emergency Requests
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {dashboardData?.overview.criticalRequests} critical
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-300">
                        Coordinate
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Bell className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            Bulk Operations
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Manage multiple donors
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Manage
                      </Button>
                    </div>
                    {/* Email Diagnostics */}
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              Email Diagnostics
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {emailStatus?.ready ? 'Configured' : 'Not configured'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          placeholder="test@example.com"
                          className="flex-1 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        />
                        <Button size="sm" onClick={handleSendTestEmail}>Send Test</Button>
                      </div>
                    </div>
                    {/* Notification Settings (Admin) */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Notification Channels</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Default: Push → Email. Escalate via WhatsApp/SMS if enabled.</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <Button size="sm" variant={notifSettings?.enableWhatsApp ? 'default' : 'outline'} onClick={handleToggleWhatsApp}>
                          {notifSettings?.enableWhatsApp ? 'Disable WhatsApp' : 'Enable WhatsApp'}
                        </Button>
                        <Button size="sm" variant={notifSettings?.enableSMS ? 'default' : 'outline'} onClick={handleToggleSMS}>
                          {notifSettings?.enableSMS ? 'Disable SMS' : 'Enable SMS'}
                        </Button>
                      </div>
                      {/* Channel order and escalation */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Channel order</p>
                          <div className="flex flex-wrap gap-2">
                            {['push', 'email', 'whatsapp', 'sms'].map((ch) => (
                              <span key={ch}
                                className={`px-2 py-1 rounded border text-xs cursor-pointer ${channelOrder.includes(ch) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}
                                onClick={() => {
                                  setChannelOrder((prev) => {
                                    const exists = prev.includes(ch);
                                    if (!exists) return [...prev, ch];
                                    return [ch, ...prev.filter((p) => p !== ch)];
                                  });
                                }}
                              >
                                {ch.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Escalate WhatsApp on</p>
                            <div className="flex gap-2 text-xs">
                              {['critical', 'urgent', 'normal'].map((u) => (
                                <span key={u}
                                  className={`px-2 py-1 rounded border cursor-pointer ${escalateWhatsApp.includes(u) ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}
                                  onClick={() => setEscalateWhatsApp((prev) => prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u])}
                                >
                                  {u}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Escalate SMS on</p>
                            <div className="flex gap-2 text-xs">
                              {['critical', 'urgent', 'normal'].map((u) => (
                                <span key={u}
                                  className={`px-2 py-1 rounded border cursor-pointer ${escalateSMS.includes(u) ? 'bg-yellow-600 text-white border-yellow-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}
                                  onClick={() => setEscalateSMS((prev) => prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u])}
                                >
                                  {u}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Escalate after (ms)</p>
                          <input type="number" className="w-full px-2 py-1 rounded border text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                            value={escalateAfterMs}
                            onChange={(e) => setEscalateAfterMs(parseInt(e.target.value || '0', 10))}
                            min={0}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button size="sm" onClick={handleSaveNotificationSettings}>Save</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Recent Activity & Active Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Recent Activity
                    </h2>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {dashboardData?.recentActivity.map((activity, index) => {
                      const IconComponent = getActivityIcon(activity.type);
                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-start space-x-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActivityColor(activity.priority)}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-slate-900 dark:text-white">
                              {activity.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {activity.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{activity.location}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>

              {/* Active Requests */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Active Blood Requests
                    </h2>
                    <Button variant="outline" size="sm" onClick={() => (window.location.href = '/admin/requests')}>
                      Manage All
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {dashboardData?.activeRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                              <Droplet className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900 dark:text-white">
                                {request.bloodType} Blood Request
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {request.hospital}
                              </p>
                            </div>
                          </div>
                          <Badge variant={getUrgencyColor(request.urgency)}>
                            {request.urgency}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600 dark:text-slate-400">Time Left</p>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {request.timeRemaining}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600 dark:text-slate-400">Notified</p>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {request.donorsNotified}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600 dark:text-slate-400">Responses</p>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {request.responses}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <Badge variant={request.status === 'matched' ? 'green' : 'blue'}>
                            {request.status}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Phone className="h-3 w-3 mr-1" />
                              Call
                            </Button>
                            <Button size="sm">
                              <MapPin className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>
          </>
        )}

        {/* Blood Requests Tab Content */}
        {activeTab === 'requests' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Blood Request Management
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Blood request management functionality will be implemented here.
              </p>
            </Card>
          </motion.div>
        )}

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Analytics & Reports
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Advanced analytics and reporting functionality will be implemented here.
              </p>
            </Card>
          </motion.div>
        )}

        {/* Donors Tab Content */}
        {activeTab === 'donors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DonorManagement />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;