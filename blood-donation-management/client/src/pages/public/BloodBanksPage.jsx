import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Search, 
  Building2, 
  Clock, 
  Phone,
  Star,
  Navigation,
  Heart,
  Shield,
  Award,
  Droplet
} from 'lucide-react';

import HospitalDirectory from '../../components/public/HospitalDirectory';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import logger from '../../utils/logger';

const BloodBanksPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const facilityTypes = [
    { value: '', label: 'All Facilities' },
    { value: 'blood_bank', label: 'Blood Banks' },
    { value: 'hospital', label: 'Hospitals' },
    { value: 'clinic', label: 'Clinics' },
    { value: 'medical_center', label: 'Medical Centers' },
    { value: 'ngo', label: 'NGO Centers' }
  ];

  const cities = [
    { value: '', label: 'All Cities' },
    { value: 'mumbai', label: 'Mumbai' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'bangalore', label: 'Bangalore' },
    { value: 'hyderabad', label: 'Hyderabad' },
    { value: 'chennai', label: 'Chennai' },
    { value: 'kolkata', label: 'Kolkata' },
    { value: 'pune', label: 'Pune' },
    { value: 'ahmedabad', label: 'Ahmedabad' },
    { value: 'jaipur', label: 'Jaipur' },
    { value: 'lucknow', label: 'Lucknow' }
  ];

  useEffect(() => {
    logger.info('Blood Banks page loaded', 'BLOOD_BANKS_PAGE');
  }, []);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          logger.info('User location obtained', 'BLOOD_BANKS_PAGE', location);
          setIsLoadingLocation(false);
        },
        (error) => {
          logger.error('Failed to get user location', 'BLOOD_BANKS_PAGE', error);
          setIsLoadingLocation(false);
        }
      );
    } else {
      logger.warn('Geolocation not supported', 'BLOOD_BANKS_PAGE');
      setIsLoadingLocation(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    logger.info('Searching blood banks', 'BLOOD_BANKS_PAGE', {
      query: searchQuery,
      city: selectedCity,
      type: selectedType
    });
  };

  const quickStats = [
    {
      icon: Building2,
      label: 'Verified Facilities',
      value: '2,500+',
      color: 'text-blue-600'
    },
    {
      icon: MapPin,
      label: 'Cities Covered',
      value: '500+',
      color: 'text-green-600'
    },
    {
      icon: Clock,
      label: '24/7 Available',
      value: '800+',
      color: 'text-purple-600'
    },
    {
      icon: Star,
      label: 'Average Rating',
      value: '4.8/5',
      color: 'text-yellow-600'
    }
  ];

  const featuredServices = [
    {
      icon: Droplet,
      title: 'Blood Collection',
      description: 'Professional blood collection services with trained staff'
    },
    {
      icon: Shield,
      title: 'Safe Storage',
      description: 'Temperature-controlled storage with quality assurance'
    },
    {
      icon: Heart,
      title: 'Emergency Services',
      description: '24/7 emergency blood supply for critical cases'
    },
    {
      icon: Award,
      title: 'Certified Centers',
      description: 'All facilities are government certified and verified'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 text-white py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Blood Banks & Medical Facilities
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-red-100 mb-8 max-w-3xl mx-auto"
            >
              Find verified blood banks, hospitals, and medical centers near you. 
              Get directions, contact information, and real-time availability.
            </motion.p>

            {/* Search Bar */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSearch}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search facilities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <Select
                    value={selectedCity}
                    onChange={setSelectedCity}
                    options={cities}
                    placeholder="Select City"
                    className="py-3"
                  />
                  
                  <Select
                    value={selectedType}
                    onChange={setSelectedType}
                    options={facilityTypes}
                    placeholder="Facility Type"
                    className="py-3"
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1 py-3"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      loading={isLoadingLocation}
                      className="py-3 px-4"
                      title="Find nearby facilities"
                    >
                      <Navigation className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.form>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="text-center p-6">
                <div className={`w-12 h-12 ${stat.color.replace('text-', 'bg-').replace('600', '100')} dark:${stat.color.replace('text-', 'bg-').replace('600', '900')} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </Card>
            );
          })}
        </motion.div>

        {/* Featured Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Our Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {service.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Hospital Directory Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <HospitalDirectory
            searchQuery={searchQuery}
            selectedCity={selectedCity}
            selectedType={selectedType}
            userLocation={userLocation}
          />
        </motion.div>

        {/* Emergency Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 p-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">
              Need Immediate Help?
            </h3>
            <p className="text-red-800 dark:text-red-200 mb-4">
              For emergency blood requirements, call our 24/7 helpline
            </p>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">
              💬 WhatsApp: https://wa.me/919491254120
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => window.location.href = '/emergency'}
                className="bg-red-600 hover:bg-red-700"
              >
                Submit Emergency Request
              </Button>
              <Button
                onClick={() => window.location.href = '/register'}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                Register as Donor
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BloodBanksPage;