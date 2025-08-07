import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';
import logger from '../../utils/logger';
import animationSystem from '../../utils/animations';

const Alert = ({
  children,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = '',
  icon: CustomIcon,
  ...props
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    logger.componentMount('Alert', { variant, title, dismissible });
    
    return () => {
      logger.componentUnmount('Alert');
    };
  }, [variant, title, dismissible]);

  const handleDismiss = () => {
    logger.ui('DISMISS', 'Alert', { variant, title }, 'UI_ALERT');
    setIsVisible(false);
    
    // Call onDismiss after animation completes
    setTimeout(() => {
      if (onDismiss) {
        onDismiss();
      }
    }, 200);
  };

  // Icon mapping
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const Icon = CustomIcon || icons[variant];

  // Variant styles
  const variants = {
    success: {
      container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      title: 'text-green-800 dark:text-green-200',
      content: 'text-green-700 dark:text-green-300',
      dismiss: 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300'
    },
    error: {
      container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-800 dark:text-red-200',
      content: 'text-red-700 dark:text-red-300',
      dismiss: 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      title: 'text-yellow-800 dark:text-yellow-200',
      content: 'text-yellow-700 dark:text-yellow-300',
      dismiss: 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-800 dark:text-blue-200',
      content: 'text-blue-700 dark:text-blue-300',
      dismiss: 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'
    }
  };

  const variantStyles = variants[variant];

  // Animation configuration
  const alertAnimation = animationSystem.getReducedMotionAnimation({
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 },
    transition: { duration: 0.2, ease: 'easeOut' }
  });

  const dismissAnimation = animationSystem.getReducedMotionAnimation({
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.9 }
  });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`
            border rounded-lg p-4 ${variantStyles.container} ${className}
          `}
          {...alertAnimation}
          onAnimationStart={() => logger.ui('ANIMATION_START', 'Alert', { variant }, 'UI_ALERT')}
          onAnimationComplete={() => logger.ui('ANIMATION_COMPLETE', 'Alert', { variant }, 'UI_ALERT')}
          {...props}
        >
          <div className="flex items-start">
            {/* Icon */}
            {Icon && (
              <div className="flex-shrink-0">
                <Icon className={`h-5 w-5 ${variantStyles.icon}`} />
              </div>
            )}

            {/* Content */}
            <div className={`${Icon ? 'ml-3' : ''} flex-1`}>
              {title && (
                <h3 className={`text-sm font-medium ${variantStyles.title} mb-1`}>
                  {title}
                </h3>
              )}
              
              <div className={`text-sm ${variantStyles.content} ${title ? '' : 'mt-0'}`}>
                {children}
              </div>
            </div>

            {/* Dismiss button */}
            {dismissible && (
              <div className="flex-shrink-0 ml-4">
                <motion.button
                  onClick={handleDismiss}
                  className={`
                    inline-flex rounded-md p-1.5 transition-colors duration-200
                    ${variantStyles.dismiss} hover:bg-black/5 dark:hover:bg-white/5
                  `}
                  {...dismissAnimation}
                  aria-label="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Alert list component for managing multiple alerts
export const AlertList = ({ 
  alerts = [], 
  onDismiss,
  className = '',
  position = 'top-right',
  ...props 
}) => {
  
  React.useEffect(() => {
    logger.componentMount('AlertList', { alertCount: alerts.length, position });
  }, [alerts.length, position]);

  const handleDismissAlert = (alertId) => {
    logger.ui('DISMISS', 'AlertList', { alertId }, 'UI_ALERT_LIST');
    if (onDismiss) {
      onDismiss(alertId);
    }
  };

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

  return (
    <div className={`${positionClass} space-y-2 max-w-sm w-full ${className}`} {...props}>
      <AnimatePresence>
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            variant={alert.variant}
            title={alert.title}
            dismissible={alert.dismissible !== false}
            onDismiss={() => handleDismissAlert(alert.id)}
            icon={alert.icon}
          >
            {alert.message || alert.children}
          </Alert>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Alert;