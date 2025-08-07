import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Network,
  TrendingUp,
  Award,
  Star,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Gift,
  Crown,
  Target,
  Zap
} from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import logger from '../../utils/logger';

const ReferralNetwork = ({ donorId, className = '' }) => {
  const [networkData, setNetworkData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(1);

  useEffect(() => {
    fetchNetworkData();
  }, [donorId]);

  const fetchNetworkData = async () => {
    try {
      // Mock data - in real app, this would be an API call
      const mockData = {
        totalReferrals: 24,
        activeReferrals: 18,
        totalRewards: 2400,
        networkLevels: 3,
        conversionRate: 75, // percentage
        topPerformer: true,
        rank: 'Ambassador',
        directReferrals: [
          {
            id: 'REF001',
            name: 'Amit Sharma',
            phone: '+91-9876543210',
            email: 'amit.sharma@email.com',
            joinDate: '2023-08-15T00:00:00Z',
            status: 'active',
            donations: 5,
            level: 1,
            avatar: null,
            lastDonation: '2024-01-10T00:00:00Z',
            totalReward: 250
          },
          {
            id: 'REF002',
            name: 'Priya Patel',
            phone: '+91-9876543211',
            email: 'priya.patel@email.com',
            joinDate: '2023-09-20T00:00:00Z',
            status: 'active',
            donations: 8,
            level: 1,
            avatar: null,
            lastDonation: '2024-01-15T00:00:00Z',
            totalReward: 400
          },
          {
            id: 'REF003',
            name: 'Rajesh Kumar',
            phone: '+91-9876543212',
            email: 'rajesh.kumar@email.com',
            joinDate: '2023-10-05T00:00:00Z',
            status: 'inactive',
            donations: 2,
            level: 1,
            avatar: null,
            lastDonation: '2023-12-01T00:00:00Z',
            totalReward: 100
          }
        ],
        secondLevelReferrals: [
          {
            id: 'REF004',
            name: 'Neha Singh',
            referredBy: 'Amit Sharma',
            joinDate: '2023-11-10T00:00:00Z',
            status: 'active',
            donations: 3,
            level: 2,
            totalReward: 75
          },
          {
            id: 'REF005',
            name: 'Vikram Gupta',
            referredBy: 'Priya Patel',
            joinDate: '2023-12-01T00:00:00Z',
            status: 'active',
            donations: 4,
            level: 2,
            totalReward: 100
          }
        ],
        monthlyStats: [
          { month: 'Aug 2023', referrals: 3, rewards: 300 },
          { month: 'Sep 2023', referrals: 5, rewards: 500 },
          { month: 'Oct 2023', referrals: 4, rewards: 400 },
          { month: 'Nov 2023', referrals: 6, rewards: 600 },
          { month: 'Dec 2023', referrals: 3, rewards: 300 },
          { month: 'Jan 2024', referrals: 3, rewards: 300 }
        ],
        achievements: [
          {
            id: 'NET001',
            title: 'Network Builder',
            description: 'Referred 10+ active donors',
            icon: '🏗️',
            earned: true,
            earnedDate: '2023-11-15T00:00:00Z'
          },
          {
            id: 'NET002',
            title: 'Ambassador',
            description: 'Achieved 75%+ conversion rate',
            icon: '👑',
            earned: true,
            earnedDate: '2023-12-20T00:00:00Z'
          },
          {
            id: 'NET003',
            title: 'Super Connector',
            description: 'Build a 3-level referral network',
            icon: '🌟',
            earned: false,
            progress: 67
          }
        ]
      };

      setNetworkData(mockData);
      logger.success('Network data loaded', 'REFERRAL_NETWORK');
    } catch (error) {
      logger.error('Error fetching network data', 'REFERRAL_NETWORK', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactReferral = (referral, method) => {
    logger.ui('CLICK', 'ContactReferral', { referralId: referral.id, method }, 'REFERRAL_NETWORK');
    
    if (method === 'phone') {
      window.open(`tel:${referral.phone}`);
    } else if (method === 'email') {
      window.open(`mailto:${referral.email}`);
    } else if (method === 'whatsapp') {
      window.open(`https://wa.me/${referral.phone.replace(/[^0-9]/g, '')}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'green' : 'gray';
  };

  const getLevelData = (level) => {
    if (level === 1) return networkData?.directReferrals || [];
    if (level === 2) return networkData?.secondLevelReferrals || [];
    return [];
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4"
        >
          <Network className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Referral Network
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Track your referral network and see your impact grow
        </p>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {networkData?.totalReferrals}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Referrals</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {networkData?.activeReferrals}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Active Donors</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {networkData?.conversionRate}%
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Conversion Rate</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {networkData?.totalRewards}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Rewards</div>
        </Card>
      </div>

      {/* Current Rank */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Current Rank: {networkData?.rank}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {networkData?.topPerformer && 'Top 10% performer in your region'}
              </p>
            </div>
          </div>
          <Badge variant="purple" className="text-lg px-4 py-2">
            Level {networkData?.networkLevels}
          </Badge>
        </div>
      </Card>

      {/* Network Levels */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Network Levels
          </h3>
          <div className="flex space-x-2">
            {[1, 2, 3].map((level) => (
              <Button
                key={level}
                variant={selectedLevel === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLevel(level)}
                disabled={level > networkData?.networkLevels}
              >
                Level {level}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getLevelData(selectedLevel).map((referral, index) => (
            <motion.div
              key={referral.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={referral.avatar}
                        alt={referral.name}
                        size="md"
                        fallback={referral.name.charAt(0)}
                      />
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {referral.name}
                        </h4>
                        {referral.referredBy && (
                          <p className="text-xs text-slate-500">
                            via {referral.referredBy}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={getStatusColor(referral.status)} size="sm">
                      {referral.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Joined</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatDate(referral.joinDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Donations</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {referral.donations}
                      </p>
                    </div>
                  </div>

                  {referral.lastDonation && (
                    <div className="text-sm">
                      <p className="text-slate-600 dark:text-slate-400">Last Donation</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatDate(referral.lastDonation)}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Reward: </span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        ₹{referral.totalReward}
                      </span>
                    </div>
                    
                    {referral.phone && (
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContactReferral(referral, 'phone')}
                        >
                          <Phone className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContactReferral(referral, 'whatsapp')}
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                        {referral.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleContactReferral(referral, 'email')}
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {getLevelData(selectedLevel).length === 0 && (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No Level {selectedLevel} Referrals Yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {selectedLevel === 1 
                ? 'Start referring friends to build your network'
                : 'Your referrals need to refer others to reach this level'
              }
            </p>
          </Card>
        )}
      </div>

      {/* Network Achievements */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
          Network Achievements
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {networkData?.achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-6 text-center ${
                achievement.earned
                  ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800'
              }`}>
                <div className="text-4xl mb-4">
                  {achievement.earned ? achievement.icon : '🔒'}
                </div>
                
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {achievement.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {achievement.description}
                </p>
                
                {achievement.earned ? (
                  <Badge variant="yellow">
                    Earned {formatDate(achievement.earnedDate)}
                  </Badge>
                ) : achievement.progress ? (
                  <div className="space-y-2">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {achievement.progress}% complete
                    </p>
                  </div>
                ) : (
                  <Badge variant="gray">Locked</Badge>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Monthly Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Monthly Performance
        </h3>
        
        <div className="space-y-4">
          {networkData?.monthlyStats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-slate-900 dark:text-white">
                  {stat.month}
                </span>
              </div>
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {stat.referrals}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">Referrals</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    ₹{stat.rewards}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">Rewards</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ReferralNetwork;