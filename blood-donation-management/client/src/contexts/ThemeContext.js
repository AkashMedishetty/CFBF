import React, { createContext, useContext, useEffect, useState } from 'react';
import logger from '../utils/logger';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    logger.error('useTheme must be used within a ThemeProvider', 'THEME_CONTEXT');
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  logger.debug('Theme context accessed', 'THEME_CONTEXT');
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme] = useState('light'); // Always light mode

  // Initialize theme - always light mode
  useEffect(() => {
    logger.info('Initializing theme provider (light mode only)...', 'THEME_PROVIDER');
    
    // Remove any saved dark theme preference
    localStorage.removeItem('call-for-blood-theme');
    localStorage.setItem('call-for-blood-theme', 'light');
  }, []);

  // Apply theme to document - always light
  useEffect(() => {
    logger.theme('APPLY', 'light', 'THEME_PROVIDER');
    
    const root = document.documentElement;
    root.classList.remove('dark'); // Always remove dark class
    logger.debug('Ensured light mode - removed dark class from document root', 'THEME_PROVIDER');
    
    localStorage.setItem('call-for-blood-theme', 'light');
    logger.debug('Theme saved to localStorage: light', 'THEME_PROVIDER');
  }, []);

  // Disabled toggle function - no-op
  const toggleTheme = () => {
    logger.debug('Theme toggle disabled - app is light mode only', 'THEME_PROVIDER');
    // No-op: theme switching is disabled
  };

  const value = {
    theme: 'light',
    toggleTheme,
    isDark: false // Always false
  };

  logger.debug(`Theme provider value: ${JSON.stringify(value)}`, 'THEME_PROVIDER');

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};