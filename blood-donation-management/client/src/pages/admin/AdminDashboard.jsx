import React, { useState, useEffect } from 'react';
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
import logger from '../../utils/logger';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 0,
    pendingRequests: 0,
    systemHealth: 100
  });

  useEffect(() => {
    logger.componentMount('AdminDashboard');
    fetchDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(updateRealTimeData, 5000);
    
    return () => {
      clearInterval(interval);
      logger.componentUnmount('AdminDashboard');
    };
  }, [selectedTimeRange]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Mock data - in real app, this would be API calls
      const mockData = {
        overview: {
          totalDonors: 1247,
          activeDonors: 892,
          pendingVerifications: 23,
          totalRequests: 156,
          activeRequests: 12,
          fulfilledRequests: 134,
          criticalRequests: 3,
          systemUptime: 99.9,
          responseTime: 180 // ms
        },
        recentActivity: [
          {
            id: 1,
            type: 'new_donor',
            title: 'New Donor Registration',
            description: 'John Smith registered as O+ donor',
            timestamp: '2024-01-20T10:30:00Z',
            priority: 'normal',
            location: 'New Delhi'
          },
          {
            id: 2,
            type: 'urgent_request',
            title: 'Critical Blood Request',
            description: 'AB- blood needed at AIIMS Hospital',
            timestamp: '2024-01-20T10:25:00Z',
            priority: 'critical',
            location: 'AIIMS, Delhi'
          },
          {
            id: 3,
            type: 'donation_completed',
            title: 'Donation Completed',
            description: 'Sarah Johnson completed O+ donation',
            timestamp: '2024-01-20T10:20:00Z',
            priority: 'normal',
            location: 'Red Cross Blood Bank'
          },
          {
            id: 4,
            type: 'system_alert',
            title: 'Low Inventory Alert',
            description: 'B- blood stock below threshold',
            timestamp: '2024-01-20T10:15:00Z',
            priority: 'high',
            location: 'Central Blood Bank'
          }
        ],
        activeRequests: [
          {
            id: 'BR001',
            bloodType: 'AB-',
            urgency: 'critical',
            hospital: 'AIIMS Hospital',
            location: [28.5672, 77.2100],
            timeRemaining: '2h 15m',
            donorsNotified: 45,
            responses: 8,
            status: 'active'
          },
          {
            id: 'BR002',
            bloodType: 'O+',
            urgency: 'urgent',
            hospital: 'Safdarjung Hospital',
            location: [28.5706, 77.2081],
            timeRemaining: '6h 30m',
            donorsNotified: 32,
            responses: 12,
            status: 'matched'
          },
          {
            id: 'BR003',
            bloodType: 'B+',
            urgency: 'scheduled',
            hospital: 'Apollo Hospital',
            location: [28.5355, 77.2803],
            timeRemaining: '1d 4h',
            donorsNotified: 18,
            responses: 6,
            status: 'active'
          }
        ],
        systemMetrics: {
          serverHealth: 98,
          databaseHealth: 99,
          whatsappService: 95,
          smsService: 97,
          emailService: 100,
          averageResponseTime: 180,
          errorRate: 0.2,
          throughput: 1250 // requests per hour
        },
        geographicData: [
          {
            region: 'Central Delhi',
            coordinates: [28.6139, 77.2090],
            activeDonors: 234,
            activeRequests: 4,
            responseRate: 89
          },
          {
            region: 'South Delhi',
            coordinates: [28.5355, 77.2803],
            activeDonors: 189,
            activeRequests: 3,
            responseRate: 94
          },
          {
            region: 'North Delhi',
            coordinates: [28.7041, 77.1025],
            activeDonors: 156,
            activeRequests: 2,
            responseRate: 82
          }
        ]
      };

      setDashboardData(mockData);
      logger.success('Admin dashboard data loaded', 'ADMIN_DASHBOARD');
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
                            className={`h-2 rounded-full transition-all duration-300 ${
                              value >= 95 ? 'bg-green-500' : value >= 85 ? 'bg-yellow-500' : 'bg-red-500'
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
                  <Button size="sm" onClick={() => window.location.href = '/admin/donors/verification'}>
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
                <Button variant="outline" size="sm">
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
      </div>
    </div>
  );
};

export default AdminDashboard;