import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Droplet, 
  Download, 
  Eye,
  Share2,
  Filter,
  Search,
  Award,
  Clock,
  Building2,
  CheckCircle,
  Star
} from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import logger from '../../utils/logger';

const DonationHistory = ({ className = '' }) => {
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchDonationHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [donations, searchQuery, filterYear, filterStatus]);

  const fetchDonationHistory = async () => {
    setIsLoading(true);
    
    try {
      // Mock data - in real app, this would be an API call
      const mockDonations = [
        {
          id: 1,
          date: '2024-01-15',
          time: '10:30 AM',
          location: {
            name: 'AIIMS Hospital',
            address: 'Ansari Nagar, New Delhi',
            coordinates: [28.5672, 77.2100]
          },
          bloodType: 'O+',
          unitsContributed: 1,
          status: 'completed',
          certificateId: 'CERT-2024-001',
          photos: ['/api/donations/1/photo1.jpg'],
          notes: 'Smooth donation process, felt great afterwards',
          verifiedBy: 'Dr. Sarah Johnson',
          verificationDate: '2024-01-15',
          impactStory: 'Your donation helped save a 7-year-old child during emergency surgery.',
          points: 100,
          milestones: ['5th Donation', 'Life Saver Badge']
        },
        {
          id: 2,
          date: '2023-10-20',
          time: '2:15 PM',
          location: {
            name: 'Red Cross Blood Bank',
            address: 'Red Cross Road, New Delhi',
            coordinates: [28.6139, 77.2090]
          },
          bloodType: 'O+',
          unitsContributed: 1,
          status: 'completed',
          certificateId: 'CERT-2023-045',
          photos: ['/api/donations/2/photo1.jpg', '/api/donations/2/photo2.jpg'],
          notes: 'Quick and efficient process',
          verifiedBy: 'Nurse Mary Wilson',
          verificationDate: '2023-10-20',
          impactStory: 'Helped a cancer patient during chemotherapy treatment.',
          points: 100,
          milestones: []
        }
      ];

      setDonations(mockDonations);
      logger.success('Donation history loaded', 'DONATION_HISTORY');
    } catch (error) {
      logger.error('Error fetching donation history', 'DONATION_HISTORY', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...donations];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(donation =>
        donation.location.name.toLowerCase().includes(query) ||
        donation.location.address.toLowerCase().includes(query) ||
        donation.notes?.toLowerCase().includes(query)
      );
    }

    // Year filter
    if (filterYear !== 'all') {
      filtered = filtered.filter(donation => 
        new Date(donation.date).getFullYear().toString() === filterYear
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(donation => donation.status === filterStatus);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    setFilteredDonations(filtered);
  };

  const downloadCertificate = (donation) => {
    // In real app, this would download the actual certificate
    logger.ui('CLICK', 'DownloadCertificate', { donationId: donation.id }, 'DONATION_HISTORY');
    // Simulate download
    const link = document.createElement('a');
    link.href = `/api/certificates/${donation.certificateId}.pdf`;
    link.download = `donation-certificate-${donation.certificateId}.pdf`;
    link.click();
  };

  const shareDonation = (donation) => {
    const text = `🩸 Just completed my donation at ${donation.location.name}! Every drop counts in saving lives. #BloodDonation #LifeSaver`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Blood Donation Completed',
        text: text,
        url: window.location.origin
      });
    } else {
      navigator.clipboard.writeText(text);
      logger.success('Donation shared to clipboard!', 'DONATION_HISTORY');
    }
  };

  const yearOptions = [
    { value: 'all', label: 'All Years' },
    { value: '2024', label: '2024' },
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending Verification' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          ))}
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
            Donation History
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track your blood donation journey and impact
          </p>
        </div>
        
        <Button variant="outline" className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export History</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            icon={Search}
            placeholder="Search donations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <Select
            value={filterYear}
            onChange={setFilterYear}
            options={yearOptions}
            placeholder="Filter by year"
          />
          
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            options={statusOptions}
            placeholder="Filter by status"
          />
          
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setFilterYear('all');
              setFilterStatus('all');
            }}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Clear Filters</span>
          </Button>
        </div>
      </Card>

      {/* Donation Cards */}
      <div className="space-y-6">
        <AnimatePresence>
          {filteredDonations.map((donation, index) => (
            <motion.div
              key={donation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              layout
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Info */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                            <Droplet className="h-6 w-6 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              Blood Donation #{donation.id}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(donation.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{donation.time}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Badge 
                          variant={donation.status === 'completed' ? 'green' : 'yellow'}
                          className="mb-3"
                        >
                          {donation.status === 'completed' ? 'Completed' : 'Pending'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareDonation(donation)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadCertificate(donation)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start space-x-3">
                      <Building2 className="h-5 w-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {donation.location.name}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {donation.location.address}
                        </p>
                      </div>
                    </div>

                    {/* Donation Details */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Blood Type</p>
                        <p className="font-semibold text-red-600 dark:text-red-400">
                          {donation.bloodType}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Units Contributed</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {donation.unitsContributed} unit{donation.unitsContributed > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {donation.notes && (
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Notes:</p>
                        <p className="text-sm text-slate-900 dark:text-white italic">
                          "{donation.notes}"
                        </p>
                      </div>
                    )}

                    {/* Impact Story */}
                    {donation.impactStory && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                              Impact Story
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {donation.impactStory}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Milestones */}
                    {donation.milestones.length > 0 && (
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          Milestones Achieved:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {donation.milestones.map((milestone, idx) => (
                            <Badge key={idx} variant="yellow" size="sm">
                              <Award className="h-3 w-3 mr-1" />
                              {milestone}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    {/* Certificate */}
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                      <div className="text-center">
                        <Star className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Digital Certificate
                        </h4>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                          ID: {donation.certificateId}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => downloadCertificate(donation)}
                          className="w-full"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </Card>

                    {/* Verification */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                        Verification
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-slate-600 dark:text-slate-400">
                            Verified by {donation.verifiedBy}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(donation.verificationDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Points Earned */}
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          +{donation.points}
                        </div>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Points Earned
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredDonations.length === 0 && !isLoading && (
          <Card className="p-12 text-center">
            <Droplet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No Donations Found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {searchQuery || filterYear !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search criteria or filters'
                : 'Start your blood donation journey today!'
              }
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DonationHistory;