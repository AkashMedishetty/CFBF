import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Share2,
    Copy,
    Gift,
    Trophy,
    UserPlus,
    Heart,
    Award,
    MessageSquare,
    Mail,
    Phone,
    Facebook,
    Twitter,
    Download,
    Eye,
    Target,
    Zap
} from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';
import logger from '../../utils/logger';

const ReferralDashboard = ({ donorId, className = '' }) => {
    const [referralData, setReferralData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [customMessage, setCustomMessage] = useState('');


    useEffect(() => {
        fetchReferralData();
    }, [donorId]);

    const fetchReferralData = async () => {
        try {
            // TODO: Replace with real referral API when available
            const mockData = {
                referralCode: 'BLOOD2024RK',
                referralLink: 'https://callforblood.org/join/BLOOD2024RK',
                qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://callforblood.org/join/BLOOD2024RK',
                stats: {
                    totalReferrals: 15,
                    successfulReferrals: 12,
                    pendingReferrals: 3,
                    totalRewards: 2400,
                    thisMonthReferrals: 4,
                    conversionRate: 80, // percentage
                    rank: 'Gold Referrer',
                    nextRewardAt: 20
                },
                recentReferrals: [
                    {
                        id: 'REF001',
                        name: 'Priya Sharma',
                        email: 'priya.sharma@email.com',
                        phone: '+91-9876543211',
                        joinDate: '2024-01-10T10:30:00Z',
                        status: 'active',
                        donationsCount: 2,
                        lastDonation: '2024-01-15T14:20:00Z',
                        rewardEarned: 200,
                        profilePicture: null
                    },
                    {
                        id: 'REF002',
                        name: 'Amit Singh',
                        email: 'amit.singh@email.com',
                        phone: '+91-9876543212',
                        joinDate: '2024-01-08T16:45:00Z',
                        status: 'active',
                        donationsCount: 1,
                        lastDonation: '2024-01-12T09:15:00Z',
                        rewardEarned: 150,
                        profilePicture: null
                    },
                    {
                        id: 'REF003',
                        name: 'Sunita Verma',
                        email: 'sunita.verma@email.com',
                        phone: '+91-9876543213',
                        joinDate: '2024-01-05T11:20:00Z',
                        status: 'pending_verification',
                        donationsCount: 0,
                        lastDonation: null,
                        rewardEarned: 0,
                        profilePicture: null
                    },
                    {
                        id: 'REF004',
                        name: 'Rajesh Kumar',
                        email: 'rajesh.kumar2@email.com',
                        phone: '+91-9876543214',
                        joinDate: '2024-01-03T13:30:00Z',
                        status: 'active',
                        donationsCount: 3,
                        lastDonation: '2024-01-14T10:45:00Z',
                        rewardEarned: 300,
                        profilePicture: null
                    }
                ],
                rewards: [
                    {
                        id: 'RW001',
                        title: 'First Referral Bonus',
                        description: 'Earned for your first successful referral',
                        points: 100,
                        earnedDate: '2023-07-15T00:00:00Z',
                        type: 'milestone'
                    },
                    {
                        id: 'RW002',
                        title: 'Super Referrer',
                        description: 'Referred 10+ active donors',
                        points: 500,
                        earnedDate: '2023-12-20T00:00:00Z',
                        type: 'achievement'
                    },
                    {
                        id: 'RW003',
                        title: 'Monthly Referral Champion',
                        description: 'Top referrer for December 2023',
                        points: 300,
                        earnedDate: '2024-01-01T00:00:00Z',
                        type: 'competition'
                    }
                ],
                leaderboard: [
                    {
                        rank: 1,
                        name: 'Rajesh Kumar',
                        referrals: 15,
                        isCurrentUser: true
                    },
                    {
                        rank: 2,
                        name: 'Priya Sharma',
                        referrals: 13,
                        isCurrentUser: false
                    },
                    {
                        rank: 3,
                        name: 'Amit Singh',
                        referrals: 11,
                        isCurrentUser: false
                    },
                    {
                        rank: 4,
                        name: 'Sunita Verma',
                        referrals: 9,
                        isCurrentUser: false
                    },
                    {
                        rank: 5,
                        name: 'Vikash Gupta',
                        referrals: 8,
                        isCurrentUser: false
                    }
                ]
            };

            setReferralData(null);
            logger.success('Referral data loaded (API placeholder)', 'REFERRAL_DASHBOARD');
        } catch (error) {
            logger.error('Error fetching referral data', 'REFERRAL_DASHBOARD', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyReferralLink = () => {
        navigator.clipboard.writeText(referralData.referralLink);
        logger.success('Referral link copied to clipboard!', 'REFERRAL_DASHBOARD');
    };

    const handleCopyReferralCode = () => {
        navigator.clipboard.writeText(referralData.referralCode);
        logger.success('Referral code copied to clipboard!', 'REFERRAL_DASHBOARD');
    };

    const handleSharePlatform = (platform) => {
        const message = customMessage || `Join me in saving lives through blood donation! Use my referral code ${referralData.referralCode} to get started. ${referralData.referralLink}`;

        logger.ui('CLICK', 'SharePlatform', { platform }, 'REFERRAL_DASHBOARD');

        switch (platform) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralData.referralLink)}`);
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`);
                break;
            case 'email':
                window.open(`mailto:?subject=Join me in saving lives&body=${encodeURIComponent(message)}`);
                break;
            case 'sms':
                window.open(`sms:?body=${encodeURIComponent(message)}`);
                break;
            default:
                break;
        }

        setShowShareModal(false);
    };

    const handleDownloadQR = () => {
        logger.ui('CLICK', 'DownloadQR', {}, 'REFERRAL_DASHBOARD');
        const link = document.createElement('a');
        link.href = referralData.qrCodeUrl;
        link.download = `referral-qr-${referralData.referralCode}.png`;
        link.click();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'green';
            case 'pending_verification': return 'yellow';
            case 'inactive': return 'gray';
            default: return 'gray';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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
            <div className="text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4"
                >
                    <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </motion.div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Referral Dashboard
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Invite friends to join the life-saving community and earn rewards
                </p>
            </div>

            {/* Stats Cards */}
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
                                <p className="text-sm text-blue-700 dark:text-blue-300">Total Referrals</p>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                    {referralData.stats.totalReferrals}
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                    {referralData.stats.thisMonthReferrals} this month
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
                                <UserPlus className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-green-700 dark:text-green-300">Active Referrals</p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                    {referralData.stats.successfulReferrals}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400">
                                    {referralData.stats.conversionRate}% conversion
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
                                <Gift className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">Total Rewards</p>
                                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                                    {referralData.stats.totalRewards}
                                </p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                    points earned
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
                                <Trophy className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-purple-700 dark:text-purple-300">Rank</p>
                                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                    {referralData.stats.rank}
                                </p>
                                <p className="text-xs text-purple-600 dark:text-purple-400">
                                    #{referralData.leaderboard.find(l => l.isCurrentUser)?.rank} overall
                                </p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Referral Tools */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                        Your Referral Tools
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Referral Code & Link */}
                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                    Referral Code
                                </label>
                                <div className="flex items-center space-x-2">
                                    <Input
                                        value={referralData.referralCode}
                                        readOnly
                                        className="font-mono"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyReferralCode}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                    Referral Link
                                </label>
                                <div className="flex items-center space-x-2">
                                    <Input
                                        value={referralData.referralLink}
                                        readOnly
                                        className="text-sm"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyReferralLink}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <Button
                                onClick={() => setShowShareModal(true)}
                                className="w-full flex items-center justify-center space-x-2"
                            >
                                <Share2 className="h-4 w-4" />
                                <span>Share with Friends</span>
                            </Button>
                        </div>

                        {/* QR Code */}
                        <div className="text-center space-y-4">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                QR Code
                            </h4>
                            <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                                <img
                                    src={referralData.qrCodeUrl}
                                    alt="Referral QR Code"
                                    className="w-32 h-32"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadQR}
                                className="flex items-center space-x-2"
                            >
                                <Download className="h-3 w-3" />
                                <span>Download QR</span>
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Referrals */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Recent Referrals
                            </h3>
                            <Badge variant="blue">
                                {referralData.recentReferrals.length}
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            {referralData.recentReferrals.map((referral) => (
                                <div key={referral.id} className="flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                    <Avatar
                                        src={referral.profilePicture}
                                        alt={referral.name}
                                        size="md"
                                        fallback={referral.name.charAt(0)}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                {referral.name}
                                            </h4>
                                            <Badge variant={getStatusColor(referral.status)} size="sm">
                                                {referral.status.replace('_', ' ')}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center space-x-4 mt-1 text-xs text-slate-600 dark:text-slate-400">
                                            <span>Joined {formatDate(referral.joinDate)}</span>
                                            <span>•</span>
                                            <span>{referral.donationsCount} donations</span>
                                            {referral.rewardEarned > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-green-600 dark:text-green-400">
                                                        +{referral.rewardEarned} points
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {referral.lastDonation && (
                                            <div className="flex items-center space-x-1 mt-1">
                                                <Heart className="h-3 w-3 text-red-500" />
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    Last donation: {formatDateTime(referral.lastDonation)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button variant="outline" className="w-full mt-4">
                            <Eye className="h-4 w-4 mr-2" />
                            View All Referrals
                        </Button>
                    </Card>
                </motion.div>

                {/* Leaderboard */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Referral Leaderboard
                            </h3>
                            <Badge variant="yellow">
                                This Month
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            {referralData.leaderboard.map((user, index) => (
                                <div key={index} className={`flex items-center space-x-4 p-3 rounded-lg ${user.isCurrentUser
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                    : 'bg-slate-50 dark:bg-slate-700'
                                    }`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${user.rank === 1
                                        ? 'bg-yellow-500 text-white'
                                        : user.rank === 2
                                            ? 'bg-gray-400 text-white'
                                            : user.rank === 3
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                                        }`}>
                                        {user.rank}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <span className={`text-sm font-medium ${user.isCurrentUser
                                                ? 'text-blue-900 dark:text-blue-100'
                                                : 'text-slate-900 dark:text-white'
                                                }`}>
                                                {user.name}
                                            </span>
                                            {user.isCurrentUser && (
                                                <Badge variant="blue" size="sm">
                                                    You
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                            {user.referrals} referrals
                                        </div>
                                    </div>

                                    {user.rank <= 3 && (
                                        <div className="text-lg">
                                            {user.rank === 1 ? '🏆' : user.rank === 2 ? '🥈' : '🥉'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Rewards & Achievements */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Referral Rewards & Achievements
                        </h3>
                        <div className="flex items-center space-x-2">
                            <Target className="h-5 w-5 text-green-600" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                Next reward at {referralData.stats.nextRewardAt} referrals
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {referralData.rewards.map((reward) => (
                            <div key={reward.id} className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {reward.type === 'milestone' ? (
                                            <Target className="h-5 w-5 text-white" />
                                        ) : reward.type === 'achievement' ? (
                                            <Award className="h-5 w-5 text-white" />
                                        ) : (
                                            <Trophy className="h-5 w-5 text-white" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {reward.title}
                                        </h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                            {reward.description}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <Badge variant="yellow" size="sm">
                                                +{reward.points} points
                                            </Badge>
                                            <span className="text-xs text-slate-500">
                                                {formatDate(reward.earnedDate)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </motion.div>

            {/* Progress to Next Reward */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
            >
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Progress to Next Reward
                        </h3>
                        <div className="flex items-center space-x-2">
                            <Zap className="h-5 w-5 text-purple-600" />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                                {referralData.stats.nextRewardAt - referralData.stats.totalReferrals} referrals to go
                            </span>
                        </div>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-4">
                        <motion.div
                            className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                                width: `${(referralData.stats.totalReferrals / referralData.stats.nextRewardAt) * 100}%`
                            }}
                            transition={{ duration: 1, delay: 1 }}
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>Current: {referralData.stats.totalReferrals} referrals</span>
                        <span>Target: {referralData.stats.nextRewardAt} referrals</span>
                    </div>
                </Card>
            </motion.div>

            {/* Share Modal */}
            <AnimatePresence>
                {showShareModal && (
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
                                        Share Your Referral
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowShareModal(false)}
                                    >
                                        ×
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                            Custom Message (Optional)
                                        </label>
                                        <Input
                                            value={customMessage}
                                            onChange={(e) => setCustomMessage(e.target.value)}
                                            placeholder="Add a personal message..."
                                            multiline
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                                            Choose Platform
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleSharePlatform('whatsapp')}
                                                className="flex items-center space-x-2 justify-center"
                                            >
                                                <MessageSquare className="h-4 w-4 text-green-600" />
                                                <span>WhatsApp</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                onClick={() => handleSharePlatform('facebook')}
                                                className="flex items-center space-x-2 justify-center"
                                            >
                                                <Facebook className="h-4 w-4 text-blue-600" />
                                                <span>Facebook</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                onClick={() => handleSharePlatform('twitter')}
                                                className="flex items-center space-x-2 justify-center"
                                            >
                                                <Twitter className="h-4 w-4 text-blue-400" />
                                                <span>Twitter</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                onClick={() => handleSharePlatform('email')}
                                                className="flex items-center space-x-2 justify-center"
                                            >
                                                <Mail className="h-4 w-4 text-gray-600" />
                                                <span>Email</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                onClick={() => handleSharePlatform('sms')}
                                                className="flex items-center space-x-2 justify-center"
                                            >
                                                <Phone className="h-4 w-4 text-green-600" />
                                                <span>SMS</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                onClick={handleCopyReferralLink}
                                                className="flex items-center space-x-2 justify-center"
                                            >
                                                <Copy className="h-4 w-4 text-gray-600" />
                                                <span>Copy Link</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReferralDashboard;