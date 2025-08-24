import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Calendar,
  MapPin,
  Droplet,
  User,
  Star,
  Image as ImageIcon,
  FileText,
  AlertTriangle,
  Filter,
  Search,
  Download,
  MessageSquare,
  Phone,
  Mail,
  Award,
  Flag,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Avatar from '../ui/Avatar';
import logger from '../../utils/logger';

const DonationVerificationQueue = ({ className = '' }) => {
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchPendingDonations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [donations, searchQuery, statusFilter, priorityFilter, sortBy, sortOrder]);

  const fetchPendingDonations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/documents/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await res.json();
      if (result.success) {
        const items = (result.data || []).map((doc) => ({
          id: doc._id,
          submissionId: doc.filename,
          donor: {
            id: doc.userId?._id || doc.userId,
            name: doc.userId?.name || 'Unknown Donor',
            phone: doc.userId?.phoneNumber || '',
            email: '',
            bloodType: '',
            profilePicture: null,
            totalDonations: 0,
            lastDonation: null,
            verificationStatus: doc.verified ? 'verified' : 'pending'
          },
          donationDetails: {
            date: doc.uploadedAt,
            time: '',
            location: { name: '—', address: '—', coordinates: [0, 0] },
            bloodType: '',
            unitsContributed: 0,
            donationType: 'document'
          },
          photos: [],
          healthStatus: { anyComplications: false },
          experience: { rating: 0, staffRating: 0, facilityRating: 0, feedback: '' },
          submittedAt: doc.uploadedAt,
          status: 'pending',
          priority: 'normal',
          flags: [],
          adminNotes: null
        }));
        setDonations(items);
        logger.success('Pending documents loaded into verification queue', 'DONATION_VERIFICATION');
      } else {
        setDonations([]);
        logger.warn('Failed to load pending documents', 'DONATION_VERIFICATION', result.error);
      }
    } catch (error) {
      logger.error('Error fetching pending documents', 'DONATION_VERIFICATION', error);
      setDonations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...donations];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(donation =>
        donation.donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donation.submissionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donation.donationDetails.location.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(donation => donation.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(donation => donation.priority === priorityFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'submittedAt' || sortBy === 'donationDetails.date') {
        aValue = new Date(sortBy === 'submittedAt' ? a.submittedAt : a.donationDetails.date);
        bValue = new Date(sortBy === 'submittedAt' ? b.submittedAt : b.donationDetails.date);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDonations(filtered);
  };

  const handleVerifyDonation = async (donationId, decision, notes) => {
    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update local state
      setDonations(prev => prev.filter(d => d.id !== donationId));
      setSelectedDonation(null);
      setVerificationNotes('');
      
      logger.success(`Donation ${decision}d successfully`, 'DONATION_VERIFICATION');
    } catch (error) {
      logger.error('Error processing verification', 'DONATION_VERIFICATION', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContactDonor = (donor, method) => {
    logger.ui('CLICK', 'ContactDonor', { donorId: donor.id, method }, 'DONATION_VERIFICATION');
    
    if (method === 'phone') {
      window.open(`tel:${donor.phone}`);
    } else if (method === 'whatsapp') {
      window.open(`https://wa.me/${donor.phone.replace(/[^0-9]/g, '')}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFlagColor = (flag) => {
    switch (flag) {
      case 'health_concern': return 'red';
      case 'first_time_donor': return 'blue';
      case 'incomplete_info': return 'yellow';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'normal': return 'blue';
      case 'low': return 'gray';
      default: return 'gray';
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High Priority' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low Priority' }
  ];

  const sortOptions = [
    { value: 'submittedAt', label: 'Submission Date' },
    { value: 'donationDetails.date', label: 'Donation Date' },
    { value: 'priority', label: 'Priority' }
  ];

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Donation Verification Queue
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Review and verify submitted donation proofs
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="blue">
            {filteredDonations.length} pending
          </Badge>
          <Button
            variant="outline"
            onClick={() => fetchPendingDonations()}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by donor name, ID, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            placeholder="Filter by status"
          />
          
          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={priorityOptions}
            placeholder="Filter by priority"
          />
          
          <div className="flex items-center space-x-2">
            <Select
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
              placeholder="Sort by"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Donations List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredDonations.map((donation, index) => (
            <motion.div
              key={donation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <Avatar
                      src={donation.donor.profilePicture}
                      alt={donation.donor.name}
                      size="lg"
                      fallback={donation.donor.name.charAt(0)}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {donation.donor.name}
                        </h3>
                        <Badge variant={getPriorityColor(donation.priority)} size="sm">
                          {donation.priority}
                        </Badge>
                        {donation.flags.map((flag) => (
                          <Badge key={flag} variant={getFlagColor(flag)} size="sm">
                            <Flag className="h-3 w-3 mr-1" />
                            {flag.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="text-slate-600 dark:text-slate-400">
                            {formatDate(donation.donationDetails.date)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="text-slate-600 dark:text-slate-400 truncate">
                            {donation.donationDetails.location.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Droplet className="h-4 w-4 text-red-600" />
                          <span className="text-slate-600 dark:text-slate-400">
                            {donation.donationDetails.bloodType} • {donation.donationDetails.unitsContributed} unit(s)
                          </span>
                        </div>
                      </div>
                      
                      {expandedCard === donation.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-slate-900 dark:text-white">Health Status:</span>
                              <p className="text-slate-600 dark:text-slate-400">
                                {donation.healthStatus.anyComplications ? 'Has complications' : 'No complications'}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-slate-900 dark:text-white">Experience Rating:</span>
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < donation.experience.rating
                                        ? 'text-yellow-500 fill-current'
                                        : 'text-slate-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-slate-600 dark:text-slate-400 ml-1">
                                  ({donation.experience.rating}/5)
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-slate-900 dark:text-white">Photos:</span>
                              <p className="text-slate-600 dark:text-slate-400">
                                {donation.photos.length} attached
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-slate-900 dark:text-white">Submitted:</span>
                              <p className="text-slate-600 dark:text-slate-400">
                                {formatDate(donation.submittedAt)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedCard(expandedCard === donation.id ? null : donation.id)}
                    >
                      {expandedCard === donation.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDonation(donation)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => handleVerifyDonation(donation.id, 'approve', '')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Quick Approve
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredDonations.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No donations to verify
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              All donation submissions have been processed.
            </p>
          </Card>
        )}
      </div>

      {/* Donation Detail Modal */}
      <AnimatePresence>
        {selectedDonation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-lg overflow-hidden"
            >
              <div className="flex flex-col h-full">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        Donation Verification - {selectedDonation.submissionId}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Submitted by {selectedDonation.donor.name} on {formatDate(selectedDonation.submittedAt)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDonation(null)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Donor Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Donor Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={selectedDonation.donor.profilePicture}
                          alt={selectedDonation.donor.name}
                          size="lg"
                          fallback={selectedDonation.donor.name.charAt(0)}
                        />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {selectedDonation.donor.name}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {selectedDonation.donor.bloodType} • {selectedDonation.donor.totalDonations} donations
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-slate-500" />
                          <span className="text-sm text-slate-900 dark:text-white">
                            {selectedDonation.donor.phone}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-slate-500" />
                          <span className="text-sm text-slate-900 dark:text-white">
                            {selectedDonation.donor.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Donation Details */}
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Donation Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              Date & Time
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">
                            {formatDate(selectedDonation.donationDetails.date)}
                          </p>
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              Location
                            </span>
                          </div>
                          <div>
                            <p className="text-slate-900 dark:text-white font-medium">
                              {selectedDonation.donationDetails.location.name}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {selectedDonation.donationDetails.location.address}
                            </p>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Droplet className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              Blood Details
                            </span>
                          </div>
                          <div>
                            <p className="text-slate-900 dark:text-white font-medium">
                              {selectedDonation.donationDetails.bloodType}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {selectedDonation.donationDetails.unitsContributed} unit(s) - {selectedDonation.donationDetails.donationType.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              Experience Rating
                            </span>
                          </div>
                          <div>
                            <p className="text-slate-900 dark:text-white font-medium">
                              {selectedDonation.experience.rating}/5 stars
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Staff: {selectedDonation.experience.staffRating}/5 • Facility: {selectedDonation.experience.facilityRating}/5
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Health Status */}
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Health Status
                    </h4>
                    <Card className={`p-4 ${
                      selectedDonation.healthStatus.anyComplications
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    }`}>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          {selectedDonation.healthStatus.anyComplications ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          <span className="font-medium text-slate-900 dark:text-white">
                            {selectedDonation.healthStatus.anyComplications ? 'Complications Reported' : 'No Complications'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Pre-donation feeling:</span>
                            <p className="text-slate-900 dark:text-white font-medium capitalize">
                              {selectedDonation.healthStatus.predonationFeeling}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Post-donation feeling:</span>
                            <p className="text-slate-900 dark:text-white font-medium capitalize">
                              {selectedDonation.healthStatus.postDonationFeeling}
                            </p>
                          </div>
                        </div>
                        
                        {selectedDonation.healthStatus.complications && (
                          <div>
                            <span className="text-slate-600 dark:text-slate-400 text-sm">Complications details:</span>
                            <p className="text-slate-900 dark:text-white mt-1">
                              {selectedDonation.healthStatus.complications}
                            </p>
                          </div>
                        )}
                        
                        {selectedDonation.healthStatus.followUpNeeded && (
                          <Badge variant="yellow">
                            Follow-up needed
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Experience Feedback */}
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Experience Feedback
                    </h4>
                    <Card className="p-4">
                      <p className="text-slate-900 dark:text-white">
                        {selectedDonation.experience.feedback}
                      </p>
                    </Card>
                  </div>

                  {/* Photos */}
                  {selectedDonation.photos.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Attached Photos ({selectedDonation.photos.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedDonation.photos.map((photo) => (
                          <Card key={photo.id} className="p-4">
                            <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded mb-3 overflow-hidden">
                              <img
                                src={photo.url}
                                alt={photo.caption}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNjBDMTA1LjUyMyA2MCAxMTAgNjQuNDc3IDExMCA3MEMxMTAgNzUuNTIzIDEwNS41MjMgODAgMTAwIDgwQzk0LjQ3NzIgODAgOTAgNzUuNTIzIDkwIDcwQzkwIDY0LjQ3NyA5NC40NzcyIDYwIDEwMCA2MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                                }}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {photo.caption}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {formatDate(photo.timestamp)}
                              </p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Flags */}
                  {selectedDonation.flags.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Flags & Concerns
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDonation.flags.map((flag) => (
                          <Badge key={flag} variant={getFlagColor(flag)}>
                            <Flag className="h-3 w-3 mr-1" />
                            {flag.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verification Notes */}
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Verification Notes
                    </h4>
                    <textarea
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                      rows={4}
                      placeholder="Add verification notes (optional)..."
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => handleContactDonor(selectedDonation.donor, 'phone')}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Donor
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleContactDonor(selectedDonation.donor, 'whatsapp')}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedDonation(null)}
                        disabled={isProcessing}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleVerifyDonation(selectedDonation.id, 'reject', verificationNotes)}
                        disabled={isProcessing}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {isProcessing ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleVerifyDonation(selectedDonation.id, 'approve', verificationNotes)}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isProcessing ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DonationVerificationQueue;