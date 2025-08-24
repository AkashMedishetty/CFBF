import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Users, 
  Droplet, 
  TrendingUp, 
  BarChart3,
  PieChart,
  Activity,
  Target,
  Calendar,
  Filter
} from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import Map from '../ui/Map';
import logger from '../../utils/logger';

const GeographicAnalytics = ({ className = '' }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeRange, selectedRegion]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    
    try {
      // Use admin requests summary to populate map markers
      // and keep some placeholders for summary cards
      const mockData = {
        summary: {
          totalDonors: 1247,
          activeDonors: 892,
          totalRequests: 156,
          fulfilledRequests: 134,
          averageResponseTime: 18, // minutes
          donorDensity: 2.3 // donors per km²
        },
        regionalStats: [
          {
            region: 'Central Delhi',
            coordinates: [28.6139, 77.2090],
            donorCount: 234,
            requestCount: 45,
            fulfillmentRate: 89,
            averageDistance: 3.2,
            responseTime: 15
          },
          {
            region: 'South Delhi',
            coordinates: [28.5355, 77.2803],
            donorCount: 189,
            requestCount: 32,
            fulfillmentRate: 94,
            averageDistance: 4.1,
            responseTime: 12
          },
          {
            region: 'North Delhi',
            coordinates: [28.7041, 77.1025],
            donorCount: 156,
            requestCount: 28,
            fulfillmentRate: 82,
            averageDistance: 5.8,
            responseTime: 22
          },
          {
            region: 'East Delhi',
            coordinates: [28.6508, 77.3152],
            donorCount: 143,
            requestCount: 31,
            fulfillmentRate: 87,
            averageDistance: 4.7,
            responseTime: 19
          },
          {
            region: 'West Delhi',
            coordinates: [28.6692, 77.1174],
            donorCount: 167,
            requestCount: 20,
            fulfillmentRate: 95,
            averageDistance: 3.9,
            responseTime: 14
          }
        ],
        bloodTypeDistribution: [
          { type: 'O+', count: 312, percentage: 25.0 },
          { type: 'A+', count: 287, percentage: 23.0 },
          { type: 'B+', count: 249, percentage: 20.0 },
          { type: 'AB+', count: 125, percentage: 10.0 },
          { type: 'O-', count: 87, percentage: 7.0 },
          { type: 'A-', count: 75, percentage: 6.0 },
          { type: 'B-', count: 62, percentage: 5.0 },
          { type: 'AB-', count: 50, percentage: 4.0 }
        ],
        timeSeriesData: [
          { date: '2024-01-01', donors: 45, requests: 12 },
          { date: '2024-01-02', donors: 52, requests: 8 },
          { date: '2024-01-03', donors: 38, requests: 15 },
          { date: '2024-01-04', donors: 61, requests: 11 },
          { date: '2024-01-05', donors: 47, requests: 9 },
          { date: '2024-01-06', donors: 55, requests: 13 },
          { date: '2024-01-07', donors: 43, requests: 7 }
        ],
        heatmapPoints: generateHeatmapData()
      };

      setAnalyticsData(mockData);
      setHeatmapData(mockData.heatmapPoints);
      try {
        const { adminApi } = await import('../../utils/api');
        const res = await adminApi.getRequestsSummary();
        const active = res?.data?.activeRequests || [];
        // augment regional markers with actual active request coordinates
        const extra = active
          .map((r) => ({
            position: [
              r.location?.hospital?.coordinates?.coordinates?.[1] || 0,
              r.location?.hospital?.coordinates?.coordinates?.[0] || 0
            ],
            title: `${r.patient?.bloodType} • ${r.request?.urgency}`,
            description: r.location?.hospital?.name || '',
            type: 'request',
            color: '#dc2626',
            icon: '🩸'
          }))
          .filter(m => m.position[0] !== 0 || m.position[1] !== 0);
        setHeatmapData((prev) => [
          ...prev,
          ...extra.map(e => ({ position: e.position, intensity: 0.8, type: 'high' }))
        ]);
      } catch (e) {
        logger.warn('Failed to augment map with live requests', 'GEOGRAPHIC_ANALYTICS', e);
      }
      
      logger.success('Analytics data loaded', 'GEOGRAPHIC_ANALYTICS');
    } catch (error) {
      logger.error('Error fetching analytics data', 'GEOGRAPHIC_ANALYTICS', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock heatmap data
  function generateHeatmapData() {
    const points = [];
    const baseCoords = [28.6139, 77.2090]; // Delhi center
    
    for (let i = 0; i < 100; i++) {
      const lat = baseCoords[0] + (Math.random() - 0.5) * 0.5;
      const lng = baseCoords[1] + (Math.random() - 0.5) * 0.5;
      const intensity = Math.random();
      
      points.push({
        position: [lat, lng],
        intensity,
        type: intensity > 0.7 ? 'high' : intensity > 0.4 ? 'medium' : 'low'
      });
    }
    
    return points;
  }

  const getMapMarkers = () => {
    if (!analyticsData) return [];

    return analyticsData.regionalStats.map(region => ({
      position: region.coordinates,
      title: region.region,
      description: `${region.donorCount} donors • ${region.requestCount} requests • ${region.fulfillmentRate}% fulfilled`,
      type: 'region',
      color: getRegionColor(region.fulfillmentRate),
      icon: '📍',
      data: region
    }));
  };

  const getHeatmapMarkers = () => {
    return heatmapData.map((point, index) => ({
      position: point.position,
      title: `Activity Point ${index + 1}`,
      description: `Intensity: ${(point.intensity * 100).toFixed(0)}%`,
      type: 'heatmap',
      color: getHeatmapColor(point.intensity),
      icon: '🔥'
    }));
  };

  const getRegionColor = (fulfillmentRate) => {
    if (fulfillmentRate >= 90) return '#16a34a'; // Green
    if (fulfillmentRate >= 80) return '#eab308'; // Yellow
    return '#dc2626'; // Red
  };

  const getHeatmapColor = (intensity) => {
    if (intensity > 0.7) return '#dc2626'; // High intensity - Red
    if (intensity > 0.4) return '#f59e0b'; // Medium intensity - Orange
    return '#3b82f6'; // Low intensity - Blue
  };

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' }
  ];

  const regionOptions = [
    { value: 'all', label: 'All Regions' },
    { value: 'central', label: 'Central Delhi' },
    { value: 'south', label: 'South Delhi' },
    { value: 'north', label: 'North Delhi' },
    { value: 'east', label: 'East Delhi' },
    { value: 'west', label: 'West Delhi' }
  ];

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Geographic Analytics
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Regional insights and donor activity patterns
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select
            value={selectedTimeRange}
            onChange={setSelectedTimeRange}
            options={timeRangeOptions}
            className="w-40"
          />
          
          <Select
            value={selectedRegion}
            onChange={setSelectedRegion}
            options={regionOptions}
            className="w-40"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Donors</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {analyticsData?.summary.totalDonors.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {analyticsData?.summary.activeDonors} active
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
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <Droplet className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Blood Requests</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {analyticsData?.summary.totalRequests}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {analyticsData?.summary.fulfilledRequests} fulfilled
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
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Response Time</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {analyticsData?.summary.averageResponseTime}m
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  average
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
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Donor Density</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {analyticsData?.summary.donorDensity}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  per km²
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Maps Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Distribution Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Regional Distribution
              </h3>
              <Badge variant="blue">
                {analyticsData?.regionalStats.length} Regions
              </Badge>
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
            
            <div className="mt-4 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>High Performance (90%+)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Good Performance (80-89%)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Needs Improvement (&lt;80%)</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Activity Heatmap
              </h3>
              <Badge variant="orange">
                {heatmapData.length} Points
              </Badge>
            </div>
            
            <Map
              center={[28.6139, 77.2090]}
              zoom={11}
              height="400px"
              markers={getHeatmapMarkers()}
              showSearch={false}
              showControls={true}
              showCurrentLocation={false}
            />
            
            <div className="mt-4 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>High Activity</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Medium Activity</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Low Activity</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Regional Statistics Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Regional Performance
            </h3>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-border">
                  <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-white">
                    Region
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-slate-900 dark:text-white">
                    Donors
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-slate-900 dark:text-white">
                    Requests
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-slate-900 dark:text-white">
                    Fulfillment Rate
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-slate-900 dark:text-white">
                    Avg Distance
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-slate-900 dark:text-white">
                    Response Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {analyticsData?.regionalStats.map((region, index) => (
                  <tr 
                    key={region.region}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getRegionColor(region.fulfillmentRate) }}
                        ></div>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {region.region}
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-slate-600 dark:text-slate-400">
                      {region.donorCount}
                    </td>
                    <td className="text-right py-3 px-4 text-slate-600 dark:text-slate-400">
                      {region.requestCount}
                    </td>
                    <td className="text-right py-3 px-4">
                      <Badge 
                        variant={region.fulfillmentRate >= 90 ? 'green' : region.fulfillmentRate >= 80 ? 'yellow' : 'red'}
                        size="sm"
                      >
                        {region.fulfillmentRate}%
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-4 text-slate-600 dark:text-slate-400">
                      {region.averageDistance} km
                    </td>
                    <td className="text-right py-3 px-4 text-slate-600 dark:text-slate-400">
                      {region.responseTime}m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Blood Type Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Blood Type Distribution
            </h3>
            <Button variant="outline" size="sm">
              <PieChart className="h-4 w-4 mr-2" />
              View Chart
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analyticsData?.bloodTypeDistribution.map((bloodType) => (
              <div 
                key={bloodType.type}
                className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
              >
                <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                  {bloodType.type}
                </div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white">
                  {bloodType.count}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {bloodType.percentage}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default GeographicAnalytics;