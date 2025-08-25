import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  Eye, 
  CheckCircle, 
  X, 
  Phone,
  Mail,
  Droplet,
  FileText
} from 'lucide-react';

import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import logger from '../../utils/logger';
import apiClient, { adminApi } from '../../utils/api';

const AllDonorsView = () => {
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBloodType, setFilterBloodType] = useState('all');
  const [showDonorModal, setShowDonorModal] = useState(false);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null);

  useEffect(() => {
    logger.componentMount('AllDonorsView');
    fetchAllDonors();
    
    return () => {
      logger.componentUnmount('AllDonorsView');
    };
  }, []);

  useEffect(() => {
    // Filter donors based on search and filters
    let filtered = donors;

    if (searchQuery) {
      filtered = filtered.filter(donor => 
        donor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donor.phoneNumber?.includes(searchQuery)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(donor => {
        if (filterStatus === 'approved') return donor.isApproved === true || donor.status === 'approved';
        if (filterStatus === 'pending') return donor.isApproved !== true && donor.status !== 'approved';
        if (filterStatus === 'rejected') return donor.status === 'rejected';
        return true;
      });
    }

    if (filterBloodType !== 'all') {
      filtered = filtered.filter(donor => donor.bloodType === filterBloodType);
    }

    setFilteredDonors(filtered);
  }, [donors, searchQuery, filterStatus, filterBloodType]);

  const fetchAllDonors = async () => {
    try {
      setIsLoading(true);
      // Use the new admin-donors endpoint
      const response = await apiClient.get('/api/v1/admin/donors/all');
      const data = response;
      
      if (data.success) {
        const donors = data.data.donors || [];
        setDonors(donors);
        logger.success(`All donors loaded: ${donors.length} donors`, 'ALL_DONORS_VIEW');
      } else {
        logger.error('Failed to load donors', 'ALL_DONORS_VIEW', data);
      }
    } catch (error) {
      logger.error('Network error loading donors', 'ALL_DONORS_VIEW', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDonor = async (donor) => {
    logger.ui('CLICK', 'ViewDonor', { donorId: donor._id }, 'ALL_DONORS_VIEW');
    setSelectedDonor(donor);
    setShowDonorModal(true);
    
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
      logger.warn('Failed to load donor details/documents', 'ALL_DONORS_VIEW', e);
    }
  };

  const handleViewQuestionnaire = async (donor) => {
    logger.ui('CLICK', 'ViewQuestionnaire', { donorId: donor._id }, 'ALL_DONORS_VIEW');
    
    try {
      // Use the new admin-donors questionnaire endpoint
      const response = await fetch(`/api/v1/admin/donors/${donor._id}/questionnaire`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.data.questionnaire) {
        setSelectedQuestionnaire({
          donor,
          questionnaire: data.data.questionnaire,
          submittedAt: data.data.submittedAt
        });
        setShowQuestionnaireModal(true);
      } else {
        alert(data.error?.message || 'No questionnaire found for this donor');
      }
    } catch (error) {
      logger.error('Failed to load questionnaire', 'ALL_DONORS_VIEW', error);
      alert('Failed to load questionnaire: ' + error.message);
    }
  };

  const handleApprove = async (donorId) => {
    if (!confirm('Are you sure you want to approve this donor?')) return;
    
    setIsProcessing(true);
    try {
      // Use the new admin-donors endpoint
      const response = await fetch(`/api/v1/admin/donors/${donorId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchAllDonors(); // Refresh the list
        setShowDonorModal(false);
        logger.success('Donor approved successfully', 'ALL_DONORS_VIEW');
      } else {
        throw new Error(data.error?.message || 'Failed to approve donor');
      }
    } catch (error) {
      logger.error('Failed to approve donor', 'ALL_DONORS_VIEW', error);
      alert('Failed to approve donor: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (donorId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    setIsProcessing(true);
    try {
      // Use the new admin-donors endpoint
      const response = await fetch(`/api/v1/admin/donors/${donorId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchAllDonors(); // Refresh the list
        setShowDonorModal(false);
        logger.success('Donor rejected successfully', 'ALL_DONORS_VIEW');
      } else {
        throw new Error(data.error?.message || 'Failed to reject donor');
      }
    } catch (error) {
      logger.error('Failed to reject donor', 'ALL_DONORS_VIEW', error);
      alert('Failed to reject donor: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportData = async () => {
    try {
      const filters = {
        status: filterStatus !== 'all' ? filterStatus : undefined,
        bloodType: filterBloodType !== 'all' ? filterBloodType : undefined,
        search: searchQuery || undefined
      };
      
      logger.info('Exporting donor data with filters', 'ALL_DONORS_VIEW', filters);
      
      // Call the new export endpoint
      const response = await fetch('/api/v1/admin/export/donors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ filters })
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }
      
      // Get the CSV content
      const csvContent = await response.text();
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Donors_${filterStatus}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      logger.success('Donor data exported successfully', 'ALL_DONORS_VIEW');
    } catch (error) {
      logger.error('Failed to export donor data', 'ALL_DONORS_VIEW', error);
      alert('Failed to export data: ' + error.message);
    }
  };

  const getStatusBadge = (donor) => {
    if (donor.isApproved === true || donor.status === 'approved') {
      return <Badge variant="success">Approved</Badge>;
    } else if (donor.status === 'rejected') {
      return <Badge variant="danger">Rejected</Badge>;
    } else {
      return <Badge variant="warning">Pending</Badge>;
    }
  };

  const getQuestionnaireStatus = (donor) => {
    if (donor.questionnaire || donor.questionnaireCompleted) {
      return <Badge variant="success">Submitted</Badge>;
    } else {
      return <Badge variant="secondary">Not Submitted</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading donors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Donors</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage and view all registered donors ({filteredDonors.length} total)
          </p>
        </div>
        <Button onClick={handleExportData} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export to Excel</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Input
              icon={Search}
              placeholder="Search by name, email, or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'approved', label: 'Approved Only' },
                { value: 'pending', label: 'Pending Only' },
                { value: 'rejected', label: 'Rejected Only' }
              ]}
            />
          </div>
          <div>
            <Select
              value={filterBloodType}
              onChange={(e) => setFilterBloodType(e.target.value)}
              options={[
                { value: 'all', label: 'All Blood Types' },
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' }
              ]}
            />
          </div>
          <div>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterBloodType('all');
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Donors Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Donor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Blood Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Questionnaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {filteredDonors.map((donor) => (
                <tr key={donor._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {donor.name ? donor.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {donor.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          ID: {donor._id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 dark:text-white">
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{donor.phoneNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-32">{donor.email || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Droplet className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {donor.bloodType || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(donor)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getQuestionnaireStatus(donor)}
                      {(donor.questionnaire || donor.questionnaireCompleted) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewQuestionnaire(donor)}
                          className="text-xs"
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {donor.createdAt ? new Date(donor.createdAt).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDonor(donor)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {(donor.isApproved !== true && donor.status !== 'approved') && (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApprove(donor._id)}
                            disabled={isProcessing}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleReject(donor._id)}
                            disabled={isProcessing}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDonors.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">No donors found matching your criteria</p>
          </div>
        )}
      </Card>

      {/* Donor Details Modal */}
      <Modal
        isOpen={showDonorModal}
        onClose={() => setShowDonorModal(false)}
        title="Donor Details"
        size="lg"
      >
        {selectedDonor && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                <p className="text-slate-900 dark:text-white">{selectedDonor.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Blood Type</label>
                <p className="text-slate-900 dark:text-white">{selectedDonor.bloodType || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                <p className="text-slate-900 dark:text-white">{selectedDonor.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <p className="text-slate-900 dark:text-white">{selectedDonor.email || 'N/A'}</p>
              </div>
            </div>

            {/* Documents */}
            {selectedDonor.documents && selectedDonor.documents.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-3">Documents</h4>
                <div className="space-y-2">
                  {selectedDonor.documents.map((doc) => (
                    <div key={doc._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-slate-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{doc.type}</p>
                          <p className="text-xs text-slate-500">{doc.originalName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {doc.verified ? (
                          <Badge variant="success">Verified</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                        <Button size="sm" variant="outline" onClick={() => window.open(doc.url, '_blank')}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowDonorModal(false)}>
                Close
              </Button>
              {(selectedDonor.isApproved !== true && selectedDonor.status !== 'approved') && (
                <>
                  <Button
                    variant="success"
                    onClick={() => handleApprove(selectedDonor._id)}
                    disabled={isProcessing}
                  >
                    Approve Donor
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleReject(selectedDonor._id)}
                    disabled={isProcessing}
                  >
                    Reject Donor
                  </Button>
                </>
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
                    {selectedQuestionnaire.questionnaire.medicalConditions.map((condition, index) => (
                      <Badge key={index} variant="secondary">{condition}</Badge>
                    ))}
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
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowQuestionnaireModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AllDonorsView;