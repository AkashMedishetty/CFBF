import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logger from '../../utils/logger';
import animationSystem from '../../utils/animations';

const Tooltip = ({
  children,
  content,
  position = 'top',
  trigger = 'hover',
  delay = 500,
  className = '',
  contentClassName = '',
  disabled = false,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    logger.componentMount('Tooltip', { position, trigger, delay });
    
    return () => {
      logger.componentUnmount('Tooltip');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showTooltip = () => {
    if (disabled || !content) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      logger.ui('SHOW', 'Tooltip', { position, trigger }, 'UI_TOOLTIP');
      setIsVisible(true);
      calculatePosition();
    }, trigger === 'hover' ? delay : 0);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    logger.ui('HIDE', 'Tooltip', { position, trigger }, 'UI_TOOLTIP');
    setIsVisible(false);
  };

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let newPosition = position;

    // Check if tooltip fits in the preferred position
    switch (position) {
      case 'top':
        if (triggerRect.top - tooltipRect.height < 10) {
          newPosition = 'bottom';
        }
        break;
      case 'bottom':
        if (triggerRect.bottom + tooltipRect.height > viewport.height - 10) {
          newPosition = 'top';
        }
        break;
      case 'left':
        if (triggerRect.left - tooltipRect.width < 10) {
          newPosition = 'right';
        }
        break;
      case 'right':
        if (triggerRect.right + tooltipRect.width > viewport.width - 10) {
          newPosition = 'left';
        }
        break;
    }

    if (newPosition !== actualPosition) {
      logger.debug(`Tooltip position adjusted from ${position} to ${newPosition}`, 'UI_TOOLTIP');
      setActualPosition(newPosition);
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      showTooltip();
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      hideTooltip();
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      if (isVisible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }
  };

  const handleFocus = () => {
    if (trigger === 'focus') {
      showTooltip();
    }
  };

  const handleBlur = () => {
    if (trigger === 'focus') {
      hideTooltip();
    }
  };

  // Position classes
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  // Arrow classes
  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-900 dark:border-t-slate-100',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-900 dark:border-b-slate-100',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-900 dark:border-l-slate-100',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-900 dark:border-r-slate-100'
  };

  // Animation configuration
  const tooltipAnimation = animationSystem.getReducedMotionAnimation({
    initial: { 
      opacity: 0, 
      scale: 0.95,
      y: actualPosition === 'top' ? 10 : actualPosition === 'bottom' ? -10 : 0,
      x: actualPosition === 'left' ? 10 : actualPosition === 'right' ? -10 : 0
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      x: 0
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: actualPosition === 'top' ? 10 : actualPosition === 'bottom' ? -10 : 0,
      x: actualPosition === 'left' ? 10 : actualPosition === 'right' ? -10 : 0
    },
    transition: { duration: 0.15, ease: 'easeOut' }
  });

  return (
    <div 
      className={`relative inline-block ${className}`}
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            ref={tooltipRef}
            className={`absolute z-50 ${positionClasses[actualPosition]}`}
            {...tooltipAnimation}
            onAnimationStart={() => logger.ui('ANIMATION_START', 'Tooltip', { actualPosition }, 'UI_TOOLTIP')}
            onAnimationComplete={() => logger.ui('ANIMATION_COMPLETE', 'Tooltip', { actualPosition }, 'UI_TOOLTIP')}
          >
            <div className={`
              px-2 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 
              rounded shadow-lg max-w-xs break-words ${contentClassName}
            `}>
              {content}
              
              {/* Arrow */}
              <div className={`absolute w-0 h-0 border-4 ${arrowClasses[actualPosition]}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;