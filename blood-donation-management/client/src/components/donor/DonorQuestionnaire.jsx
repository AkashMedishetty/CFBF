import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  AlertTriangle, 
  CheckCircle, 
  Info
} from 'lucide-react';

import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import logger from '../../utils/logger';

const DonorQuestionnaire = ({ onComplete, initialData = {} }) => {
  const [formData, setFormData] = useState({
    medicalConditions: initialData.medicalConditions || [],
    medications: initialData.medications || [],
    allergies: initialData.allergies || [],
    lifestyle: {
      smoking: initialData.lifestyle?.smoking || '',
      alcohol: initialData.lifestyle?.alcohol || '',
      exercise: initialData.lifestyle?.exercise || '',
      diet: initialData.lifestyle?.diet || ''
    },
    recentTravel: initialData.recentTravel || [],
    vaccinations: initialData.vaccinations || [],
    previousDonations: {
      hasDonateBefore: initialData.previousDonations?.hasDonateBefore || false,
      lastDonationDate: initialData.previousDonations?.lastDonationDate || '',
      complications: initialData.previousDonations?.complications || ''
    },
    currentHealth: {
      feelingWell: initialData.currentHealth?.feelingWell || true,
      recentIllness: initialData.currentHealth?.recentIllness || '',
      currentSymptoms: initialData.currentHealth?.currentSymptoms || []
    }
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const medicalConditionOptions = [
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'hypertension', label: 'High Blood Pressure' },
    { value: 'heart_disease', label: 'Heart Disease' },
    { value: 'asthma', label: 'Asthma' },
    { value: 'epilepsy', label: 'Epilepsy' },
    { value: 'cancer', label: 'Cancer (current or past)' },
    { value: 'hepatitis', label: 'Hepatitis' },
    { value: 'hiv', label: 'HIV/AIDS' },
    { value: 'bleeding_disorder', label: 'Bleeding Disorder' },
    { value: 'autoimmune', label: 'Autoimmune Disease' },
    { value: 'other', label: 'Other' }
  ];

  const lifestyleOptions = {
    smoking: [
      { value: 'never', label: 'Never smoked' },
      { value: 'former', label: 'Former smoker' },
      { value: 'occasional', label: 'Occasional smoker' },
      { value: 'regular', label: 'Regular smoker' }
    ],
    alcohol: [
      { value: 'never', label: 'Never drink' },
      { value: 'occasional', label: 'Occasional (1-2 drinks/week)' },
      { value: 'moderate', label: 'Moderate (3-7 drinks/week)' },
      { value: 'heavy', label: 'Heavy (8+ drinks/week)' }
    ],
    exercise: [
      { value: 'sedentary', label: 'Sedentary lifestyle' },
      { value: 'light', label: 'Light exercise (1-2 times/week)' },
      { value: 'moderate', label: 'Moderate exercise (3-4 times/week)' },
      { value: 'active', label: 'Very active (5+ times/week)' }
    ],
    diet: [
      { value: 'omnivore', label: 'Omnivore' },
      { value: 'vegetarian', label: 'Vegetarian' },
      { value: 'vegan', label: 'Vegan' },
      { value: 'other', label: 'Other dietary restrictions' }
    ]
  };

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

  const addArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], item]
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };



  const validateForm = () => {
    const newErrors = {};

    // Validate required lifestyle questions
    if (!formData.lifestyle.smoking) {
      newErrors['lifestyle.smoking'] = 'Please select smoking status';
    }
    if (!formData.lifestyle.alcohol) {
      newErrors['lifestyle.alcohol'] = 'Please select alcohol consumption';
    }
    if (!formData.lifestyle.exercise) {
      newErrors['lifestyle.exercise'] = 'Please select exercise level';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    logger.ui('CLICK', 'SubmitQuestionnaire', null, 'DONOR_QUESTIONNAIRE');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate eligibility based on responses
      const eligibilityResult = calculateEligibility(formData);
      
      const questionnaireData = {
        ...formData,
        eligibility: eligibilityResult,
        completedAt: new Date().toISOString()
      };

      await onComplete(questionnaireData);
      logger.success('Donor questionnaire completed', 'DONOR_QUESTIONNAIRE');
    } catch (error) {
      logger.error('Failed to submit questionnaire', 'DONOR_QUESTIONNAIRE', error);
      setErrors({ submit: 'Failed to submit questionnaire. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEligibility = (data) => {
    const disqualifyingConditions = [
      'hiv', 'hepatitis', 'cancer', 'bleeding_disorder'
    ];
    
    const temporaryDeferrals = [
      'recent_illness', 'recent_travel', 'recent_vaccination'
    ];

    let eligible = true;
    let deferralReason = null;
    let deferralUntil = null;
    const warnings = [];

    // Check for disqualifying conditions
    const hasDisqualifyingCondition = data.medicalConditions.some(condition => 
      disqualifyingConditions.includes(condition)
    );

    if (hasDisqualifyingCondition) {
      eligible = false;
      deferralReason = 'Medical condition requires permanent deferral';
    }

    // Check recent donation
    if (data.previousDonations.lastDonationDate) {
      const lastDonation = new Date(data.previousDonations.lastDonationDate);
      const daysSinceLastDonation = (Date.now() - lastDonation.getTime()) / (24 * 60 * 60 * 1000);
      
      if (daysSinceLastDonation < 90) {
        eligible = false;
        deferralReason = 'Must wait 90 days between donations';
        deferralUntil = new Date(lastDonation.getTime() + (90 * 24 * 60 * 60 * 1000));
      }
    }

    // Check current health
    if (!data.currentHealth.feelingWell) {
      eligible = false;
      deferralReason = 'Must be feeling well to donate';
    }

    // Add warnings for lifestyle factors
    if (data.lifestyle.smoking === 'regular') {
      warnings.push('Regular smoking may affect donation eligibility');
    }
    if (data.lifestyle.alcohol === 'heavy') {
      warnings.push('Heavy alcohol consumption may affect donation eligibility');
    }

    return {
      eligible,
      deferralReason,
      deferralUntil,
      warnings,
      assessedAt: new Date().toISOString()
    };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4"
        >
          <Heart className="h-8 w-8 text-red-600 dark:text-red-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Donor Health Questionnaire
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Please answer these questions honestly to ensure safe blood donation
        </p>
      </div>

      {/* Medical Conditions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Medical History
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Do you have any of the following medical conditions?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {medicalConditionOptions.map(condition => (
                <label 
                  key={condition.value} 
                  className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.medicalConditions.includes(condition.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        addArrayItem('medicalConditions', condition.value);
                      } else {
                        const index = formData.medicalConditions.indexOf(condition.value);
                        removeArrayItem('medicalConditions', index);
                      }
                    }}
                    className="mt-0.5 w-5 h-5 rounded border-2 border-slate-400 dark:border-slate-500 text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-all duration-200 cursor-pointer"
                    style={{
                      accentColor: '#dc2626' // Modern way to style checkboxes
                    }}
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed select-none">
                    {condition.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>



      {/* Lifestyle Questions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Lifestyle Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Smoking Status"
            value={formData.lifestyle.smoking}
            onChange={(value) => handleInputChange('lifestyle.smoking', value)}
            options={lifestyleOptions.smoking}
            error={errors['lifestyle.smoking']}
            placeholder="Select smoking status"
            required
          />
          
          <Select
            label="Alcohol Consumption"
            value={formData.lifestyle.alcohol}
            onChange={(value) => handleInputChange('lifestyle.alcohol', value)}
            options={lifestyleOptions.alcohol}
            error={errors['lifestyle.alcohol']}
            placeholder="Select alcohol consumption"
            required
          />
          
          <Select
            label="Exercise Level"
            value={formData.lifestyle.exercise}
            onChange={(value) => handleInputChange('lifestyle.exercise', value)}
            options={lifestyleOptions.exercise}
            error={errors['lifestyle.exercise']}
            placeholder="Select exercise level"
            required
          />
          
          <Select
            label="Dietary Preferences"
            value={formData.lifestyle.diet}
            onChange={(value) => handleInputChange('lifestyle.diet', value)}
            options={lifestyleOptions.diet}
            placeholder="Select dietary preference"
          />
        </div>
      </Card>

      {/* Previous Donations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Previous Blood Donations
        </h3>
        
        <div className="space-y-4">
          <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={formData.previousDonations.hasDonateBefore}
              onChange={(e) => handleInputChange('previousDonations.hasDonateBefore', e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-2 border-slate-400 dark:border-slate-500 text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-all duration-200 cursor-pointer"
              style={{
                accentColor: '#dc2626'
              }}
            />
            <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed select-none">
              I have donated blood before
            </span>
          </label>
          
          {formData.previousDonations.hasDonateBefore && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <Input
                label="Last Donation Date"
                type="date"
                value={formData.previousDonations.lastDonationDate}
                onChange={(e) => handleInputChange('previousDonations.lastDonationDate', e.target.value)}
              />
              
              <Input
                label="Any Complications or Reactions?"
                value={formData.previousDonations.complications}
                onChange={(e) => handleInputChange('previousDonations.complications', e.target.value)}
                placeholder="Describe any issues during or after donation"
                multiline
                rows={3}
              />
            </motion.div>
          )}
        </div>
      </Card>

      {/* Current Health Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Current Health Status
        </h3>
        
        <div className="space-y-4">
          <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={formData.currentHealth.feelingWell}
              onChange={(e) => handleInputChange('currentHealth.feelingWell', e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-2 border-slate-400 dark:border-slate-500 text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-all duration-200 cursor-pointer"
              style={{
                accentColor: '#dc2626'
              }}
            />
            <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed select-none">
              I am feeling well today and have no symptoms of illness
            </span>
          </label>
          
          <Input
            label="Recent Illness or Symptoms (if any)"
            value={formData.currentHealth.recentIllness}
            onChange={(e) => handleInputChange('currentHealth.recentIllness', e.target.value)}
            placeholder="Describe any recent illness or current symptoms"
            multiline
            rows={3}
          />
        </div>
      </Card>

      {/* Error Display */}
      {errors.submit && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2"
        >
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-700 dark:text-red-300">{errors.submit}</span>
        </motion.div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          loading={isSubmitting}
          size="lg"
          className="flex items-center space-x-2 px-8"
        >
          <CheckCircle className="h-5 w-5" />
          <span>Complete Health Assessment</span>
        </Button>
      </div>
    </div>
  );
};

export default DonorQuestionnaire;