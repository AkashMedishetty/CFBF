/**
 * Touch Optimized Form Component
 * Provides touch-friendly form with swipe navigation and large touch targets
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TouchOptimizedForm = ({
  children,
  onSubmit,
  multiStep = false,
  steps = [],
  currentStep = 0,
  onStepChange,
  className = '',
  ...props
}) => {
  const [localCurrentStep, setLocalCurrentStep] = useState(currentStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });

  const actualCurrentStep = multiStep ? (onStepChange ? currentStep : localCurrentStep) : 0;
  const totalSteps = multiStep ? steps.length : 1;

  useEffect(() => {
    if (multiStep && formRef.current) {
      const formWidth = formRef.current.offsetWidth;
      setDragConstraints({
        left: -formWidth * 0.3, // Allow 30% drag
        right: formWidth * 0.3
      });
    }
  }, [multiStep]);

  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      if (onStepChange) {
        onStepChange(stepIndex);
      } else {
        setLocalCurrentStep(stepIndex);
      }
    }
  };

  const goToNextStep = () => {
    if (actualCurrentStep < totalSteps - 1) {
      goToStep(actualCurrentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (actualCurrentStep > 0) {
      goToStep(actualCurrentStep - 1);
    }
  };

  const handleSwipe = (_, info) => {
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0 && actualCurrentStep > 0) {
        // Swipe right - go to previous step
        goToPreviousStep();
      } else if (info.offset.x < 0 && actualCurrentStep < totalSteps - 1) {
        // Swipe left - go to next step
        goToNextStep();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (multiStep && actualCurrentStep < totalSteps - 1) {
      goToNextStep();
      return;
    }

    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(e);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isLastStep = !multiStep || actualCurrentStep === totalSteps - 1;
  const isFirstStep = !multiStep || actualCurrentStep === 0;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={`touch-optimized-form ${className}`}
      {...props}
    >
      {/* Multi-step Progress Indicator */}
      {multiStep && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {steps[actualCurrentStep]?.title || `Step ${actualCurrentStep + 1}`}
            </h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {actualCurrentStep + 1} of {totalSteps}
            </span>
          </div>
          
          {steps[actualCurrentStep]?.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {steps[actualCurrentStep].description}
            </p>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4">
            <motion.div
              className="bg-primary-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((actualCurrentStep + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between">
            {steps.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToStep(index)}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  transition-all duration-200 touch-manipulation
                  ${index <= actualCurrentStep
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }
                  ${index < actualCurrentStep ? 'hover:bg-primary-700' : ''}
                `}
                style={{ minWidth: '44px', minHeight: '44px' }} // Touch target optimization
              >
                {index < actualCurrentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Content with Swipe Support */}
      <div className="relative overflow-hidden">
        <motion.div
          drag={multiStep ? 'x' : false}
          dragConstraints={dragConstraints}
          dragElastic={0.1}
          onDragEnd={handleSwipe}
          className="form-content"
          animate={{ x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={actualCurrentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="step-content"
            >
              {multiStep ? (
                React.Children.toArray(children)[actualCurrentStep]
              ) : (
                children
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        {/* Previous Button */}
        <button
          type="button"
          onClick={goToPreviousStep}
          disabled={isFirstStep}
          className={`
            flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200
            touch-manipulation
            ${isFirstStep
              ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }
          `}
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </button>

        {/* Swipe Hint */}
        {multiStep && (
          <div className="text-xs text-slate-400 dark:text-slate-500 text-center">
            Swipe left/right to navigate
          </div>
        )}

        {/* Next/Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200
            touch-manipulation
            ${isSubmitting
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-105 active:scale-95'
            }
            ${isLastStep
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
            }
          `}
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : isLastStep ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Submit
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>

      {/* Touch Feedback */}
      <style jsx>{`
        .touch-optimized-form {
          -webkit-tap-highlight-color: transparent;
        }
        
        .touch-optimized-form button {
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        
        .touch-optimized-form .touch-manipulation {
          touch-action: manipulation;
        }
        
        @media (hover: none) and (pointer: coarse) {
          .touch-optimized-form button:hover {
            transform: none;
          }
          
          .touch-optimized-form button:active {
            transform: scale(0.95);
          }
        }
      `}</style>
    </form>
  );
};

export default TouchOptimizedForm;