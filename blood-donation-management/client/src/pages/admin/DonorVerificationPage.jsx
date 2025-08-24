import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  CheckCircle, 
  X, 
  Eye, 
  FileText, 
  Heart,
  Clock,
  Search,
  Filter,
  Download,
  User,
  Phone,
  Mail,
  MapPin,
  Droplet
} from 'lucide-react';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Avatar from '../../components/ui/Avatar';
import Tabs from '../../components/ui/Tabs';
import logger from '../../utils/logger';
import { adminApi } from '../../utils/api';

const DonorVerificationPage = () => {
  const [pendingDonors, setPendingDonors] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    logger.componentMount('DonorVerificationPage');
    fetchPendingDonors();
    
    return () => {
      logger.componentUnmount('DonorVerificationPage');
    };
  }, []);

  const fetchPendingDonors = async () => {
    try {
      const response = await fetch('/api/v1/admin/donors/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setPendingDonors(data.data.donors);
        logger.success('Pending donors loaded', 'DONOR_VERIFICATION');
      } else {
        logger.error('Failed to load pending donors', 'DONOR_VERIFICATION');
      }
    } catch (error) {
      logger.error('Network error loading pending donors', 'DONOR_VERIFICATION', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDonorSelect = async (donor) => {
    logger.ui('CLICK', 'SelectDonor', { donorId: donor._id }, 'DONOR_VERIFICATION');
    setSelectedDonor(donor);
    try {
      const [detailsRes, docsRes] = await Promise.all([
        adminApi.getDonorDetails(donor._id),
        adminApi.getUserDocuments(donor._id)
      ]);
      const details = detailsRes?.data?.donor || donor;
      const documents = (docsRes?.data || []).map((d) => ({
        _id: d._id,
        type: d.type,
        originalName: d.originalName,
        url: d.url,
        verified: d.verified
      }));
      setSelectedDonor({ ...details, documents });
    } catch (e) {
      logger.warn('Failed to load donor details/documents', 'DONOR_VERIFICATION', e);
    }
  };

  const handleApprove = async (donorId, notes = '') => {
    logger.ui('CLICK', 'ApproveDonor', { donorId }, 'DONOR_VERIFICATION');
    
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/v1/admin/donors/${donorId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes })
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove from pending list
        setPendingDonors(prev => prev.filter(donor => donor._id !== donorId));
        setSelectedDonor(null);
        logger.success('Donor approved successfully', 'DONOR_VERIFICATION');
      } else {
        logger.error('Failed to approve donor', 'DONOR_VERIFICATION');
      }
    } catch (error) {
      logger.error('Network error approving donor', 'DONOR_VERIFICATION', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (donorId, reason) => {
    logger.ui('CLICK', 'RejectDonor', { donorId }, 'DONOR_VERIFICATION');
    
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/v1/admin/donors/${donorId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove from pending list
        setPendingDonors(prev => prev.filter(donor => donor._id !== donorId));
        setSelectedDonor(null);
        logger.success('Donor rejected', 'DONOR_VERIFICATION');
      } else {
        logger.error('Failed to reject donor', 'DONOR_VERIFICATION');
      }
    } catch (error) {
      logger.error('Network error rejecting donor', 'DONOR_VERIFICATION', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getVerificationProgress = (donor) => {
    const steps = [
      { key: 'phoneVerified', label: 'Phone' },
      { key: 'documentsUploaded', label: 'Documents' },
      { key: 'questionnaireCompleted', label: 'Health Form' }
    ];

    const completed = steps.filter(step => {
      if (step.key === 'phoneVerified') return donor.verification?.phoneVerified;
      if (step.key === 'documentsUploaded') return (donor.verification?.documentsVerified) || (donor.documents?.length >= 2);
      if (step.key === 'questionnaireCompleted') return donor.questionnaire?.completedAt;
      return false;
    });

    return {
      completed: completed.length,
      total: steps.length,
      percentage: Math.round((completed.length / steps.length) * 100)
    };
  };

  const filteredDonors = pendingDonors.filter(donor => {
    const matchesSearch = !searchQuery || 
      donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor.phoneNumber.includes(searchQuery) ||
      donor.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'complete' && getVerificationProgress(donor).percentage === 100) ||
      (filterStatus === 'incomplete' && getVerificationProgress(donor).percentage < 100);

    return matchesSearch && matchesFilter;
  });

  const tabs = [
    { id: 'pending', label: 'Pending Verification', icon: Clock },
    { id: 'approved', label: 'Recently Approved', icon: CheckCircle },
    { id: 'rejected', label: 'Rejected', icon: X }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'complete', label: 'Complete Profile' },
    { value: 'incomplete', label: 'Incomplete Profile' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Donor Verification
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Review and approve pending donor registrations
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="blue" className="text-lg px-4 py-2">
                {pendingDonors.length} Pending
              </Badge>
              
              <Button
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Card className="mb-6">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            className="p-6"
          />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Donor List */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Pending Donors
                </h2>
                <Badge variant="blue">
                  {filteredDonors.length}
                </Badge>
              </div>

              {/* Search and Filter */}
              <div className="space-y-4 mb-6">
                <Input
                  icon={Search}
                  placeholder="Search donors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                <Select
                  icon={Filter}
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={statusOptions}
                  placeholder="Filter by status"
                />
              </div>

              {/* Donor List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {filteredDonors.map((donor) => {
                    const progress = getVerificationProgress(donor);
                    const isSelected = selectedDonor?._id === donor._id;
                    
                    return (
                      <motion.div
                        key={donor._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                        onClick={() => handleDonorSelect(donor)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar
                            src={donor.profilePicture}
                            alt={donor.name}
                            size="sm"
                            fallback={donor.name?.charAt(0)}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white truncate">
                              {donor.name}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                              {donor.phoneNumber}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={donor.bloodType === 'O-' ? 'red' : 'blue'} size="sm">
                                {donor.bloodType}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {progress.percentage}% complete
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                            <div
                              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredDonors.length === 0 && (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p>No donors found</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Donor Details */}
          <div className="lg:col-span-2">
            {selectedDonor ? (
              <DonorDetailsPanel
                donor={selectedDonor}
                onApprove={handleApprove}
                onReject={handleReject}
                isProcessing={isProcessing}
                onUpdateDonor={(updated) => setSelectedDonor(updated)}
              />
            ) : (
              <Card className="p-12 text-center">
                <Eye className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Select a Donor
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Choose a donor from the list to review their details and documents
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Donor Details Panel Component
const DonorDetailsPanel = ({ donor, onApprove, onReject, isProcessing, onUpdateDonor }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const detailTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'health', label: 'Health Info', icon: Heart }
  ];

  const handleApproveClick = () => {
    setShowApprovalModal(true);
  };

  const handleRejectClick = () => {
    setShowRejectionModal(true);
  };

  const confirmApproval = () => {
    onApprove(donor._id, approvalNotes);
    setShowApprovalModal(false);
    setApprovalNotes('');
  };

  const confirmRejection = () => {
    if (!rejectionReason.trim()) return;
    onReject(donor._id, rejectionReason);
    setShowRejectionModal(false);
    setRejectionReason('');
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Avatar
            src={donor.profilePicture}
            alt={donor.name}
            size="lg"
            fallback={donor.name?.charAt(0)}
          />
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {donor.name}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Registered {new Date(donor.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRejectClick}
            disabled={isProcessing}
            className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          
          <Button
            onClick={handleApproveClick}
            disabled={isProcessing}
            loading={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={detailTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Full Name</p>
                    <p className="font-medium text-slate-900 dark:text-white">{donor.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Phone Number</p>
                    <p className="font-medium text-slate-900 dark:text-white">{donor.phoneNumber}</p>
                    {donor.verification?.phoneVerified && (
                      <Badge variant="green" size="sm" className="mt-1">Verified</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
                    <p className="font-medium text-slate-900 dark:text-white">{donor.email || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Droplet className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Blood Type</p>
                    <p className="font-medium text-slate-900 dark:text-white">{donor.bloodType}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Address</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {donor.address ? `${donor.address.city}, ${donor.address.state}` : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'documents' && (
          <motion.div
            key="documents"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {donor.documents?.length > 0 ? (
              donor.documents.map((doc, index) => (
                <div key={doc._id || index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{doc.type}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{doc.originalName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      {doc.verified ? (
                        <Badge variant="green">Verified</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                          await adminApi.verifyDocument(doc._id, { verified: true });
                              // Refresh selected donor documents
                              const docsRes = await adminApi.getUserDocuments(donor._id);
                              const documents = (docsRes?.data || []).map((d) => ({
                                _id: d._id, type: d.type, originalName: d.originalName, url: d.url, verified: d.verified
                              }));
                              if (onUpdateDonor) {
                                onUpdateDonor({ ...donor, documents });
                              }
                              logger.success('Document verified', 'DONOR_VERIFICATION');
                            } catch (e) {
                              logger.error('Failed to verify document', 'DONOR_VERIFICATION', e);
                            }
                          }}
                        >
                          Verify
                        </Button>
                      )}
                      {!doc.verified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const reason = window.prompt('Enter rejection reason');
                            if (!reason) return;
                            try {
                              await adminApi.verifyDocument(doc._id, { verified: false, rejectionReason: reason });
                              const docsRes = await adminApi.getUserDocuments(donor._id);
                              const documents = (docsRes?.data || []).map((d) => ({
                                _id: d._id, type: d.type, originalName: d.originalName, url: d.url, verified: d.verified
                              }));
                              if (onUpdateDonor) {
                                onUpdateDonor({ ...donor, documents });
                              }
                              logger.info('Document rejected', 'DONOR_VERIFICATION');
                            } catch (e) {
                              logger.error('Failed to reject document', 'DONOR_VERIFICATION', e);
                            }
                          }}
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>No documents uploaded</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'health' && (
          <motion.div
            key="health"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {donor.questionnaire ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">Medical Conditions</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    {donor.questionnaire.medicalConditions?.length > 0 
                      ? donor.questionnaire.medicalConditions.join(', ')
                      : 'None reported'
                    }
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">Current Medications</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    {donor.questionnaire.medications?.length > 0 
                      ? donor.questionnaire.medications.map(med => med.name).join(', ')
                      : 'None reported'
                    }
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">Eligibility Status</h4>
                  <Badge variant={donor.questionnaire.eligibility?.eligible ? 'green' : 'red'}>
                    {donor.questionnaire.eligibility?.eligible ? 'Eligible' : 'Not Eligible'}
                  </Badge>
                  {donor.questionnaire.eligibility?.deferralReason && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {donor.questionnaire.eligibility.deferralReason}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Heart className="h-8 w-8 mx-auto mb-2" />
                <p>Health questionnaire not completed</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Approve Donor
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Are you sure you want to approve {donor.name} as a verified donor?
            </p>
            <Input
              label="Approval Notes (Optional)"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Add any notes about the approval..."
              multiline
              rows={3}
            />
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowApprovalModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmApproval}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve Donor
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Reject Donor
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Please provide a reason for rejecting {donor.name}'s application.
            </p>
            <Input
              label="Rejection Reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why the application is being rejected..."
              multiline
              rows={3}
              required
            />
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowRejectionModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRejection}
                disabled={!rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Reject Application
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </Card>
  );
};

export default DonorVerificationPage;