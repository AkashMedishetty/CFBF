import React from 'react';
import { motion } from 'framer-motion';
import logger from '../../utils/logger';
import animationSystem from '../../utils/animations';

const AnimatedList = ({ 
  children, 
  staggerType = 'container',
  className = '',
  ...props 
}) => {
  
  React.useEffect(() => {
    logger.ui('MOUNT', 'AnimatedList', { staggerType, childrenCount: React.Children.count(children) }, 'UI_ANIMATED_LIST');
    
    return () => {
      logger.ui('UNMOUNT', 'AnimatedList', { staggerType }, 'UI_ANIMATED_LIST');
    };
  }, [staggerType, children]);

  // Get stagger animation configuration
  const staggerConfig = animationSystem.getAnimation('staggerAnimations', staggerType);
  const reducedMotionAnimation = animationSystem.getReducedMotionAnimation(staggerConfig);

  logger.debug(`AnimatedList rendered with staggerType: ${staggerType}, children: ${React.Children.count(children)}`, 'UI_ANIMATED_LIST');

  return (
    <motion.div
      className={className}
      variants={reducedMotionAnimation}
      initial="hidden"
      animate="visible"
      onAnimationStart={() => logger.ui('ANIMATION_START', 'AnimatedList', { staggerType }, 'UI_ANIMATED_LIST')}
      onAnimationComplete={() => logger.ui('ANIMATION_COMPLETE', 'AnimatedList', { staggerType }, 'UI_ANIMATED_LIST')}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Animated list item component
export const AnimatedListItem = ({ 
  children, 
  staggerType = 'item',
  className = '',
  ...props 
}) => {
  
  // Get item animation configuration
  const itemConfig = animationSystem.getAnimation('staggerAnimations', staggerType);
  const reducedMotionAnimation = animationSystem.getReducedMotionAnimation(itemConfig);

  logger.debug(`AnimatedListItem rendered with staggerType: ${staggerType}`, 'UI_ANIMATED_LIST');

  return (
    <motion.div
      className={className}
      variants={reducedMotionAnimation}
      onAnimationStart={() => logger.ui('ANIMATION_START', 'AnimatedListItem', { staggerType }, 'UI_ANIMATED_LIST')}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Grid animation component
export const AnimatedGrid = ({ 
  children, 
  columns = 3,
  gap = 4,
  staggerType = 'fastStagger',
  className = '',
  ...props 
}) => {
  
  React.useEffect(() => {
    logger.ui('MOUNT', 'AnimatedGrid', { columns, gap, staggerType, childrenCount: React.Children.count(children) }, 'UI_ANIMATED_GRID');
  }, [columns, gap, staggerType, children]);

  const gridClasses = `grid grid-cols-1 md:grid-cols-${columns} gap-${gap} ${className}`;
  
  // Get stagger animation configuration
  const staggerConfig = animationSystem.getAnimation('staggerAnimations', staggerType);
  const reducedMotionAnimation = animationSystem.getReducedMotionAnimation(staggerConfig);

  return (
    <motion.div
      className={gridClasses}
      variants={reducedMotionAnimation.container}
      initial="hidden"
      animate="visible"
      onAnimationStart={() => logger.ui('ANIMATION_START', 'AnimatedGrid', { staggerType }, 'UI_ANIMATED_GRID')}
      onAnimationComplete={() => logger.ui('ANIMATION_COMPLETE', 'AnimatedGrid', { staggerType }, 'UI_ANIMATED_GRID')}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={reducedMotionAnimation.item}
          onAnimationStart={() => logger.ui('ANIMATION_START', 'AnimatedGridItem', { index }, 'UI_ANIMATED_GRID')}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Fade in when visible component
export const FadeInWhenVisible = ({ 
  children, 
  animationType = 'slideUp',
  threshold = 0.1,
  className = '',
  ...props 
}) => {
  
  React.useEffect(() => {
    logger.ui('MOUNT', 'FadeInWhenVisible', { animationType, threshold }, 'UI_FADE_IN_VISIBLE');
  }, [animationType, threshold]);

  // Get animation configuration
  const animation = animationSystem.getAnimation('pageTransitions', animationType);
  const reducedMotionAnimation = animationSystem.getReducedMotionAnimation(animation);

  return (
    <motion.div
      className={className}
      initial={reducedMotionAnimation.initial}
      whileInView={reducedMotionAnimation.animate}
      viewport={{ once: true, amount: threshold }}
      transition={reducedMotionAnimation.transition}
      onAnimationStart={() => logger.ui('ANIMATION_START', 'FadeInWhenVisible', { animationType }, 'UI_FADE_IN_VISIBLE')}
      onAnimationComplete={() => logger.ui('ANIMATION_COMPLETE', 'FadeInWhenVisible', { animationType }, 'UI_FADE_IN_VISIBLE')}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedList;