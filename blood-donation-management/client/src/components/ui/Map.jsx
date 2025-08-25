import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, Maximize2, Minimize2 } from 'lucide-react';

import Button from './Button';
import Input from './Input';
import Card from './Card';
import logger from '../../utils/logger';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Map = ({
  center = [28.6139, 77.2090], // Default to Delhi
  zoom = 10,
  height = '400px',
  markers = [],
  onLocationSelect,
  onMarkerClick,
  showSearch = true,
  showControls = true,
  showCurrentLocation = true,
  interactive = true,
  className = '',
  style = {}
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const onMarkerClickRef = useRef(onMarkerClick);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Update the ref when onMarkerClick changes
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  // Define createMarker function before it's used
  const createMarker = useCallback((markerData) => {
    try {
      const {
        position,
        title,
        description,
        type = 'default',
        icon,
        color = '#dc2626'
      } = markerData;

      if (!position || !Array.isArray(position) || position.length !== 2) {
        logger.warn('Invalid marker position', 'MAP_COMPONENT', markerData);
        return null;
      }

      // Create custom icon based on type
      let markerIcon;
      
      if (icon) {
        markerIcon = L.divIcon({
          html: `<div class="custom-marker" style="background-color: ${color};">${icon}</div>`,
          className: 'custom-div-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        });
      } else {
        // Use different colors for different types
        const typeColors = {
          hospital: '#dc2626',
          donor: '#16a34a',
          request: '#ea580c',
          bloodbank: '#2563eb',
          default: '#6b7280'
        };

        markerIcon = L.divIcon({
          html: `<div class="marker-pin" style="background-color: ${typeColors[type] || color};"></div>`,
          className: 'custom-div-icon',
          iconSize: [25, 35],
          iconAnchor: [12, 35]
        });
      }

      const marker = L.marker(position, { icon: markerIcon });

      // Add popup if title or description provided
      if (title || description) {
        const popupContent = `
          <div class="marker-popup">
            ${title ? `<h3 class="popup-title">${title}</h3>` : ''}
            ${description ? `<p class="popup-description">${description}</p>` : ''}
          </div>
        `;
        marker.bindPopup(popupContent);
      }

      // Add click handler
      if (onMarkerClickRef.current) {
        marker.on('click', () => {
          onMarkerClickRef.current(markerData);
          logger.ui('CLICK', 'MapMarker', { type, title }, 'MAP_COMPONENT');
        });
      }

      return marker;
    } catch (error) {
      logger.error('Error creating marker', 'MAP_COMPONENT', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
      attributionControl: true
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Add zoom control to top-right
    if (showControls) {
      L.control.zoom({
        position: 'topright'
      }).addTo(map);
    }

    // Add scale control
    L.control.scale({
      position: 'bottomleft'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add click handler for location selection
    if (onLocationSelect && interactive) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        onLocationSelect({ latitude: lat, longitude: lng });
        logger.ui('CLICK', 'MapLocationSelect', { lat, lng }, 'MAP_COMPONENT');
      });
    }

    // Get current location if enabled
    if (showCurrentLocation) {
      getCurrentLocation();
    }

    logger.componentMount('Map');

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      logger.componentUnmount('Map');
    };
  }, [center, interactive, onLocationSelect, showControls, showCurrentLocation, zoom]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const marker = createMarker(markerData);
      if (marker) {
        marker.addTo(mapInstanceRef.current);
        markersRef.current.push(marker);
      }
    });

    // Fit bounds to show all markers if there are any
    if (markers.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [markers]);

  // Update map center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      logger.warn('Geolocation not supported', 'MAP_COMPONENT');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation([latitude, longitude]);

        if (mapInstanceRef.current) {
          // Add current location marker
          const currentLocationMarker = L.marker([latitude, longitude], {
            icon: L.divIcon({
              html: '<div class="current-location-marker"></div>',
              className: 'current-location-icon',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          });

          currentLocationMarker.addTo(mapInstanceRef.current);
          currentLocationMarker.bindPopup('Your current location');
          markersRef.current.push(currentLocationMarker);
        }

        logger.success('Current location obtained', 'MAP_COMPONENT');
      },
      (error) => {
        logger.warn('Failed to get current location', 'MAP_COMPONENT', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // Use Nominatim API for geocoding
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
      logger.success(`Found ${formattedResults.length} search results`, 'MAP_COMPONENT');
    } catch (error) {
      logger.error('Error searching locations', 'MAP_COMPONENT', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSelect = (result) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([result.latitude, result.longitude], 15);
      
      if (onLocationSelect) {
        onLocationSelect({
          latitude: result.latitude,
          longitude: result.longitude,
          name: result.name
        });
      }
    }
    
    setSearchResults([]);
    setSearchQuery('');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    // Trigger map resize after fullscreen toggle
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);
  };

  const centerOnCurrentLocation = () => {
    if (currentLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView(currentLocation, 15);
    } else {
      getCurrentLocation();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-dark-bg' : ''} ${className}`}
      style={style}
    >
      {/* Search Bar */}
      {showSearch && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="relative">
            <Input
              icon={Search}
              placeholder="Search for locations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="bg-white dark:bg-dark-bg-secondary shadow-lg"
              loading={isSearching}
            />
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card className="absolute top-full mt-2 w-full max-h-60 overflow-y-auto shadow-lg z-20">
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
        </div>
      )}

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="bg-white dark:bg-slate-800 shadow-lg"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          {showCurrentLocation && (
            <Button
              variant="outline"
              size="sm"
              onClick={centerOnCurrentLocation}
              className="bg-white dark:bg-slate-800 shadow-lg"
            >
              <Navigation className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ 
          height: isFullscreen ? '100vh' : height,
          minHeight: '300px'
        }}
      />

      {/* Custom Styles */}
      <style jsx>{`
        .custom-div-icon {
          background: transparent;
          border: none;
        }
        
        .marker-pin {
          width: 25px;
          height: 35px;
          border-radius: 50% 50% 50% 0;
          position: relative;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .marker-pin::after {
          content: '';
          width: 8px;
          height: 8px;
          margin: 6px 0 0 6px;
          background: white;
          position: absolute;
          border-radius: 50%;
        }
        
        .current-location-marker {
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        
        .custom-marker {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .marker-popup {
          min-width: 200px;
        }
        
        .popup-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #1f2937;
        }
        
        .popup-description {
          font-size: 12px;
          margin: 0;
          color: #6b7280;
          line-height: 1.4;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .leaflet-popup-tip {
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </motion.div>
  );
};

export default Map;