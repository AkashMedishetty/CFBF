import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Menu, 
  X, 
  Download,
  Shield
} from 'lucide-react';
import Button from '../ui/Button';
import { featureFlags } from '../../utils/featureFlags';



const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [installAvailable, setInstallAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);


  useEffect(() => {
    // Close mobile menu when route changes
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [location.pathname, isMenuOpen]);



  // PWA install prompt handler
  useEffect(() => {
    console.log('PWA: Setting up install prompt listeners');
    
    const onBeforeInstall = (e) => {
      console.log('PWA: beforeinstallprompt event fired', e);
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallAvailable(true);
    };
    
    const onInstalled = () => {
      console.log('PWA: App installed');
      setInstallAvailable(false);
      setDeferredPrompt(null);
    };
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA: App is already installed');
      setInstallAvailable(false);
    } else {
      console.log('PWA: App is not installed, waiting for install prompt');
      // Force show install button for testing in development
      if (process.env.NODE_ENV === 'development') {
        console.log('PWA: Development mode - showing install button');
        setInstallAvailable(true);
      }
    }
    
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const primaryNavigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'About Us', href: '/about', current: location.pathname === '/about' },
    { name: 'Education', href: '/education', current: location.pathname === '/education' },
    { name: 'Contact', href: '/contact', current: location.pathname === '/contact' },
  ];

  // Only show enabled features
  const secondaryNavigation = [
    ...(featureFlags.isEnabled('emergencyServices') ? [
      { name: 'Emergency Request', href: '/emergency', current: location.pathname === '/emergency' }
    ] : []),
    ...(featureFlags.isEnabled('bloodBankDirectory') ? [
      { name: 'Blood Banks', href: '/blood-banks', current: location.pathname === '/blood-banks' }
    ] : []),
  ];

  const allNavigation = [...primaryNavigation, ...secondaryNavigation];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <header className="bg-white dark:bg-dark-bg shadow-sm border-b border-gray-200 dark:border-dark-border sticky top-0 z-50">
      {/* Privacy-focused top bar */}
      <div className="bg-primary-600 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Shield className="h-4 w-4" />
              <span>India's 1st Privacy-Protected Blood Donation Platform</span>
            </div>
          </div>
          <div className="text-sm font-medium hidden md:block">
            100% Free • Complete Privacy • 3-Month Donor Hiding
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Fixed width for consistency */}
          <div className="flex-shrink-0 min-w-0">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden"
              >
                <img 
                  src="/Logo/android-chrome-192x192.png" 
                  alt="Call For Blood Foundation Logo" 
                  className="h-full w-full object-contain"
                />
              </motion.div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                  Call For Blood
                </span>
                <span className="text-xs text-gray-500 -mt-1 hidden sm:block">
                  Foundation
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation (center) - Better responsive handling */}
          <div className="hidden xl:flex flex-1 justify-center items-center max-w-2xl mx-8">
            <div className="flex items-center gap-1 lg:gap-2 xl:gap-4">
              {/* Primary Navigation Items */}
              {primaryNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-2 lg:px-2.5 py-2 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                    item.current
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Secondary Navigation Items - Direct Display */}
              {secondaryNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-2 lg:px-2.5 py-2 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                    item.current
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side buttons - Simplified for home page redesign */}
          <div className="flex items-center justify-end space-x-2 flex-shrink-0">
            

            {/* Install App */}
            {installAvailable && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  try {
                    console.log('PWA: Install button clicked', { deferredPrompt, installAvailable });
                    
                    if (!deferredPrompt) {
                      console.log('PWA: No deferred prompt available');
                      
                      // In development, try to use the debug function
                      if (process.env.NODE_ENV === 'development' && window.triggerPWAInstall) {
                        console.log('PWA: Using development trigger function');
                        await window.triggerPWAInstall();
                      } else {
                        alert('PWA installation is not available. This might be because:\n\n1. The app is already installed\n2. Your browser doesn\'t support PWA installation\n3. The app doesn\'t meet PWA requirements\n\nTry accessing the app in Chrome/Edge and check the address bar for an install icon.');
                      }
                      return;
                    }
                    
                    console.log('PWA: Showing install prompt');
                    deferredPrompt.prompt();
                    const choiceResult = await deferredPrompt.userChoice;
                    console.log('PWA: User choice:', choiceResult);
                    
                    setInstallAvailable(false);
                    setDeferredPrompt(null);
                  } catch (e) {
                    console.error('PWA: Install prompt failed:', e);
                    alert('Installation failed. Please try installing manually from your browser\'s menu.');
                  }
                }}
                className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                aria-label="Install app"
                title="Install app"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.button>
            )}

            {/* CTA Buttons - Focused on registration */}
            <div className="hidden lg:flex items-center space-x-3 ml-4">
              <Link to="/signin">
                <Button
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Sign In
                </Button>
              </Link>
              <Button
                onClick={handleRegisterClick}
                size="sm"
                className="whitespace-nowrap bg-primary-600 hover:bg-primary-700 text-white"
              >
                Register as Donor
              </Button>
            </div>

            {/* Mobile menu button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMenu}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors touch-manipulation ml-2"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <motion.div
                animate={{ rotate: isMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={false}
          animate={{
            height: isMenuOpen ? 'auto' : 0,
            opacity: isMenuOpen ? 1 : 0
          }}
          transition={{
            duration: 0.3,
            ease: [0.04, 0.62, 0.23, 0.98]
          }}
          className="lg:hidden overflow-hidden border-t border-gray-200"
        >
          <div className="py-4 px-2 bg-gray-50/50">
            {/* Navigation Links with staggered animation */}
            <div className="space-y-1 mb-4">
              {allNavigation.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={false}
                  animate={{
                    x: isMenuOpen ? 0 : -20,
                    opacity: isMenuOpen ? 1 : 0
                  }}
                  transition={{
                    duration: 0.3,
                    delay: isMenuOpen ? index * 0.05 : 0,
                    ease: [0.04, 0.62, 0.23, 0.98]
                  }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 touch-manipulation ${
                      item.current
                        ? 'text-primary-600 bg-primary-100 shadow-sm'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-white active:bg-gray-100'
                    }`}
                  >
                    <span className="flex-1">{item.name}</span>
                    {item.current && (
                      <motion.div
                        layoutId="mobile-nav-indicator"
                        className="w-2 h-2 bg-primary-600 rounded-full"
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
            


            {/* Action Buttons - Simplified for home page redesign */}
            <div className="space-y-3">
              <motion.div
                initial={false}
                animate={{
                  x: isMenuOpen ? 0 : -20,
                  opacity: isMenuOpen ? 1 : 0
                }}
                transition={{
                  duration: 0.3,
                  delay: isMenuOpen ? (allNavigation.length + 1) * 0.05 : 0,
                  ease: [0.04, 0.62, 0.23, 0.98]
                }}
              >
                <Link 
                  to="/signin" 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 rounded-xl text-gray-700 font-medium hover:bg-gray-200 transition-colors touch-manipulation"
                >
                  Sign In
                </Link>
              </motion.div>

              <motion.div
                initial={false}
                animate={{
                  x: isMenuOpen ? 0 : -20,
                  opacity: isMenuOpen ? 1 : 0
                }}
                transition={{
                  duration: 0.3,
                  delay: isMenuOpen ? (allNavigation.length + 2) * 0.05 : 0,
                  ease: [0.04, 0.62, 0.23, 0.98]
                }}
              >
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleRegisterClick();
                  }}
                  className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl text-white font-medium transition-colors touch-manipulation shadow-sm"
                >
                  Register as Donor
                </button>
              </motion.div>
            </div>

            {/* Bottom spacing for thumb-friendly navigation */}
            <div className="h-4"></div>
          </div>
        </motion.div>
      </nav>
    </header>
  );
};

export default Header;