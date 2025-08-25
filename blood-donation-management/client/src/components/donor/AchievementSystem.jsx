import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Star, 
  Trophy, 
  Medal, 
  Crown, 
  Heart,
  Zap,
  Target,
  Calendar,
  Users,
  MapPin,
  Clock,
  TrendingUp,
  Gift,
  Share2,
  Download,
  Lock,
  CheckCircle,
  Sparkles
} from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import logger from '../../utils/logger';

const AchievementSystem = ({ donorId, className = '' }) => {
  const [achievements, setAchievements] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [currentStats, setCurrentStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetchAchievements();
    fetchMilestones();
    fetchCurrentStats();
  }, [donorId]);

  const fetchAchievements = async () => {
    try {
      // Compute basic achievements from real donations
      const { authApi, userApi } = await import('../../utils/api');
      const me = await authApi.getCurrentUser();
      const user = me?.data?.user || me?.data;
      const uid = user?._id || user?.id;
      if (!uid) {
        setAchievements([]);
        return;
      }
      const donationsRes = await userApi.getDonations(uid);
      const donations = donationsRes?.data?.donations || [];
      const total = donations.filter(d => d.status === 'completed').length;
      const units = donations.reduce((s, d) => s + (d.unitsDonated || 0), 0);
      const computed = [];
      if (total >= 1) computed.push({ id: 'ACH001', title: 'First Drop', description: 'Completed your first donation', icon: '🩸', isUnlocked: true });
      if (total >= 5) computed.push({ id: 'ACH003', title: 'Dedicated Donor', description: 'Completed 5 donations', icon: '🏅', isUnlocked: true });
      if (units >= 10) computed.push({ id: 'ACH005', title: 'Community Hero', description: 'Donated 10+ units', icon: '🦸', isUnlocked: true });
      setAchievements(computed);
      logger.success('Achievements computed', 'ACHIEVEMENT_SYSTEM');
    } catch (error) {
      logger.error('Error computing achievements', 'ACHIEVEMENT_SYSTEM', error);
      setAchievements([]);
    }
  };

  const fetchMilestones = async () => {
    try {
      // TODO: Replace with real milestones API when available
      const mockMilestones = [
        {
          id: 'MIL001',
          title: 'Bronze Donor',
          description: 'Complete 3 blood donations',
          icon: '🥉',
          target: 3,
          current: 12,
          isCompleted: true,
          completedDate: '2023-08-01T00:00:00Z',
          reward: {
            points: 150,
            badge: 'Bronze Donor',
            certificate: true
          }
        },
        {
          id: 'MIL002',
          title: 'Silver Donor',
          description: 'Complete 7 blood donations',
          icon: '🥈',
          target: 7,
          current: 12,
          isCompleted: true,
          completedDate: '2023-11-15T00:00:00Z',
          reward: {
            points: 300,
            badge: 'Silver Donor',
            certificate: true
          }
        },
        {
          id: 'MIL003',
          title: 'Gold Donor',
          description: 'Complete 10 blood donations',
          icon: '🥇',
          target: 10,
          current: 12,
          isCompleted: true,
          completedDate: '2024-01-10T00:00:00Z',
          reward: {
            points: 500,
            badge: 'Gold Donor',
            certificate: true,
            specialRecognition: true
          }
        },
        {
          id: 'MIL004',
          title: 'Platinum Donor',
          description: 'Complete 25 blood donations',
          icon: '💎',
          target: 25,
          current: 12,
          isCompleted: false,
          reward: {
            points: 1000,
            badge: 'Platinum Donor',
            certificate: true,
            specialRecognition: true,
            exclusivePerks: true
          }
        },
        {
          id: 'MIL005',
          title: 'Diamond Donor',
          description: 'Complete 50 blood donations',
          icon: '💍',
          target: 50,
          current: 12,
          isCompleted: false,
          reward: {
            points: 2500,
            badge: 'Diamond Donor',
            certificate: true,
            specialRecognition: true,
            exclusivePerks: true,
            hallOfFame: true
          }
        }
      ];

      setMilestones([]);
      logger.success('Loaded milestones (API placeholder)', 'ACHIEVEMENT_SYSTEM');
    } catch (error) {
      logger.error('Error fetching milestones', 'ACHIEVEMENT_SYSTEM', error);
    }
  };

  const fetchCurrentStats = async () => {
    try {
      const mockStats = {
        totalDonations: 12,
        totalPoints: 2400,
        livesImpacted: 36,
        streakDays: 45,
        responseTime: 15, // average minutes
        nightResponses: 2,
        streakMonths: 3,
        rank: 'Gold Donor',
        nextMilestone: {
          title: 'Platinum Donor',
          progress: 48, // percentage
          remaining: 13
        }
      };

      setCurrentStats(mockStats);
      logger.success('Loaded current stats', 'ACHIEVEMENT_SYSTEM');
    } catch (error) {
      logger.error('Error fetching current stats', 'ACHIEVEMENT_SYSTEM', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareAchievement = (achievement) => {
    logger.ui('CLICK', 'ShareAchievement', { achievementId: achievement.id }, 'ACHIEVEMENT_SYSTEM');
    
    if (navigator.share) {
      navigator.share({
        title: `Achievement Unlocked: ${achievement.title}`,
        text: achievement.shareText,
        url: `https://callforbloodfoundation.com/achievements/${achievement.id}`
      });
    } else {
      navigator.clipboard.writeText(achievement.shareText);
      logger.success('Achievement text copied to clipboard!', 'ACHIEVEMENT_SYSTEM');
    }
  };

  const handleDownloadCertificate = (achievement) => {
    logger.ui('CLICK', 'DownloadCertificate', { achievementId: achievement.id }, 'ACHIEVEMENT_SYSTEM');
    // In real app, this would generate and download a certificate
    logger.success('Certificate download started', 'ACHIEVEMENT_SYSTEM');
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'yellow';
      default: return 'gray';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'milestone': return <Trophy className="h-4 w-4" />;
      case 'speed': return <Zap className="h-4 w-4" />;
      case 'impact': return <Heart className="h-4 w-4" />;
      case 'consistency': return <Calendar className="h-4 w-4" />;
      case 'special': return <Star className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
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
          className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mb-4"
        >
          <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Achievements & Milestones
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Track your donation journey and unlock special rewards
        </p>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {currentStats.totalPoints}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Points</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {achievements.filter(a => a.isUnlocked).length}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Unlocked</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {currentStats.rank}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Current Rank</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {currentStats.nextMilestone.progress}%
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Next Milestone</div>
        </Card>
      </div>

      {/* Next Milestone Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Progress to {currentStats.nextMilestone.title}
          </h3>
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {currentStats.nextMilestone.remaining} donations remaining
            </span>
          </div>
        </div>
        
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 mb-4">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full flex items-center justify-end pr-2"
            initial={{ width: 0 }}
            animate={{ width: `${currentStats.nextMilestone.progress}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            {currentStats.nextMilestone.progress > 20 && (
              <span className="text-xs text-white font-medium">
                {currentStats.nextMilestone.progress}%
              </span>
            )}
          </motion.div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>Current: {currentStats.totalDonations} donations</span>
          <span>Target: {currentStats.totalDonations + currentStats.nextMilestone.remaining} donations</span>
        </div>
      </Card>

      {/* Milestones */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
          Donation Milestones
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {milestones.map((milestone, index) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-6 relative overflow-hidden ${
                milestone.isCompleted
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                  : 'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800'
              }`}>
                {milestone.isCompleted && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                )}
                
                <div className="text-center space-y-4">
                  <div className="text-4xl">{milestone.icon}</div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {milestone.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {milestone.description}
                    </p>
                  </div>
                  
                  {milestone.isCompleted ? (
                    <div className="space-y-2">
                      <Badge variant="green" className="text-sm">
                        Completed {formatDate(milestone.completedDate)}
                      </Badge>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        +{milestone.reward.points} points earned
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${calculateProgress(milestone.current, milestone.target)}%` }}
                          transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                        />
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {milestone.current} / {milestone.target} donations
                      </div>
                      <div className="text-xs text-slate-500">
                        +{milestone.reward.points} points when completed
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
          Special Achievements
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <Card className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                achievement.isUnlocked
                  ? 'bg-gradient-to-br from-white to-yellow-50 dark:from-slate-800 dark:to-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                  : 'bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-800 opacity-75'
              }`}
              onClick={() => setSelectedAchievement(achievement)}
              >
                {!achievement.isUnlocked && (
                  <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-900/30 rounded-lg flex items-center justify-center">
                    <Lock className="h-8 w-8 text-slate-500" />
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="text-3xl">
                      {achievement.isUnlocked ? achievement.icon : '🔒'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getRarityColor(achievement.rarity)} size="sm">
                        {achievement.rarity}
                      </Badge>
                      <div className="text-slate-500">
                        {getCategoryIcon(achievement.category)}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {achievement.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {achievement.description}
                    </p>
                  </div>
                  
                  {achievement.isUnlocked ? (
                    <div className="space-y-2">
                      <Badge variant="green" className="text-sm">
                        Unlocked {formatDate(achievement.earnedDate)}
                      </Badge>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        +{achievement.points} points
                      </div>
                    </div>
                  ) : achievement.progress ? (
                    <div className="space-y-2">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                          style={{ width: `${(achievement.progress.current / achievement.progress.target) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {achievement.progress.current} / {achievement.progress.target}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">
                      Requirements not met
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg overflow-hidden"
            >
              <div className="p-6 text-center space-y-6">
                {selectedAchievement.isUnlocked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="text-6xl"
                  >
                    {selectedAchievement.icon}
                  </motion.div>
                )}
                
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {selectedAchievement.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedAchievement.description}
                  </p>
                </div>
                
                {selectedAchievement.isUnlocked && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-4">
                      <Badge variant={getRarityColor(selectedAchievement.rarity)}>
                        {selectedAchievement.rarity.toUpperCase()}
                      </Badge>
                      <Badge variant="yellow">
                        +{selectedAchievement.points} points
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Unlocked on {formatDate(selectedAchievement.earnedDate)}
                    </p>
                    
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareAchievement(selectedAchievement)}
                        className="flex-1"
                      >
                        <Share2 className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadCertificate(selectedAchievement)}
                        className="flex-1"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Certificate
                      </Button>
                    </div>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => setSelectedAchievement(null)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 1, 
                    scale: 0,
                    x: 0,
                    y: 0
                  }}
                  animate={{ 
                    opacity: 0,
                    scale: 1,
                    x: (Math.random() - 0.5) * 400,
                    y: (Math.random() - 0.5) * 400
                  }}
                  transition={{ 
                    duration: 2,
                    delay: i * 0.1
                  }}
                  className="absolute"
                >
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AchievementSystem;