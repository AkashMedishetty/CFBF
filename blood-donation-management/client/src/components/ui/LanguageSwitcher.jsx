/**
 * Language Switcher Component
 * Allows users to switch between supported languages
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

const LanguageSwitcher = ({ 
  variant = 'dropdown', // 'dropdown' | 'inline' | 'compact'
  showFlag = true,
  showNativeName = true,
  className = ''
}) => {
  const { 
    currentLanguage, 
    supported, 
    changeLanguage, 
    isLoading,
    t 
  } = useI18n();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          // Focus next language option
          break;
        case 'ArrowUp':
          event.preventDefault();
          // Focus previous language option
          break;
        default:
          // No action needed for other keys
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLanguageChange = async (languageCode) => {
    if (languageCode === currentLanguage) {
      setIsOpen(false);
      return;
    }

    try {
      await changeLanguage(languageCode);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const currentLang = supported.find(lang => lang.code === currentLanguage);

  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <Globe className="w-4 h-4 text-slate-500" />
        <div className="flex items-center space-x-1">
          {supported.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              disabled={isLoading}
              className={`px-2 py-1 text-sm rounded transition-colors ${
                language.code === currentLanguage
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={`Switch to ${language.name}`}
            >
              {showFlag && <span className="mr-1">{language.flag}</span>}
              {language.code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`relative inline-flex items-center px-2 py-1 text-sm rounded transition-colors ${
          isOpen 
            ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        aria-label={t('common.changeLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {showFlag && currentLang && (
          <span className="mr-1">{currentLang.flag}</span>
        )}
        <span>{currentLanguage.toUpperCase()}</span>
        <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-1 py-1 bg-white dark:bg-dark-bg-secondary border border-slate-200 dark:border-dark-border rounded-lg shadow-lg z-50 min-w-[120px]"
              role="listbox"
            >
              {supported.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                    language.code === currentLanguage
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                  role="option"
                  aria-selected={language.code === currentLanguage}
                >
                  <div className="flex items-center">
                    {showFlag && <span className="mr-2">{language.flag}</span>}
                    <span>{language.code.toUpperCase()}</span>
                  </div>
                  {language.code === currentLanguage && (
                    <Check className="w-3 h-3" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
          isOpen
            ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-bg-secondary dark:text-slate-300 dark:hover:bg-dark-bg-tertiary'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={t('common.changeLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4 mr-2" />
        {currentLang && (
          <>
            {showFlag && <span className="mr-2">{currentLang.flag}</span>}
            <span>
              {showNativeName ? currentLang.nativeName : currentLang.name}
            </span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 py-2 bg-white dark:bg-dark-bg-secondary border border-slate-200 dark:border-dark-border rounded-lg shadow-lg z-50 min-w-full"
            role="listbox"
          >
            {supported.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between ${
                  language.code === currentLanguage
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
                role="option"
                aria-selected={language.code === currentLanguage}
              >
                <div className="flex items-center">
                  {showFlag && <span className="mr-3 text-lg">{language.flag}</span>}
                  <div>
                    <div className="font-medium">
                      {showNativeName ? language.nativeName : language.name}
                    </div>
                    {showNativeName && language.nativeName !== language.name && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {language.name}
                      </div>
                    )}
                  </div>
                </div>
                {language.code === currentLanguage && (
                  <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;