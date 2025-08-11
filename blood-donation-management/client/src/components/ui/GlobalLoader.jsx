import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Animated blood drop morph loader
// - Gentle bob and subtle tilt
// - Rising fill with gradient inside the drop
// - Soft shadow pulse
// Respects prefers-reduced-motion
const GlobalLoader = ({ isLoading, message = 'Loading…' }) => {
  const prefersReducedMotion = useReducedMotion();

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const bobAnimation = prefersReducedMotion
    ? { y: 0, rotate: 0 }
    : {
        y: [0, -8, 0],
        rotate: [-2, 2, -2],
        transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
      };

  const shadowAnimation = prefersReducedMotion
    ? { scale: 1, opacity: 0.2 }
    : {
        scale: [1, 0.9, 1],
        opacity: [0.2, 0.1, 0.2],
        transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
      };

  // Rising fill animation inside the clipPath
  const fillAnimation = prefersReducedMotion
    ? { y: 90, height: 70 }
    : {
        y: [110, 20, 110],
        height: [50, 140, 50],
        transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
      };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="relative flex flex-col items-center">
            {/* Soft pulsing shadow */}
          <motion.div
              className="absolute -bottom-6 h-3 w-28 rounded-full bg-red-600/30 blur-md"
              style={{ filter: 'blur(8px)' }}
              animate={shadowAnimation}
            />

            {/* Loader card */}
            <div className="relative rounded-3xl border border-white/30 bg-white/90 p-8 shadow-2xl backdrop-blur-md">
              <motion.div
                className="relative flex items-center justify-center"
                animate={bobAnimation}
              >
                {/* Blood drop SVG */}
                <svg width="140" height="180" viewBox="0 0 140 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="bloodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f51414" />
                      <stop offset="100%" stopColor="#b50f0f" />
                    </linearGradient>
                    <clipPath id="dropClip">
                      {/* Same path used for clip and outline */}
                      <path d="M70 10 C70 10, 95 50, 110 80 C122 103, 125 120, 125 135 C125 160, 104 175, 70 175 C36 175, 15 160, 15 135 C15 120, 18 103, 30 80 C45 50, 70 10, 70 10 Z" />
                    </clipPath>
                  </defs>

                  {/* Outline */}
                  <path
                    d="M70 10 C70 10, 95 50, 110 80 C122 103, 125 120, 125 135 C125 160, 104 175, 70 175 C36 175, 15 160, 15 135 C15 120, 18 103, 30 80 C45 50, 70 10, 70 10 Z"
                    stroke="#f51414"
                    strokeWidth="4"
                    fill="none"
                    strokeLinejoin="round"
                  />

                  {/* Rising fill inside drop */}
                  <g clipPath="url(#dropClip)">
                    <motion.rect
                      x="10"
                      width="120"
                      rx="6"
                      fill="url(#bloodGrad)"
                      animate={fillAnimation}
                    />

                    {/* Subtle highlight wave */}
                    <motion.ellipse
                      cx="55"
                      cy="55"
                      rx="16"
                      ry="8"
                      fill="white"
                      fillOpacity="0.25"
                      animate={
                        prefersReducedMotion
                          ? { opacity: 0.25 }
                          : {
                              opacity: [0.15, 0.35, 0.15],
                              transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                            }
                      }
                    />
                  </g>
                </svg>
                  </motion.div>

              {/* Message */}
              <div className="mt-5 text-center">
                <p className="text-gray-800 text-base font-medium">{message}</p>
                {!prefersReducedMotion && (
                  <motion.p 
                    className="text-gray-500 text-sm"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    Preparing your experience…
                  </motion.p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoader;
