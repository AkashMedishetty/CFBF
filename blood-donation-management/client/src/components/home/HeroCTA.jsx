import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, Shield, Users, CheckCircle } from 'lucide-react';

const HeroCTA = ({ 
  onRegisterClick,
  className = '',
  variant = 'primary' // 'primary', 'secondary', 'compact'
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const buttonVariants = {
    initial: { 
      scale: 1,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    hover: {
      scale: 1.05,
      boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 10px 20px -5px rgba(0, 0, 0, 0.1)',
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
        ease: 'easeInOut'
      }
    }
  };

  const iconVariants = {
    initial: { x: 0, scale: 1 },
    hover: { 
      x: 4, 
      scale: 1.1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  const heartVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.2,
      transition: {
        duration: 0.3,
        ease: 'backOut'
      }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const shimmerVariants = {
    initial: { x: '-100%' },
    animate: {
      x: '100%',
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatDelay: 3,
        ease: 'easeInOut'
      }
    }
  };

  const handleClick = () => {
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Analytics tracking
    if (window.gtag) {
      window.gtag('event', 'hero_cta_click', {
        event_category: 'engagement',
        event_label: 'register_as_donor'
      });
    }
    
    onRegisterClick?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Primary CTA - Main registration button
  if (variant === 'primary') {
    return (
      <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}

        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          relative overflow-hidden
          bg-white text-primary-900 
          hover:bg-gray-50 hover:text-primary-950
          px-8 py-4 rounded-2xl
          text-lg font-bold
          border-2 border-white
          focus:outline-none focus:ring-4 focus:ring-white/50
          transition-all duration-300
          group
          ${className}
        `}
        role="button"
        tabIndex={0}
        aria-label="Register as blood donor - completely free"
      >
        {/* Shimmer effect */}
        <motion.div
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
        
        {/* Button content */}
        <div className="relative z-10 flex items-center justify-center space-x-3">
          <motion.div
            variants={heartVariants}
            animate={isHovered ? 'hover' : 'pulse'}
          >
            <Heart className="w-6 h-6 text-primary-900 fill-current" />
          </motion.div>
          
          <span className="font-black tracking-wide">
            Register as Donor
          </span>
          
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium">100% Free</span>
            <motion.div variants={iconVariants}>
              <ArrowRight className="w-5 h-5 text-primary-900" />
            </motion.div>
          </div>
        </div>

        {/* Hover overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-r from-primary-50/50 to-primary-100/50 rounded-2xl"
            />
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  // Secondary CTA - Learn more button
  if (variant === 'secondary') {
    return (
      <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={() => {
          // Scroll to privacy section or open modal
          console.log('Learn about privacy protection');
        }}
        onKeyDown={handleKeyDown}
        className={`
          relative overflow-hidden
          border-2 border-white 
          bg-white/10 backdrop-blur-sm 
          text-white hover:bg-white hover:text-primary-800
          px-8 py-4 rounded-2xl
          text-lg font-medium
          focus:outline-none focus:ring-4 focus:ring-white/50
          transition-all duration-300
          group
          ${className}
        `}
        role="button"
        tabIndex={0}
        aria-label="Learn about our privacy protection features"
      >
        <div className="relative z-10 flex items-center justify-center space-x-3">
          <Shield className="w-5 h-5 group-hover:text-primary-800" />
          <span>Learn About Privacy Protection</span>
          <motion.div variants={iconVariants}>
            <ArrowRight className="w-4 h-4 group-hover:text-primary-800" />
          </motion.div>
        </div>
      </motion.button>
    );
  }

  // Compact CTA - Mobile optimized
  return (
    <motion.button
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative overflow-hidden
        bg-white text-primary-900 
        hover:bg-gray-50
        px-6 py-3 rounded-xl
        text-base font-bold
        w-full
        focus:outline-none focus:ring-4 focus:ring-white/50
        transition-all duration-300
        group
        ${className}
      `}
      role="button"
      tabIndex={0}
      aria-label="Register as blood donor"
    >
      <div className="relative z-10 flex items-center justify-center space-x-2">
        <Heart className="w-5 h-5 text-primary-900 fill-current" />
        <span>Register as Donor</span>
        <span className="text-sm">Free</span>
      </div>
    </motion.button>
  );
};

// Enhanced CTA group with multiple actions
export const HeroCTAGroup = ({ 
  onRegisterClick,
  onLearnMoreClick,
  className = '',
  layout = 'horizontal' // 'horizontal', 'vertical', 'stacked'
}) => {
  const groupVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
        delayChildren: 0.8
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  };

  const layoutClasses = {
    horizontal: 'flex flex-col sm:flex-row gap-4 items-start',
    vertical: 'flex flex-col gap-4 items-center',
    stacked: 'space-y-4'
  };

  return (
    <motion.div
      variants={groupVariants}
      initial="hidden"
      animate="visible"
      className={`${layoutClasses[layout]} ${className}`}
    >
      {/* Primary CTA */}
      <motion.div variants={itemVariants}>
        <HeroCTA 
          variant="primary" 
          onRegisterClick={onRegisterClick}
        />
      </motion.div>

      {/* Secondary CTA */}
      <motion.div variants={itemVariants}>
        <HeroCTA 
          variant="secondary" 
          onRegisterClick={onLearnMoreClick}
        />
      </motion.div>

      {/* Trust indicators */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-wrap items-center gap-4 text-red-100 text-sm mt-4"
      >
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span>50,000+ trusted donors</span>
        </div>
        <div className="flex items-center space-x-2">
          <Heart className="w-4 h-4 text-red-400 fill-current" />
          <span>25,000+ lives saved</span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span>95% success rate</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Floating CTA for mobile
export const FloatingCTA = ({ 
  onRegisterClick,
  isVisible = true,
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={`
        fixed bottom-4 left-4 right-4 z-50
        md:hidden
        ${className}
      `}
    >
      <HeroCTA 
        variant="compact" 
        onRegisterClick={onRegisterClick}
        className="shadow-2xl"
      />
    </motion.div>
  );
};

export default HeroCTA;