import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  MapPin, 
  Droplet,
  Star,
  Heart,
  CheckCircle,
  X
} from 'lucide-react';

import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import logger from '../../utils/logger';

const PostDonationForm = ({ onSubmit, onCancel, className = '' }) => {
  const [formData, setFormData] = useState({
    donationDate: '',
    donationTime: '',
    location: {
      name: '',
      address: '',
      coordinates: null
    },
    bloodType: '',
    unitsContributed: 1,
    donationType: 'whole_blood',
    photos: [],
    experience: {
      rating: 5,
      feedback: '',
      staffRating: 5,
      facilityRating: 5,
      overallExperience: ''
    },
    healthStatus: {
      predonationFeeling: 'excellent',
      postDonationFeeling: 'good',
      anyComplications: false,
      complications: '',
      followUpNeeded: false
    },
    additionalNotes: '',
    consentForStory: true,
    shareOnSocial: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

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

  const donationTypes = [
    { value: 'whole_blood', label: 'Whole Blood' },
    { value: 'platelets', label: 'Platelets' },
    { value: 'plasma', label: 'Plasma' },
    { value: 'red_cells', label: 'Red Blood Cells' }
  ];

  const feelingOptions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => {
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

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);

    try {
      const uploadPromises = files.map(async (file) => {
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error('Only image files are allowed');
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          throw new Error('File size must be less than 5MB');
        }

        // Create preview
        const preview = URL.createObjectURL(file);
        
        // In real app, upload to server
        // For now, simulate upload
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          id: Date.now() + Math.random(),
          file,
          preview,
          name: file.name,
          size: file.size,
          uploaded: true
        };
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...uploadedPhotos]
      }));

      logger.success(`Uploaded ${uploadedPhotos.length} photos`, 'POST_DONATION_FORM');
    } catch (error) {
      logger.error('Error uploading photos', 'POST_DONATION_FORM', error);
      setErrors(prev => ({
        ...prev,
        photos: error.message
      }));
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePhoto = (photoId) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo.id !== photoId)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.donationDate) {
      newErrors.donationDate = 'Donation date is required';
    }

    if (!formData.donationTime) {
      newErrors.donationTime = 'Donation time is required';
    }

    if (!formData.location.name) {
      newErrors['location.name'] = 'Location name is required';
    }

    if (!formData.bloodType) {
      newErrors.bloodType = 'Blood type is required';
    }

    if (!formData.unitsContributed || formData.unitsContributed < 1) {
      newErrors.unitsContributed = 'Units contributed must be at least 1';
    }

    if (!formData.experience.feedback.trim()) {
      newErrors['experience.feedback'] = 'Please share your experience';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare submission data
      const submissionData = {
        ...formData,
        submittedAt: new Date().toISOString(),
        photos: formData.photos.map(photo => ({
          name: photo.name,
          size: photo.size,
          // In real app, this would be the uploaded file URL
          url: photo.preview
        }))
      };

      await onSubmit(submissionData);
      logger.success('Post-donation form submitted', 'POST_DONATION_FORM');
    } catch (error) {
      logger.error('Error submitting form', 'POST_DONATION_FORM', error);
      setErrors({ submit: 'Failed to submit form. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (value, onChange, label) => {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className={`p-1 rounded transition-colors ${
                star <= value
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'text-slate-300 hover:text-slate-400 dark:text-slate-600 dark:hover:text-slate-500'
              }`}
            >
              <Star className="h-6 w-6 fill-current" />
            </button>
          ))}
          <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
            {value}/5
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4"
          >
            <Heart className="h-8 w-8 text-red-600 dark:text-red-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Thank You for Donating! 🎉
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Help us track your donation and share your experience
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Donation Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Donation Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Donation Date"
                type="date"
                value={formData.donationDate}
                onChange={(e) => handleInputChange('donationDate', e.target.value)}
                error={errors.donationDate}
                required
              />
              
              <Input
                label="Donation Time"
                type="time"
                value={formData.donationTime}
                onChange={(e) => handleInputChange('donationTime', e.target.value)}
                error={errors.donationTime}
                required
              />
              
              <Input
                label="Location Name"
                icon={MapPin}
                value={formData.location.name}
                onChange={(e) => handleInputChange('location.name', e.target.value)}
                error={errors['location.name']}
                placeholder="Hospital or blood bank name"
                required
              />
              
              <Input
                label="Location Address"
                value={formData.location.address}
                onChange={(e) => handleInputChange('location.address', e.target.value)}
                placeholder="Full address"
              />
              
              <Select
                label="Blood Type"
                icon={Droplet}
                value={formData.bloodType}
                onChange={(value) => handleInputChange('bloodType', value)}
                options={bloodTypes}
                error={errors.bloodType}
                required
              />
              
              <Input
                label="Units Contributed"
                type="number"
                value={formData.unitsContributed}
                onChange={(e) => handleInputChange('unitsContributed', parseInt(e.target.value))}
                error={errors.unitsContributed}
                min="1"
                max="5"
                required
              />
              
              <Select
                label="Donation Type"
                value={formData.donationType}
                onChange={(value) => handleInputChange('donationType', value)}
                options={donationTypes}
                className="md:col-span-2"
              />
            </div>
          </Card>

          {/* Photos */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Photos (Optional)
            </h3>
            
            <div className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="photo-upload"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Camera className="h-8 w-8 text-slate-400" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Click to upload photos of your donation experience
                  </p>
                  <p className="text-xs text-slate-500">
                    Max 5MB per photo, up to 5 photos
                  </p>
                </label>
              </div>

              {/* Photo Preview */}
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.preview}
                        alt={photo.name}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.photos && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.photos}
                </p>
              )}
            </div>
          </Card>

          {/* Experience Rating */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Rate Your Experience
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderStarRating(
                formData.experience.rating,
                (value) => handleInputChange('experience.rating', value),
                'Overall Experience'
              )}
              
              {renderStarRating(
                formData.experience.staffRating,
                (value) => handleInputChange('experience.staffRating', value),
                'Staff Friendliness'
              )}
              
              {renderStarRating(
                formData.experience.facilityRating,
                (value) => handleInputChange('experience.facilityRating', value),
                'Facility Quality'
              )}
            </div>
            
            <div className="mt-6">
              <Input
                label="Share Your Experience"
                value={formData.experience.feedback}
                onChange={(e) => handleInputChange('experience.feedback', e.target.value)}
                error={errors['experience.feedback']}
                placeholder="Tell us about your donation experience..."
                multiline
                rows={4}
                required
              />
            </div>
          </Card>

          {/* Health Status */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Health Status
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="How did you feel before donation?"
                value={formData.healthStatus.predonationFeeling}
                onChange={(value) => handleInputChange('healthStatus.predonationFeeling', value)}
                options={feelingOptions}
              />
              
              <Select
                label="How do you feel after donation?"
                value={formData.healthStatus.postDonationFeeling}
                onChange={(value) => handleInputChange('healthStatus.postDonationFeeling', value)}
                options={feelingOptions}
              />
            </div>
            
            <div className="mt-6 space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.healthStatus.anyComplications}
                  onChange={(e) => handleInputChange('healthStatus.anyComplications', e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Did you experience any complications during or after donation?
                </span>
              </label>
              
              {formData.healthStatus.anyComplications && (
                <Input
                  label="Please describe the complications"
                  value={formData.healthStatus.complications}
                  onChange={(e) => handleInputChange('healthStatus.complications', e.target.value)}
                  placeholder="Describe any complications you experienced..."
                  multiline
                  rows={3}
                />
              )}
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.healthStatus.followUpNeeded}
                  onChange={(e) => handleInputChange('healthStatus.followUpNeeded', e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Do you need medical follow-up?
                </span>
              </label>
            </div>
          </Card>

          {/* Additional Options */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Additional Options
            </h3>
            
            <div className="space-y-4">
              <Input
                label="Additional Notes"
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                placeholder="Any additional comments or feedback..."
                multiline
                rows={3}
              />
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.consentForStory}
                  onChange={(e) => handleInputChange('consentForStory', e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  I consent to my donation story being shared (anonymously) to inspire others
                </span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.shareOnSocial}
                  onChange={(e) => handleInputChange('shareOnSocial', e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Share my donation achievement on social media
                </span>
              </label>
            </div>
          </Card>

          {/* Error Display */}
          {errors.submit && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2"
            >
              <X className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">{errors.submit}</span>
            </motion.div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              loading={isSubmitting}
              className="flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Submit Donation Record</span>
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PostDonationForm;