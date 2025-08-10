import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import logger from '../../utils/logger';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = ''
}) => {

  useEffect(() => {
    if (isOpen) {
      logger.ui('OPEN', 'Modal', { title, size }, 'UI_MODAL');
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      logger.ui('CLOSE', 'Modal', { title }, 'UI_MODAL');
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, title]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        logger.ui('ESCAPE_CLOSE', 'Modal', { title }, 'UI_MODAL');
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeOnEscape, onClose, title]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      logger.ui('OVERLAY_CLOSE', 'Modal', { title }, 'UI_MODAL');
      onClose();
    }
  };

  const handleCloseClick = () => {
    logger.ui('BUTTON_CLOSE', 'Modal', { title }, 'UI_MODAL');
    onClose();
  };

  // Size variants
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl mx-4'
  };

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={handleOverlayClick}
          />

          {/* Modal Container */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`relative w-full ${sizeClasses[size]} bg-white text-slate-900 dark:bg-slate-800 dark:text-white rounded-xl shadow-strong border border-slate-200 dark:border-slate-700 ${className}`}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                  {title && (
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={handleCloseClick}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Modal sub-components
Modal.Header = ({ children, className = '' }) => {
  logger.debug('Modal.Header rendered', 'UI_MODAL');
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
};

Modal.Body = ({ children, className = '' }) => {
  logger.debug('Modal.Body rendered', 'UI_MODAL');
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
};

Modal.Footer = ({ children, className = '' }) => {
  logger.debug('Modal.Footer rendered', 'UI_MODAL');
  return (
    <div className={`mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3 ${className}`}>
      {children}
    </div>
  );
};

export default Modal;