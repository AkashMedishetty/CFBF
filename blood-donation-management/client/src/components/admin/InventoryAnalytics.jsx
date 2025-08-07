import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Filter,
  MapPin,
  Hospital,
  Droplet,
  BarChart3,
  PieChart,
  LineChart,
  Bell,
  ExternalLink,
  Calendar,
  Users,
  Activity
} from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Select from '../ui/Select';
import Input from '../ui/Input';
import logger from '../../utils/logger';

const InventoryAnalytics = ({ className = '' }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedBloodType, setSelectedBloodType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');

  useEffect(() => {
    fetchAnalyticsData();
    fetchAlerts();
  }, [selectedTimeRange, selectedBloodType, selectedRegion]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Mock analytics data - in real app, this would be API calls
      const mockData = {
        overview: {
          totalHospitals: 45,
          totalInventoryUnits: 2847,
          averageStockLevel: 63.2,
          criticalStockHospitals: 8,
          expiringUnitsNext7Days: 156,
          redistributionsPastMonth: 23
        },
        bloodTypeDistribution: [
          { type: 'O+', totalUnits: 892, hospitals: 42, avgUnits: 21.2, status: 'adequate' },
          { type: 'A+', totalUnits: 654, hospitals: 38, avgUnits: 17.2, status: 'adequate' },
          { type: 'B+', totalUnits: 445, hospitals: 35, avgUnits: 12.7, status: 'low' },
          { type: 'AB+', totalUnits: 234, hospitals: 28, avgUnits: 8.4, status: 'adequate' },
          { type: 'O-', totalUnits: 298, hospitals: 32, avgUnits: 9.3, status: 'critical' },
          { type: 'A-', totalUnits: 187, hospitals: 25, avgUnits: 7.5, status: 'low' },
          { type: 'B-', totalUnits: 89, hospitals: 18, avgUnits: 4.9, status: 'critical' },
          { type: 'AB-', totalUnits: 48, hospitals: 12, avgUnits: 4.0, status: 'critical' }
        ],
        regionalData: [
          { region: 'North Delhi', hospitals: 12, totalUnits: 756, avgStock: 63.0, alerts: 2 },
          { region: 'South Delhi', hospitals: 8, totalUnits: 542, avgStock: 67.8, alerts: 1 },
          { region: 'East Delhi', hospitals: 10, totalUnits: 489, avgStock: 48.9, alerts: 3 },
          { region: 'West Delhi', hospitals: 9, totalUnits: 623, avgStock: 69.2, alerts: 1 },
          { region: 'Central Delhi', hospitals: 6, totalUnits: 437, avgStock: 72.8, alerts: 1 }
        ],
        trends: {
          stockLevels: [
            { date: '2024-01-01', value: 2650 },
            { date: '2024-01-02', value: 2680 },
            { date: '2024-01-03', value: 2720 },
            { date: '2024-01-04', value: 2695 },
            { date: '2024-01-05', value: 2847 }
          ],
          redistributions: [
            { date: '2024-01-01', value: 5 },
            { date: '2024-01-02', value: 8 },
            { date: '2024-01-03', value: 12 },
            { date: '2024-01-04', value: 7 },
            { date: '2024-01-05', value: 9 }
          ]
        },
        topPerformingHospitals: [
          { name: 'AIIMS Delhi', stockLevel: 95.2, efficiency: 98.5, lastUpdate: '2024-01-15' },
          { name: 'Safdarjung Hospital', stockLevel: 87.3, efficiency: 94.2, lastUpdate: '2024-01-15' },
          { name: 'Max Hospital Saket', stockLevel: 82.1, efficiency: 91.8, lastUpdate: '2024-01-14' }
        ],
        criticalHospitals: [
          { name: 'Delhi Heart Institute', stockLevel: 23.4, criticalTypes: ['O-', 'AB-'], lastUpdate: '2024-01-14' },
          { name: 'Metro Hospital', stockLevel: 31.2, criticalTypes: ['B-'], lastUpdate: '2024-01-13' }
        ]
      };

      setAnalyticsData(mockData);
      logger.success('Inventory analytics loaded');
    } catch (error) {
      logger.error('Error fetching inventory analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      // Mock alert data - in real app, these would be separate API calls
      const mockLowStockAlerts = [
        {
          hospital: {
            id: 'H001',
            name: 'Delhi Heart Institute',
            contactInfo: { phone: '+91-9876543210' }
          },
          lowStockItems: [
            { bloodType: 'O-', unitsAvailable: 2, minimumThreshold: 10 },
            { bloodType: 'AB-', unitsAvailable: 1, minimumThreshold: 5 }
          ]
        },
        {
          hospital: {
            id: 'H002',
            name: 'Metro Hospital',
            contactInfo: { phone: '+91-9876543211' }
          },
          lowStockItems: [
            { bloodType: 'B-', unitsAvailable: 3, minimumThreshold: 8 }
          ]
        }
      ];

      const mockExpiryAlerts = [
        {
          hospital: {
            id: 'H003',
            name: 'City Hospital',
            contactInfo: { phone: '+91-9876543212' }
          },
          expiringSoonItems: [
            { bloodType: 'A+', expiringSoonCount: 5, daysUntilExpiry: 3 },
            { bloodType: 'O+', expiringSoonCount: 8, daysUntilExpiry: 5 }
          ]
        }
      ];

      setLowStockAlerts(mockLowStockAlerts);
      setExpiryAlerts(mockExpiryAlerts);
    } catch (error) {
      logger.error('Error fetching alerts:', error);
    }
  };

  const handleProcessExpiredInventory = async () => {
    try {
      const response = await fetch('/api/inventory/admin/process-expired', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        logger.success(`Processed ${result.data.totalExpiredUnits} expired units`);
        await fetchAnalyticsData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      logger.error('Error processing expired inventory:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'adequate': return 'green';
      case 'low': return 'yellow';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' }
  ];

  const bloodTypeOptions = [
    { value: 'all', label: 'All Blood Types' },
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  const regionOptions = [
    { value: 'all', label: 'All Regions' },
    { value: 'north', label: 'North Delhi' },
    { value: 'south', label: 'South Delhi' },
    { value: 'east', label: 'East Delhi' },
    { value: 'west', label: 'West Delhi' },
    { value: 'central', label: 'Central Delhi' }
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
            Inventory Analytics
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            System-wide blood inventory monitoring and analytics
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleProcessExpiredInventory}
            className="flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Process Expired</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => fetchAnalyticsData()}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
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
            label="Blood Type"
            value={selectedBloodType}
            onChange={setSelectedBloodType}
            options={bloodTypeOptions}
          />
          
          <Select
            label="Region"
            value={selectedRegion}
            onChange={setSelectedRegion}
            options={regionOptions}
          />
          
          <div className="flex items-end">
            <Button
              variant="outline"
              className="flex items-center space-x-2 w-full"
            >
              <Download className="h-4 w-4" />
              <span>Export Report</span>
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
                <Hospital className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Total Hospitals</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {analyticsData.overview.totalHospitals}
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
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">Total Units</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatNumber(analyticsData.overview.totalInventoryUnits)}
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
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Critical Stock</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {analyticsData.overview.criticalStockHospitals}
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
          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-red-700 dark:text-red-300">Expiring Soon</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {analyticsData.overview.expiringUnitsNext7Days}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Alerts Section */}
      {(lowStockAlerts.length > 0 || expiryAlerts.length > 0) && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Bell className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Critical Alerts
            </h3>
            <Badge variant="red" size="sm">
              {lowStockAlerts.length + expiryAlerts.length}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Alerts */}
            {lowStockAlerts.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-slate-900 dark:text-white mb-3">
                  Low Stock Alerts ({lowStockAlerts.length})
                </h4>
                <div className="space-y-3">
                  {lowStockAlerts.map((alert, index) => (
                    <div key={index} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-slate-900 dark:text-white">
                          {alert.hospital.name}
                        </h5>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {alert.lowStockItems.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">
                              {item.bloodType}: {item.unitsAvailable} units
                            </span>
                            <Badge variant="yellow" size="sm">
                              Min: {item.minimumThreshold}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expiry Alerts */}
            {expiryAlerts.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-slate-900 dark:text-white mb-3">
                  Expiry Alerts ({expiryAlerts.length})
                </h4>
                <div className="space-y-3">
                  {expiryAlerts.map((alert, index) => (
                    <div key={index} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-slate-900 dark:text-white">
                          {alert.hospital.name}
                        </h5>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {alert.expiringSoonItems.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">
                              {item.bloodType}: {item.expiringSoonCount} units
                            </span>
                            <Badge variant="red" size="sm">
                              {item.daysUntilExpiry} days
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Blood Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Blood Type Distribution
              </h3>
              <PieChart className="h-5 w-5 text-blue-600" />
            </div>
            
            <div className="space-y-4">
              {analyticsData.bloodTypeDistribution.map((type, index) => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ 
                        backgroundColor: `hsl(${index * 45}, 70%, 50%)` 
                      }}
                    />
                    <span className="font-medium text-slate-900 dark:text-white">
                      {type.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {type.totalUnits} units
                    </span>
                    <Badge variant={getStatusColor(type.status)} size="sm">
                      {type.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Regional Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Regional Performance
              </h3>
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            
            <div className="space-y-4">
              {analyticsData.regionalData.map((region, index) => (
                <div key={region.region} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {region.region}
                    </span>
                    {region.alerts > 0 && (
                      <Badge variant="red" size="sm">
                        {region.alerts} alerts
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Hospitals:</span>
                      <span className="ml-1 font-medium text-slate-900 dark:text-white">
                        {region.hospitals}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Units:</span>
                      <span className="ml-1 font-medium text-slate-900 dark:text-white">
                        {region.totalUnits}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Avg Stock:</span>
                      <span className="ml-1 font-medium text-slate-900 dark:text-white">
                        {region.avgStock}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Hospitals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Top Performing Hospitals
              </h3>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            
            <div className="space-y-3">
              {analyticsData.topPerformingHospitals.map((hospital, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {hospital.name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Stock: {hospital.stockLevel}% • Efficiency: {hospital.efficiency}%
                    </p>
                  </div>
                  <Badge variant="green" size="sm">
                    #{index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Critical Hospitals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Hospitals Needing Attention
              </h3>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            
            <div className="space-y-3">
              {analyticsData.criticalHospitals.map((hospital, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {hospital.name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Stock: {hospital.stockLevel}% • Critical: {hospital.criticalTypes.join(', ')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default InventoryAnalytics;