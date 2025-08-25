import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Home page components
import HeroSection from '../../components/home/HeroSection';
import PrivacyConceptSection from '../../components/home/PrivacyConceptSection';
import CommitmentSection from '../../components/home/CommitmentSection';
import CallToActionSection from '../../components/home/CallToActionSection';

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Privacy Focus */}
      <HeroSection onRegisterClick={handleRegisterClick} />
      
      {/* Privacy Concept Explanation */}
      <PrivacyConceptSection />
      
      {/* Our Commitment Section */}
      <CommitmentSection />
      
      {/* Call to Action */}
      <CallToActionSection onRegisterClick={handleRegisterClick} />
    </div>
  );
};

export default HomePage;