import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';

// Animation configuration constants
export const ANIMATION_CONFIG = {
  TOTAL_DURATION: 2000, // 2 seconds total
  STAGGER_DELAY: 200,   // 200ms between elements
  SEQUENCE: {
    PRIVACY_BADGE: 0,     // 0ms
    HEADLINE: 200,        // 200ms
    TAGLINE: 400,         // 400ms
    IMAGES: 600,          // 600ms
    CTA: 800             // 800ms
  }
};

// Custom hook for managing hero animations
export const useHeroAnimations = (options = {}) => {
  const {
    autoStart = true,
    respectReducedMotion = true,
    onComplete
  } = options;

  const shouldReduceMotion = useReducedMotion();
  const controls = useAnimation();
  const [animationState, setAnimationState] = useState('idle');

  const startAnimations = async () => {
    if (shouldReduceMotion && respectReducedMotion) {
      // Skip animations for users who prefer reduced motion
      setAnimationState('complete');
      onComplete?.();
      return;
    }

    setAnimationState('running');

    try {
      await controls.start('visible');
      setAnimationState('complete');
      onComplete?.();
    } catch (error) {
      console.warn('Animation error:', error);
      setAnimationState('error');
    }
  };

  useEffect(() => {
    if (autoStart) {
      startAnimations();
    }
  }, [autoStart, startAnimations]);

  return {
    controls,
    animationState,
    startAnimations,
    shouldReduceMotion: shouldReduceMotion && respectReducedMotion
  };
};

// Staggered container variants
export const createStaggeredContainer = (delayChildren = 0, staggerChildren = 0.2) => ({
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      delayChildren,
      staggerChildren,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
});

// Individual element variants
export const createElementVariants = (delay = 0, customTransition = {}) => ({
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
    ...customTransition.hidden
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      delay: delay / 1000, // Convert ms to seconds
      ease: [0.25, 0.46, 0.45, 0.94],
      ...customTransition.visible
    }
  }
});

// Privacy badge specific animations
export const privacyBadgeVariants = {
  hidden: {
    opacity: 0,
    y: -30,
    scale: 0.9,
    rotateX: -15
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.6,
      delay: ANIMATION_CONFIG.SEQUENCE.PRIVACY_BADGE / 1000,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Headline text animation with word staggering
export const headlineVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      delay: ANIMATION_CONFIG.SEQUENCE.HEADLINE / 1000,
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const headlineWordVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    skewY: 5
  },
  visible: {
    opacity: 1,
    y: 0,
    skewY: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Image entrance animations
export const imageContainerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      delay: ANIMATION_CONFIG.SEQUENCE.IMAGES / 1000,
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

export const imageVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 40,
    rotateY: -15
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateY: 0,
    transition: {
      duration: 1,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// CTA button animations
export const ctaVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: ANIMATION_CONFIG.SEQUENCE.CTA / 1000,
      ease: 'backOut'
    }
  }
};

// Floating elements animations
export const floatingElementVariants = {
  hidden: {
    opacity: 0,
    scale: 0
  },
  visible: {
    opacity: 0.2,
    scale: 1,
    transition: {
      duration: 1,
      delay: 1,
      ease: 'easeOut'
    }
  },
  float: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Performance optimized animation wrapper
export const AnimatedSection = ({ 
  children, 
  variants, 
  className = '',
  delay = 0,
  ...props 
}) => {
  const shouldReduceMotion = useReducedMotion();
  
  if (shouldReduceMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Text reveal animation component
export const AnimatedText = ({ 
  text, 
  className = '',
  delay = 0,
  staggerChildren = 0.05 
}) => {
  const shouldReduceMotion = useReducedMotion();
  
  if (shouldReduceMotion) {
    return <span className={className}>{text}</span>;
  }

  const words = text.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: delay / 1000,
        staggerChildren,
        delayChildren: 0.1
      }
    }
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 10,
      rotateX: -90
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={wordVariants}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};

// Scroll-triggered animations
export const useScrollAnimation = (threshold = 0.1) => {
  const [isInView, setIsInView] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
          controls.start('visible');
        }
      },
      { threshold }
    );

    const element = document.querySelector('[data-scroll-animation]');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [controls, isInView, threshold]);

  return { controls, isInView };
};

// Performance monitoring for animations
export const useAnimationPerformance = () => {
  const [metrics, setMetrics] = useState({
    frameRate: 60,
    droppedFrames: 0,
    animationDuration: 0
  });

  useEffect(() => {
    let startTime = performance.now();
    let frameCount = 0;
    let lastTime = startTime;

    const measurePerformance = (currentTime) => {
      frameCount++;
      const elapsed = currentTime - startTime;
      // const currentFrameRate = Math.round(1000 / (currentTime - lastTime));
      
      if (elapsed >= 1000) {
        const avgFrameRate = Math.round((frameCount * 1000) / elapsed);
        const droppedFrames = Math.max(0, 60 - avgFrameRate);
        
        setMetrics({
          frameRate: avgFrameRate,
          droppedFrames,
          animationDuration: elapsed
        });

        // Reset counters
        startTime = currentTime;
        frameCount = 0;
      }
      
      lastTime = currentTime;
      requestAnimationFrame(measurePerformance);
    };

    const animationId = requestAnimationFrame(measurePerformance);
    
    return () => cancelAnimationFrame(animationId);
  }, []);

  return metrics;
};

// Export animation presets
export const ANIMATION_PRESETS = {
  FADE_IN: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  },
  SLIDE_UP: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  },
  SCALE_IN: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
  },
  ROTATE_IN: {
    hidden: { opacity: 0, rotateY: -90 },
    visible: { opacity: 1, rotateY: 0, transition: { duration: 0.8 } }
  }
};

const HeroAnimations = {
  useHeroAnimations,
  createStaggeredContainer,
  createElementVariants,
  AnimatedSection,
  AnimatedText,
  useScrollAnimation,
  useAnimationPerformance,
  ANIMATION_CONFIG,
  ANIMATION_PRESETS
};

export default HeroAnimations;