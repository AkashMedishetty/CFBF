/**
 * Language Selector Component
 * Dropdown for selecting application language
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

const LanguageSelector = ({ 
  className = '',
  variant = 'default', // 'default', 'compact', 'icon-only'
  position = 'bottom-left' // 'bottom-left', 'bottom-right', 'top-left', 'top-right'
}) => {
  const { currentLanguage, changeLanguage, availableLanguages, isLoading, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (languageCode) => {
    setIsOpen(false);
    await changeLanguage(languageCode);
  };

  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'right-0 top-full mt-2';
      case 'top-left':
        return 'left-0 bottom-full mb-2';
      case 'top-right':
        return 'right-0 bottom-full mb-2';
      case 'bottom-left':
      default:
        return 'left-0 top-full mt-2';
    }
  };

  if (variant === 'icon-only') {
    return (
      <div className={`relative ${className}`}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation disabled:opacity-50"
          aria-label={t('language.selector.aria.label', { current: currentLang?.nativeName })}
        >
          <Globe className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              
              {/* Dropdown */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className={`absolute z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 ${getPositionClasses()}`}
              >
                {availableLanguages.map((language) => (
                  <motion.button
                    key={language.code}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLanguageChange(language.code)}
                    className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors touch-manipulation"
                  >
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {language.nativeName}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {language.name}
                      </div>
                    </div>
                    {currentLanguage === language.code && (
                      <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation disabled:opacity-50"
        >
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {currentLang?.code.toUpperCase()}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className={`absolute z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 ${getPositionClasses()}`}
              >
                {availableLanguages.map((language) => (
                  <motion.button
                    key={language.code}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLanguageChange(language.code)}
                    className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors touch-manipulation"
                  >
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {language.nativeName}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {language.name}
                      </div>
                    </div>
                    {currentLanguage === language.code && (
                      <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center space-x-3 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors touch-manipulation disabled:opacity-50"
      >
        <Globe className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        <div className="flex-1 text-left">
          <div className="font-medium text-slate-900 dark:text-white">
            {currentLang?.nativeName}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {currentLang?.name}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className={`absolute z-20 w-full min-w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 ${getPositionClasses()}`}
            >
              {availableLanguages.map((language) => (
                <motion.button
                  key={language.code}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLanguageChange(language.code)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors touch-manipulation"
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {language.nativeName}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {language.name}
                      </div>
                    </div>
                  </div>
                  {currentLanguage === language.code && (
                    <Check className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  )}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-white dark:bg-slate-800 bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;