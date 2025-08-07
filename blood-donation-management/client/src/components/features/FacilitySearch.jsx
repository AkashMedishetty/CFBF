import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Phone, 
  Clock, 
  Navigation, 
  Filter,
  Star,
  Heart,
  Building2,
  Droplet,
  ExternalLink
} from 'lucide-react';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Map from '../ui/Map';
import logger from '../../utils/logger';

const FacilitySearch = ({
  userLocation = null,
  onFacilitySelect,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [filters, setFilters] = useState({
    type: 'all',
    distance: 'all',
    rating: 'all',
    availability: 'all'
  });

  useEffect(() => {
    fetchFacilities();
  }, [userLocation]);

  useEffect(() => {
    applyFilters();
  }, [facilities, filters, searchQuery]);

  const fetchFacilities = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      // For now, we'll use mock data
      const mockFacilities = [
        {
          id: 1,
          name: 'All India Institute of Medical Sciences (AIIMS)',
          type: 'hospital',
          address: 'Ansari Nagar, New Delhi, Delhi 110029',
          coordinates: [28.5672, 77.2100],
          phone: '+91-11-26588500',
          rating: 4.8,
          distance: userLocation ? calculateDistance(userLocation, [28.5672, 77.2100]) : 5.2,
          bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
          services: ['Emergency Blood Bank', '24/7 Service', 'Component Separation'],
          timings: '24/7',
          website: 'https://www.aiims.edu',
          verified: true,
          lastUpdated: '2024-01-15'
        },
        {
          id: 2,
          name: 'Red Cross Blood Bank',
          type: 'bloodbank',
          address: 'Red Cross Bhawan, 1 Red Cross Road, New Delhi 110001',
          coordinates: [28.6139, 77.2090],
          phone: '+91-11-23711551',
          rating: 4.5,
          distance: userLocation ? calculateDistance(userLocation, [28.6139, 77.2090]) : 3.8,
          bloodTypes: ['A+', 'B+', 'O+', 'AB+'],
          services: ['Voluntary Blood Donation', 'Blood Components', 'Apheresis'],
          timings: '9:00 AM - 5:00 PM',
          website: 'https://www.indianredcross.org',
          verified: true,
          lastUpdated: '2024-01-14'
        },
        {
          id: 3,
          name: 'Safdarjung Hospital Blood Bank',
          type: 'hospital',
          address: 'Safdarjung Hospital, Ring Road, New Delhi 110029',
          coordinates: [28.5706, 77.2081],
          phone: '+91-11-26165060',
          rating: 4.2,
          distance: userLocation ? calculateDistance(userLocation, [28.5706, 77.2081]) : 7.1,
          bloodTypes: ['A+', 'A-', 'B+', 'O+', 'O-'],
          services: ['Emergency Services', 'Blood Storage', 'Cross Matching'],
          timings: '24/7',
          website: 'https://www.safdarjunghospital.nic.in',
          verified: true,
          lastUpdated: '2024-01-13'
        },
        {
          id: 4,
          name: 'Rotary Blood Bank',
          type: 'bloodbank',
          address: 'Rotary Sadan, 94-95 Nehru Place, New Delhi 110019',
          coordinates: [28.5494, 77.2519],
          phone: '+91-11-26433542',
          rating: 4.6,
          distance: userLocation ? calculateDistance(userLocation, [28.5494, 77.2519]) : 12.3,
          bloodTypes: ['A+', 'B+', 'AB+', 'O+'],
          services: ['Donor Registration', 'Blood Collection', 'Health Checkup'],
          timings: '8:00 AM - 8:00 PM',
          website: 'https://www.rotarybloodbank.org',
          verified: true,
          lastUpdated: '2024-01-12'
        },
        {
          id: 5,
          name: 'Apollo Hospital Blood Bank',
          type: 'hospital',
          address: 'Sarita Vihar, Delhi Mathura Road, New Delhi 110076',
          coordinates: [28.5355, 77.2803],
          phone: '+91-11-26925858',
          rating: 4.7,
          distance: userLocation ? calculateDistance(userLocation, [28.5355, 77.2803]) : 15.6,
          bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'O+', 'O-'],
          services: ['Advanced Blood Banking', 'Platelet Apheresis', 'Stem Cell Collection'],
          timings: '24/7',
          website: 'https://www.apollohospitals.com',
          verified: true,
          lastUpdated: '2024-01-16'
        }
      ];

      setFacilities(mockFacilities);
      logger.success(`Loaded ${mockFacilities.length} facilities`, 'FACILITY_SEARCH');
    } catch (error) {
      logger.error('Error fetching facilities', 'FACILITY_SEARCH', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...facilities];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(facility =>
        facility.name.toLowerCase().includes(query) ||
        facility.address.toLowerCase().includes(query) ||
        facility.services.some(service => service.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(facility => facility.type === filters.type);
    }

    // Distance filter
    if (filters.distance !== 'all') {
      const maxDistance = parseInt(filters.distance);
      filtered = filtered.filter(facility => facility.distance <= maxDistance);
    }

    // Rating filter
    if (filters.rating !== 'all') {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter(facility => facility.rating >= minRating);
    }

    // Sort by distance
    filtered.sort((a, b) => a.distance - b.distance);

    setFilteredFacilities(filtered);
  };

  const calculateDistance = (coord1, coord2) => {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;

    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal place
  };

  const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
  };

  const handleFacilityClick = (facility) => {
    setSelectedFacility(facility);
    if (onFacilitySelect) {
      onFacilitySelect(facility);
    }
    logger.ui('CLICK', 'FacilitySelect', { id: facility.id, name: facility.name }, 'FACILITY_SEARCH');
  };

  const handleGetDirections = (facility) => {
    const [lat, lng] = facility.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
    logger.ui('CLICK', 'GetDirections', { id: facility.id }, 'FACILITY_SEARCH');
  };

  const handleCall = (facility) => {
    window.open(`tel:${facility.phone}`, '_self');
    logger.ui('CLICK', 'CallFacility', { id: facility.id }, 'FACILITY_SEARCH');
  };

  const handleWebsite = (facility) => {
    window.open(facility.website, '_blank');
    logger.ui('CLICK', 'VisitWebsite', { id: facility.id }, 'FACILITY_SEARCH');
  };

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'hospital', label: 'Hospitals' },
    { value: 'bloodbank', label: 'Blood Banks' }
  ];

  const distanceOptions = [
    { value: 'all', label: 'Any Distance' },
    { value: '5', label: 'Within 5 km' },
    { value: '10', label: 'Within 10 km' },
    { value: '25', label: 'Within 25 km' },
    { value: '50', label: 'Within 50 km' }
  ];

  const ratingOptions = [
    { value: 'all', label: 'Any Rating' },
    { value: '4.5', label: '4.5+ Stars' },
    { value: '4.0', label: '4.0+ Stars' },
    { value: '3.5', label: '3.5+ Stars' }
  ];

  const getMapMarkers = () => {
    return filteredFacilities.map(facility => ({
      position: facility.coordinates,
      title: facility.name,
      description: `${facility.type === 'hospital' ? '🏥' : '🩸'} ${facility.address}`,
      type: facility.type,
      color: facility.type === 'hospital' ? '#dc2626' : '#2563eb',
      data: facility
    }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Find Blood Banks & Hospitals
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Locate nearby facilities for blood donation and emergency needs
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'map' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
          >
            Map
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <Input
            icon={Search}
            placeholder="Search facilities, services, or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Type"
              value={filters.type}
              onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              options={typeOptions}
            />
            
            <Select
              label="Distance"
              value={filters.distance}
              onChange={(value) => setFilters(prev => ({ ...prev, distance: value }))}
              options={distanceOptions}
            />
            
            <Select
              label="Rating"
              value={filters.rating}
              onChange={(value) => setFilters(prev => ({ ...prev, rating: value }))}
              options={ratingOptions}
            />
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ type: 'all', distance: 'all', rating: 'all', availability: 'all' })}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Facility List */}
        <div className={`${viewMode === 'map' ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isLoading ? 'Loading...' : `${filteredFacilities.length} Facilities Found`}
            </h3>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {filteredFacilities.map((facility) => (
                  <motion.div
                    key={facility.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    layout
                  >
                    <Card 
                      className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                        selectedFacility?.id === facility.id 
                          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : ''
                      }`}
                      onClick={() => handleFacilityClick(facility)}
                    >
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {facility.type === 'hospital' ? (
                                <Building2 className="h-5 w-5 text-red-600" />
                              ) : (
                                <Droplet className="h-5 w-5 text-blue-600" />
                              )}
                              <h4 className="font-semibold text-slate-900 dark:text-white">
                                {facility.name}
                              </h4>
                              {facility.verified && (
                                <Badge variant="green" size="sm">Verified</Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span>{facility.rating}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{facility.distance} km away</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{facility.timings}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Address */}
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {facility.address}
                        </p>

                        {/* Blood Types */}
                        <div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Available Blood Types:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {facility.bloodTypes.map(type => (
                              <Badge key={type} variant="outline" size="sm">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Services */}
                        <div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Services:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {facility.services.slice(0, 3).map(service => (
                              <Badge key={service} variant="blue" size="sm">
                                {service}
                              </Badge>
                            ))}
                            {facility.services.length > 3 && (
                              <Badge variant="outline" size="sm">
                                +{facility.services.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetDirections(facility);
                            }}
                            className="flex items-center space-x-1"
                          >
                            <Navigation className="h-3 w-3" />
                            <span>Directions</span>
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCall(facility);
                            }}
                            className="flex items-center space-x-1"
                          >
                            <Phone className="h-3 w-3" />
                            <span>Call</span>
                          </Button>
                          
                          {facility.website && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWebsite(facility);
                              }}
                              className="flex items-center space-x-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Website</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredFacilities.length === 0 && !isLoading && (
                <Card className="p-12 text-center">
                  <Heart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No Facilities Found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Try adjusting your search criteria or filters
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="lg:col-span-2">
            <Card className="p-4">
              <Map
                center={userLocation || [28.6139, 77.2090]}
                zoom={12}
                height="500px"
                markers={getMapMarkers()}
                onMarkerClick={(marker) => handleFacilityClick(marker.data)}
                showSearch={false}
                showControls={true}
                showCurrentLocation={true}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilitySearch;