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
  const [theme, setTheme] = useState('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    logger.info('Initializing theme provider...', 'THEME_PROVIDER');
    
    const savedTheme = localStorage.getItem('call-for-blood-theme');
    if (savedTheme) {
      logger.info(`Found saved theme: ${savedTheme}`, 'THEME_PROVIDER');
      setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = prefersDark ? 'dark' : 'light';
      logger.info(`No saved theme found, using system preference: ${systemTheme}`, 'THEME_PROVIDER');
      setTheme(systemTheme);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    logger.theme('APPLY', theme, 'THEME_PROVIDER');
    
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      logger.debug('Added dark class to document root', 'THEME_PROVIDER');
    } else {
      root.classList.remove('dark');
      logger.debug('Removed dark class from document root', 'THEME_PROVIDER');
    }
    
    localStorage.setItem('call-for-blood-theme', theme);
    logger.debug(`Theme saved to localStorage: ${theme}`, 'THEME_PROVIDER');
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    logger.theme('TOGGLE', `${theme} → ${newTheme}`, 'THEME_PROVIDER');
    setTheme(newTheme);
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  logger.debug(`Theme provider value: ${JSON.stringify(value)}`, 'THEME_PROVIDER');

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};