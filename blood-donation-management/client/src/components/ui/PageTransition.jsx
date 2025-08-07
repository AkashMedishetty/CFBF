import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import logger from '../../utils/logger';
import animationSystem from '../../utils/animations';

const PageTransition = ({ 
  children, 
  animationType = 'slideUp',
  className = '',
  ...props 
}) => {
  const location = useLocation();
  
  React.useEffect(() => {
    logger.ui('MOUNT', 'PageTransition', { animationType, pathname: location.pathname }, 'UI_PAGE_TRANSITION');
    
    return () => {
      logger.ui('UNMOUNT', 'PageTransition', { animationType }, 'UI_PAGE_TRANSITION');
    };
  }, [animationType, location.pathname]);

  // Get animation configuration
  const animation = animationSystem.getAnimation('pageTransitions', animationType);
  const reducedMotionAnimation = animationSystem.getReducedMotionAnimation(animation);

  logger.debug(`PageTransition rendered with animationType: ${animationType}, pathname: ${location.pathname}`, 'UI_PAGE_TRANSITION');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className={className}
        initial={reducedMotionAnimation.initial}
        animate={reducedMotionAnimation.animate}
        exit={reducedMotionAnimation.exit}
        transition={reducedMotionAnimation.transition}
        onAnimationStart={() => logger.ui('ANIMATION_START', 'PageTransition', { animationType, pathname: location.pathname }, 'UI_PAGE_TRANSITION')}
        onAnimationComplete={() => logger.ui('ANIMATION_COMPLETE', 'PageTransition', { animationType, pathname: location.pathname }, 'UI_PAGE_TRANSITION')}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Route-specific transition wrapper
export const RouteTransition = ({ 
  children, 
  animationType = 'slideUp',
  className = 'min-h-screen',
  ...props 
}) => {
  const location = useLocation();
  
  React.useEffect(() => {
    logger.route('TRANSITION', location.pathname, 'ROUTE_TRANSITION');
  }, [location.pathname]);

  return (
    <PageTransition 
      animationType={animationType}
      className={className}
      {...props}
    >
      {children}
    </PageTransition>
  );
};

// Modal transition wrapper
export const ModalTransition = ({ 
  isOpen,
  children, 
  onClose,
  className = '',
  ...props 
}) => {
  
  React.useEffect(() => {
    if (isOpen) {
      logger.ui('OPEN', 'ModalTransition', null, 'UI_MODAL_TRANSITION');
    } else {
      logger.ui('CLOSE', 'ModalTransition', null, 'UI_MODAL_TRANSITION');
    }
  }, [isOpen]);

  // Get modal animation configuration
  const overlayAnimation = animationSystem.getAnimation('modalAnimations', 'overlay');
  const modalAnimation = animationSystem.getAnimation('modalAnimations', 'modal');
  
  const reducedOverlayAnimation = animationSystem.getReducedMotionAnimation(overlayAnimation);
  const reducedModalAnimation = animationSystem.getReducedMotionAnimation(modalAnimation);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            {...reducedOverlayAnimation}
            onClick={onClose}
            onAnimationStart={() => logger.ui('ANIMATION_START', 'ModalOverlay', null, 'UI_MODAL_TRANSITION')}
          />

          {/* Modal Container */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              className={`relative w-full max-w-lg ${className}`}
              {...reducedModalAnimation}
              onAnimationStart={() => logger.ui('ANIMATION_START', 'ModalContent', null, 'UI_MODAL_TRANSITION')}
              onAnimationComplete={() => logger.ui('ANIMATION_COMPLETE', 'ModalContent', null, 'UI_MODAL_TRANSITION')}
              {...props}
            >
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Notification transition wrapper
export const NotificationTransition = ({ 
  notifications = [],
  position = 'top-right',
  className = '',
  ...props 
}) => {
  
  React.useEffect(() => {
    logger.ui('UPDATE', 'NotificationTransition', { count: notifications.length, position }, 'UI_NOTIFICATION_TRANSITION');
  }, [notifications.length, position]);

  // Position classes
  const positions = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50'
  };

  const positionClass = positions[position] || positions['top-right'];

  // Get notification animation configuration
  const animationType = position.includes('right') ? 'slideInRight' : 'slideInTop';
  const animation = animationSystem.getAnimation('notificationAnimations', animationType);
  const reducedMotionAnimation = animationSystem.getReducedMotionAnimation(animation);

  return (
    <div className={`${positionClass} space-y-2 ${className}`}>
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            {...reducedMotionAnimation}
            layout
            onAnimationStart={() => logger.ui('ANIMATION_START', 'Notification', { id: notification.id }, 'UI_NOTIFICATION_TRANSITION')}
            onAnimationComplete={() => logger.ui('ANIMATION_COMPLETE', 'Notification', { id: notification.id }, 'UI_NOTIFICATION_TRANSITION')}
            {...props}
          >
            {notification.content}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default PageTransition;