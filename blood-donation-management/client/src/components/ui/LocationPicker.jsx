import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Navigation, Check, X } from 'lucide-react';

import Button from './Button';
import Input from './Input';
import Card from './Card';
import Map from './Map';
import logger from '../../utils/logger';

const LocationPicker = ({
  value,
  onChange,
  placeholder = "Select location",
  required = false,
  error = null,
  className = '',
  mapHeight = '300px',
  showCurrentLocation = true,
  showSearch = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(value || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (value) {
      setSelectedLocation(value);
    }
  }, [value]);

  const handleLocationSelect = async (location) => {
    try {
      // Reverse geocode to get address
      const address = await reverseGeocode(location.latitude, location.longitude);
      
      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
        name: location.name || address || 'Selected Location'
      };

      setSelectedLocation(locationData);
      logger.ui('SELECT', 'Location', locationData, 'LOCATION_PICKER');
    } catch (error) {
      logger.error('Error selecting location', 'LOCATION_PICKER', error);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation && onChange) {
      onChange(selectedLocation);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedLocation(value || null);
    setIsOpen(false);
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`
      );
      
      const results = await response.json();
      
      const formattedResults = results.map(result => ({
        id: result.place_id,
        name: result.display_name,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        type: result.type,
        importance: result.importance
      }));

      setSearchResults(formattedResults);
    } catch (error) {
      logger.error('Error searching locations', 'LOCATION_PICKER', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSelect = (result) => {
    handleLocationSelect({
      latitude: result.latitude,
      longitude: result.longitude,
      name: result.name
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      logger.warn('Geolocation not supported', 'LOCATION_PICKER');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = { latitude, longitude };
        
        // Auto-select current location
        await handleLocationSelect({ latitude, longitude });
        
        logger.success('Current location obtained', 'LOCATION_PICKER');
      },
      (error) => {
        logger.warn('Failed to get current location', 'LOCATION_PICKER', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      
      const data = await response.json();
      return data.display_name || null;
    } catch (error) {
      logger.error('Error reverse geocoding', 'LOCATION_PICKER', error);
      return null;
    }
  };

  const getDisplayText = () => {
    if (selectedLocation) {
      return selectedLocation.name || selectedLocation.address || 'Location Selected';
    }
    return placeholder;
  };

  const markers = selectedLocation ? [{
    position: [selectedLocation.latitude, selectedLocation.longitude],
    title: 'Selected Location',
    description: selectedLocation.address,
    type: 'selected',
    color: '#dc2626'
  }] : [];

  return (
    <div className={`relative ${className}`}>
      {/* Location Input Display */}
      <div
        className={`w-full px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
          error 
            ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20' 
            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
        } ${
          selectedLocation 
            ? 'bg-white dark:bg-slate-800' 
            : 'bg-slate-50 dark:bg-slate-700'
        }`}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center space-x-3">
          <MapPin className={`h-5 w-5 ${
            selectedLocation ? 'text-red-600' : 'text-slate-400'
          }`} />
          <div className="flex-1">
            <p className={`text-sm ${
              selectedLocation 
                ? 'text-slate-900 dark:text-white' 
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              {getDisplayText()}
            </p>
            {selectedLocation && selectedLocation.address && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </p>
            )}
          </div>
          <div className="text-slate-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.p>
      )}

      {/* Required Indicator */}
      {required && (
        <span className="absolute top-3 right-12 text-red-500">*</span>
      )}

      {/* Location Picker Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Select Location
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Search and Current Location */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Input
                      icon={Search}
                      placeholder="Search for locations..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearch(e.target.value);
                      }}
                      loading={isSearching}
                    />
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <Card className="mt-2 max-h-40 overflow-y-auto">
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-200 dark:border-slate-600 last:border-b-0"
                            onClick={() => handleSearchSelect(result)}
                          >
                            <div className="flex items-start space-x-3">
                              <MapPin className="h-4 w-4 text-slate-500 mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                  {result.name.split(',')[0]}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                  {result.name}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </Card>
                    )}
                  </div>
                  
                  {showCurrentLocation && (
                    <Button
                      variant="outline"
                      onClick={getCurrentLocation}
                      className="flex items-center space-x-2"
                    >
                      <Navigation className="h-4 w-4" />
                      <span>Current Location</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Map */}
              <div className="p-6">
                <Map
                  center={selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] : [28.6139, 77.2090]}
                  zoom={selectedLocation ? 15 : 10}
                  height={mapHeight}
                  markers={markers}
                  onLocationSelect={handleLocationSelect}
                  showSearch={false}
                  showControls={true}
                  showCurrentLocation={false}
                />
              </div>

              {/* Selected Location Info */}
              {selectedLocation && (
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700 border-t border-slate-200 dark:border-slate-600">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Selected Location
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {selectedLocation.address || selectedLocation.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedLocation}
                  className="flex items-center space-x-2"
                >
                  <Check className="h-4 w-4" />
                  <span>Confirm Location</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationPicker;