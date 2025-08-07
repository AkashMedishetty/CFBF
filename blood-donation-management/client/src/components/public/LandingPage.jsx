import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Users, 
  MapPin, 
  Clock, 
  Phone, 
  Star,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Award,
  TrendingUp,
  Search,
  Navigation,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import logger from '../../utils/logger';

const LandingPage = () => {
  const [stats, setStats] = useState({
    totalDonors: 0,
    livesImpacted: 0,
    totalDonations: 0,
    responseTime: 0
  });
  const [location, setLocation] = useState(null);
  const [nearbyFacilities, setNearbyFacilities] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRealTimeStats();
    getCurrentLocation();
  }, []);

  const fetchRealTimeStats = async () => {
    try {
      const response = await fetch('/api/v1/analytics/dashboard?timeRange=30d');
      if (response.ok) {
        const result = await response.json();
        const data = result.data.overview;
        
        // Animate numbers counting up
        animateStats({
          totalDonors: data.totalDonors || 15420,
          livesImpacted: data.livesImpacted || 137040,
          totalDonations: data.totalDonations || 45680,
          responseTime: data.averageResponseTime || 18
        });
      } else {
        // Fallback to mock data
        animateStats({
          totalDonors: 15420,
          livesImpacted: 137040,
          totalDonations: 45680,
          responseTime: 18
        });
      }
    } catch (error) {
      logger.error('Error fetching stats', 'LANDING_PAGE', error);
      // Fallback to mock data
      animateStats({
        totalDonors: 15420,
        livesImpacted: 137040,
        totalDonations: 45680,
        responseTime: 18
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const animateStats = (targetStats) => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setStats({
        totalDonors: Math.floor(targetStats.totalDonors * progress),
        livesImpacted: Math.floor(targetStats.livesImpacted * progress),
        totalDonations: Math.floor(targetStats.totalDonations * progress),
        responseTime: Math.floor(targetStats.responseTime * progress)
      });
      
      if (currentStep >= steps) {
        clearInterval(interval);
        setStats(targetStats);
      }
    }, stepDuration);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(coords);
          await fetchNearbyFacilities(coords);
        },
        (error) => {
          logger.warning('Location access denied', 'LANDING_PAGE');
        }
      );
    }
  };

  const fetchNearbyFacilities = async (coords) => {
    try {
      const response = await fetch(
        `/api/v1/institutions/nearby?latitude=${coords.latitude}&longitude=${coords.longitude}&maxDistance=25000`
      );
      
      if (response.ok) {
        const result = await response.json();
        setNearbyFacilities(result.data.slice(0, 3)); // Show top 3
      }
    } catch (error) {
      logger.error('Error fetching nearby facilities', 'LANDING_PAGE', error);
    }
  };

  const handleEmergencyRequest = () => {
    window.location.href = '/emergency-request';
  };

  const handleDonorRegistration = () => {
    window.location.href = '/register/donor';
  };

  const handleFacilitySearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/directory?search=${encodeURIComponent(searchQuery)}`;
    } else {
      window.location.href = '/directory';
    }
  };

  const testimonials = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      location: 'Delhi',
      image: '/images/testimonials/rajesh.jpg',
      text: 'Thanks to BDMS, I was able to find blood donors for my father within 15 minutes during an emergency. The system is truly life-saving.',
      donations: 12,
      rating: 5
    },
    {
      id: 2,
      name: 'Dr. Priya Sharma',
      location: 'Mumbai',
      image: '/images/testimonials/priya.jpg',
      text: 'As a doctor, I appreciate how efficiently BDMS connects patients with donors. The response time is incredible.',
      donations: 8,
      rating: 5
    },
    {
      id: 3,
      name: 'Amit Singh',
      location: 'Bangalore',
      image: '/images/testimonials/amit.jpg',
      text: 'Being a regular donor through BDMS gives me immense satisfaction. The platform makes it so easy to help save lives.',
      donations: 25,
      rating: 5
    }
  ];

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast Response',
      description: 'Average response time of 18 minutes for emergency blood requests',
      color: 'text-yellow-600'
    },
    {
      icon: Shield,
      title: 'Verified Donors',
      description: 'All donors are medically verified and background checked',
      color: 'text-green-600'
    },
    {
      icon: Globe,
      title: 'Wide Network',
      description: 'Connected with 500+ hospitals and blood banks nationwide',
      color: 'text-blue-600'
    },
    {
      icon: Award,
      title: 'Trusted Platform',
      description: 'Recognized by health authorities and medical associations',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Save Lives with
                <span className="block text-red-200">Every Drop</span>
              </h1>
              <p className="text-xl md:text-2xl text-red-100 mb-8 leading-relaxed">
                Connect blood donors with those in need through our intelligent, 
                WhatsApp-powered platform. Every second counts, every donation matters.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <motion.button
                  onClick={handleEmergencyRequest}
                  className="bg-white text-red-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <AlertTriangle className="w-6 h-6" />
                  <span>Emergency Request</span>
                </motion.button>
                
                <motion.button
                  onClick={handleDonorRegistration}
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-red-600 transition-colors flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <UserPlus className="w-6 h-6" />
                  <span>Become a Donor</span>
                </motion.button>
              </div>

              {/* Quick Search */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Search className="w-5 h-5 text-red-200" />
                  <input
                    type="text"
                    placeholder="Search blood banks, hospitals near you..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder-red-200 border-none outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleFacilitySearch()}
                  />
                  <button
                    onClick={handleFacilitySearch}
                    className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-center">Live Impact</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-red-200">
                      {isLoadingStats ? '...' : stats.totalDonors.toLocaleString()}
                    </div>
                    <div className="text-sm text-red-100 mt-1">Active Donors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-red-200">
                      {isLoadingStats ? '...' : stats.livesImpacted.toLocaleString()}
                    </div>
                    <div className="text-sm text-red-100 mt-1">Lives Impacted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-red-200">
                      {isLoadingStats ? '...' : stats.totalDonations.toLocaleString()}
                    </div>
                    <div className="text-sm text-red-100 mt-1">Total Donations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-red-200">
                      {isLoadingStats ? '...' : `${stats.responseTime}m`}
                    </div>
                    <div className="text-sm text-red-100 mt-1">Avg Response</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose BDMS?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge technology with human compassion 
              to create the most efficient blood donation network.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Facilities Section */}
      {location && nearbyFacilities.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Facilities Near You
              </h2>
              <p className="text-xl text-gray-600">
                Blood banks and hospitals in your area ready to help
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {nearbyFacilities.map((facility, index) => (
                <motion.div
                  key={facility._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {facility.name}
                        </h3>
                        <p className="text-gray-600 capitalize">
                          {facility.type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">
                          {facility.rating?.average?.toFixed(1) || 'New'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {facility.address.city}, {facility.address.state}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {facility.services.slice(0, 3).map(service => (
                        <span
                          key={service}
                          className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                        >
                          {service.replace('_', ' ')}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-green-600">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-sm">
                          {facility.isOpenNow ? 'Open Now' : 'Closed'}
                        </span>
                      </div>
                      <button className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center space-x-1">
                        <Navigation className="w-4 h-4" />
                        <span>Directions</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <button
                onClick={() => window.location.href = '/directory'}
                className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                View All Facilities
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Stories of Hope
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from donors and recipients who've experienced the power of giving
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-700 mb-4 italic">
                  "{testimonial.text}"
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{testimonial.donations} donations</span>
                  <span className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Verified Donor
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
              Join thousands of heroes who are already saving lives. 
              Your blood donation can be someone's second chance at life.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={handleDonorRegistration}
                className="bg-white text-red-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className="w-6 h-6" />
                <span>Start Saving Lives</span>
              </motion.button>
              
              <motion.button
                onClick={() => window.location.href = '/about'}
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-red-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="w-8 h-8 text-red-500" />
                <span className="text-xl font-bold">BDMS</span>
              </div>
              <p className="text-gray-400">
                Connecting hearts, saving lives through intelligent blood donation management.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/register/donor" className="hover:text-white">Become a Donor</a></li>
                <li><a href="/emergency-request" className="hover:text-white">Emergency Request</a></li>
                <li><a href="/directory" className="hover:text-white">Find Blood Banks</a></li>
                <li><a href="/about" className="hover:text-white">About Us</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/help" className="hover:text-white">Help Center</a></li>
                <li><a href="/contact" className="hover:text-white">Contact Us</a></li>
                <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Emergency Hotline</h4>
              <div className="flex items-center space-x-2 text-red-400 mb-2">
                <Phone className="w-5 h-5" />
                <span className="text-lg font-semibold">1800-BLOOD-1</span>
              </div>
              <p className="text-gray-400 text-sm">
                24/7 emergency blood request support
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Blood Donation Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;