import React, { Suspense, lazy, memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import PrivacyBadge, { PremiumPrivacyBadge, CompactPrivacyBadge } from './PrivacyBadge';
import HeroContent from './HeroContent';
import HeroImages from './HeroImages';
import HeroCTA from './HeroCTA';
import { useHeroAnimations, AnimatedSection } from './HeroAnimations';
import { useResponsiveLayout } from './ResponsiveHeroLayout';

// Lazy load heavy components for better performance
const MissionMessaging = lazy(() => import('./MissionMessaging'));

// Error fallback component
export const HeroErrorFallback = memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-red-800 flex items-center justify-center">
    <div className="text-center space-y-4 max-w-md mx-auto px-4">
      <div className="text-white text-6xl mb-4">⚠️</div>
      <h2 className="text-white text-2xl font-bold">Something went wrong</h2>
      <p className="text-red-100">We're having trouble loading the hero section.</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-white text-primary-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
));

// Main Hero Section Component
const NewHeroSection = memo(({
  onRegisterClick,
  className = '',
  variant = 'full',
  enableAnimations = true,
  enableLazyLoading = true
}) => {
  // Hooks for responsive behavior and animations
  const { layout } = useResponsiveLayout();
  const { shouldReduceMotion } = useHeroAnimations({
    autoStart: enableAnimations,
    respectReducedMotion: true
  });

  // Memoized configuration based on variant and layout
  const heroConfig = useMemo(() => ({
    showPrivacyBadge: variant !== 'minimal',
    showMissionMessaging: variant === 'full' && layout !== 'mobile',
    showFloatingElements: variant === 'full' && layout === 'desktop',
    animationDelay: shouldReduceMotion ? 0 : 200
  }), [variant, layout, shouldReduceMotion]);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleRegisterClick = useCallback(() => {
    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'hero_register_click', {
        event_category: 'engagement',
        event_label: 'hero_section',
        value: 1
      });
    }
    
    onRegisterClick?.();
  }, [onRegisterClick]);

  // Memoized animation variants
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: heroConfig.animationDelay / 1000,
        delayChildren: 0.1
      }
    }
  }), [heroConfig.animationDelay]);

  const sectionVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }), []);

  // Performance optimization: Skip heavy components for minimal variant
  if (variant === 'minimal') {
    return (
      <section className={`relative bg-white min-h-screen flex items-center ${className}`}>
        {/* Top half blue background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-[calc(35%+20px)] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        </div>
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              India's First<br />
              <span className="text-red-200">Privacy-Protected</span><br />
              Blood Donation Platform
            </h1>
            
            <p className="text-xl text-red-100 max-w-2xl mx-auto">
              Revolutionary donor privacy protection with 3-month hiding feature.
            </p>
            
            <HeroCTA 
              variant="primary" 
              onRegisterClick={handleRegisterClick}
            />
          </motion.div>
        </div>
      </section>
    );
  }

  // Compact variant for mobile or space-constrained layouts
  if (variant === 'compact' || layout === 'mobile') {
    return (
      <section className={`relative bg-white min-h-screen ${className}`}>
        {/* Top half blue background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-[calc(35%+20px)] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        </div>
        <div className="relative max-w-sm mx-auto px-4 py-8 min-h-screen flex flex-col justify-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {heroConfig.showPrivacyBadge && (
              <AnimatedSection variants={sectionVariants} className="text-center">
                <CompactPrivacyBadge className="mx-auto max-w-[90%]" />
              </AnimatedSection>
            )}
            
            <AnimatedSection variants={sectionVariants}>
              <HeroContent onRegisterClick={handleRegisterClick} />
            </AnimatedSection>
            
            <AnimatedSection variants={sectionVariants}>
              <HeroImages layout="mobile" />
            </AnimatedSection>
          </motion.div>
        </div>
      </section>
    );
  }

  // Full variant with all features
  return (
    <section className={`relative bg-white overflow-visible min-h-screen ${className}`}>
      {/* Background: top half blue, bottom half white */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-[calc(29.5%)] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8 py-8 min-h-screen overflow-visible">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Privacy Badge */}
          {heroConfig.showPrivacyBadge && (
            <AnimatedSection variants={sectionVariants} className="text-center mb-8">
              {layout === 'desktop' ? (
                <PremiumPrivacyBadge />
              ) : (
                <CompactPrivacyBadge className="mx-auto max-w-[90%]" />
              )}
            </AnimatedSection>
          )}

          {/* Associations will be shown under the branding inside the left column */}

          {/* Main Content Layout - Balanced proportions */}
          {layout === 'desktop' ? (
            <div className="grid grid-cols-12 gap-10 items-center min-h-[calc(100vh-150px)]">
              <AnimatedSection variants={sectionVariants} className="col-span-7">
                <HeroContent onRegisterClick={handleRegisterClick} />
              </AnimatedSection>
              
              <AnimatedSection variants={sectionVariants} className="col-span-5 mt-10">
                <HeroImages layout="desktop" />
              </AnimatedSection>
            </div>
          ) : (
            <div className="space-y-12 text-center overflow-visible">
              <AnimatedSection variants={sectionVariants}>
                <HeroContent onRegisterClick={handleRegisterClick} />
              </AnimatedSection>
              
              <AnimatedSection variants={sectionVariants} className="overflow-visible">
                <HeroImages layout="tablet" />
              </AnimatedSection>
            </div>
          )}

          {/* Mission Messaging - Lazy loaded for performance */}
          {heroConfig.showMissionMessaging && enableLazyLoading && (
            <AnimatedSection variants={sectionVariants} className="mt-16">
              <Suspense fallback={<div className="h-32 bg-white/5 rounded-2xl animate-pulse" />}>
                <MissionMessaging variant="stats" />
              </Suspense>
            </AnimatedSection>
          )}

          {/* Associations block removed from below stats per request */}
        </motion.div>
      </div>

      {/* Floating Decorative Elements */}
      {heroConfig.showFloatingElements && (
        <>
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
        </>
      )}
    </section>
  );
});

// Display name for debugging
NewHeroSection.displayName = 'NewHeroSection';

// Performance monitoring hook
export const useHeroPerformance = () => {
  const [metrics, setMetrics] = React.useState({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0
  });

  React.useEffect(() => {
    const startTime = performance.now();
    
    // Measure initial render time
    const measureRenderTime = () => {
      const renderTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, renderTime }));
    };

    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(measureRenderTime);

    // Measure interaction readiness
    const measureInteractionTime = () => {
      const interactionTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, interactionTime }));
    };

    // Measure when animations complete
    setTimeout(measureInteractionTime, 2000);

    return () => {
      // Cleanup if needed
    };
  }, []);

  return metrics;
};

// Export optimized hero section with performance monitoring
export default NewHeroSection;