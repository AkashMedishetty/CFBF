import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Shield, Zap, Globe, Star, CheckCircle } from 'lucide-react';

const MissionMessaging = ({ className = '', variant = 'full' }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const impactStats = [
    {
      icon: Heart,
      value: '25,000+',
      label: 'Lives Saved',
      description: 'Through our privacy-protected platform',
      color: 'text-red-400'
    },
    {
      icon: Users,
      value: '50,000+',
      label: 'Trusted Donors',
      description: 'Who value their privacy',
      color: 'text-blue-400'
    },
    {
      icon: Shield,
      value: '100%',
      label: 'Privacy Protected',
      description: 'With 3-month hiding feature',
      color: 'text-green-400'
    },
    {
      icon: Zap,
      value: '95%',
      label: 'Success Rate',
      description: 'In emergency matching',
      color: 'text-yellow-400'
    }
  ];

  const missionPoints = [
    {
      icon: Globe,
      title: 'India\'s First Privacy-Protected Platform',
      description: 'Revolutionary approach to blood donation that puts donor privacy first while saving lives.'
    },
    {
      icon: Heart,
      title: 'Every Donation Saves 3 Lives',
      description: 'Your single donation can be separated into components to help multiple patients in need.'
    },
    {
      icon: Shield,
      title: 'Complete Anonymity Protection',
      description: 'Our unique 3-month hiding feature ensures your personal details remain completely secure.'
    },
    {
      icon: Users,
      title: 'Building Stronger Communities',
      description: 'Connecting donors and recipients while maintaining privacy and dignity for all.'
    }
  ];

  // Compact version for mobile or smaller spaces
  if (variant === 'compact') {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`space-y-4 ${className}`}
      >
        <motion.div variants={itemVariants} className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Heart className="w-5 h-5 text-red-300 fill-current" />
            <span className="text-lg font-bold text-white">Saving Lives Through Innovation</span>
          </div>
          <p className="text-red-100 text-sm leading-relaxed">
            Join thousands of donors who trust our privacy-first approach to make a meaningful 
            difference in their communities.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-2 gap-3">
            {impactStats.slice(0, 4).map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-red-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Stats only version
  if (variant === 'stats') {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}
      >
        {impactStats.map((stat, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -2 }}
            className="text-center bg-red-600/10 rounded-xl p-4 border border-red-300/30"
          >
            <stat.icon className={`w-8 h-8 text-red-700 mx-auto mb-2`} />
            <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
            <div className="text-sm font-medium text-slate-700 mb-1">{stat.label}</div>
            <div className="text-xs text-slate-600 leading-tight">{stat.description}</div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // Full version with complete mission messaging
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`space-y-8 ${className}`}
    >
      {/* Main Mission Statement */}
      <motion.div variants={itemVariants}>
        <div className="bg-red-700/30 rounded-2xl p-8 border border-red-500/40">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center">
                <Heart className="w-8 h-8 text-red-300 fill-current" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-3">
                Revolutionizing Blood Donation in India
              </h3>
              <p className="text-white leading-relaxed text-lg mb-4 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                Every donation through our platform can save up to 3 lives. Join thousands of donors who trust our privacy-first approach to make a meaningful difference in their communities while keeping their personal information completely secure.
              </p>
              <div className="flex items-center space-x-4 text-sm text-white/90">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Privacy First Approach</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Life-Saving Impact</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Community Building</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Impact Statistics */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {impactStats.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -4 }}
              className="bg-red-600/10 rounded-xl p-6 border border-red-300/30 text-center group hover:bg-red-600/15 transition-all duration-300"
            >
              <stat.icon className={`w-10 h-10 text-red-700 mx-auto mb-3 group-hover:scale-110 transition-transform`} />
              <div className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</div>
              <div className="text-sm font-semibold text-slate-700 mb-2">{stat.label}</div>
              <div className="text-xs text-slate-600 leading-tight">{stat.description}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Mission Points */}
      <motion.div variants={itemVariants}>
        <div className="grid md:grid-cols-2 gap-6">
          {missionPoints.map((point, index) => (
            <motion.div
              key={index}
              whileHover={{ x: 4 }}
              className="flex items-start space-x-4 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                  <point.icon className="w-6 h-6 text-red-700" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-slate-900 mb-2">{point.title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{point.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Call to Action with Social Proof */}
      <motion.div variants={itemVariants}>
        <div className="bg-gradient-to-r from-red-600/20 to-red-700/20 backdrop-blur-sm rounded-2xl p-8 border border-red-400/20 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Star className="w-6 h-6 text-yellow-400 fill-current" />
            <Star className="w-6 h-6 text-yellow-400 fill-current" />
            <Star className="w-6 h-6 text-yellow-400 fill-current" />
            <Star className="w-6 h-6 text-yellow-400 fill-current" />
            <Star className="w-6 h-6 text-yellow-400 fill-current" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">
            Join the Privacy-Protected Blood Donation Revolution
          </h3>
          <p className="text-red-100 mb-6 max-w-2xl mx-auto">
            Be part of India's first privacy-protected blood donation platform. Your contribution 
            can save lives while keeping your personal information completely secure.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-red-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Trusted by 50,000+ donors</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span>25,000+ lives saved</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>95% success rate</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span>100% privacy protected</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Floating impact indicator
export const FloatingImpactIndicator = ({ className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 2, duration: 0.6 }}
      className={`fixed bottom-20 right-6 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg z-40 ${className}`}
    >
      <div className="flex items-center space-x-2 text-sm font-medium">
        <Heart className="w-4 h-4 fill-current animate-pulse" />
        <span>25,000+ Lives Saved</span>
      </div>
    </motion.div>
  );
};

// Mission highlight component
export const MissionHighlight = ({ 
  icon: Icon = Heart,
  title,
  description,
  className = ''
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 ${className}`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-red-300" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-red-100 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default MissionMessaging;