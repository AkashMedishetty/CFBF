import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Activity, Award, Shield } from 'lucide-react';

const GlobalLoader = ({ isLoading, message = "Loading..." }) => {
  const [currentIcon, setCurrentIcon] = useState(0);
  const icons = [Heart, Activity, Award, Shield];
  
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setCurrentIcon(prev => (prev + 1) % icons.length);
    }, 800);
    
    return () => clearInterval(interval);
  }, [isLoading, icons.length]);

  const overlayVariants = {
    hidden: { 
      opacity: 0,
      backdropFilter: "blur(0px)"
    },
    visible: { 
      opacity: 1,
      backdropFilter: "blur(8px)",
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0,
      backdropFilter: "blur(0px)",
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  const containerVariants = {
    hidden: { 
      scale: 0.8,
      y: 20,
      opacity: 0
    },
    visible: { 
      scale: 1,
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        delay: 0.1
      }
    },
    exit: { 
      scale: 0.8,
      y: -20,
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  const iconVariants = {
    hidden: { 
      scale: 0,
      rotate: -180,
      opacity: 0
    },
    visible: { 
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: { 
      scale: 0,
      rotate: 180,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  const pulseVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: [0, 1.5, 0],
      opacity: [0, 0.3, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeOut"
      }
    }
  };

  const CurrentIcon = icons[currentIcon];

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative flex flex-col items-center justify-center"
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-yellow-400/20 to-red-500/20 rounded-full blur-3xl animate-pulse"></div>
            
            {/* Main loader container */}
            <div className="relative bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
              {/* Pulse rings */}
              <motion.div
                variants={pulseVariants}
                initial="hidden"
                animate="visible"
                className="absolute inset-0 border-2 border-red-400 rounded-3xl"
              ></motion.div>
              <motion.div
                variants={pulseVariants}
                initial="hidden"
                animate="visible"
                className="absolute inset-0 border-2 border-yellow-400 rounded-3xl"
                style={{ animationDelay: '1s' }}
              ></motion.div>
              
              {/* Icon container */}
              <div className="relative flex flex-col items-center space-y-6">
                {/* Rotating medical icons */}
                <div className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIcon}
                      variants={iconVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-lg"
                    >
                      <CurrentIcon className="h-8 w-8 text-white" />
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Orbiting dots */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-400 rounded-full"></div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full"></div>
                  </motion.div>
                </div>
                
                {/* Loading dots */}
                <div className="flex space-x-2">
                  {[0, 1, 2].map((index) => (
                    <motion.div
                      key={index}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.4, 1, 0.4]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: index * 0.2,
                        ease: "easeInOut"
                      }}
                      className="w-2 h-2 bg-red-500 rounded-full"
                    ></motion.div>
                  ))}
                </div>
                
                {/* Loading text */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <p className="text-gray-700 font-medium text-lg">{message}</p>
                  <motion.p 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-gray-500 text-sm mt-1"
                  >
                    Please wait...
                  </motion.p>
                </motion.div>
              </div>
            </div>
            
            {/* Bottom progress indicator */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 rounded-full"
            ></motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoader;
