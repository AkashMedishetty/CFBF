import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Utils
import logger from './utils/logger';

// Context providers
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import ComponentsPage from './pages/public/ComponentsPage';
import EducationPage from './pages/public/EducationPage';
import EmergencyRequestPage from './pages/public/EmergencyRequestPage';
import BloodBanksPage from './pages/public/BloodBanksPage';
import RegisterPage from './pages/auth/RegisterPage';

// Components
import ArticleDetail from './components/public/ArticleDetail';



// Component to track route changes
const RouteTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    logger.route('NAVIGATE', location.pathname, 'APP');
    logger.debug(`Full location: ${JSON.stringify(location)}`, 'APP');
  }, [location]);
  
  return null;
};

function App() {
  useEffect(() => {
    logger.info('🚀 Call For Blood Foundation client starting...', 'APP');
    logger.debug(`Environment: ${process.env.NODE_ENV}`, 'APP');
    logger.debug(`React version: ${React.version}`, 'APP');
    
    // Log browser information
    logger.debug(`User Agent: ${navigator.userAgent}`, 'APP');
    logger.debug(`Screen resolution: ${window.screen.width}x${window.screen.height}`, 'APP');
    logger.debug(`Viewport: ${window.innerWidth}x${window.innerHeight}`, 'APP');
    
    return () => {
      logger.info('App component unmounting', 'APP');
    };
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <RouteTracker />
        <div className="min-h-screen bg-background text-foreground">
          <Header />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/components" element={<ComponentsPage />} />
              <Route path="/education" element={<EducationPage />} />
              <Route path="/education/article/:slug" element={<ArticleDetail />} />
              <Route path="/emergency" element={<EmergencyRequestPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/blood-banks" element={<BloodBanksPage />} />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;