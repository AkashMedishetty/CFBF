import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// PWA Components
import InstallPrompt from './components/pwa/InstallPrompt';
import OfflineIndicator from './components/pwa/OfflineIndicator';
import ServiceWorkerUpdater from './components/pwa/ServiceWorkerUpdater';


// Utils
import { pwaManager } from './utils/pwaManager';
import performanceMonitor from './utils/performanceMonitor';
import { featureFlags, FeatureFlag } from './utils/featureFlags';
import cacheManager from './utils/cacheManager';

// Components
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Context Providers
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';

// Lazy load pages
const HomePage = lazy(() => import('./pages/public/HomePage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const SimplifiedRegisterPage = lazy(() => import('./pages/auth/SimplifiedRegisterPage'));
const SignInPage = lazy(() => import('./pages/auth/SignInPage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const EducationPage = lazy(() => import('./pages/public/EducationPage'));
const EmergencyRequestPage = lazy(() => import('./pages/public/EmergencyRequestPage'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  useEffect(() => {
    // Initialize PWA functionality
    const initializePWA = async () => {
      try {
        // Register service worker (enabled in development for testing)
        console.log('[App] Initializing PWA features...');
        const registration = await pwaManager.registerServiceWorker();
        
        if (registration) {
          console.log('[App] PWA features initialized successfully');
        } else {
          console.warn('[App] PWA features failed to initialize');
        }
        
        // Initialize cache manager
        await cacheManager.initialize();
        
        // Start performance monitoring
        performanceMonitor.startTiming('app_initialization');
        performanceMonitor.measureResourceLoading();
        
        // Check for updates periodically
        setInterval(() => {
          pwaManager.checkForUpdates();
        }, 30 * 60 * 1000); // Check every 30 minutes
        
        performanceMonitor.endTiming('app_initialization');
        
      } catch (error) {
        console.error('PWA initialization failed:', error);
      }
    };

    initializePWA();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="App">
          {/* PWA Components */}
          <InstallPrompt />
          <OfflineIndicator />
          <ServiceWorkerUpdater />
    
          
          {/* Layout */}
          <Header />
          
          {/* Main Content */}
          <main>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<HomePage />} />
              
              {/* Registration Route - Use simplified version if home page redesign is enabled */}
              <Route 
                path="/register" 
                element={
                  featureFlags.isEnabled('homePageRedesign') ? 
                    <SimplifiedRegisterPage /> : 
                    <RegisterPage />
                } 
              />
              
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/education" element={<EducationPage />} />
              <Route path="/contact" element={<ContactPage />} />
              
              {/* Emergency requests - only show if feature is enabled */}
              <FeatureFlag feature="emergencyServices">
                <Route path="/emergency" element={<EmergencyRequestPage />} />
              </FeatureFlag>
              
              {/* Catch all route - redirect to home */}
              <Route path="*" element={<HomePage />} />
              </Routes>
            </Suspense>
          </main>
          
          {/* Footer */}
          <Footer />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;