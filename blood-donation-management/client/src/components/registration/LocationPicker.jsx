import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const LocationPicker = ({ onLocationSelect, enableHighAccuracy = true, allowManualEntry = true }) => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [isManual, setIsManual] = useState(false);

  // Get user's current location
  const getCurrentLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setIsLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: enableHighAccuracy,
      timeout: 20000,
      maximumAge: 60000 // 1 minute
    };

    const handleLocationSuccess = async (position) => {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        isManual: false
      };

      setLocation(locationData);
      setAccuracy(position.coords.accuracy);
      setIsManual(false);

      // Try to get address from coordinates
      try {
        const addressData = await reverseGeocode(locationData.latitude, locationData.longitude);
        setAddress(addressData);
        locationData.address = addressData;
      } catch (error) {
        console.warn('Failed to get address from coordinates:', error);
        setAddress('Location detected (address lookup failed)');
        locationData.address = 'Location detected';
      }

      setIsLoading(false);
      onLocationSelect && onLocationSelect(locationData);
    };

    const handleLocationError = (error) => {
      // Try fallback with lower accuracy if high accuracy fails
      if (enableHighAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
        console.warn('High accuracy location failed, trying fallback:', error);
        
        const fallbackOptions = {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 60000
        };
        
        navigator.geolocation.getCurrentPosition(
          handleLocationSuccess,
          (fallbackError) => {
            setIsLoading(false);
            let errorMessage = 'Failed to get your location even with fallback';
            
            switch (fallbackError.code) {
              case fallbackError.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please enable location permissions.';
                break;
              case fallbackError.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable.';
                break;
              case fallbackError.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                break;
              default:
                errorMessage = 'An unknown error occurred while getting location.';
                break;
            }
            
            setError(errorMessage);
          },
          fallbackOptions
        );
        return;
      }
      
      setIsLoading(false);
      let errorMessage = 'Failed to get your location';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location permissions.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out. Please try again.';
          break;
        default:
          errorMessage = 'An unknown error occurred while getting location.';
          break;
      }
      
      setError(errorMessage);
    };

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    );
  };

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      // Using Nominatim (OpenStreetMap) for reverse geocoding - free service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      } else {
        throw new Error('No address found');
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      throw error;
    }
  };

  // Manual address entry
  const handleManualEntry = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Forward geocoding to get coordinates from address
      const coordinates = await forwardGeocode(address);
      
      const locationData = {
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        address: address,
        accuracy: null, // Manual entry doesn't have accuracy
        isManual: true
      };

      setLocation(locationData);
      setIsManual(true);
      setIsLoading(false);
      
      onLocationSelect && onLocationSelect(locationData);
    } catch (error) {
      setError('Failed to find location for the entered address');
      setIsLoading(false);
    }
  };

  // Forward geocoding to get coordinates from address
  const forwardGeocode = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=in`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      } else {
        throw new Error('Address not found');
      }
    } catch (error) {
      console.error('Forward geocoding failed:', error);
      throw error;
    }
  };

  // Get accuracy description
  const getAccuracyDescription = (accuracy) => {
    if (!accuracy) return null;
    
    if (accuracy <= 10) return 'Very High Accuracy';
    if (accuracy <= 50) return 'High Accuracy';
    if (accuracy <= 100) return 'Good Accuracy';
    if (accuracy <= 500) return 'Moderate Accuracy';
    return 'Low Accuracy';
  };

  // Get accuracy color
  const getAccuracyColor = (accuracy) => {
    if (!accuracy) return 'text-gray-500';
    
    if (accuracy <= 10) return 'text-green-600';
    if (accuracy <= 50) return 'text-green-500';
    if (accuracy <= 100) return 'text-yellow-500';
    if (accuracy <= 500) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <MapPin className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Location Detection</h3>
        </div>

        {/* Current Location Button */}
        <div className="space-y-3">
          <Button
            onClick={getCurrentLocation}
            isLoading={isLoading}
            isDisabled={isLoading}
            leftIcon={<Navigation className="w-4 h-4" />}
            className="w-full"
          >
            {isLoading ? 'Getting Location...' : 'Use Current Location'}
          </Button>

          {/* Location Display */}
          {location && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Location Detected</p>
                  <p className="text-sm text-green-700 mt-1">{address}</p>
                  
                  {/* Accuracy Info */}
                  {accuracy && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className={`text-xs font-medium ${getAccuracyColor(accuracy)}`}>
                        {getAccuracyDescription(accuracy)}
                      </span>
                      <span className="text-xs text-gray-500">
                        (±{Math.round(accuracy)}m)
                      </span>
                    </div>
                  )}
                  
                  {isManual && (
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Manual Entry
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Location Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Manual Entry Section */}
        {allowManualEntry && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Or enter address manually
            </h4>
            <div className="flex space-x-2">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address or landmark"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={isLoading}
              />
              <Button
                onClick={handleManualEntry}
                isLoading={isLoading}
                isDisabled={isLoading || !address.trim()}
                variant="outline"
              >
                Find
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter your city, area, or landmark for accurate location detection
            </p>
          </div>
        )}

        {/* Location Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Location Tips</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Enable location permissions for best accuracy</li>
            <li>• Make sure you're in an open area for GPS signal</li>
            <li>• Your location helps us match you with nearby patients</li>
            <li>• We only use your location for blood donation matching</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default LocationPicker;