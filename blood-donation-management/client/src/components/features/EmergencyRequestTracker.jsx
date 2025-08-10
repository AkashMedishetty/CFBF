/**
 * EmergencyRequestTracker Component
 * Tracking system for guest emergency requests
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Phone, 
  MapPin,
  RefreshCw,
  Share2,
  Copy,
  MessageCircle,
  Mail,
  User
} from 'lucide-react';

import MobileOptimizedInput from '../ui/MobileOptimizedInput';

const EmergencyRequestTracker = ({ trackingId: initialTrackingId }) => {
  const [trackingId, setTrackingId] = useState(initialTrackingId || '');
  const [requestData, setRequestData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Mock data for demonstration - in real app, this would come from API
  const mockRequestData = {
    trackingId: 'ER12345678',
    status: 'active',
    patientName: 'John Doe',
    bloodType: 'O+',
    unitsNeeded: 2,
    urgencyLevel: 'urgent',
    hospitalName: 'City General Hospital',
    hospitalAddress: '123 Medical Center Dr, Downtown',
    city: 'New York',
    contactName: 'Jane Doe',
    contactPhone: '+1-555-0123',
    submittedAt: '2024-01-20T10:30:00Z',
    lastUpdated: '2024-01-20T11:15:00Z',
    donorsNotified: 45,
    donorsResponded: 8,
    donorsAccepted: 3,
    estimatedFulfillment: '2024-01-20T13:30:00Z',
    timeline: [
      {
        id: 1,
        status: 'submitted',
        title: 'Request Submitted',
        description: 'Emergency blood request created',
        timestamp: '2024-01-20T10:30:00Z',
        completed: true
      },
      {
        id: 2,
        status: 'notifying',
        title: 'Notifying Donors',
        description: '45 nearby donors notified',
        timestamp: '2024-01-20T10:32:00Z',
        completed: true
      },
      {
        id: 3,
        status: 'responding',
        title: 'Donors Responding',
        description: '8 donors responded, 3 accepted',
        timestamp: '2024-01-20T11:15:00Z',
        completed: true
      },
      {
        id: 4,
        status: 'coordinating',
        title: 'Coordinating Donation',
        description: 'Connecting donors with hospital',
        timestamp: null,
        completed: false
      },
      {
        id: 5,
        status: 'fulfilled',
        title: 'Request Fulfilled',
        description: 'Blood donation completed',
        timestamp: null,
        completed: false
      }
    ]
  };

  // Status configurations
  const statusConfig = {
    pending: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Clock },
    active: { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Users },
    coordinating: { color: 'text-purple-600', bgColor: 'bg-purple-50', icon: Phone },
    fulfilled: { color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
    expired: { color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertCircle }
  };

  // Urgency level configurations
  const urgencyConfig = {
    critical: { color: 'text-red-600', bgColor: 'bg-red-50', label: 'Critical' },
    urgent: { color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'Urgent' },
    scheduled: { color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Scheduled' }
  };

  // Track request
  const trackRequest = async () => {
    if (!trackingId.trim()) {
      setError('Please enter a tracking ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In real app, make API call here
      // const response = await fetch(`/api/v1/emergency/track/${trackingId}`);
      // const data = await response.json();
      
      // For demo, use mock data
      if (trackingId.toUpperCase() === 'ER12345678' || trackingId === mockRequestData.trackingId) {
        setRequestData(mockRequestData);
        setLastUpdated(new Date().toISOString());
      } else {
        throw new Error('Request not found');
      }
      
    } catch (err) {
      setError(err.message || 'Failed to track request. Please check your tracking ID.');
      setRequestData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    if (requestData) {
      await trackRequest();
    }
  };

  // Share request
  const shareRequest = async (method) => {
    if (!requestData) return;

    const shareText = `🚨 URGENT: ${requestData.bloodType} blood needed for ${requestData.patientName} at ${requestData.hospitalName}. Please help or share! Track: ${requestData.trackingId}`;
    const shareUrl = `${window.location.origin}/emergency/track/${requestData.trackingId}`;

    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        break;
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_self');
        break;
      case 'email':
        window.open(`mailto:?subject=Urgent Blood Request&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`, '_self');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareText + ' ' + shareUrl);
          alert('Request details copied to clipboard!');
        } catch (error) {
          console.error('Failed to copy:', error);
        }
        break;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Urgent Blood Request',
              text: shareText,
              url: shareUrl
            });
          } catch (error) {
            console.log('Share cancelled or failed:', error);
          }
        }
        break;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Pending';
    return new Date(timestamp).toLocaleString();
  };

  // Calculate time elapsed
  const getTimeElapsed = (timestamp) => {
    if (!timestamp) return '';
    const elapsed = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  };

  // Auto-track if initial tracking ID provided
  useEffect(() => {
    if (initialTrackingId) {
      trackRequest();
    }
  }, [initialTrackingId]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Track Emergency Request
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Enter your tracking ID to check request status
            </p>
          </div>
        </div>

        {/* Search Form */}
        <div className="flex space-x-3">
          <div className="flex-1">
            <MobileOptimizedInput
              type="text"
              label="Tracking ID"
              value={trackingId}
              onChange={setTrackingId}
              placeholder="Enter tracking ID (e.g., ER12345678)"
              className="text-center font-mono"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={trackRequest}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              'Track'
            )}
          </motion.button>
        </div>

        {/* Demo Helper */}
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <strong>Demo:</strong> Try tracking ID "ER12345678" to see a sample request
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Request Details */}
      <AnimatePresence>
        {requestData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Status Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${statusConfig[requestData.status].bgColor} rounded-full flex items-center justify-center`}>
                    {React.createElement(statusConfig[requestData.status].icon, {
                      className: `w-6 h-6 ${statusConfig[requestData.status].color}`
                    })}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Request {requestData.status.charAt(0).toUpperCase() + requestData.status.slice(1)}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      ID: {requestData.trackingId}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={refreshData}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors touch-manipulation"
                    aria-label="Refresh data"
                  >
                    <RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => shareRequest('native')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors touch-manipulation"
                    aria-label="Share request"
                  >
                    <Share2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </motion.button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {requestData.donorsNotified}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Donors Notified
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {requestData.donorsResponded}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Responses
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {requestData.donorsAccepted}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Accepted
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {requestData.unitsNeeded}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Units Needed
                  </div>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Information */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Patient Information</span>
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Name:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {requestData.patientName}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Blood Type:</span>
                    <span className="font-bold text-red-600 dark:text-red-400 text-lg">
                      {requestData.bloodType}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Units Needed:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {requestData.unitsNeeded}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Urgency:</span>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${urgencyConfig[requestData.urgencyLevel].bgColor} ${urgencyConfig[requestData.urgencyLevel].color}`}>
                      {urgencyConfig[requestData.urgencyLevel].label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Location</span>
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm">Hospital:</div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {requestData.hospitalName}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm">Address:</div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {requestData.hospitalAddress}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm">City:</div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {requestData.city}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Request Timeline</span>
              </h3>
              
              <div className="space-y-4">
                {requestData.timeline.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.completed 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : 'bg-slate-100 dark:bg-slate-700'
                    }`}>
                      {item.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <div className="w-2 h-2 bg-slate-400 rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${
                          item.completed 
                            ? 'text-slate-900 dark:text-white' 
                            : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {item.title}
                        </h4>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {item.description}
                      </p>
                      {item.timestamp && (
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {getTimeElapsed(item.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share Options */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Share to Get More Help
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => shareRequest('whatsapp')}
                  className="flex items-center justify-center space-x-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors touch-manipulation"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>WhatsApp</span>
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => shareRequest('sms')}
                  className="flex items-center justify-center space-x-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors touch-manipulation"
                >
                  <Phone className="w-5 h-5" />
                  <span>SMS</span>
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => shareRequest('email')}
                  className="flex items-center justify-center space-x-2 p-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors touch-manipulation"
                >
                  <Mail className="w-5 h-5" />
                  <span>Email</span>
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => shareRequest('copy')}
                  className="flex items-center justify-center space-x-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors touch-manipulation"
                >
                  <Copy className="w-5 h-5" />
                  <span>Copy Link</span>
                </motion.button>
              </div>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
              <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                Last updated: {formatTimestamp(lastUpdated)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmergencyRequestTracker;