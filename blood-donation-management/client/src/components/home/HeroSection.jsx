import React from 'react';
import NewHeroSection from './NewHeroSection';

// Legacy wrapper component for backward compatibility
const HeroSection = ({ onRegisterClick }) => {
  return (
    <NewHeroSection 
      onRegisterClick={onRegisterClick}
      variant="full"
      enableAnimations={true}
      enableLazyLoading={true}
    />
  );
};

export default HeroSection;