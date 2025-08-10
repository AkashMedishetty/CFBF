/**
 * Multi-Language Support Demo Component
 * Demonstrates internationalization features and language switching
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Calendar, 
  DollarSign, 
  Clock, 
  Users, 
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Heart,
  Phone,
  MapPin
} from 'lucide-react';

import { useI18n, useTranslation } from '../../hooks/useI18n';
import LanguageSwitcher from '../ui/LanguageSwitcher';

const MultiLanguageDemo = () => {
  const { 
    t, 
    currentLanguage, 
    supported, 
    isRTL, 
    directionClass,
    formatNumber, 
    formatCurrency, 
    formatDate, 
    formatRelativeTime 
  } = useI18n();
  
  const { t: tEmergency } = useTranslation('emergency');
  const { t: tAuth } = useTranslation('auth');
  const { t: tDonor } = useTranslation('donor');
  
  const [activeTab, setActiveTab] = useState('overview');
  const [sampleData, setSampleData] = useState({
    donorCount: 15420,
    requestsToday: 47,
    successRate: 0.94,
    lastDonation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    nextAppointment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    donationAmount: 250,
    emergencyRequests: [
      {
        id: 1,
        bloodType: 'O-',
        urgency: 'critical',
        hospital: 'City General Hospital',
        location: 'Downtown',
        timeAgo: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
      },
      {
        id: 2,
        bloodType: 'A+',
        urgency: 'urgent',
        hospital: 'Regional Medical Center',
        location: 'Uptown',
        timeAgo: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
      }
    ]
  });

  const tabs = [
    { id: 'overview', name: t('nav.dashboard'), icon: Globe },
    { id: 'emergency', name: t('nav.emergency'), icon: Heart },
    { id: 'formatting', name: 'Formatting', icon: Calendar },
    { id: 'rtl', name: 'RTL Support', icon: MessageCircle },
    { id: 'features', name: 'Features', icon: Zap }
  ];

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'urgent': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      default: return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Language Info */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                {t('common.currentLanguage', { language: supported.find(l => l.code === currentLanguage)?.nativeName })}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {supported.find(l => l.code === currentLanguage)?.flag}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {supported.find(l => l.code === currentLanguage)?.nativeName}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {isRTL ? 'RTL' : 'LTR'}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Text Direction
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {supported.length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Supported Languages
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('donor.totalDonors', { count: sampleData.donorCount })}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formatNumber(sampleData.donorCount)}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('emergency.requestsToday')}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formatNumber(sampleData.requestsToday)}
                    </p>
                  </div>
                  <Heart className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('common.successRate')}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {Math.round(sampleData.successRate * 100)}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('donor.lastDonation')}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formatRelativeTime(sampleData.lastDonation)}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Language Switcher Demo */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">
                Language Switcher Variants
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800 dark:text-blue-200">Dropdown (Default):</span>
                  <LanguageSwitcher variant="dropdown" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800 dark:text-blue-200">Compact:</span>
                  <LanguageSwitcher variant="compact" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800 dark:text-blue-200">Inline:</span>
                  <LanguageSwitcher variant="inline" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'emergency':
        return (
          <div className="space-y-6">
            {/* Emergency Form Demo */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-600" />
                {tEmergency('title')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {tEmergency('bloodType')}
                  </label>
                  <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                    <option value="O-">{t('bloodType.oNegative')}</option>
                    <option value="O+">{t('bloodType.oPositive')}</option>
                    <option value="A-">{t('bloodType.aNegative')}</option>
                    <option value="A+">{t('bloodType.aPositive')}</option>
                    <option value="B-">{t('bloodType.bNegative')}</option>
                    <option value="B+">{t('bloodType.bPositive')}</option>
                    <option value="AB-">{t('bloodType.abNegative')}</option>
                    <option value="AB+">{t('bloodType.abPositive')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {tEmergency('urgency')}
                  </label>
                  <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                    <option value="critical">{tEmergency('critical')}</option>
                    <option value="urgent">{tEmergency('urgent')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {tEmergency('hospital')}
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder={tEmergency('hospital')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {tEmergency('contact')}
                  </label>
                  <input 
                    type="tel" 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder={tEmergency('contact')}
                  />
                </div>
              </div>
              <button className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                {tEmergency('submit')}
              </button>
            </div>

            {/* Emergency Requests List */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                {t('emergency.activeRequests')}
              </h4>
              <div className="space-y-4">
                {sampleData.emergencyRequests.map((request) => (
                  <div key={request.id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                            {tEmergency(request.urgency)}
                          </span>
                          <span className="font-semibold text-lg text-slate-900 dark:text-white">
                            {request.bloodType}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {request.hospital} - {request.location}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {formatRelativeTime(request.timeAgo)}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                          {t('common.accept')}
                        </button>
                        <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'formatting':
        return (
          <div className="space-y-6">
            {/* Number Formatting */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Number & Currency Formatting
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Numbers</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Raw: 1234567.89</span>
                        <span className="font-mono">{formatNumber(1234567.89)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Donors: {sampleData.donorCount}</span>
                        <span className="font-mono">{formatNumber(sampleData.donorCount)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Currency</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">USD:</span>
                        <span className="font-mono">{formatCurrency(sampleData.donationAmount, 'USD')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">EUR:</span>
                        <span className="font-mono">{formatCurrency(sampleData.donationAmount, 'EUR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">INR:</span>
                        <span className="font-mono">{formatCurrency(sampleData.donationAmount, 'INR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Dates</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Today:</span>
                        <span className="font-mono">{formatDate(new Date())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Last Donation:</span>
                        <span className="font-mono">{formatDate(sampleData.lastDonation)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Next Appointment:</span>
                        <span className="font-mono">{formatDate(sampleData.nextAppointment)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Relative Time</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Last Donation:</span>
                        <span className="font-mono">{formatRelativeTime(sampleData.lastDonation)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Emergency Request:</span>
                        <span className="font-mono">{formatRelativeTime(sampleData.emergencyRequests[0].timeAgo)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'rtl':
        return (
          <div className="space-y-6">
            {/* RTL Demo */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Right-to-Left (RTL) Support
              </h4>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Current Direction: {isRTL ? 'Right-to-Left (RTL)' : 'Left-to-Right (LTR)'}
                  </h5>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {isRTL 
                      ? 'This text is displayed in RTL mode. Notice how the layout adapts automatically.'
                      : 'This text is displayed in LTR mode. Switch to Arabic to see RTL in action.'
                    }
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
                    <h6 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Form Layout</h6>
                    <div className="space-y-2">
                      <input 
                        type="text" 
                        placeholder={t('auth.email')}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                      <input 
                        type="password" 
                        placeholder={t('auth.password')}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
                    <h6 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Button Layout</h6>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm">
                        {t('common.save')}
                      </button>
                      <button className="px-3 py-1 bg-slate-600 text-white rounded text-sm">
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Language-specific Features */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-4">
                Language-Specific Features
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h5 className="font-medium text-yellow-800 dark:text-yellow-200">RTL Languages</h5>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Arabic (العربية)</li>
                    <li>• Hebrew (עברית)</li>
                    <li>• Persian (فارسی)</li>
                    <li>• Urdu (اردو)</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium text-yellow-800 dark:text-yellow-200">Automatic Adaptations</h5>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Text alignment</li>
                    <li>• Icon positioning</li>
                    <li>• Form layouts</li>
                    <li>• Navigation menus</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-6">
            {/* Implementation Features */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Internationalization Features
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Automatic Language Detection</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Detects user's preferred language from browser settings
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Dynamic Translation Loading</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Loads translations on-demand for better performance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">RTL/LTR Support</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Automatic layout adaptation for right-to-left languages
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Locale-aware Formatting</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Numbers, dates, and currencies formatted per locale
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Pluralization Support</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Handles complex pluralization rules for different languages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Namespace Organization</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Organized translations by feature for better maintainability
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Supported Languages */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-4">
                Supported Languages ({supported.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {supported.map((language) => (
                  <div key={language.code} className="text-center p-3 bg-white dark:bg-green-800/20 rounded-lg">
                    <div className="text-2xl mb-2">{language.flag}</div>
                    <div className="font-medium text-green-900 dark:text-green-100 text-sm">
                      {language.nativeName}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300">
                      {language.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Implementation */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                Technical Implementation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>React hooks for component integration</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Intl API for native formatting</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Automatic fallback to English</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Persistent language preference</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>CSS direction classes for RTL</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Translation interpolation support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Missing translation detection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Performance-optimized loading</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 ${directionClass}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Multi-Language Support System
          </h2>
          <LanguageSwitcher variant="compact" />
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Comprehensive internationalization with {supported.length} supported languages, RTL support, and locale-aware formatting.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-8" role="tablist">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                >
                  <div className="flex items-center space-x-2">
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div role="tabpanel">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MultiLanguageDemo;