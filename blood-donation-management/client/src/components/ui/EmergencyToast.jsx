import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Clock, MapPin, Heart, Phone, User } from 'lucide-react';

const EmergencyToast = ({ 
  isVisible, 
  onClose, 
  patientData,
  autoClose = false,
  autoCloseDelay = 10000 
}) => {
  const [timeLeft, setTimeLeft] = useState(autoCloseDelay / 1000);

  useEffect(() => {
    if (!isVisible || !autoClose) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, autoClose, onClose]);

  useEffect(() => {
    if (isVisible && autoClose) {
      setTimeLeft(autoCloseDelay / 1000);
    }
  }, [isVisible, autoClose, autoCloseDelay]);

  const toastVariants = {
    hidden: { 
      y: 100,
      opacity: 0,
      scale: 0.95
    },
    visible: { 
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: { 
      y: 100,
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  if (!patientData) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={toastVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-50 max-w-md mx-auto md:mx-0 pointer-events-auto"
        >
          <div className="relative bg-[#0f121a]/95 rounded-xl shadow-2xl backdrop-blur-md border border-white/10 ring-2 ring-[#f51414]/40 shadow-[0_10px_40px_rgba(245,20,20,0.25)] overflow-hidden">
            <div className="pointer-events-none absolute -inset-4 rounded-2xl bg-[radial-gradient(ellipse_at_center,rgba(245,20,20,0.22),transparent_65%)] blur-2xl" />
            <div className="pointer-events-none absolute -inset-4 rounded-2xl bg-[radial-gradient(ellipse_at_left,rgba(245,20,20,0.18),transparent_65%)] blur-2xl" />
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>

            {/* Static Highlight Border (no rotation) */}
            <div className="absolute inset-0 rounded-2xl">
              <div className="absolute -inset-1 bg-[conic-gradient(from_0deg,_#f51414,_transparent_30%)] rounded-2xl opacity-20 blur-sm" />
            </div>

            {/* Content */}
            <div className="relative p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <motion.div
                    variants={pulseVariants}
                    animate="pulse"
                    className="flex items-center justify-center w-9 h-9 rounded-full shadow-lg bg-[#f51414]/20 ring-1 ring-[#f51414]/40"
                  >
                    <AlertTriangle className="h-5 w-5 text-[#f51414]" />
                  </motion.div>
                  <div>
                    <h3 className="text-base font-bold text-white">Emergency Blood Request</h3>
                    <p className="text-white/70 text-xs">Urgent donor needed</p>
                  </div>
                </div>
                
                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  type="button"
                  className="flex items-center justify-center w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full transition-colors duration-200"
                >
                  <X className="h-4 w-4 text-white" />
                </motion.button>
              </div>

              {/* Patient Details */}
              <div className="grid grid-cols-1 gap-3 mb-3">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-white/80" />
                    <div>
                      <p className="text-white/70 text-xs">Patient Name</p>
                      <p className="text-white font-semibold text-sm">{patientData.name || 'Anonymous'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Heart className="h-4 w-4 text-white/80" />
                    <div>
                      <p className="text-white/70 text-xs">Blood Type</p>
                      <p className="text-white font-bold">{patientData.bloodType || 'O+'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-white/80" />
                    <div>
                      <p className="text-white/70 text-xs">Location</p>
                      <p className="text-white font-semibold text-sm">{patientData.location || 'City Hospital'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-white/80" />
                    <div>
                      <p className="text-white/70 text-xs">Time Needed</p>
                      <p className="text-white font-semibold text-sm">{patientData.timeNeeded || 'ASAP'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {patientData.condition && (
                <div className="mb-3 p-2.5 bg-white/5 rounded-md ring-1 ring-white/10">
                  <p className="text-white/70 text-xs mb-0.5">Medical Condition</p>
                  <p className="text-white font-medium text-sm">{patientData.condition}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-transparent border-2 border-[#f51414] text-[#f51414] hover:bg-[#f51414]/10 ring-2 ring-[#f51414]/30 hover:ring-[#f51414]/40 px-4 py-2 rounded-md font-extrabold text-center transition-colors duration-200 flex items-center justify-center space-x-2 text-sm"
                >
                  <Heart className="h-4 w-4" />
                  <span>I Can Donate</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-white/10 hover:bg-white/15 text-white border border-white/20 px-4 py-2 rounded-md font-semibold text-center transition-colors duration-200 flex items-center justify-center space-x-2 text-sm"
                >
                  <Phone className="h-4 w-4" />
                  <span>Call Hospital</span>
                </motion.button>
              </div>

              {/* Auto-close Timer */}
              {autoClose && timeLeft > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-red-100 mb-2">
                    <span>Auto-closing in {timeLeft}s</span>
                    <span>{Math.round((timeLeft / (autoCloseDelay / 1000)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-red-800/50 rounded-full h-1">
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: autoCloseDelay / 1000, ease: "linear" }}
                      className="h-1 bg-yellow-400 rounded-full"
                    ></motion.div>
                  </div>
                </div>
              )}
            </div>

            {/* Floating Hearts Animation */}
            <div className="absolute top-1.5 right-1.5">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Heart className="h-3.5 w-3.5 text-[#f51414] opacity-70 fill-current" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmergencyToast;
