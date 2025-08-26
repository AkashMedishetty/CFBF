import React, { useEffect } from 'react';
import SEO from '../../components/ui/SEO';
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
      <SEO
        title="Callforblood Foundation – Privacy‑Protected Blood Donation"
        description="Connect with donors safely using our 3‑month donor hiding feature. India's first privacy‑protected blood donation platform."
        url="https://www.callforbloodfoundation.com/"
        image="/og-card.jpg"
      />
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