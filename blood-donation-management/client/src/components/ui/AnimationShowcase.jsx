import React, { useState } from 'react';
import { 
  Zap, 
  Heart,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import logger from '../../utils/logger';
import {
  AnimatedButton,
  AnimatedCard,
  LoadingSpinner,
  SkeletonLoader,
  ProgressBar,
  AnimatedList,
  AnimatedListItem,
  AnimatedGrid,
  FadeInWhenVisible,
  ModalTransition
} from './index';

const AnimationShowcase = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState(45);
  const [isAnimating, setIsAnimating] = useState(false);

  React.useEffect(() => {
    logger.componentMount('AnimationShowcase');
    
    return () => {
      logger.componentUnmount('AnimationShowcase');
    };
  }, []);

  const handleStartAnimation = () => {
    logger.ui('CLICK', 'StartAnimation', null, 'ANIMATION_SHOWCASE');
    setIsAnimating(true);
    
    // Simulate progress animation
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsAnimating(false);
        setTimeout(() => setProgress(45), 1000);
      }
    }, 100);
  };

  const demoItems = [
    { id: 1, title: 'Micro-interactions', icon: Zap },
    { id: 2, title: 'Smooth Transitions', icon: Heart },
    { id: 3, title: 'Loading States', icon: Star },
    { id: 4, title: 'Form Animations', icon: CheckCircle }
  ];

  const buttonVariants = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <FadeInWhenVisible>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Animation System Showcase
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Experience the premium animations and micro-interactions powered by Framer Motion
          </p>
        </div>
      </FadeInWhenVisible>

      {/* Button Animations */}
      <FadeInWhenVisible>
        <AnimatedCard className="mb-12">
          <AnimatedCard.Header>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Button Animations
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Hover and click to see smooth micro-interactions
            </p>
          </AnimatedCard.Header>
          
          <AnimatedCard.Body>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {buttonVariants.map((variant) => (
                <AnimatedButton
                  key={variant}
                  variant={variant}
                  onClick={() => logger.ui('CLICK', 'ShowcaseButton', { variant }, 'ANIMATION_SHOWCASE')}
                  className="capitalize"
                >
                  {variant}
                </AnimatedButton>
              ))}
            </div>
          </AnimatedCard.Body>
        </AnimatedCard>
      </FadeInWhenVisible>

      {/* Loading States */}
      <FadeInWhenVisible>
        <AnimatedCard className="mb-12">
          <AnimatedCard.Header>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Loading States
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Various loading animations and progress indicators
            </p>
          </AnimatedCard.Header>
          
          <AnimatedCard.Body>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <h3 className="font-semibold mb-4">Spinner</h3>
                <LoadingSpinner variant="spinner" size="lg" />
              </div>
              
              <div className="text-center">
                <h3 className="font-semibold mb-4">Dots</h3>
                <LoadingSpinner variant="dots" size="lg" />
              </div>
              
              <div className="text-center">
                <h3 className="font-semibold mb-4">Pulse</h3>
                <LoadingSpinner variant="pulse" size="lg" />
              </div>
              
              <div className="text-center">
                <h3 className="font-semibold mb-4">Progress</h3>
                <div className="space-y-4">
                  <ProgressBar progress={progress} animated={true} />
                  <AnimatedButton
                    size="sm"
                    onClick={handleStartAnimation}
                    disabled={isAnimating}
                    loading={isAnimating}
                  >
                    {isAnimating ? 'Animating...' : 'Start Animation'}
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </AnimatedCard.Body>
        </AnimatedCard>
      </FadeInWhenVisible>

      {/* Skeleton Loading */}
      <FadeInWhenVisible>
        <AnimatedCard className="mb-12">
          <AnimatedCard.Header>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Skeleton Loading
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Animated skeleton placeholders for content loading
            </p>
          </AnimatedCard.Header>
          
          <AnimatedCard.Body>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Animated Skeleton</h3>
                <SkeletonLoader lines={4} animated={true} />
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Static Skeleton</h3>
                <SkeletonLoader lines={4} animated={false} />
              </div>
            </div>
          </AnimatedCard.Body>
        </AnimatedCard>
      </FadeInWhenVisible>

      {/* List Animations */}
      <FadeInWhenVisible>
        <AnimatedCard className="mb-12">
          <AnimatedCard.Header>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              List Animations
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Staggered animations for lists and grids
            </p>
          </AnimatedCard.Header>
          
          <AnimatedCard.Body>
            <AnimatedList className="space-y-4">
              {demoItems.map((item) => {
                const Icon = item.icon;
                return (
                  <AnimatedListItem key={item.id}>
                    <div className="flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          Demonstrating smooth list item animations
                        </p>
                      </div>
                    </div>
                  </AnimatedListItem>
                );
              })}
            </AnimatedList>
          </AnimatedCard.Body>
        </AnimatedCard>
      </FadeInWhenVisible>

      {/* Grid Animations */}
      <FadeInWhenVisible>
        <AnimatedCard className="mb-12">
          <AnimatedCard.Header>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Grid Animations
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Staggered grid animations with fast timing
            </p>
          </AnimatedCard.Header>
          
          <AnimatedCard.Body>
            <AnimatedGrid columns={4} gap={4} staggerType="fastStagger">
              {Array.from({ length: 8 }).map((_, index) => (
                <AnimatedCard
                  key={index}
                  hover={true}
                  padding="sm"
                  className="text-center"
                >
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Grid Item
                  </p>
                </AnimatedCard>
              ))}
            </AnimatedGrid>
          </AnimatedCard.Body>
        </AnimatedCard>
      </FadeInWhenVisible>

      {/* Modal Animation */}
      <FadeInWhenVisible>
        <AnimatedCard className="mb-12">
          <AnimatedCard.Header>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Modal Animations
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Smooth modal transitions with backdrop blur
            </p>
          </AnimatedCard.Header>
          
          <AnimatedCard.Body>
            <AnimatedButton
              onClick={() => {
                logger.ui('CLICK', 'OpenModal', null, 'ANIMATION_SHOWCASE');
                setIsModalOpen(true);
              }}
            >
              Open Animated Modal
            </AnimatedButton>
          </AnimatedCard.Body>
        </AnimatedCard>
      </FadeInWhenVisible>

      {/* Modal */}
      <ModalTransition
        isOpen={isModalOpen}
        onClose={() => {
          logger.ui('CLICK', 'CloseModal', null, 'ANIMATION_SHOWCASE');
          setIsModalOpen(false);
        }}
      >
        <AnimatedCard>
          <AnimatedCard.Header>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Animated Modal
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              This modal uses spring animations for smooth entrance and exit
            </p>
          </AnimatedCard.Header>
          
          <AnimatedCard.Body>
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                The modal animates in with a spring effect and includes backdrop blur for a premium feel.
              </p>
              
              <LoadingSpinner 
                variant="spinner" 
                size="md" 
                text="Loading content..." 
              />
            </div>
          </AnimatedCard.Body>
          
          <AnimatedCard.Footer>
            <AnimatedButton
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Close Modal
            </AnimatedButton>
          </AnimatedCard.Footer>
        </AnimatedCard>
      </ModalTransition>

      {/* Performance Note */}
      <FadeInWhenVisible>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Performance & Accessibility
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                All animations respect the user's reduced motion preferences and are optimized for 60fps performance. 
                Animations are automatically disabled in production for users who prefer reduced motion.
              </p>
            </div>
          </div>
        </div>
      </FadeInWhenVisible>
    </div>
  );
};

export default AnimationShowcase;