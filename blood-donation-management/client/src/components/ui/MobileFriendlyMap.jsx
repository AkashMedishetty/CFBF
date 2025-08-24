/**
 * Mobile Friendly Map Component
 * Touch-optimized map with location services and mobile-friendly controls
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Minus, Locate, Phone, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileFriendlyMap = ({
  center = { lat: 40.7128, lng: -74.0060 },
  zoom = 12,
  markers = [],
  height = '400px',
  onMarkerClick,
  className = ''
}) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [mapCenter, setMapCenter] = useState(center);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const [isPinching, setIsPinching] = useState(false);

  // Simulate map functionality (in a real app, you'd use a map library like Leaflet or Google Maps)
  useEffect(() => {
    // Initialize map simulation
    console.log('Map initialized with center:', mapCenter, 'zoom:', mapZoom);
  }, [mapCenter, mapZoom]);

  // Get user's current location with high accuracy and fallback
  const getCurrentLocation = async () => {
    setIsLocating(true);
    
    try {
      if ('geolocation' in navigator) {
        let position;
        
        try {
          // First attempt with high accuracy
          position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000 // 5 minutes
            });
          });
        } catch (highAccuracyError) {
          console.warn('High accuracy location failed, trying fallback:', highAccuracyError);
          
          // Fallback with lower accuracy
          position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 600000 // 10 minutes
            });
          });
        }
        
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        setCurrentLocation(location);
        setMapCenter(location);
        console.log('Current location obtained with accuracy:', position.coords.accuracy + 'm', location);
      } else {
        throw new Error('Geolocation not supported');
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      alert('Unable to get your location. Please check your location settings and try again.');
    } finally {
      setIsLocating(false);
    }
  };

  // Handle touch events for pinch-to-zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    } else if (e.touches.length === 2) {
      setIsPinching(true);
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStart({ distance });
    }
  };

  const handleTouchMove = (e) => {
    if (isPinching && e.touches.length === 2 && touchStart) {
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      const scale = distance / touchStart.distance;
      if (scale > 1.1) {
        zoomIn();
        setTouchStart({ distance });
      } else if (scale < 0.9) {
        zoomOut();
        setTouchStart({ distance });
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
    setIsPinching(false);
  };

  // Zoom controls
  const zoomIn = () => {
    setMapZoom(prev => Math.min(prev + 1, 20));
  };

  const zoomOut = () => {
    setMapZoom(prev => Math.max(prev - 1, 1));
  };

  // Handle marker click
  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  };

  // Get directions to marker
  const getDirections = (marker) => {
    if (currentLocation) {
      const url = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${marker.lat},${marker.lng}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/${marker.lat},${marker.lng}`;
      window.open(url, '_blank');
    }
  };

  // Call marker phone number
  const callMarker = (marker) => {
    if (marker.phone) {
      window.location.href = `tel:${marker.phone}`;
    }
  };

  return (
    <div className={`relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Map Container */}
      <div
        ref={mapRef}
        className="relative bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900"
        style={{ height }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Simulated Map Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-blue-200 via-green-200 to-blue-200 dark:from-blue-800 dark:via-green-800 dark:to-blue-800">
            {/* Grid pattern to simulate map */}
            <div className="absolute inset-0 opacity-30">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
          </div>
        </div>

        {/* Current Location Marker */}
        {currentLocation && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <div className="relative">
              <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
              <div className="absolute inset-0 w-4 h-4 bg-blue-600 rounded-full animate-ping opacity-75"></div>
            </div>
          </motion.div>
        )}

        {/* Markers */}
        {markers.map((marker, index) => (
          <motion.button
            key={index}
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleMarkerClick(marker)}
            className="absolute transform -translate-x-1/2 -translate-y-full z-20 touch-manipulation"
            style={{
              left: `${50 + (index - markers.length / 2) * 15}%`,
              top: `${40 + (index % 2) * 20}%`,
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            <div className="relative">
              <MapPin className="w-8 h-8 text-red-600 drop-shadow-lg" fill="currentColor" />
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
            </div>
          </motion.button>
        ))}

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-30">
          <button
            onClick={zoomIn}
            className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors touch-manipulation"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={zoomOut}
            className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors touch-manipulation"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>

        {/* Location Button */}
        <button
          onClick={getCurrentLocation}
          disabled={isLocating}
          className="absolute bottom-4 right-4 w-12 h-12 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 touch-manipulation z-30"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          {isLocating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          ) : (
            <Locate className="w-5 h-5" />
          )}
        </button>

        {/* Zoom Level Indicator */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm z-30">
          Zoom: {mapZoom}
        </div>
      </div>

      {/* Selected Marker Info */}
      <AnimatePresence>
        {selectedMarker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-dark-bg-secondary border-t border-slate-200 dark:border-dark-border p-4 z-40"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  {selectedMarker.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {selectedMarker.address}
                </p>
                {selectedMarker.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedMarker.description}
                  </p>
                )}
              </div>
              
              <div className="flex space-x-2 ml-4">
                {selectedMarker.phone && (
                  <button
                    onClick={() => callMarker(selectedMarker)}
                    className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center hover:bg-green-700 transition-colors touch-manipulation"
                    style={{ minWidth: '44px', minHeight: '44px' }}
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => getDirections(selectedMarker)}
                  className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors touch-manipulation"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <Navigation className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setSelectedMarker(null)}
                  className="w-10 h-10 bg-slate-600 text-white rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors touch-manipulation"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  ×
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Touch Instructions */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-xs z-30">
        <div>Pinch to zoom</div>
        <div>Tap markers for info</div>
      </div>
    </div>
  );
};

export default MobileFriendlyMap;