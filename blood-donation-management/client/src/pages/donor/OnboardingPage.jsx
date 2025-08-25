import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Heart, 
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  User
} from 'lucide-react';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DocumentUpload from '../../components/donor/DocumentUpload';
import DonorQuestionnaire from '../../components/donor/DonorQuestionnaire';
import logger from '../../utils/logger';
import { authApi } from '../../utils/api';

const OnboardingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(() => {
    const u = location.state?.user || null;
    if (u && !u._id && u.id) {
      return { ...u, _id: u.id };
    }
    return u;
  });
  const [completedSteps, setCompletedSteps] = useState({
    documents: false,
    questionnaire: false
  });
  const checkCompletionStatus = useCallback(async () => {
    const uid = user?._id || user?.id;
    if (!uid) return;

    try {
      const response = await fetch(`/api/v1/users/${uid}/onboarding-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setCompletedSteps(data.data.completedSteps);
        
        // If both steps are complete, show completion screen
        if (data.data.completedSteps.documents && data.data.completedSteps.questionnaire) {
          setCurrentStep(3);
        }
      }
    } catch (error) {
      logger.error('Failed to check onboarding status', 'ONBOARDING_PAGE', error);
    }
  }, [user]);

  useEffect(() => {
    logger.componentMount('OnboardingPage');
    
    logger.debug('🔍 OnboardingPage user data', 'ONBOARDING_PAGE', {
      hasUser: !!user,
      userId: user?.id,
      userIdUnderscore: user?._id,
      userKeys: user ? Object.keys(user) : 'null',
      locationState: location.state,
      hasLocationUser: !!location.state?.user,
      userStatus: user?.status,
      isApproved: user?.isApproved,
      verificationStatus: user?.verification?.isVerified
    });
    
    // Ensure we have a user with an ID; if not, fetch current user
    const ensureUser = async () => {
      if (user && (user._id || user.id)) {
        // Check if user is already approved - redirect to dashboard
        const isApproved = user?.status === 'active' || 
                          user?.verification?.medicallyCleared === true ||
                          (user?.verification?.verifiedAt && user?.verification?.verifiedBy);
        
        if (isApproved) {
          logger.info('✅ User is already approved, redirecting to dashboard', 'ONBOARDING_PAGE', {
            userStatus: user?.status,
            medicallyCleared: user?.verification?.medicallyCleared,
            verifiedAt: user?.verification?.verifiedAt,
            verifiedBy: user?.verification?.verifiedBy
          });
          navigate('/dashboard');
          return false;
        }
        return true;
      }
      
      try {
        const resp = await authApi.getCurrentUser();
        if (resp.success && resp.data?.user) {
          const u = resp.data.user;
          const userData = u._id ? u : { ...u, _id: u.id };
          setUser(userData);
          
          // Check if newly fetched user is approved
          const isApproved = userData?.status === 'active' || 
                            userData?.verification?.medicallyCleared === true ||
                            (userData?.verification?.verifiedAt && userData?.verification?.verifiedBy);
          
          if (isApproved) {
            logger.info('✅ Fetched user is approved, redirecting to dashboard', 'ONBOARDING_PAGE', {
              userStatus: userData?.status,
              medicallyCleared: userData?.verification?.medicallyCleared,
              verifiedAt: userData?.verification?.verifiedAt,
              verifiedBy: userData?.verification?.verifiedBy
            });
            navigate('/dashboard');
            return false;
          }
          
          return true;
        }
      } catch (e) {
        logger.warn('Failed to fetch current user for onboarding', 'ONBOARDING_PAGE', e);
      }
      logger.warn('❌ No user data found, redirecting to register', 'ONBOARDING_PAGE');
      navigate('/register');
      return false;
    };

    (async () => {
      const ok = await ensureUser();
      if (!ok) return;
      // Set initial step based on state
      if (location.state?.step === 'documents') {
        setCurrentStep(1);
      } else if (location.state?.step === 'questionnaire') {
        setCurrentStep(2);
      }
      // Check existing completion status
      checkCompletionStatus();
    })();
    
    return () => {
      logger.componentUnmount('OnboardingPage');
    };
  }, [user, navigate, location.state, checkCompletionStatus]);

  const steps = [
    {
      id: 1,
      title: 'Document Upload',
      description: 'Upload required documents for verification',
      icon: Upload,
      component: 'documents'
    },
    {
      id: 2,
      title: 'Health Questionnaire',
      description: 'Complete your medical assessment',
      icon: Heart,
      component: 'questionnaire'
    },
    {
      id: 3,
      title: 'Pending Approval',
      description: 'Wait for admin verification',
      icon: Clock,
      component: 'completion'
    }
  ];

  const handleDocumentComplete = async (documents) => {
    logger.ui('COMPLETE', 'DocumentUpload', { count: documents.length }, 'ONBOARDING_PAGE');
    
    logger.debug('🎉 Document upload completed', 'ONBOARDING_PAGE', {
      documentsCount: documents.length,
      documentTypes: documents.map(doc => doc.type),
      hasUser: !!user,
      userId: user?.id
    });
    
    // Documents are already uploaded individually by DocumentUpload component
    // We just need to mark this step as complete and move to the next step
    setCompletedSteps(prev => ({ ...prev, documents: true }));
    setCurrentStep(2);
    
    logger.success('✅ Documents step completed, moving to next step', 'ONBOARDING_PAGE', {
      currentStep: 2,
      completedSteps: { ...completedSteps, documents: true }
    });
  };

  const handleQuestionnaireComplete = async (questionnaireData) => {
    logger.ui('COMPLETE', 'DonorQuestionnaire', null, 'ONBOARDING_PAGE');
    
    try {
      const uid = user?._id || user?.id;
      if (!uid) throw new Error('Missing user ID');
      const response = await fetch(`/api/v1/users/${uid}/questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(questionnaireData)
      });

      const data = await response.json();
      
      if (data.success) {
        setCompletedSteps(prev => ({ ...prev, questionnaire: true }));
        setCurrentStep(3);
        logger.success('Health questionnaire completed', 'ONBOARDING_PAGE');
      } else {
        throw new Error(data.message || 'Failed to save questionnaire');
      }
    } catch (error) {
      logger.error('Failed to complete questionnaire', 'ONBOARDING_PAGE', error);
      throw error;
    }
  };

  const handlePrevious = () => {
    if ((currentStep || 1) > 1) {
      setCurrentStep(prev => (prev || 1) - 1);
    }
  };

  const handleNext = () => {
    const step = currentStep || 1;
    if (step === 1 && completedSteps.documents) {
      setCurrentStep(2);
    } else if (step === 2 && completedSteps.questionnaire) {
      setCurrentStep(3);
    }
  };

  const renderStepContent = () => {
    const step = currentStep || 1;
    switch (step) {
      case 1:
        return (
          <DocumentUpload
            onComplete={handleDocumentComplete}
            initialDocuments={user?.documents || []}
          />
        );
        
      case 2:
        return (
          <DonorQuestionnaire
            onComplete={handleQuestionnaireComplete}
            initialData={user?.questionnaire || {}}
          />
        );
        
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <Clock className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Registration Complete!
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                Thank you for completing your donor registration. Your profile is now pending admin approval.
              </p>
            </div>

            <Card className="p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                What happens next?
              </h3>
              
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Document Review</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Our admin team will review your uploaded documents for authenticity and completeness.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Medical Assessment</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Your health questionnaire will be reviewed to ensure donation eligibility.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Account Activation</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Once approved, you'll receive a WhatsApp notification and can start helping save lives!
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Approval typically takes 24-48 hours.</strong> You'll be notified via WhatsApp once your account is activated.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span>View Profile</span>
              </Button>
              
              <Button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <span>Return to Home</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        );
        
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Session Expired
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Please register again to continue.
          </p>
          <Button onClick={() => navigate('/register')}>
            Go to Registration
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 dark:from-dark-bg dark:via-dark-bg-secondary dark:to-dark-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Complete Your Donor Profile
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Just a few more steps to become a verified blood donor
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = (currentStep || 1) === step.id;
              const isCompleted = (currentStep || 1) > step.id || 
                (step.id === 1 && completedSteps.documents) ||
                (step.id === 2 && completedSteps.questionnaire);
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <motion.div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : isActive
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white border-slate-300 text-slate-400 dark:bg-dark-bg-secondary dark:border-dark-border'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </motion.div>
                    <div className="mt-2 text-center">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                      (currentStep || 1) > step.id ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep || 1}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation (only show for steps 1 and 2) */}
        {(currentStep || 1) < 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between mt-8"
          >
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={(currentStep || 1) === 1}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={
                ((currentStep || 1) === 1 && !completedSteps.documents) ||
                ((currentStep || 1) === 2 && !completedSteps.questionnaire)
              }
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;