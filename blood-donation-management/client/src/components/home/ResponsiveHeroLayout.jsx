import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import HeroContent, { CompactHeroContent } from './HeroContent';
import HeroImages from './HeroImages';
import PrivacyBadge, { CompactPrivacyBadge, PremiumPrivacyBadge } from './PrivacyBadge';

const ResponsiveHeroLayout = ({ onRegisterClick, className = '' }) => {
  const [screenSize, setScreenSize] = useState('desktop');
  const [isLoaded, setIsLoaded] = useState(false);

  // Detect screen size
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    setIsLoaded(true);

    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-red-800 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Desktop Layout (≥1024px)
  if (screenSize === 'desktop') {
    return (
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`relative bg-gradient-to-br from-primary-600 via-primary-700 to-red-800 text-white overflow-hidden min-h-screen ${className}`}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-12 min-h-screen">
          {/* Privacy Badge */}
          <motion.div variants={sectionVariants} className="text-center mb-12">
            <PremiumPrivacyBadge />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-8 items-center min-h-[calc(100vh-200px)]">
            {/* Content Column */}
            <motion.div variants={sectionVariants} className="col-span-7 pr-8">
              <HeroContent onRegisterClick={onRegisterClick} />
            </motion.div>

            {/* Images Column */}
            <motion.div variants={sectionVariants} className="col-span-5">
              <HeroImages layout="desktop" />
            </motion.div>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 left-10 opacity-20"
        >
          <div className="w-16 h-16 bg-white/10 rounded-full blur-xl" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 right-10 opacity-20"
        >
          <div className="w-12 h-12 bg-red-200/20 rounded-full blur-lg" />
        </motion.div>
      </motion.section>
    );
  }

  // Tablet Layout (768px - 1023px)
  if (screenSize === 'tablet') {
    return (
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`relative bg-gradient-to-br from-primary-600 via-primary-700 to-red-800 text-white overflow-hidden min-h-screen ${className}`}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='20' cy='20' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-12 min-h-screen">
          {/* Privacy Badge */}
          <motion.div variants={sectionVariants} className="text-center mb-8">
            <PrivacyBadge />
          </motion.div>

          {/* Stacked Layout */}
          <div className="space-y-12">
            {/* Content Section */}
            <motion.div variants={sectionVariants} className="text-center">
              <HeroContent onRegisterClick={onRegisterClick} />
            </motion.div>

            {/* Images Section */}
            <motion.div variants={sectionVariants}>
              <HeroImages layout="tablet" />
            </motion.div>
          </div>
        </div>
      </motion.section>
    );
  }

  // Mobile Layout (<768px)
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`relative bg-gradient-to-br from-primary-600 via-primary-700 to-red-800 text-white overflow-hidden min-h-screen ${className}`}
    >
      {/* Simplified Background for Mobile */}
      <div className="absolute inset-0 bg-black/5" />

      <div className="relative max-w-sm mx-auto px-4 py-8 min-h-screen flex flex-col justify-center">
        {/* Compact Privacy Badge */}
        <motion.div variants={sectionVariants} className="text-center mb-6">
          <CompactPrivacyBadge />
        </motion.div>

        {/* Mobile Content */}
        <motion.div variants={sectionVariants} className="mb-8">
          <CompactHeroContent onRegisterClick={onRegisterClick} />
        </motion.div>

        {/* Mobile Images */}
        <motion.div variants={sectionVariants}>
          <HeroImages layout="mobile" />
        </motion.div>
      </div>
    </motion.section>
  );
};

// Hook for responsive behavior
export const useResponsiveLayout = () => {
  const [layout, setLayout] = useState('desktop');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDimensions({ width, height });
      
      if (width < 768) {
        setLayout('mobile');
      } else if (width < 1024) {
        setLayout('tablet');
      } else {
        setLayout('desktop');
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  return { layout, dimensions };
};

// Responsive image aspect ratios
export const getResponsiveAspectRatio = (layout, imageType = 'primary') => {
  const aspectRatios = {
    desktop: {
      primary: '4/3',
      secondary: '3/4'
    },
    tablet: {
      primary: '16/10',
      secondary: '4/3'
    },
    mobile: {
      primary: '16/10',
      secondary: '16/10'
    }
  };

  return aspectRatios[layout]?.[imageType] || '16/10';
};

// Responsive spacing utilities
export const getResponsiveSpacing = (layout) => {
  const spacing = {
    desktop: {
      container: 'px-6 lg:px-8 py-12',
      section: 'space-y-12',
      grid: 'gap-8'
    },
    tablet: {
      container: 'px-6 py-12',
      section: 'space-y-8',
      grid: 'gap-6'
    },
    mobile: {
      container: 'px-4 py-8',
      section: 'space-y-6',
      grid: 'gap-4'
    }
  };

  return spacing[layout] || spacing.desktop;
};

export default ResponsiveHeroLayout;