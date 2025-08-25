import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Calendar,
  Heart,
  Pill,
  Activity,
  MessageSquare
} from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import { adminApi } from '../../utils/api';
import logger from '../../utils/logger';

const QuestionnaireReview = ({ donorId, questionnaire, onReviewComplete }) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [eligibilityAssessment, setEligibilityAssessment] = useState(null);

  useEffect(() => {
    if (questionnaire) {
      assessEligibility(questionnaire);
    }
  }, [questionnaire]);

  const assessEligibility = (data) => {
    const disqualifyingConditions = [
      'hiv', 'hepatitis', 'cancer', 'bleeding_disorder'
    ];
    
    let eligible = true;
    let warnings = [];
    let concerns = [];
    let deferralReason = null;

    // Check for disqualifying conditions
    if (data.medicalConditions && data.medicalConditions.length > 0) {
      const hasDisqualifying = data.medicalConditions.some(condition => 
        disqualifyingConditions.includes(condition)
      );
      
      if (hasDisqualifying) {
        eligible = false;
        deferralReason = 'Medical condition requires permanent deferral';
        concerns.push('Disqualifying medical condition reported');
      } else {
        warnings.push(`${data.medicalConditions.length} medical condition(s) reported - requires review`);
      }
    }

    // Check current health
    if (data.currentHealth && !data.currentHealth.feelingWell) {
      eligible = false;
      deferralReason = 'Must be feeling well to donate';
      concerns.push('Donor not feeling well');
    }

    // Check recent illness
    if (data.currentHealth && data.currentHealth.recentIllness) {
      warnings.push('Recent illness reported');
    }

    // Check previous donation complications
    if (data.previousDonations && data.previousDonations.complications) {
      warnings.push('Previous donation complications reported');
    }

    // Check lifestyle factors
    if (data.lifestyle) {
      if (data.lifestyle.smoking === 'regular') {
        warnings.push('Regular smoker - may affect eligibility');
      }
      if (data.lifestyle.alcohol === 'heavy') {
        warnings.push('Heavy alcohol consumption - may affect eligibility');
      }
    }

    setEligibilityAssessment({
      eligible,
      deferralReason,
      warnings,
      concerns,
      riskLevel: concerns.length > 0 ? 'high' : warnings.length > 2 ? 'medium' : 'low'
    });
  };

  const handleReviewAction = async (action, decision) => {
    setIsProcessing(true);
    try {
      logger.info(`Reviewing questionnaire for donor ${donorId}: ${action}`, 'QUESTIONNAIRE_REVIEW');
      
      const reviewData = {
        decision,
        notes: reviewNotes,
        eligibilityAssessment,
        reviewedAt: new Date().toISOString()
      };

      const response = await adminApi.reviewQuestionnaire(donorId, reviewData);
      
      if (response?.success) {
        logger.success('Questionnaire review completed', 'QUESTIONNAIRE_REVIEW');
        onReviewComplete?.(decision, reviewData);
      } else {
        throw new Error(response?.message || 'Review failed');
      }
    } catch (error) {
      logger.error('Failed to complete questionnaire review', 'QUESTIONNAIRE_REVIEW', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!questionnaire) {
    return (
      <Card className="p-6">
        <div className="text-center text-slate-500">
          <FileText className="h-12 w-12 mx-auto mb-4" />
          <p>No questionnaire data available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Eligibility Assessment */}
      {eligibilityAssessment && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Eligibility Assessment
            </h3>
            <Badge 
              variant={
                eligibilityAssessment.riskLevel === 'high' ? 'red' : 
                eligibilityAssessment.riskLevel === 'medium' ? 'yellow' : 'green'
              }
            >
              {eligibilityAssessment.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${
                eligibilityAssessment.eligible ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="font-medium">
                {eligibilityAssessment.eligible ? 'Eligible' : 'Not Eligible'}
              </span>
            </div>
            
            {eligibilityAssessment.deferralReason && (
              <div className="text-sm text-red-600">
                Reason: {eligibilityAssessment.deferralReason}
              </div>
            )}
          </div>

          {/* Concerns */}
          {eligibilityAssessment.concerns.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Critical Concerns
              </h4>
              <ul className="space-y-1">
                {eligibilityAssessment.concerns.map((concern, index) => (
                  <li key={index} className="text-sm text-red-600 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {eligibilityAssessment.warnings.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-700 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Warnings
              </h4>
              <ul className="space-y-1">
                {eligibilityAssessment.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-600 flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Medical History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Heart className="h-5 w-5 mr-2 text-red-500" />
          Medical History
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Medical Conditions</h4>
            {questionnaire.medicalConditions && questionnaire.medicalConditions.length > 0 ? (
              <div className="space-y-1">
                {questionnaire.medicalConditions.map((condition, index) => (
                  <Badge key={index} variant="red" size="sm">
                    {condition.replace('_', ' ').toUpperCase()}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">None reported</p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Current Health Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Feeling well today:</span>
                <Badge variant={questionnaire.currentHealth?.feelingWell ? 'green' : 'red'}>
                  {questionnaire.currentHealth?.feelingWell ? 'Yes' : 'No'}
                </Badge>
              </div>
              
              {questionnaire.currentHealth?.recentIllness && (
                <div>
                  <span className="text-sm text-slate-600">Recent illness:</span>
                  <p className="text-sm text-slate-900 mt-1">
                    {questionnaire.currentHealth.recentIllness}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Lifestyle Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-blue-500" />
          Lifestyle Information
        </h3>
        
        {questionnaire.lifestyle && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Smoking:</span>
                <Badge variant={questionnaire.lifestyle.smoking === 'never' ? 'green' : 'yellow'}>
                  {questionnaire.lifestyle.smoking || 'Not specified'}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Alcohol:</span>
                <Badge variant={questionnaire.lifestyle.alcohol === 'never' ? 'green' : 'yellow'}>
                  {questionnaire.lifestyle.alcohol || 'Not specified'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Exercise:</span>
                <Badge variant="blue">
                  {questionnaire.lifestyle.exercise || 'Not specified'}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Diet:</span>
                <Badge variant="blue">
                  {questionnaire.lifestyle.diet || 'Not specified'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Previous Donations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-green-500" />
          Previous Donations
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Has donated before:</span>
            <Badge variant={questionnaire.previousDonations?.hasDonateBefore ? 'green' : 'gray'}>
              {questionnaire.previousDonations?.hasDonateBefore ? 'Yes' : 'No'}
            </Badge>
          </div>
          
          {questionnaire.previousDonations?.hasDonateBefore && (
            <>
              {questionnaire.previousDonations.lastDonationDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Last donation:</span>
                  <span className="text-sm text-slate-900">
                    {new Date(questionnaire.previousDonations.lastDonationDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {questionnaire.previousDonations.complications && (
                <div>
                  <span className="text-sm text-slate-600">Complications:</span>
                  <p className="text-sm text-slate-900 mt-1">
                    {questionnaire.previousDonations.complications}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Review Notes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
          Review Notes
        </h3>
        
        <Input
          label="Admin Notes"
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          placeholder="Add any additional notes about this questionnaire review..."
          multiline
          rows={4}
        />
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => handleReviewAction('reject', 'rejected')}
          disabled={isProcessing}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Reject Application
        </Button>
        
        <Button
          onClick={() => handleReviewAction('approve', 'approved')}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Approve Application
        </Button>
      </div>
    </div>
  );
};

export default QuestionnaireReview;