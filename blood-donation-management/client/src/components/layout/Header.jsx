import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Download,
  Shield,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Bell
} from 'lucide-react';
import Button from '../ui/Button';
import { featureFlags } from '../../utils/featureFlags';
import { useAuth } from '../../contexts/AuthContext';



const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [installAvailable, setInstallAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const { isAuthenticated, user, logout, isLoading } = useAuth();


  useEffect(() => {
    // Close mobile menu when route changes
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [location.pathname]); // Removed isMenuOpen from dependencies to prevent infinite loop

  // Debug mobile menu state changes
  useEffect(() => {
    console.log('🔍 Mobile menu state changed:', isMenuOpen);
  }, [isMenuOpen]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);



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

  const toggleMenu = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('🔍 Mobile menu toggle clicked');
    console.log('Current isMenuOpen state:', isMenuOpen);
    console.log('Event target:', e.target);
    console.log('Event type:', e.type);
    setIsMenuOpen(!isMenuOpen);
    console.log('Setting isMenuOpen to:', !isMenuOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both the menu button and the menu content
      if (isMenuOpen && 
          !event.target.closest('.mobile-menu-container') && 
          !event.target.closest('.mobile-menu-content')) {
        console.log('🔍 Clicking outside menu, closing');
        setIsMenuOpen(false);
      }
    };

    const handleTouchOutside = (event) => {
      // Check if touch is outside both the menu button and the menu content
      if (isMenuOpen && 
          !event.target.closest('.mobile-menu-container') && 
          !event.target.closest('.mobile-menu-content')) {
        console.log('🔍 Touching outside menu, closing');
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      // Add a delay to prevent immediate closing from the same click that opened the menu
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleTouchOutside);
      }, 200); // Increased delay to prevent immediate closing

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleTouchOutside);
      };
    }
  }, [isMenuOpen]);

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
                  alt="CallforBlood Foundation Logo" 
                  className="h-full w-full object-contain"
                />
              </motion.div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                  CallforBlood
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

            {/* Authentication Section */}
            <div className="hidden lg:flex items-center space-x-3 ml-4">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">Loading...</span>
                </div>
              ) : isAuthenticated && user ? (
                <div className="relative user-menu-container">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {(user.name || user.fullName || user.firstName || user.email)?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {(() => {
                          // Debug: Log user data for troubleshooting
                          console.log('User data for name display:', {
                            name: user.name,
                            fullName: user.fullName,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            profile: user.profile
                          });
                          
                          // Priority order: name > fullName > firstName + lastName > profile.name > email prefix
                          const displayName = user.name || 
                                            user.fullName || 
                                            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                                            user.profile?.firstName + ' ' + user.profile?.lastName ||
                                            user.email?.split('@')[0] || 
                                            'User';
                          
                          return displayName;
                        })()}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user.role || 'Donor'}
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  {/* User Dropdown Menu */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {user.name || 
                             user.fullName || 
                             `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                             user.profile?.firstName + ' ' + user.profile?.lastName ||
                             user.email?.split('@')[0] || 
                             'User'}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <p className="text-xs text-primary-600 capitalize">{user.role || 'Donor'}</p>
                        </div>
                        
                        <div className="py-1">
                          <Link
                            to={user.role === 'admin' ? '/admin' : (user.status === 'pending' ? '/onboarding' : '/dashboard')}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <User className="h-4 w-4 mr-3" />
                            {user.role === 'admin' ? 'Admin Dashboard' : (user.status === 'pending' ? 'Complete Registration' : 'Dashboard')}
                          </Link>
                          
                          <Link
                            to="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="h-4 w-4 mr-3" />
                            Profile Settings
                          </Link>
                          
                          <Link
                            to="/notifications"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Bell className="h-4 w-4 mr-3" />
                            Notifications
                          </Link>
                        </div>
                        
                        <div className="border-t border-gray-100 py-1">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              logout();
                              navigate('/');
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="h-4 w-4 mr-3" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMenu}
              className="lg:hidden inline-flex h-12 w-12 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors touch-manipulation ml-2 mobile-menu-container"
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
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden fixed inset-0 bg-black bg-opacity-25 z-40"
                onClick={() => {
                  console.log('🔍 Mobile menu overlay clicked, closing menu');
                  setIsMenuOpen(false);
                }}
              />
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="lg:hidden border-t border-gray-200 bg-white relative z-50 mobile-menu-content"
                onAnimationStart={() => console.log('🔍 Mobile menu animation started')}
                onAnimationComplete={() => console.log('🔍 Mobile menu animation completed')}
              >
                <div className="py-4 px-2 bg-gray-50/50">
                  {/* Navigation Links with staggered animation */}
                  <div className="space-y-1 mb-4">
                    {allNavigation.map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
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

                  {/* Mobile Authentication Section */}
                  <div className="space-y-3">
                  {isLoading ? (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: (allNavigation.length + 1) * 0.05,
                        ease: [0.04, 0.62, 0.23, 0.98]
                      }}
                      className="flex items-center justify-center px-4 py-3 bg-gray-100 rounded-xl"
                    >
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-primary-600 rounded-full animate-spin mr-2"></div>
                      <span className="text-gray-700">Loading...</span>
                    </motion.div>
                  ) : isAuthenticated && user ? (
                    <>
                      {/* User Info */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: (allNavigation.length + 1) * 0.05,
                          ease: [0.04, 0.62, 0.23, 0.98]
                        }}
                        className="flex items-center px-4 py-3 bg-primary-50 rounded-xl"
                      >
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-medium">
                            {(user.name || user.fullName || user.firstName || user.email)?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user.name || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'User'}</p>
                          <p className="text-sm text-gray-600 capitalize">{user.role || 'Donor'}</p>
                        </div>
                      </motion.div>

                      {/* Dashboard Link */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: (allNavigation.length + 2) * 0.05,
                          ease: [0.04, 0.62, 0.23, 0.98]
                        }}
                      >
                        <Link 
                          to={user.role === 'admin' ? '/admin' : (user.status === 'pending' ? '/onboarding' : '/dashboard')}
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl text-white font-medium transition-colors touch-manipulation shadow-sm"
                        >
                          <User className="h-4 w-4 mr-2" />
                          {user.role === 'admin' ? 'Admin Dashboard' : (user.status === 'pending' ? 'Complete Registration' : 'Dashboard')}
                        </Link>
                      </motion.div>

                      {/* Logout Button */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: (allNavigation.length + 3) * 0.05,
                          ease: [0.04, 0.62, 0.23, 0.98]
                        }}
                      >
                        <button 
                          onClick={() => {
                            setIsMenuOpen(false);
                            logout();
                            navigate('/');
                          }}
                          className="w-full flex items-center justify-center px-4 py-3 bg-red-100 hover:bg-red-200 rounded-xl text-red-700 font-medium transition-colors touch-manipulation"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </button>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: (allNavigation.length + 1) * 0.05,
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
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: (allNavigation.length + 2) * 0.05,
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
                    </>
                  )}
                </div>

                {/* Bottom spacing for thumb-friendly navigation */}
                <div className="h-4"></div>
              </div>
            </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Header;