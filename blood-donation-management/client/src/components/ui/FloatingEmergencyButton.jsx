/**
 * FloatingEmergencyButton Component
 * Prominent emergency request button accessible from any page
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Phone, AlertTriangle, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const FloatingEmergencyButton = ({ 
  className = '',
  showOnPages = 'all', // 'all', 'exclude-emergency', or array of paths
  position = 'bottom-right' // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if button should be visible on current page
  useEffect(() => {
    const currentPath = location.pathname;
    
    if (showOnPages === 'all') {
      setIsVisible(true);
    } else if (showOnPages === 'exclude-emergency') {
      setIsVisible(!currentPath.startsWith('/emergency'));
    } else if (Array.isArray(showOnPages)) {
      setIsVisible(showOnPages.includes(currentPath));
    }
  }, [location.pathname, showOnPages]);

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'top-left':
        return 'top-6 left-6';
      case 'bottom-right':
      default:
        return 'bottom-6 right-6';
    }
  };

  // Handle emergency request
  const handleEmergencyRequest = () => {
    setIsAnimating(true);
    setTimeout(() => {
      navigate('/emergency?source=floating-button');
      setIsAnimating(false);
    }, 300);
  };

  // Handle emergency hotline
  const handleEmergencyHotline = () => {
    window.open('tel:+91-911-BLOOD', '_self');
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed z-50 ${getPositionClasses()} ${className}`}>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mb-4 space-y-3"
          >
            {/* Emergency Hotline Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEmergencyHotline}
              className="flex items-center space-x-3 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg transition-colors touch-manipulation min-w-max"
              aria-label="Call emergency hotline"
            >
              <Phone className="w-5 h-5" />
              <span className="font-medium">Call Hotline</span>
            </motion.button>

            {/* Emergency Request Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEmergencyRequest}
              className="flex items-center space-x-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors touch-manipulation min-w-max"
              aria-label="Submit emergency blood request"
            >
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Blood Request</span>
            </motion.button>

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleExpanded}
              className="flex items-center justify-center w-12 h-12 bg-slate-600 hover:bg-slate-700 text-white rounded-full shadow-lg transition-colors touch-manipulation"
              aria-label="Close emergency menu"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Emergency Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={isExpanded ? toggleExpanded : handleEmergencyRequest}
        onDoubleClick={toggleExpanded}
        className={`relative flex items-center justify-center w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl transition-all duration-300 touch-manipulation ${
          isAnimating ? 'animate-pulse' : ''
        }`}
        aria-label={isExpanded ? "Emergency menu" : "Emergency blood request"}
        style={{
          boxShadow: '0 8px 32px rgba(220, 38, 38, 0.4)'
        }}
      >
        {/* Pulsing Ring Animation */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 0, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute inset-0 bg-red-600 rounded-full"
        />
        
        {/* Heart Icon */}
        <motion.div
          animate={isAnimating ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.3, repeat: isAnimating ? Infinity : 0 }}
        >
          <Heart className="w-8 h-8 fill-current" />
        </motion.div>

        {/* Emergency Badge */}
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
          !
        </div>
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: position.includes('right') ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: position.includes('right') ? 10 : -10 }}
            className={`absolute top-1/2 transform -translate-y-1/2 ${
              position.includes('right') ? 'right-20' : 'left-20'
            } bg-black text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none`}
            style={{ zIndex: -1 }}
          >
            Emergency Blood Request
            <div 
              className={`absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-black rotate-45 ${
                position.includes('right') ? 'right-[-4px]' : 'left-[-4px]'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessibility Instructions */}
      <div className="sr-only">
        Emergency blood request button. Single tap to submit request, double tap to open menu with more options.
      </div>
    </div>
  );
};

export default FloatingEmergencyButton;