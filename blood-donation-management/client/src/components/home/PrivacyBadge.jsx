import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Star, Award } from 'lucide-react';

const PrivacyBadge = ({ 
  text = "1st time in India with Unique Donor Details Privacy Concept",
  animated = true,
  className = ''
}) => {
  const badgeVariants = {
    hidden: { 
      opacity: 0, 
      y: -30,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0
      }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: 0.3,
        ease: 'backOut'
      }
    }
  };

  const BadgeContent = () => (
    <div className="relative inline-flex items-center justify-center px-8 py-4 rounded-full overflow-hidden border border-white/30 shadow-2xl backdrop-blur-sm">
      {/* Indian Flag Gradient Background */}
      <div 
        className="absolute inset-0 opacity-90"
        style={{
          background: `linear-gradient(135deg, 
            #FF9933 0%,     /* Saffron */
            #FF9933 25%,    /* Saffron */
            #FFFFFF 25%,    /* White */
            #FFFFFF 50%,    /* White */
            #FFFFFF 50%,    /* White */
            #FFFFFF 75%,    /* White */
            #138808 75%,    /* Green */
            #138808 100%    /* Green */
          )`
        }}
      />
      
      {/* Subtle overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10" />
      
      {/* Glass morphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center space-x-3">
        {/* Left Icon */}
        <motion.div
          variants={iconVariants}
          initial={animated ? "hidden" : "visible"}
          animate="visible"
        >
          <Shield className="w-5 h-5 text-orange-800 drop-shadow-sm" />
        </motion.div>
        
        {/* Text */}
        <span 
          className="font-bold text-sm md:text-base lg:text-lg tracking-wide text-center leading-tight"
          style={{
            color: '#1a365d', // Dark blue for contrast
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 1px rgba(0, 0, 0, 0.1)'
          }}
        >
          {text}
        </span>
        
        {/* Right Icon */}
        <motion.div
          variants={iconVariants}
          initial={animated ? "hidden" : "visible"}
          animate="visible"
        >
          <Star className="w-5 h-5 text-green-800 drop-shadow-sm fill-current" />
        </motion.div>
      </div>
      
      {/* Subtle inner border for depth */}
      <div className="absolute inset-0 rounded-full border border-white/40 pointer-events-none" />
    </div>
  );

  if (!animated) {
    return (
      <div className={className}>
        <BadgeContent />
      </div>
    );
  }

  return (
    <motion.div
      variants={badgeVariants}
      initial="hidden"
      animate="visible"
      whileHover="pulse"
      className={`inline-block ${className}`}
    >
      <motion.div
        variants={pulseVariants}
        animate="pulse"
      >
        <BadgeContent />
      </motion.div>
    </motion.div>
  );
};

// Alternative compact version for smaller screens
export const CompactPrivacyBadge = ({ 
  text = "India's 1st Privacy-Protected Platform",
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold ${className}`}
      style={{
        background: `linear-gradient(90deg, 
          #FF9933 0%,     /* Saffron */
          #FFFFFF 50%,    /* White */
          #138808 100%    /* Green */
        )`,
        color: '#1a365d',
        textShadow: '0 1px 1px rgba(255, 255, 255, 0.8)'
      }}
    >
      <Shield className="w-3 h-3 mr-2 text-orange-800" />
      {text}
      <Star className="w-3 h-3 ml-2 text-green-800 fill-current" />
    </motion.div>
  );
};

// Premium version with enhanced effects
export const PremiumPrivacyBadge = ({ 
  text = "1st time in India with Unique Donor Details Privacy Concept",
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative inline-block ${className}`}
    >
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 via-white to-green-400 rounded-full blur opacity-30" />
      
      {/* Main badge */}
      <div className="relative flex items-center px-10 py-5 rounded-full overflow-hidden border border-white/40 shadow-2xl backdrop-blur-md">
        {/* Enhanced Indian Flag Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, 
              #FF9933 0%,     /* Saffron */
              #FF9933 30%,    /* Saffron */
              #FFFFFF 30%,    /* White */
              #FFFFFF 70%,    /* White */
              #138808 70%,    /* Green */
              #138808 100%    /* Green */
            )`
          }}
        />
        
        {/* Ashoka Chakra inspired subtle pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at center, #000080 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/10 to-transparent" />
        
        {/* Content */}
        <div className="relative z-10 flex items-center space-x-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <Award className="w-6 h-6 text-orange-800 drop-shadow-lg" />
          </motion.div>
          
          <span 
            className="font-black text-base md:text-lg lg:text-xl tracking-wide text-center leading-tight"
            style={{
              color: '#1a365d',
              textShadow: '0 2px 4px rgba(255, 255, 255, 0.9), 0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
          >
            {text}
          </span>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          >
            <Star className="w-6 h-6 text-green-800 drop-shadow-lg fill-current" />
          </motion.div>
        </div>
        
        {/* Multiple inner borders for premium effect */}
        <div className="absolute inset-0 rounded-full border-2 border-white/50 pointer-events-none" />
        <div className="absolute inset-1 rounded-full border border-white/30 pointer-events-none" />
      </div>
    </motion.div>
  );
};

export default PrivacyBadge;