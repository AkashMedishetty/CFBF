import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Utils
import logger from './utils/logger';
import sessionRestoration from './utils/sessionRestoration';
import pwaInstallManager from './utils/pwaInstallManager';
import performanceMonitor from './utils/performanceMonitor';
import preloadManager from './utils/preloadManager';
import codeSplittingManager from './utils/codeSplitting';
import browserCompatibility from './utils/browserCompatibility';
import accessibilityManager from './utils/accessibilityManager';
import i18n from './utils/i18n';

// Context providers
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

// Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Alert from './components/ui/Alert';
import InstallPrompt from './components/pwa/InstallPrompt';
import UpdateNotification from './components/pwa/UpdateNotification';
import PWAInstallPrompt from './components/features/PWAInstallPrompt';
// import PWAStatus from './components/features/PWAStatus';

// Hooks
import { useAuth } from './contexts/AuthContext';

// Public Pages
const HomePage = lazy(() => import('./pages/public/HomePage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const ComponentsPage = lazy(() => import('./pages/public/ComponentsPage'));
const EducationPage = lazy(() => import('./pages/public/EducationPage'));
const EmergencyRequestPage = lazy(() => import('./pages/public/EmergencyRequestPage'));
const BloodBanksPage = lazy(() => import('./pages/public/BloodBanksPage'));
const ArticleDetail = lazy(() => import('./components/public/ArticleDetail'));

// Auth Pages
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const SignInPage = lazy(() => import('./pages/auth/SignInPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const AdminLoginPage = lazy(() => import('./pages/auth/AdminLoginPage'));

// Donor Pages
const DonorDashboardPage = lazy(() => import('./pages/donor/DashboardPage'));
const DonorOnboardingPage = lazy(() => import('./pages/donor/OnboardingPage'));
const DonorProfilePage = lazy(() => import('./pages/donor/ProfilePage'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const DonorVerificationPage = lazy(() => import('./pages/admin/DonorVerificationPage'));


// Component to track route changes
const RouteTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    logger.route('NAVIGATE', location.pathname, 'APP');
    logger.debug(`Full location: ${JSON.stringify(location)}`, 'APP');
    
    // Record navigation for performance monitoring
    performanceMonitor.recordMetric('navigation', {
      path: location.pathname,
      timestamp: Date.now()
    });
    
    // Record navigation for preload manager
    const previousPath = sessionStorage.getItem('previousPath');
    if (previousPath) {
      preloadManager.recordNavigation(previousPath, location.pathname);
    }
    sessionStorage.setItem('previousPath', location.pathname);
    
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
};

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <LoadingSpinner size="lg" />
  </div>
);

// Auth loading component
const AuthLoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <LoadingSpinner size="lg" text="Loading..." />
  </div>
);

// App content component that uses auth context
const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  return (
    <Router>
      <ErrorBoundary>
        <RouteTracker />
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          <Header />
          
          <main className="flex-1">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/components" element={<ComponentsPage />} />
                <Route path="/education" element={<EducationPage />} />
                <Route path="/emergency" element={<EmergencyRequestPage />} />
                <Route path="/blood-banks" element={<BloodBanksPage />} />
                <Route path="/articles/:slug" element={<ArticleDetail />} />
                
                {/* Authentication Routes */}
                <Route path="/login" element={<SignInPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                
                {/* Donor Routes - Protected */}
                <Route path="/donor">
                  <Route path="dashboard" element={
                    <ProtectedRoute>
                      <DonorDashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="onboarding" element={
                    <ProtectedRoute>
                      <DonorOnboardingPage />
                    </ProtectedRoute>
                  } />
                  <Route path="profile" element={
                    <ProtectedRoute>
                      <DonorProfilePage />
                    </ProtectedRoute>
                  } />
                </Route>
                
                {/* Admin Routes - Protected */}
                <Route path="/admin">
                  <Route index element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="verification" element={
                    <ProtectedRoute requiredRole="admin">
                      <DonorVerificationPage />
                    </ProtectedRoute>
                  } />
                </Route>
                
                {/* 404 - Not Found */}
                <Route path="*" element={
                  <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-red-600 dark:text-red-400 mb-4">404</h1>
                      <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">Page not found</p>
                      <a 
                        href="/" 
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Go to Home
                      </a>
                    </div>
                  </div>
                } />
              </Routes>
            </Suspense>
          </main>
          
          <Footer />
        </div>
      </ErrorBoundary>
    </Router>
  );
};

function App() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  useEffect(() => {
    logger.info(' Call For Blood Foundation client starting...', 'APP');
    logger.debug(`Environment: ${process.env.NODE_ENV}`, 'APP');
    logger.debug(`React version: ${React.version}`, 'APP');
    
    // Log browser information
    logger.debug(`User Agent: ${navigator.userAgent}`, 'APP');
    logger.debug(`Screen resolution: ${window.screen.width}x${window.screen.height}`, 'APP');
    logger.debug(`Viewport: ${window.innerWidth}x${window.innerHeight}`, 'APP');
    
    // Initialize session restoration for PWA
    sessionRestoration.initializeListeners();
    
    // Check if this is a PWA restart and attempt session restoration
    if (sessionRestoration.isPWARestart()) {
      logger.info('PWA restart detected, attempting session restoration', 'APP');
      sessionRestoration.restoreSession().then(session => {
        if (session) {
          logger.success('Session restored after PWA restart', 'APP', {
            userId: session.userId
          });
        }
      }).catch(error => {
        logger.warn('Session restoration failed after PWA restart', 'APP', error);
      });
    }
    
    // Initialize PWA install manager
    logger.debug('PWA capabilities', 'APP', pwaInstallManager.getPWACapabilities());
    
    // Initialize performance monitoring
    logger.debug('Performance monitoring initialized', 'APP');
    
    // Initialize browser compatibility
    const compatibilityReport = browserCompatibility.getCompatibilityReport();
    logger.debug('Browser compatibility initialized', 'APP', {
      browser: compatibilityReport.browser.name,
      version: compatibilityReport.browser.version,
      score: compatibilityReport.compatibilityScore
    });
    
    // Apply browser-specific fixes
    browserCompatibility.applyBrowserFixes();
    
    // Initialize accessibility manager
    logger.debug('Accessibility manager initialized', 'APP');
    
    // Initialize i18n system
    i18n.initialize().then(() => {
      logger.debug('i18n system initialized', 'APP', {
        language: i18n.currentLanguage,
        isRTL: i18n.isRTL()
      });
    }).catch(error => {
      logger.warn('Failed to initialize i18n system', 'APP', error);
    });
    
    // Preload critical chunks for better performance
    codeSplittingManager.prefetchCriticalChunks().then(() => {
      logger.debug('Critical chunks preloaded', 'APP');
    }).catch(error => {
      logger.warn('Failed to preload critical chunks', 'APP', error);
    });
    
    // Record navigation for preload manager
    preloadManager.recordNavigation('/', window.location.pathname);
    
    // Listen for PWA update availability and show a toast-like inline banner
    const onUpdateAvailable = () => {
      logger.info('PWA update available - prompting user', 'APP');
      setIsUpdateAvailable(true);
    };
    window.addEventListener('pwa:update-available', onUpdateAvailable);

    return () => {
      logger.info('App component unmounting', 'APP');
      window.removeEventListener('pwa:update-available', onUpdateAvailable);
    };
  }, []);

  const handleRefreshNow = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const waiting = registration?.waiting;
      if (waiting) {
        waiting.postMessage({ type: 'SKIP_WAITING' });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        }, { once: true });
      } else {
        window.location.reload();
      }
    } catch (e) {
      window.location.reload();
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Update prompt */}
        {isUpdateAvailable && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
            <Alert variant="info" title="Update available" dismissible onDismiss={() => setIsUpdateAvailable(false)}>
              <div className="space-y-3">
                <div>New version is ready. Refresh to get the latest features and fixes.</div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setIsUpdateAvailable(false)}
                    className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-white/10 dark:hover:bg-white/15 dark:text-gray-200"
                  >
                    Later
                  </button>
                  <button
                    onClick={handleRefreshNow}
                    className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </Alert>
          </div>
        )}
        <AppContent />
        
        {/* PWA Components */}
        <InstallPrompt />
        <UpdateNotification />
        <PWAInstallPrompt />
        {/* <PWAStatus /> */}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;