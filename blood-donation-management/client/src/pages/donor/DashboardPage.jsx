import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Droplet, 
  Calendar, 
  Award, 
  TrendingUp,
  Users,
  MapPin,
  Clock,
  Star,
  Share2,
  Download,
  Bell,
  Activity,
  Target,
  Gift,
  Zap
} from 'lucide-react';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import logger from '../../utils/logger';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');

  useEffect(() => {
    logger.componentMount('DonorDashboard');
    fetchDashboardData();
    
    return () => {
      logger.componentUnmount('DonorDashboard');
    };
  }, [selectedTimeRange]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Mock data - in real app, this would be an API call
      const mockData = {
        user: {
          name: 'John Doe',
          bloodType: 'O+',
          profilePicture: null,
          joinedDate: '2023-06-15',
          location: 'New Delhi, India',
          donorId: 'BD2023001234'
        },
        stats: {
          totalDonations: 8,
          totalUnitsContributed: 12,
          livesImpacted: 24,
          responseRate: 92,
          averageResponseTime: 15, // minutes
          lastDonationDate: '2024-01-15',
          nextEligibleDate: '2024-04-15',
          totalPoints: 2400,
          currentStreak: 3
        },
        recentActivity: [
          {
            id: 1,
            type: 'donation',
            title: 'Blood Donation Completed',
            description: 'Donated 450ml at AIIMS Hospital',
            date: '2024-01-15',
            icon: 'droplet',
            color: 'red'
          },
          {
            id: 2,
            type: 'request_response',
            title: 'Responded to Emergency Request',
            description: 'Confirmed availability for O+ blood request',
            date: '2024-01-10',
            icon: 'heart',
            color: 'green'
          },
          {
            id: 3,
            type: 'achievement',
            title: 'Achievement Unlocked',
            description: 'Earned "Life Saver" badge for 5+ donations',
            date: '2024-01-08',
            icon: 'award',
            color: 'yellow'
          },
          {
            id: 4,
            type: 'certificate',
            title: 'Certificate Generated',
            description: 'Digital certificate for December donation',
            date: '2024-01-05',
            icon: 'star',
            color: 'blue'
          }
        ],
        upcomingEvents: [
          {
            id: 1,
            title: 'Blood Donation Camp',
            location: 'Red Cross Society, CP',
            date: '2024-02-15',
            time: '10:00 AM - 4:00 PM',
            type: 'camp'
          },
          {
            id: 2,
            title: 'Health Checkup Reminder',
            location: 'Your registered clinic',
            date: '2024-02-20',
            time: '2:00 PM',
            type: 'checkup'
          }
        ],
        achievements: [
          {
            id: 1,
            name: 'First Drop',
            description: 'Completed your first donation',
            icon: '🩸',
            earned: true,
            earnedDate: '2023-06-20'
          },
          {
            id: 2,
            name: 'Life Saver',
            description: 'Completed 5 donations',
            icon: '❤️',
            earned: true,
            earnedDate: '2024-01-08'
          },
          {
            id: 3,
            name: 'Hero',
            description: 'Completed 10 donations',
            icon: '🦸',
            earned: false,
            progress: 80
          },
          {
            id: 4,
            name: 'Quick Responder',
            description: 'Respond to requests within 5 minutes',
            icon: '⚡',
            earned: true,
            earnedDate: '2023-12-10'
          },
          {
            id: 5,
            name: 'Community Champion',
            description: 'Refer 10 new donors',
            icon: '👥',
            earned: false,
            progress: 30
          },
          {
            id: 6,
            name: 'Streak Master',
            description: 'Maintain 6-month donation streak',
            icon: '🔥',
            earned: false,
            progress: 50
          }
        ],
        impactMetrics: {
          livesImpacted: 24,
          hospitalsHelped: 6,
          emergencyResponses: 12,
          communityRank: 15,
          totalCommunityDonors: 1247
        }
      };

      setDashboardData(mockData);
      logger.success('Dashboard data loaded', 'DONOR_DASHBOARD');
    } catch (error) {
      logger.error('Error fetching dashboard data', 'DONOR_DASHBOARD', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNextEligibilityDays = () => {
    if (!dashboardData?.stats.nextEligibleDate) return 0;
    const nextDate = new Date(dashboardData.stats.nextEligibleDate);
    const today = new Date();
    const diffTime = nextDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getActivityIcon = (type) => {
    const icons = {
      donation: Droplet,
      request_response: Heart,
      achievement: Award,
      certificate: Star
    };
    return icons[type] || Activity;
  };

  const getActivityColor = (color) => {
    const colors = {
      red: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      green: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
      blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    };
    return colors[color] || 'text-slate-600 bg-slate-100 dark:bg-slate-800';
  };

  const shareAchievement = (achievement) => {
    const text = `🎉 I just earned the "${achievement.name}" badge on Call For Blood Foundation! ${achievement.description} #BloodDonation #LifeSaver`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Achievement Unlocked!',
        text: text,
        url: window.location.origin
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(text);
      // Show toast notification
      logger.success('Achievement shared to clipboard!', 'DONOR_DASHBOARD');
    }
  };

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

  const eligibilityDays = getNextEligibilityDays();

  return (
    <div className="min-h-screen bg-white dark:bg-[#121726] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Welcome back, {dashboardData?.user.name}! 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Your blood donation journey continues to save lives
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </Button>
            <Button className="flex items-center space-x-2">
              <Share2 className="h-4 w-4" />
              <span>Share Impact</span>
            </Button>
          </div>
        </motion.div>

        {/* Key Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <Droplet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">Total Donations</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {dashboardData?.stats.totalDonations}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {dashboardData?.stats.totalUnitsContributed} units contributed
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
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">Lives Impacted</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {dashboardData?.stats.livesImpacted}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Potential lives saved
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
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Response Rate</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {dashboardData?.stats.responseRate}%
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Avg: {dashboardData?.stats.averageResponseTime}min
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
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Reward Points</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {dashboardData?.stats.totalPoints.toLocaleString()}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Streak: {dashboardData?.stats.currentStreak}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
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
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActivityColor(activity.color)}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {activity.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Next Donation Eligibility */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    Next Donation
                  </h3>
                  {eligibilityDays > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {eligibilityDays} days
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        until you're eligible
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        Ready!
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        You can donate now
                      </p>
                      <Button className="mt-4 w-full">
                        Find Donation Centers
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Upcoming Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                  Upcoming Events
                </h3>
                <div className="space-y-3">
                  {dashboardData?.upcomingEvents.map((event) => (
                    <div key={event.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                        {event.title}
                      </h4>
                      <div className="flex items-center space-x-1 mt-1">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {event.location}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {new Date(event.date).toLocaleDateString()} • {event.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Achievements & Badges
              </h2>
              <Button variant="outline" size="sm">
                <Award className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {dashboardData?.achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className={`relative p-4 rounded-lg text-center transition-all hover:scale-105 cursor-pointer ${
                    achievement.earned 
                      ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-200 dark:border-yellow-800' 
                      : 'bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 opacity-60'
                  }`}
                  onClick={() => achievement.earned && shareAchievement(achievement)}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <h3 className="font-medium text-sm text-slate-900 dark:text-white mb-1">
                    {achievement.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    {achievement.description}
                  </p>
                  
                  {achievement.earned ? (
                    <Badge variant="yellow" size="sm">
                      Earned
                    </Badge>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                        <div 
                          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        {achievement.progress}%
                      </p>
                    </div>
                  )}
                  
                  {achievement.earned && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 w-6 h-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareAchievement(achievement);
                      }}
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Impact Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
              Your Impact
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {dashboardData?.impactMetrics.livesImpacted}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Lives Impacted
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {dashboardData?.impactMetrics.hospitalsHelped}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Hospitals Helped
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {dashboardData?.impactMetrics.emergencyResponses}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Emergency Responses
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  #{dashboardData?.impactMetrics.communityRank}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Community Rank
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;