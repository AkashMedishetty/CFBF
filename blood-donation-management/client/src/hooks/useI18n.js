/**
 * React Hook for Internationalization
 * Provides i18n functionality to React components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import i18n from '../utils/i18n';

export const useI18n = () => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.currentLanguage);
  const [isLoading, setIsLoading] = useState(false);

  // Update component when language changes
  useEffect(() => {
    const unsubscribe = i18n.addLanguageChangeListener((newLanguage) => {
      setCurrentLanguage(newLanguage);
    });

    return unsubscribe;
  }, []);

  // Translation function
  const t = useCallback((key, params) => {
    return i18n.t(key, params);
  }, []);

  // Change language function
  const changeLanguage = useCallback(async (languageCode) => {
    setIsLoading(true);
    try {
      await i18n.setLanguage(languageCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Format functions
  const formatNumber = useCallback((number, options) => {
    return i18n.formatNumber(number, options);
  }, []);

  const formatCurrency = useCallback((amount, currency) => {
    return i18n.formatCurrency(amount, currency);
  }, []);

  const formatDate = useCallback((date, options) => {
    return i18n.formatDate(date, options);
  }, []);

  const formatRelativeTime = useCallback((date) => {
    return i18n.formatRelativeTime(date);
  }, []);

  // Pluralization function
  const plural = useCallback((key, count, params) => {
    return i18n.plural(key, count, params);
  }, []);

  // Language info
  const languageInfo = useMemo(() => ({
    current: i18n.getCurrentLanguage(),
    supported: i18n.getSupportedLanguages(),
    isRTL: i18n.isRTL(),
    directionClass: i18n.getDirectionClass(),
    languageClasses: i18n.getLanguageClasses()
  }), []);

  return {
    // Translation
    t,
    plural,

    // Language management
    currentLanguage,
    changeLanguage,
    isLoading,

    // Formatting
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,

    // Language info
    ...languageInfo,

    // Utilities
    hasTranslation: i18n.hasTranslation.bind(i18n),
    getMissingTranslations: i18n.getMissingTranslations.bind(i18n)
  };
};

// Hook for translation only (lighter version)
export const useTranslation = (namespace = '') => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.currentLanguage);

  useEffect(() => {
    const unsubscribe = i18n.addLanguageChangeListener((newLanguage) => {
      setCurrentLanguage(newLanguage);
    });

    return unsubscribe;
  }, []);

  const t = useCallback((key, params) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return i18n.t(fullKey, params);
  }, [namespace]);

  return { t, currentLanguage };
};

export default useI18n;