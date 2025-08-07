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
  MapPin
} from 'lucide-react';

import { useTheme } from '../../contexts/ThemeContext';
import { AnimatedButton } from '../ui';
import logger from '../../utils/logger';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

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
          <div className="text-sm font-medium">
            Save Lives. Donate Blood.
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg"
            >
              <Heart className="h-6 w-6 text-white fill-current" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                Call For Blood
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
                Foundation
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  item.current
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                logger.ui('CLICK', 'ThemeToggle', { currentTheme: theme }, 'HEADER');
                toggleTheme();
              }}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </motion.button>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link to="/register">
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  onClick={() => logger.ui('CLICK', 'RegisterButton', null, 'HEADER')}
                >
                  Register as Donor
                </AnimatedButton>
              </Link>
              <Link to="/emergency">
                <AnimatedButton
                  variant="danger"
                  size="sm"
                  onClick={() => logger.ui('CLICK', 'EmergencyButton', null, 'HEADER')}
                >
                  Need Blood Now
                </AnimatedButton>
              </Link>
            </div>

            {/* Mobile menu button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700"
          >
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    item.current
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile CTA buttons */}
              <div className="pt-4 space-y-2">
                <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                  <AnimatedButton
                    variant="secondary"
                    className="w-full"
                  >
                    Register as Donor
                  </AnimatedButton>
                </Link>
                <Link to="/emergency" onClick={() => setIsMenuOpen(false)}>
                  <AnimatedButton
                    variant="danger"
                    className="w-full"
                  >
                    Need Blood Now
                  </AnimatedButton>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>
    </header>
  );
};

export default Header;