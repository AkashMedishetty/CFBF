import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import EmergencyToast from './EmergencyToast';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContainer = () => {
  const { toasts, hideToast } = useToast();

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getToastColors = (type) => {
    switch (type) {
      case 'success':
        return 'from-green-500 to-green-600 border-green-400/30';
      case 'error':
        return 'from-red-500 to-red-600 border-red-400/30';
      case 'warning':
        return 'from-yellow-500 to-yellow-600 border-yellow-400/30';
      case 'info':
      default:
        return 'from-blue-500 to-blue-600 border-blue-400/30';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-100';
      case 'error':
        return 'text-red-100';
      case 'warning':
        return 'text-yellow-100';
      case 'info':
      default:
        return 'text-blue-100';
    }
  };

  const regularToastVariants = {
    hidden: { 
      x: '100%',
      opacity: 0,
      scale: 0.95
    },
    visible: { 
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: { 
      x: '100%',
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Emergency Toasts (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0">
        <AnimatePresence>
          {toasts
            .filter(toast => toast.type === 'emergency')
            .map(toast => (
              <EmergencyToast
                key={toast.id}
                isVisible={toast.isVisible}
                patientData={toast.patientData}
                onClose={() => hideToast(toast.id)}
                autoClose={toast.autoClose}
                autoCloseDelay={toast.autoCloseDelay}
              />
            ))}
        </AnimatePresence>
      </div>

      {/* Regular Toasts (Top Right) */}
      <div className="absolute top-4 right-4 space-y-3 max-w-sm w-full">
        <AnimatePresence>
          {toasts
            .filter(toast => toast.type !== 'emergency')
            .slice(-5) // Show max 5 toasts
            .map((toast, index) => (
              <motion.div
                key={toast.id}
                variants={regularToastVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ zIndex: 1000 - index }}
                className="pointer-events-auto"
              >
                <div className={`relative bg-gradient-to-r ${getToastColors(toast.type)} rounded-lg shadow-lg border-2 overflow-hidden`}>
                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 ${getIconColor(toast.type)}`}>
                        {getToastIcon(toast.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm leading-5">
                          {toast.message}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => hideToast(toast.id)}
                        className="flex-shrink-0 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200"
                      >
                        <X className="h-4 w-4 text-white" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Auto-close progress bar */}
                  {toast.autoClose && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                      <motion.div
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ 
                          duration: (toast.autoCloseDelay || 5000) / 1000, 
                          ease: "linear" 
                        }}
                        className="h-full bg-white/50"
                      ></motion.div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ToastContainer;


