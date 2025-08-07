import logger from './logger';

// Animation configuration and utilities
class AnimationSystem {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    logger.debug('Animation system initialized', 'ANIMATION_SYSTEM');
  }

  // Page transition animations
  pageTransitions = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
    
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    
    slideDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    
    slideLeft: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    
    slideRight: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  };

  // Micro-interaction animations
  microInteractions = {
    buttonHover: {
      whileHover: { 
        scale: 1.02,
        transition: { duration: 0.15, ease: 'easeOut' }
      },
      whileTap: { 
        scale: 0.98,
        transition: { duration: 0.1, ease: 'easeOut' }
      }
    },
    
    cardHover: {
      whileHover: { 
        y: -2,
        boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
        transition: { duration: 0.2, ease: 'easeOut' }
      }
    },
    
    iconSpin: {
      animate: { rotate: 360 },
      transition: { duration: 1, ease: 'linear', repeat: Infinity }
    },
    
    iconBounce: {
      animate: { y: [0, -5, 0] },
      transition: { duration: 0.6, ease: 'easeInOut', repeat: Infinity }
    },
    
    pulse: {
      animate: { scale: [1, 1.05, 1] },
      transition: { duration: 2, ease: 'easeInOut', repeat: Infinity }
    },
    
    shake: {
      animate: { x: [0, -5, 5, -5, 5, 0] },
      transition: { duration: 0.5, ease: 'easeInOut' }
    }
  };

  // Loading state animations
  loadingStates = {
    skeleton: {
      animate: { opacity: [0.5, 1, 0.5] },
      transition: { duration: 1.5, ease: 'easeInOut', repeat: Infinity }
    },
    
    spinner: {
      animate: { rotate: 360 },
      transition: { duration: 1, ease: 'linear', repeat: Infinity }
    },
    
    pulse: {
      animate: { scale: [1, 1.1, 1] },
      transition: { duration: 1, ease: 'easeInOut', repeat: Infinity }
    },
    
    dots: {
      animate: { y: [0, -10, 0] },
      transition: { duration: 0.6, ease: 'easeInOut', repeat: Infinity }
    }
  };

  // Stagger animations for lists
  staggerAnimations = {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.1
        }
      }
    },
    
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: 'easeOut' }
      }
    },
    
    fastStagger: {
      container: {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05,
            delayChildren: 0.05
          }
        }
      },
      item: {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { duration: 0.3, ease: 'easeOut' }
        }
      }
    }
  };

  // Form animations
  formAnimations = {
    fieldFocus: {
      whileFocus: {
        scale: 1.02,
        transition: { duration: 0.2, ease: 'easeOut' }
      }
    },
    
    errorShake: {
      animate: { x: [0, -5, 5, -5, 5, 0] },
      transition: { duration: 0.4, ease: 'easeInOut' }
    },
    
    successPulse: {
      animate: { scale: [1, 1.05, 1] },
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  // Modal animations
  modalAnimations = {
    overlay: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 }
    },
    
    modal: {
      initial: { 
        opacity: 0, 
        scale: 0.95,
        y: 20
      },
      animate: { 
        opacity: 1, 
        scale: 1,
        y: 0
      },
      exit: { 
        opacity: 0, 
        scale: 0.95,
        y: 20
      },
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    }
  };

  // Notification animations
  notificationAnimations = {
    slideInRight: {
      initial: { opacity: 0, x: 100 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 100 },
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    
    slideInTop: {
      initial: { opacity: 0, y: -100 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -100 },
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  // Get animation by name and type
  getAnimation(type, name) {
    logger.debug(`Getting animation: ${type}.${name}`, 'ANIMATION_SYSTEM');
    
    const animationMap = {
      pageTransitions: this.pageTransitions,
      microInteractions: this.microInteractions,
      loadingStates: this.loadingStates,
      staggerAnimations: this.staggerAnimations,
      formAnimations: this.formAnimations,
      modalAnimations: this.modalAnimations,
      notificationAnimations: this.notificationAnimations
    };

    const animation = animationMap[type]?.[name];
    if (!animation) {
      logger.warn(`Animation not found: ${type}.${name}`, 'ANIMATION_SYSTEM');
      return {};
    }

    return animation;
  }

  // Create custom spring animation
  createSpring(config = {}) {
    const defaultConfig = {
      type: 'spring',
      damping: 25,
      stiffness: 300,
      mass: 1
    };

    const springConfig = { ...defaultConfig, ...config };
    logger.debug('Created custom spring animation', 'ANIMATION_SYSTEM');
    logger.logObject(springConfig, 'Spring Config', 'ANIMATION_SYSTEM');

    return springConfig;
  }

  // Create custom tween animation
  createTween(config = {}) {
    const defaultConfig = {
      type: 'tween',
      duration: 0.3,
      ease: 'easeOut'
    };

    const tweenConfig = { ...defaultConfig, ...config };
    logger.debug('Created custom tween animation', 'ANIMATION_SYSTEM');
    logger.logObject(tweenConfig, 'Tween Config', 'ANIMATION_SYSTEM');

    return tweenConfig;
  }

  // Performance monitoring for animations
  logAnimationPerformance(animationName, startTime) {
    if (this.isDevelopment) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      logger.debug(`Animation "${animationName}" completed in ${duration.toFixed(2)}ms`, 'ANIMATION_PERFORMANCE');
    }
  }

  // Reduced motion support
  getReducedMotionAnimation(normalAnimation, reducedAnimation = {}) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      logger.info('Using reduced motion animation', 'ANIMATION_SYSTEM');
      return {
        ...normalAnimation,
        transition: { duration: 0.01 },
        ...reducedAnimation
      };
    }

    return normalAnimation;
  }
}

// Create singleton instance
const animationSystem = new AnimationSystem();

// Export commonly used animations as named exports
export const {
  pageTransitions,
  microInteractions,
  loadingStates,
  staggerAnimations,
  formAnimations,
  modalAnimations,
  notificationAnimations
} = animationSystem;

export default animationSystem;