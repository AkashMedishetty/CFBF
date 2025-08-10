import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Menu, 
  X, 
  Sun, 
  Moon,
  Phone,
  MapPin,
  Bell,
  Download
} from 'lucide-react';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { AnimatedButton } from '../ui';
import logger from '../../utils/logger';
import { subscribeUser, isPushSupported } from '../../utils/push';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    logger.componentMount('Header', { theme, pathname: location.pathname });
    
    return () => {
      logger.componentUnmount('Header');
    };
  }, []);

  useEffect(() => {
    logger.componentUpdate('Header', { theme });
  }, [theme]);

  useEffect(() => {
    logger.componentUpdate('Header', { pathname: location.pathname });
    // Close mobile menu when route changes
    if (isMenuOpen) {
      logger.ui('AUTO_CLOSE', 'MobileMenu', { reason: 'route_change' }, 'HEADER');
      setIsMenuOpen(false);
    }
  }, [location.pathname]);

  // PWA install prompt handler
  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallAvailable(true);
      logger.info('PWA install prompt available', 'HEADER');
    };
    const onInstalled = () => {
      setInstallAvailable(false);
      setDeferredPrompt(null);
      logger.info('App installed', 'HEADER');
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const navigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'About Us', href: '/about', current: location.pathname === '/about' },
    { name: 'Education', href: '/education', current: location.pathname.startsWith('/education') },
    { name: 'Contact', href: '/contact', current: location.pathname === '/contact' },
    { name: 'Components', href: '/components', current: location.pathname === '/components' },
    { name: 'Blood Banks', href: '/blood-banks', current: location.pathname === '/blood-banks' },
    { name: 'Emergency Request', href: '/emergency', current: location.pathname === '/emergency' },
  ];

  const toggleMenu = () => {
    const newState = !isMenuOpen;
    logger.ui('TOGGLE', 'MobileMenu', { from: isMenuOpen, to: newState }, 'HEADER');
    setIsMenuOpen(newState);
  };

  const handleLogout = async () => {
    logger.ui('CLICK', 'LogoutButton', null, 'HEADER');
    try {
      await logout();
      // Redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      logger.error('Logout failed', 'HEADER', error);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      if (!(await isPushSupported())) {
        alert('Notifications are not supported on this device/browser.');
        return;
      }
      setIsEnablingPush(true);
      const uid = isAuthenticated ? (user?.id || user?._id) : undefined;
      const result = await subscribeUser(uid);
      if (result.success) {
        setPushEnabled(true);
        alert('Notifications enabled successfully.');
      } else {
        alert(result.message || 'Failed to enable notifications.');
      }
    } catch (e) {
      logger.error('Enable notifications failed', 'HEADER', e);
      alert('Failed to enable notifications.');
    } finally {
      setIsEnablingPush(false);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 shadow-soft border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      {/* Top bar with contact info */}
      <div className="bg-primary-600 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Phone className="h-4 w-4" />
              <span>Emergency: +91-911-BLOOD</span>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>24/7 Blood Donation Service</span>
            </div>
          </div>
          <div className="text-sm font-medium hidden md:block">
            Save Lives. Donate Blood.
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
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-primary-600 rounded-lg"
              >
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white fill-current" />
              </motion.div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                  Call For Blood
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 -mt-1 hidden sm:block">
                  Foundation
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation (center) - Better responsive handling */}
          <div className="hidden xl:flex flex-1 justify-center items-center max-w-2xl mx-8">
            <div className="flex items-center gap-1 lg:gap-2 xl:gap-4 overflow-x-auto scrollbar-hide">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-2 lg:px-2.5 py-2 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                    item.current
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side buttons - Improved responsive layout */}
          <div className="flex items-center justify-end space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Icon buttons with consistent sizing */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Install App */}
              {installAvailable && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    try {
                      if (!deferredPrompt) return;
                      deferredPrompt.prompt();
                      const { outcome } = await deferredPrompt.userChoice;
                      logger.info(`PWA install outcome: ${outcome}`, 'HEADER');
                      setInstallAvailable(false);
                      setDeferredPrompt(null);
                    } catch (e) {
                      logger.error('Install prompt failed', 'HEADER', e);
                    }
                  }}
                  className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors touch-manipulation"
                  aria-label="Install app"
                  title="Install app"
                >
                  <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.button>
              )}
              
              {/* Enable Notifications */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEnableNotifications}
                disabled={isEnablingPush}
                className={`inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg transition-colors touch-manipulation ${
                  pushEnabled 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                } ${isEnablingPush ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Enable notifications"
                title={pushEnabled ? 'Notifications enabled' : 'Enable notifications'}
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.button>

              {/* Theme toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  logger.ui('CLICK', 'ThemeToggle', { currentTheme: theme }, 'HEADER');
                  toggleTheme();
                }}
                className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors touch-manipulation"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </motion.button>
            </div>

            {/* CTA Buttons - Better responsive handling */}
            <div className="hidden lg:flex items-center space-x-2 xl:space-x-3 ml-2 xl:ml-4">
              {isAuthenticated ? (
                // Authenticated user buttons
                <>
                  <div className="flex items-center space-x-2 xl:space-x-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400 max-w-24 xl:max-w-none truncate">
                      Welcome, {user?.profile?.firstName || user?.name || 'User'}
                    </span>
                    <Link to={user?.role === 'admin' ? '/admin' : '/donor/dashboard'}>
                      <AnimatedButton
                        variant="secondary"
                        size="sm"
                        className="whitespace-nowrap"
                        onClick={() => logger.ui('CLICK', 'DashboardButton', null, 'HEADER')}
                      >
                        Dashboard
                      </AnimatedButton>
                    </Link>
                    <AnimatedButton
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={handleLogout}
                    >
                      Logout
                    </AnimatedButton>
                  </div>
                  <Link to="/emergency">
                    <AnimatedButton
                      variant="danger"
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => logger.ui('CLICK', 'EmergencyButton', null, 'HEADER')}
                    >
                      Need Blood Now
                    </AnimatedButton>
                  </Link>
                </>
              ) : (
                // Guest user buttons
                <>
                  <Link to="/login">
                    <AnimatedButton
                      variant="secondary"
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => logger.ui('CLICK', 'SignInButton', null, 'HEADER')}
                    >
                      Sign In
                    </AnimatedButton>
                  </Link>
                  <Link to="/register">
                    <AnimatedButton
                      variant="primary"
                      size="sm"
                      className="whitespace-nowrap hidden xl:inline-flex"
                      onClick={() => logger.ui('CLICK', 'RegisterButton', null, 'HEADER')}
                    >
                      Register as Donor
                    </AnimatedButton>
                  </Link>
                  <Link to="/emergency">
                    <AnimatedButton
                      variant="danger"
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => logger.ui('CLICK', 'EmergencyButton', null, 'HEADER')}
                    >
                      Need Blood Now
                    </AnimatedButton>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button - Enhanced for better touch targets */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMenu}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-manipulation ml-2"
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

        {/* Enhanced Mobile Navigation with better animations and touch targets */}
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
          className="lg:hidden overflow-hidden border-t border-slate-200 dark:border-slate-700"
        >
          <div className="py-4 px-2 bg-slate-50/50 dark:bg-slate-800/50">
            {/* Navigation Links with staggered animation */}
            <div className="space-y-1 mb-4">
              {navigation.map((item, index) => (
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
                    onClick={() => {
                      logger.ui('CLICK', 'MobileNavLink', { item: item.name }, 'HEADER');
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 touch-manipulation ${
                      item.current
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600'
                    }`}
                  >
                    <span className="flex-1">{item.name}</span>
                    {item.current && (
                      <motion.div
                        layoutId="mobile-nav-indicator"
                        className="w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full"
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
            
            {/* User Info Section */}
            {isAuthenticated && (
              <motion.div
                initial={false}
                animate={{
                  x: isMenuOpen ? 0 : -20,
                  opacity: isMenuOpen ? 1 : 0
                }}
                transition={{
                  duration: 0.3,
                  delay: isMenuOpen ? navigation.length * 0.05 : 0,
                  ease: [0.04, 0.62, 0.23, 0.98]
                }}
                className="px-4 py-3 mb-4 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {user?.profile?.firstName || user?.name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {user?.role === 'admin' ? 'Administrator' : 'Blood Donor'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons with improved touch targets */}
            <div className="space-y-3">
              {isAuthenticated ? (
                // Authenticated user mobile buttons
                <>
                  <motion.div
                    initial={false}
                    animate={{
                      x: isMenuOpen ? 0 : -20,
                      opacity: isMenuOpen ? 1 : 0
                    }}
                    transition={{
                      duration: 0.3,
                      delay: isMenuOpen ? (navigation.length + 1) * 0.05 : 0,
                      ease: [0.04, 0.62, 0.23, 0.98]
                    }}
                  >
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleEnableNotifications();
                      }}
                      className="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors touch-manipulation"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      {pushEnabled ? 'Notifications Enabled' : 'Enable Notifications'}
                    </button>
                  </motion.div>

                  <motion.div
                    initial={false}
                    animate={{
                      x: isMenuOpen ? 0 : -20,
                      opacity: isMenuOpen ? 1 : 0
                    }}
                    transition={{
                      duration: 0.3,
                      delay: isMenuOpen ? (navigation.length + 2) * 0.05 : 0,
                      ease: [0.04, 0.62, 0.23, 0.98]
                    }}
                  >
                    <Link 
                      to={user?.role === 'admin' ? '/admin' : '/donor/dashboard'} 
                      onClick={() => {
                        logger.ui('CLICK', 'MobileDashboardButton', null, 'HEADER');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors touch-manipulation"
                    >
                      Dashboard
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
                      delay: isMenuOpen ? (navigation.length + 3) * 0.05 : 0,
                      ease: [0.04, 0.62, 0.23, 0.98]
                    }}
                  >
                    <Link 
                      to="/emergency" 
                      onClick={() => {
                        logger.ui('CLICK', 'MobileEmergencyButton', null, 'HEADER');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-medium transition-colors touch-manipulation shadow-sm"
                    >
                      <Heart className="w-4 h-4 mr-2 fill-current" />
                      Need Blood Now
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
                      delay: isMenuOpen ? (navigation.length + 4) * 0.05 : 0,
                      ease: [0.04, 0.62, 0.23, 0.98]
                    }}
                  >
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors touch-manipulation"
                    >
                      Logout
                    </button>
                  </motion.div>
                </>
              ) : (
                // Guest user mobile buttons
                <>
                  <motion.div
                    initial={false}
                    animate={{
                      x: isMenuOpen ? 0 : -20,
                      opacity: isMenuOpen ? 1 : 0
                    }}
                    transition={{
                      duration: 0.3,
                      delay: isMenuOpen ? (navigation.length + 1) * 0.05 : 0,
                      ease: [0.04, 0.62, 0.23, 0.98]
                    }}
                  >
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleEnableNotifications();
                      }}
                      className="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors touch-manipulation"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      {pushEnabled ? 'Notifications Enabled' : 'Enable Notifications'}
                    </button>
                  </motion.div>

                  <motion.div
                    initial={false}
                    animate={{
                      x: isMenuOpen ? 0 : -20,
                      opacity: isMenuOpen ? 1 : 0
                    }}
                    transition={{
                      duration: 0.3,
                      delay: isMenuOpen ? (navigation.length + 2) * 0.05 : 0,
                      ease: [0.04, 0.62, 0.23, 0.98]
                    }}
                  >
                    <Link 
                      to="/login" 
                      onClick={() => {
                        logger.ui('CLICK', 'MobileSignInButton', null, 'HEADER');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors touch-manipulation"
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
                      delay: isMenuOpen ? (navigation.length + 3) * 0.05 : 0,
                      ease: [0.04, 0.62, 0.23, 0.98]
                    }}
                  >
                    <Link 
                      to="/register" 
                      onClick={() => {
                        logger.ui('CLICK', 'MobileRegisterButton', null, 'HEADER');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl text-white font-medium transition-colors touch-manipulation shadow-sm"
                    >
                      Register as Donor
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
                      delay: isMenuOpen ? (navigation.length + 4) * 0.05 : 0,
                      ease: [0.04, 0.62, 0.23, 0.98]
                    }}
                  >
                    <Link 
                      to="/emergency" 
                      onClick={() => {
                        logger.ui('CLICK', 'MobileEmergencyButton', null, 'HEADER');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-medium transition-colors touch-manipulation shadow-sm"
                    >
                      <Heart className="w-4 h-4 mr-2 fill-current" />
                      Need Blood Now
                    </Link>
                  </motion.div>
                </>
              )}
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