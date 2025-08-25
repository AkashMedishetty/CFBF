import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Download,
  User,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { adminApi } from '../../utils/api';
import logger from '../../utils/logger';

const DonorManagement = () => {
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null);

  const statusOptions = [
    { value: 'all', label: 'All Donors' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'suspended', label: 'Suspended' }
  ];



  useEffect(() => {
    fetchDonors();
  }, []);

  useEffect(() => {
    filterDonors();
  }, [donors, searchTerm, statusFilter]);

  const fetchDonors = async () => {
    setIsLoading(true);
    try {
      logger.info('Fetching donors for admin management', 'DONOR_MANAGEMENT');
      
      // Try to fetch all donors first, fallback to pending donors
      let allDonors = [];
      
      try {
        const response = await fetch('/api/v1/admin/donors/all', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          allDonors = data.success ? (data.data?.donors || []) : [];
        }
      } catch (error) {
        logger.warn('All donors endpoint not available, using pending donors', 'DONOR_MANAGEMENT');
      }
      
      // If no all donors endpoint, fetch pending donors and stats
      if (allDonors.length === 0) {
        const [pendingRes, statsRes] = await Promise.all([
          adminApi.getPendingDonors().catch(() => ({ data: { donors: [] } })),
          adminApi.getDonorStats().catch(() => ({ data: { donors: [] } }))
        ]);

        const pendingDonors = pendingRes?.data?.donors || [];
        const statsDonors = statsRes?.data?.donors || [];
        
        // Merge and deduplicate donors
        const donorMap = new Map();
        
        // Add stats donors first
        statsDonors.forEach(donor => {
          donorMap.set(donor._id || donor.id, {
            ...donor,
            id: donor._id || donor.id
          });
        });
        
        // Update with pending donor details
        pendingDonors.forEach(donor => {
          const existingDonor = donorMap.get(donor._id || donor.id);
          donorMap.set(donor._id || donor.id, {
            ...existingDonor,
            ...donor,
            id: donor._id || donor.id,
            isPending: true
          });
        });

        allDonors = Array.from(donorMap.values());
      }
      
      // Debug log to check phone number data
      logger.debug('Donors data loaded:', 'DONOR_MANAGEMENT', {
        totalDonors: allDonors.length,
        sampleDonor: allDonors[0],
        phoneNumberFields: allDonors.slice(0, 3).map(d => ({
          id: d._id?.slice(-8) || d.id?.slice(-8),
          name: d.name,
          phoneNumber: d.phoneNumber,
          phone: d.phone,
          mobile: d.mobile,
          allFields: Object.keys(d)
        }))
      });
      
      logger.success(`Loaded ${allDonors.length} donors`, 'DONOR_MANAGEMENT');
      setDonors(allDonors);
    } catch (error) {
      logger.error('Failed to fetch donors', 'DONOR_MANAGEMENT', error);
      setDonors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterDonors = () => {
    let filtered = [...donors];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(donor => 
        donor.name?.toLowerCase().includes(term) ||
        donor.email?.toLowerCase().includes(term) ||
        donor.phoneNumber?.includes(term) ||
        donor.bloodType?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(donor => {
        switch (statusFilter) {
          case 'pending':
            return donor.status === 'pending' || donor.isPending;
          case 'approved':
            return donor.status === 'approved' || donor.verified === true;
          case 'rejected':
            return donor.status === 'rejected' || donor.verified === false;
          case 'suspended':
            return donor.status === 'suspended';
          default:
            return true;
        }
      });
    }

    setFilteredDonors(filtered);
    setCurrentPage(1);
  };

  const handleDonorAction = async (donorId, action, reason = '') => {
    setIsProcessing(true);
    try {
      logger.info(`Performing ${action} on donor ${donorId}`, 'DONOR_MANAGEMENT');
      
      let response;
      switch (action) {
        case 'approve':
          response = await adminApi.approveDonor(donorId);
          break;
        case 'reject':
          response = await adminApi.rejectDonor(donorId, reason);
          break;
        case 'suspend':
          response = await adminApi.suspendDonor(donorId, reason);
          break;
        case 'reactivate':
          response = await adminApi.reactivateDonor(donorId);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      if (response?.success) {
        logger.success(`Donor ${action} successful`, 'DONOR_MANAGEMENT');
        await fetchDonors(); // Refresh the list
        setIsDetailModalOpen(false);
      } else {
        throw new Error(response?.message || `Failed to ${action} donor`);
      }
    } catch (error) {
      logger.error(`Failed to ${action} donor`, 'DONOR_MANAGEMENT', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewDonor = async (donor) => {
    try {
      const donorId = donor.id || donor._id;
      logger.info(`Viewing donor details for ${donorId}`, 'DONOR_MANAGEMENT');
      
      // Fetch detailed donor information
      const response = await adminApi.getDonorDetails(donorId);
      if (response?.success) {
        setSelectedDonor({
          ...donor,
          ...response.data.donor,
          questionnaire: response.data.donor?.questionnaire || {},
          documents: response.data.documents || []
        });
      } else {
        setSelectedDonor(donor);
      }
      
      setIsDetailModalOpen(true);
    } catch (error) {
      logger.error('Failed to fetch donor details', 'DONOR_MANAGEMENT', error);
      setSelectedDonor(donor);
      setIsDetailModalOpen(true);
    }
  };

  const handleViewQuestionnaire = async (donor) => {
    try {
      const donorId = donor.id || donor._id;
      logger.info(`Viewing questionnaire for donor ${donorId}`, 'DONOR_MANAGEMENT');
      
      // Fetch questionnaire data
      const response = await fetch(`/api/v1/admin/donors/${donorId}/questionnaire`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.data?.questionnaire) {
        setSelectedQuestionnaire({
          donor,
          questionnaire: data.data.questionnaire,
          submittedAt: data.data.submittedAt
        });
        setShowQuestionnaireModal(true);
      } else {
        alert('No questionnaire found for this donor');
      }
    } catch (error) {
      logger.error('Failed to load questionnaire', 'DONOR_MANAGEMENT', error);
      alert('Failed to load questionnaire');
    }
  };

  const getStatusBadge = (donor) => {
    if (donor.status === 'pending' || donor.isPending) {
      return <Badge variant="yellow">Pending</Badge>;
    } else if (donor.status === 'approved' || donor.verified === true) {
      return <Badge variant="green">Approved</Badge>;
    } else if (donor.status === 'rejected' || donor.verified === false) {
      return <Badge variant="red">Rejected</Badge>;
    } else if (donor.status === 'suspended') {
      return <Badge variant="gray">Suspended</Badge>;
    } else {
      return <Badge variant="blue">Unknown</Badge>;
    }
  };

  const getQuestionnaireStatus = (donor) => {
    if (donor.questionnaire || donor.questionnaireCompleted || donor.questionnaireSubmitted) {
      return (
        <div className="flex items-center space-x-2">
          <Badge variant="green">Submitted</Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewQuestionnaire(donor)}
            className="text-xs"
          >
            View
          </Button>
        </div>
      );
    } else {
      return <Badge variant="gray">Not Submitted</Badge>;
    }
  };

  const exportDonors = async () => {
    try {
      logger.info('Exporting donor data', 'DONOR_MANAGEMENT');
      
      const response = await adminApi.exportDonors({
        status: statusFilter,
        search: searchTerm
      });
      
      if (response?.success) {
        logger.success('Donor export completed', 'DONOR_MANAGEMENT');
      }
    } catch (error) {
      logger.error('Failed to export donors', 'DONOR_MANAGEMENT', error);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredDonors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDonors = filteredDonors.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Donor Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage donor registrations, approvals, and profiles
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={exportDonors}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          
          <Button
            onClick={fetchDonors}
            className="flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Donors</p>
              <p className="text-2xl font-bold text-slate-900">{donors.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Pending Approval</p>
              <p className="text-2xl font-bold text-slate-900">
                {donors.filter(d => d.status === 'pending' || d.isPending).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Approved</p>
              <p className="text-2xl font-bold text-slate-900">
                {donors.filter(d => d.status === 'approved' || d.verified === true).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Rejected</p>
              <p className="text-2xl font-bold text-slate-900">
                {donors.filter(d => d.status === 'rejected' || d.verified === false).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search donors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            placeholder="Filter by status"
          />
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredDonors.length)} of {filteredDonors.length}
            </span>
          </div>
        </div>
      </Card>

      {/* Donors Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Donor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Blood Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Questionnaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              <AnimatePresence>
                {currentDonors.map((donor, index) => (
                  <motion.tr
                    key={donor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-slate-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {donor.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-slate-500">
                            ID: {donor.id?.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{donor.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <Phone className="h-3 w-3" />
                          <span>{donor.phoneNumber || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="blue">
                        {donor.bloodType || 'Unknown'}
                      </Badge>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(donor)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getQuestionnaireStatus(donor)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {donor.createdAt ? new Date(donor.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDonor(donor)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Donor Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Donor Details"
        size="lg"
      >
        {selectedDonor && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <p className="text-sm text-slate-900">{selectedDonor.name || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Blood Type
                </label>
                <Badge variant="blue">{selectedDonor.bloodType || 'Unknown'}</Badge>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <p className="text-sm text-slate-900">{selectedDonor.email || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <p className="text-sm text-slate-900">{selectedDonor.phoneNumber || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                {getStatusBadge(selectedDonor)}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Registered
                </label>
                <p className="text-sm text-slate-900">
                  {selectedDonor.createdAt ? new Date(selectedDonor.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Questionnaire Summary */}
            {selectedDonor.questionnaire && (
              <div>
                <h4 className="text-lg font-medium text-slate-900 mb-3">Health Questionnaire</h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Feeling Well:</span>
                    <span className="text-sm font-medium">
                      {selectedDonor.questionnaire.currentHealth?.feelingWell ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Medical Conditions:</span>
                    <span className="text-sm font-medium">
                      {selectedDonor.questionnaire.medicalConditions?.length || 0} reported
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Previous Donations:</span>
                    <span className="text-sm font-medium">
                      {selectedDonor.questionnaire.previousDonations?.hasDonateBefore ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              {(selectedDonor.status === 'pending' || selectedDonor.isPending) && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleDonorAction(selectedDonor.id || selectedDonor._id, 'reject')}
                    disabled={isProcessing}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  
                  <Button
                    onClick={() => handleDonorAction(selectedDonor.id || selectedDonor._id, 'approve')}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </>
              )}
              
              {selectedDonor.status === 'approved' && (
                <Button
                  variant="outline"
                  onClick={() => handleDonorAction(selectedDonor.id || selectedDonor._id, 'suspend')}
                  disabled={isProcessing}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  Suspend
                </Button>
              )}
              
              {selectedDonor.status === 'suspended' && (
                <Button
                  onClick={() => handleDonorAction(selectedDonor.id || selectedDonor._id, 'reactivate')}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Reactivate
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Questionnaire Modal */}
      <Modal
        isOpen={showQuestionnaireModal}
        onClose={() => setShowQuestionnaireModal(false)}
        title="Health Questionnaire"
        size="lg"
      >
        {selectedQuestionnaire && (
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h4 className="text-lg font-medium text-slate-900 dark:text-white">
                {selectedQuestionnaire.donor.name}'s Health Questionnaire
              </h4>
              <p className="text-sm text-slate-500">
                Submitted: {selectedQuestionnaire.submittedAt ? new Date(selectedQuestionnaire.submittedAt).toLocaleString() : 'Unknown'}
              </p>
            </div>

            <div className="space-y-4">
              {/* Medical Conditions */}
              {selectedQuestionnaire.questionnaire.medicalConditions && (
                <div>
                  <h5 className="font-medium text-slate-900 dark:text-white mb-2">Medical Conditions</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedQuestionnaire.questionnaire.medicalConditions.length > 0 ? (
                      selectedQuestionnaire.questionnaire.medicalConditions.map((condition, index) => (
                        <Badge key={index} variant="secondary">{condition}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">None reported</span>
                    )}
                  </div>
                </div>
              )}

              {/* Lifestyle */}
              {selectedQuestionnaire.questionnaire.lifestyle && (
                <div>
                  <h5 className="font-medium text-slate-900 dark:text-white mb-2">Lifestyle</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Smoking:</span> {selectedQuestionnaire.questionnaire.lifestyle.smoking || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Alcohol:</span> {selectedQuestionnaire.questionnaire.lifestyle.alcohol || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Exercise:</span> {selectedQuestionnaire.questionnaire.lifestyle.exercise || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Diet:</span> {selectedQuestionnaire.questionnaire.lifestyle.diet || 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* Current Health */}
              {selectedQuestionnaire.questionnaire.currentHealth && (
                <div>
                  <h5 className="font-medium text-slate-900 dark:text-white mb-2">Current Health</h5>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium">Feeling Well:</span> {selectedQuestionnaire.questionnaire.currentHealth.feelingWell ? 'Yes' : 'No'}
                    </div>
                    {selectedQuestionnaire.questionnaire.currentHealth.recentIllness && (
                      <div>
                        <span className="font-medium">Recent Illness:</span> {selectedQuestionnaire.questionnaire.currentHealth.recentIllness}
                      </div>
                    )}
                    {selectedQuestionnaire.questionnaire.currentHealth.currentSymptoms && selectedQuestionnaire.questionnaire.currentHealth.currentSymptoms.length > 0 && (
                      <div>
                        <span className="font-medium">Current Symptoms:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedQuestionnaire.questionnaire.currentHealth.currentSymptoms.map((symptom, index) => (
                            <Badge key={index} variant="warning" size="sm">{symptom}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Previous Donations */}
              {selectedQuestionnaire.questionnaire.previousDonations && (
                <div>
                  <h5 className="font-medium text-slate-900 dark:text-white mb-2">Previous Donations</h5>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium">Has Donated Before:</span> {selectedQuestionnaire.questionnaire.previousDonations.hasDonateBefore ? 'Yes' : 'No'}
                    </div>
                    {selectedQuestionnaire.questionnaire.previousDonations.lastDonationDate && (
                      <div>
                        <span className="font-medium">Last Donation:</span> {new Date(selectedQuestionnaire.questionnaire.previousDonations.lastDonationDate).toLocaleDateString()}
                      </div>
                    )}
                    {selectedQuestionnaire.questionnaire.previousDonations.complications && (
                      <div>
                        <span className="font-medium">Complications:</span> {selectedQuestionnaire.questionnaire.previousDonations.complications}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowQuestionnaireModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                // Add questionnaire review functionality here
                alert('Questionnaire review functionality to be implemented');
              }}>
                Add Review Notes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DonorManagement;