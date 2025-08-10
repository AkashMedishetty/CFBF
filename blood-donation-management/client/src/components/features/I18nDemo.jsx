/**
 * I18n Demo Component
 * Demonstrates internationalization features and language switching
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Calendar, 
  Clock, 
  DollarSign, 
  Hash,
  MessageCircle,
  CheckCircle,
  Info
} from 'lucide-react';

import { useI18n } from '../../hooks/useI18n';
import LanguageSelector from '../ui/LanguageSelector';

const I18nDemo = () => {
  const { 
    t, 
    currentLanguage, 
    formatDate, 
    formatTime, 
    formatNumber, 
    formatCurrency, 
    plural,
    isRTL,
    availableLanguages 
  } = useI18n();

  const [donorCount, setDonorCount] = useState(5);
  const [amount, setAmount] = useState(1250.75);

  const demoData = {
    currentDate: new Date(),
    currentTime: new Date(),
    largeNumber: 1234567.89,
    currencies: [
      { amount: 100, currency: 'USD' },
      { amount: 7500, currency: 'INR' },
      { amount: 85, currency: 'EUR' },
      { amount: 130, currency: 'CAD' }
    ]
  };

  const features = [
    {
      title: 'Automatic Language Detection',
      description: 'Detects user\'s preferred language from browser settings',
      icon: Globe,
      color: 'text-blue-600'
    },
    {
      title: 'Date & Time Formatting',
      description: 'Locale-aware date and time formatting',
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      title: 'Number & Currency Formatting',
      description: 'Proper number and currency formatting for each locale',
      icon: DollarSign,
      color: 'text-purple-600'
    },
    {
      title: 'RTL Language Support',
      description: 'Right-to-left text direction for Arabic and Hebrew',
      icon: MessageCircle,
      color: 'text-orange-600'
    },
    {
      title: 'Pluralization Rules',
      description: 'Language-specific pluralization handling',
      icon: Hash,
      color: 'text-red-600'
    },
    {
      title: 'Persistent Language Preference',
      description: 'Remembers user\'s language choice across sessions',
      icon: CheckCircle,
      color: 'text-teal-600'
    }
  ];

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t('i18n.demo.title', {}, 'Internationalization (i18n) Demo')}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {t('i18n.demo.description', {}, 'Comprehensive multi-language support with automatic formatting and locale detection.')}
        </p>
      </div>

      {/* Language Selector */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          {t('i18n.language.selector', {}, 'Language Selector')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Default Variant
            </label>
            <LanguageSelector variant="default" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Compact Variant
            </label>
            <LanguageSelector variant="compact" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Icon Only Variant
            </label>
            <LanguageSelector variant="icon-only" />
          </div>
        </div>
      </div>

      {/* Current Language Info */}
      <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          {t('i18n.current.language', {}, 'Current Language Information')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-600 dark:text-slate-400">Language Code:</span>
            <span className="ml-2 font-medium text-slate-900 dark:text-white">
              {currentLanguage}
            </span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Text Direction:</span>
            <span className="ml-2 font-medium text-slate-900 dark:text-white">
              {isRTL ? 'RTL' : 'LTR'}
            </span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Available Languages:</span>
            <span className="ml-2 font-medium text-slate-900 dark:text-white">
              {availableLanguages.length}
            </span>
          </div>
        </div>
      </div>

      {/* Formatting Examples */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          {t('i18n.formatting.examples', {}, 'Formatting Examples')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date & Time Formatting */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-slate-900 dark:text-white">
                {t('i18n.date.time', {}, 'Date & Time')}
              </h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Date:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatDate(demoData.currentDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Time:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatTime(demoData.currentTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Number Formatting */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Hash className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-slate-900 dark:text-white">
                {t('i18n.numbers', {}, 'Numbers')}
              </h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Large Number:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatNumber(demoData.largeNumber)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Donors:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatNumber(donorCount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Currency Formatting */}
        <div className="mt-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-slate-900 dark:text-white">
              {t('i18n.currency', {}, 'Currency Formatting')}
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {demoData.currencies.map((item, index) => (
              <div key={index} className="text-center">
                <div className="font-medium text-slate-900 dark:text-white">
                  {formatCurrency(item.amount, item.currency)}
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {item.currency}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pluralization Demo */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          {t('i18n.pluralization', {}, 'Pluralization Demo')}
        </h3>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <div className="flex items-center space-x-4 mb-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('i18n.donor.count', {}, 'Donor Count:')}
            </label>
            <input
              type="number"
              value={donorCount}
              onChange={(e) => setDonorCount(parseInt(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              min="0"
              max="100"
            />
          </div>
          <div className="text-lg font-medium text-slate-900 dark:text-white">
            {plural(donorCount, 
              t('i18n.donor.singular', {}, '{{count}} donor is available'),
              t('i18n.donor.plural', {}, '{{count}} donors are available')
            ).replace('{{count}}', donorCount)}
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          {t('i18n.features', {}, 'I18n Features')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <IconComponent className={`w-5 h-5 mt-0.5 ${feature.color}`} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Implementation Notes:</p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-400">
              <li>• Language preference is stored in localStorage and persists across sessions</li>
              <li>• Automatic browser language detection on first visit</li>
              <li>• Fallback to English for missing translations</li>
              <li>• Support for RTL languages with automatic text direction</li>
              <li>• Locale-aware formatting using Intl API</li>
              <li>• Extensible translation system with parameter interpolation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default I18nDemo;