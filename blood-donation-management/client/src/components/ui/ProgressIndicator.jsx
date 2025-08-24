import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

const ProgressIndicator = ({ steps, currentStep, className }) => {
  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={step.id || index} className="flex items-center">
              {/* Step Circle */}
              <div className="relative">
                <motion.div
                  className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200',
                    {
                      'bg-primary-600 text-white': isCompleted,
                      'bg-primary-600 text-white ring-4 ring-primary-100': isCurrent,
                      'bg-gray-200 text-gray-500': isUpcoming
                    }
                  )}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </motion.div>
                
                {/* Step Label */}
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-center">
                  <p className={clsx(
                    'text-xs font-medium whitespace-nowrap',
                    {
                      'text-primary-600': isCompleted || isCurrent,
                      'text-gray-500': isUpcoming
                    }
                  )}>
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className="relative">
                    <div className="h-0.5 bg-gray-200 w-full" />
                    <motion.div
                      className="h-0.5 bg-primary-600 absolute top-0 left-0"
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: stepNumber < currentStep ? '100%' : '0%' 
                      }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;