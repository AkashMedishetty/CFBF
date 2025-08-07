import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Droplet, 
  Weight, 
  Users, 
  Shield,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Camera,
  Upload,
  Activity,
  Award,
  Heart,
  Clock
} from 'lucide-react';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Tabs from '../../components/ui/Tabs';
import logger from '../../utils/logger';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [errors, setErrors] = useState({});
  const [editData, setEditData] = useState({});

  useEffect(() => {
    logger.componentMount('ProfilePage');
    fetchUserProfile();
    
    return () => {
      logger.componentUnmount('ProfilePage');
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      // Get user ID from localStorage or auth context
      const userId = localStorage.getItem('userId') || 'current-user-id';
      
      const response = await fetch(`/api/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.data.user);
        setEditData(data.data.user);
        logger.success('User profile loaded', 'PROFILE_PAGE');
      } else {
        logger.error('Failed to load profile', 'PROFILE_PAGE');
      }
    } catch (error) {
      logger.error('Network error loading profile', 'PROFILE_PAGE', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    logger.ui('CLICK', 'EditProfile', null, 'PROFILE_PAGE');
    setIsEditing(true);
    setEditData({ ...user });
  };

  const handleCancel = () => {
    logger.ui('CLICK', 'CancelEdit', null, 'PROFILE_PAGE');
    setIsEditing(false);
    setEditData({ ...user });
    setErrors({});
  };

  const handleSave = async () => {
    logger.ui('CLICK', 'SaveProfile', null, 'PROFILE_PAGE');
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      const response = await fetch(`/api/v1/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.data.user);
        setIsEditing(false);
        setErrors({});
        logger.success('Profile updated successfully', 'PROFILE_PAGE');
      } else {
        setErrors({ submit: data.message || 'Failed to update profile' });
        logger.error('Profile update failed', 'PROFILE_PAGE');
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
      logger.error('Network error updating profile', 'PROFILE_PAGE', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!editData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!editData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (editData.weight && (editData.weight < 45 || editData.weight > 200)) {
      newErrors.weight = 'Weight must be between 45-200 kg';
    }
    
    if (editData.height && (editData.height < 120 || editData.height > 250)) {
      newErrors.height = 'Height must be between 120-250 cm';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getVerificationStatus = () => {
    if (!user?.verification) return { status: 'pending', color: 'yellow', text: 'Pending' };
    
    const { phoneVerified, emailVerified, documentsVerified, medicallyCleared } = user.verification;
    
    if (phoneVerified && emailVerified && documentsVerified && medicallyCleared) {
      return { status: 'verified', color: 'green', text: 'Fully Verified' };
    } else if (phoneVerified) {
      return { status: 'partial', color: 'blue', text: 'Partially Verified' };
    } else {
      return { status: 'pending', color: 'yellow', text: 'Verification Pending' };
    }
  };

  const getEligibilityStatus = () => {
    if (!user) return { eligible: false, reason: 'Loading...' };
    
    if (user.status !== 'active') {
      return { eligible: false, reason: 'Account not active' };
    }
    
    if (!user.verification?.phoneVerified || !user.verification?.documentsVerified) {
      return { eligible: false, reason: 'Verification incomplete' };
    }
    
    if (user.medicalInfo?.lastDonationDate) {
      const daysSinceLastDonation = (Date.now() - new Date(user.medicalInfo.lastDonationDate).getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceLastDonation < 90) {
        const nextEligibleDate = new Date(new Date(user.medicalInfo.lastDonationDate).getTime() + (90 * 24 * 60 * 60 * 1000));
        return { 
          eligible: false, 
          reason: `Next donation eligible on ${nextEligibleDate.toLocaleDateString()}` 
        };
      }
    }
    
    return { eligible: true, reason: 'Eligible to donate' };
  };

  const bloodTypes = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Profile Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Unable to load your profile. Please try again.
          </p>
        </Card>
      </div>
    );
  }

  const verificationStatus = getVerificationStatus();
  const eligibilityStatus = getEligibilityStatus();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'medical', label: 'Medical Info', icon: Heart },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'achievements', label: 'Achievements', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                My Profile
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage your donor profile and preferences
              </p>
            </div>
            
            {!isEditing && (
              <Button
                onClick={handleEdit}
                className="flex items-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Profile</span>
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Summary Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar
                  src={user.profilePicture}
                  alt={user.name}
                  size="xl"
                  fallback={user.name?.charAt(0)}
                />
                {isEditing && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Camera className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
              
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                {user.name}
              </h2>
              
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {user.bloodType} Donor
              </p>
              
              <div className="space-y-3">
                <Badge
                  variant={verificationStatus.color}
                  className="w-full justify-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {verificationStatus.text}
                </Badge>
                
                <Badge
                  variant={eligibilityStatus.eligible ? 'green' : 'red'}
                  className="w-full justify-center"
                >
                  <Droplet className="h-4 w-4 mr-2" />
                  {eligibilityStatus.eligible ? 'Eligible' : 'Not Eligible'}
                </Badge>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {user.stats?.totalDonations || 0}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Donations</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {user.stats?.totalUnitsContributed || 0}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Units</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <Card className="p-6">
              {/* Tabs */}
              <Tabs
                tabs={tabs}
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
                    {/* Personal Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Personal Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Full Name"
                          icon={User}
                          value={isEditing ? editData.name : user.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          error={errors.name}
                          disabled={!isEditing}
                          required
                        />
                        
                        <Input
                          label="Phone Number"
                          icon={Phone}
                          value={user.phoneNumber}
                          disabled
                          className="bg-slate-100 dark:bg-slate-800"
                        />
                        
                        <Input
                          label="Email Address"
                          icon={Mail}
                          type="email"
                          value={isEditing ? editData.email : user.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          error={errors.email}
                          disabled={!isEditing}
                          required
                        />
                        
                        <Input
                          label="Date of Birth"
                          icon={Calendar}
                          type="date"
                          value={user.dateOfBirth?.split('T')[0]}
                          disabled
                          className="bg-slate-100 dark:bg-slate-800"
                        />
                        
                        <Select
                          label="Gender"
                          icon={Users}
                          value={isEditing ? editData.gender : user.gender}
                          onChange={(value) => handleInputChange('gender', value)}
                          options={genderOptions}
                          disabled={!isEditing}
                        />
                        
                        <Select
                          label="Blood Type"
                          icon={Droplet}
                          value={user.bloodType}
                          options={bloodTypes}
                          disabled
                          className="bg-slate-100 dark:bg-slate-800"
                        />
                      </div>
                    </div>

                    {/* Physical Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Physical Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Weight (kg)"
                          icon={Weight}
                          type="number"
                          value={isEditing ? editData.weight : user.weight}
                          onChange={(e) => handleInputChange('weight', e.target.value)}
                          error={errors.weight}
                          disabled={!isEditing}
                          min="45"
                          max="200"
                        />
                        
                        <Input
                          label="Height (cm)"
                          type="number"
                          value={isEditing ? editData.height : user.height}
                          onChange={(e) => handleInputChange('height', e.target.value)}
                          error={errors.height}
                          disabled={!isEditing}
                          min="120"
                          max="250"
                        />
                      </div>
                    </div>

                    {/* Address Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Address Information
                      </h3>
                      
                      <div className="space-y-4">
                        <Input
                          label="Street Address"
                          icon={MapPin}
                          value={isEditing ? editData.address?.street : user.address?.street}
                          onChange={(e) => handleInputChange('address.street', e.target.value)}
                          disabled={!isEditing}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input
                            label="City"
                            value={isEditing ? editData.address?.city : user.address?.city}
                            onChange={(e) => handleInputChange('address.city', e.target.value)}
                            disabled={!isEditing}
                          />
                          
                          <Input
                            label="State"
                            value={isEditing ? editData.address?.state : user.address?.state}
                            onChange={(e) => handleInputChange('address.state', e.target.value)}
                            disabled={!isEditing}
                          />
                          
                          <Input
                            label="Pincode"
                            value={isEditing ? editData.address?.pincode : user.address?.pincode}
                            onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'medical' && (
                  <motion.div
                    key="medical"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                          Donation Eligibility
                        </h4>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            eligibilityStatus.eligible ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {eligibilityStatus.reason}
                          </span>
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                          Last Donation
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-slate-500" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {user.medicalInfo?.lastDonationDate 
                              ? new Date(user.medicalInfo.lastDonationDate).toLocaleDateString()
                              : 'Never donated'
                            }
                          </span>
                        </div>
                      </Card>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'activity' && (
                  <motion.div
                    key="activity"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                          {user.stats?.responseRate || 0}%
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Response Rate
                        </div>
                      </Card>
                      
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                          {user.stats?.averageResponseTime || 0}m
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Avg Response Time
                        </div>
                      </Card>
                      
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {user.stats?.lastActiveAt 
                            ? new Date(user.stats.lastActiveAt).toLocaleDateString()
                            : 'Never'
                          }
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Last Active
                        </div>
                      </Card>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'achievements' && (
                  <motion.div
                    key="achievements"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center py-12"
                  >
                    <Award className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      No Achievements Yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Start donating blood to earn achievements and badges!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end space-x-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700"
                >
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </Button>
                  
                  <Button
                    onClick={handleSave}
                    loading={isSaving}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </Button>
                </motion.div>
              )}

              {/* Error Display */}
              {errors.submit && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-700 dark:text-red-300">{errors.submit}</span>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;