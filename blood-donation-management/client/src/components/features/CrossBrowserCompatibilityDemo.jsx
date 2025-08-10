/**
 * Cross-Browser Compatibility Demo Component
 * Demonstrates browser compatibility features and accessibility compliance
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Monitor as BrowserIcon, 
  Globe, 


  CheckCircle, 
  XCircle,
  AlertTriangle,
  Eye,
  Keyboard,
  Volume2,
  Contrast,
  Accessibility,
  TestTube,
  Settings,
  Info,
  Zap
} from 'lucide-react';

import browserCompatibility from '../../utils/browserCompatibility';
import accessibilityManager from '../../utils/accessibilityManager';
import accessibilityTester from '../../utils/accessibilityTester';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation';

const CrossBrowserCompatibilityDemo = () => {
  const [activeTab, setActiveTab] = useState('browser-info');
  const [compatibilityReport, setCompatibilityReport] = useState(null);
  const [accessibilityReport, setAccessibilityReport] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const { containerRef } = useKeyboardNavigation({
    enableArrowKeys: true,
    enableEscapeHandling: true
  });

  const tabs = [
    { id: 'browser-info', name: 'Browser Info', icon: Monitor },
    { id: 'compatibility', name: 'Compatibility', icon: CheckCircle },
    { id: 'accessibility', name: 'Accessibility', icon: Accessibility },
    { id: 'testing', name: 'A11y Testing', icon: TestTube },
    { id: 'features', name: 'Features', icon: Zap }
  ];

  useEffect(() => {
    // Load initial data
    loadCompatibilityData();
  }, []);

  const loadCompatibilityData = () => {
    const report = browserCompatibility.getCompatibilityReport();
    setCompatibilityReport(report);
    
    const a11yReport = accessibilityManager.getAccessibilityReport();
    setAccessibilityReport(a11yReport);
  };

  const runAccessibilityTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await accessibilityTester.runAllTests();
      setTestResults(results);
      accessibilityManager.announce('Accessibility tests completed', 'polite');
    } catch (error) {
      console.error('Accessibility tests failed:', error);
      accessibilityManager.announce('Accessibility tests failed', 'assertive');
    } finally {
      setIsRunningTests(false);
    }
  };

  const getBrowserIcon = (browserName) => {
    const icons = {
      chrome: BrowserIcon,
      firefox: Globe,
      safari: BrowserIcon,
      edge: BrowserIcon
    };
    return icons[browserName] || Monitor;
  };

  const getFeatureStatus = (supported) => {
    return supported ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'browser-info':
        return (
          <div className="space-y-6">
            {compatibilityReport && (
              <>
                {/* Browser Information */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                    {React.createElement(getBrowserIcon(compatibilityReport.browser.name), { className: "w-5 h-5 mr-2" })}
                    Browser Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Browser Details</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Name:</span>
                          <span className="font-medium capitalize">{compatibilityReport.browser.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Version:</span>
                          <span className="font-medium">{compatibilityReport.browser.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Engine:</span>
                          <span className="font-medium capitalize">{compatibilityReport.browser.engine}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Platform:</span>
                          <span className="font-medium">
                            {compatibilityReport.browser.isMobile ? 'Mobile' : 
                             compatibilityReport.browser.isTablet ? 'Tablet' : 'Desktop'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Compatibility Score</h5>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              compatibilityReport.compatibilityScore >= 80 ? 'bg-green-500' :
                              compatibilityReport.compatibilityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${compatibilityReport.compatibilityScore}%` }}
                          />
                        </div>
                        <span className="font-bold text-lg">
                          {compatibilityReport.compatibilityScore}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Based on supported web features
                      </p>
                    </div>
                  </div>
                </div>

                {/* Device Information */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" />
                    Device Capabilities
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {navigator.hardwareConcurrency || 'N/A'}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">CPU Cores</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'N/A'}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">Device Memory</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {navigator.connection?.effectiveType || 'N/A'}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">Connection</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'compatibility':
        return (
          <div className="space-y-6">
            {compatibilityReport && (
              <>
                {/* Feature Support Grid */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                    Web Feature Support
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(compatibilityReport.features).map(([feature, supported]) => (
                      <div key={feature} className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {feature.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        {getFeatureStatus(supported)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unsupported Features */}
                {compatibilityReport.unsupportedFeatures.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-4 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Unsupported Features
                    </h4>
                    <div className="space-y-2">
                      {compatibilityReport.unsupportedFeatures.map((feature) => (
                        <div key={feature} className="flex items-center space-x-2">
                          <XCircle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800 dark:text-yellow-200 capitalize">
                            {feature.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Polyfills Loaded */}
                {compatibilityReport.polyfillsLoaded.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Polyfills Loaded
                    </h4>
                    <div className="space-y-2">
                      {compatibilityReport.polyfillsLoaded.map((polyfill) => (
                        <div key={polyfill} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800 dark:text-green-200 capitalize">
                            {polyfill.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'accessibility':
        return (
          <div className="space-y-6">
            {/* Accessibility Features */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                <Accessibility className="w-5 h-5 mr-2" />
                Accessibility Features
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Keyboard className="w-5 h-5 text-blue-600" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Keyboard Navigation</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Full keyboard support with focus management
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-5 h-5 text-green-600" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Screen Reader Support</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        ARIA labels and live regions for announcements
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-purple-600" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Focus Indicators</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Visible focus indicators for all interactive elements
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Contrast className="w-5 h-5 text-red-600" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Color Contrast</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        WCAG AA compliant color contrast ratios
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-yellow-600" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Reduced Motion</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Respects user's motion preferences
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Touch Targets</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Minimum 44px touch targets for mobile
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accessibility Report */}
            {accessibilityReport && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">
                  Current Accessibility Status
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {accessibilityReport.focusableElementsCount}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Focusable Elements</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {accessibilityReport.announcements.length}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Announcements Made</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {accessibilityReport.hasSkipLink ? 'Yes' : 'No'}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Skip Link Present</div>
                  </div>
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-4">
                Keyboard Shortcuts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800 dark:text-green-200">Skip to main content</span>
                    <kbd className="px-2 py-1 bg-green-200 dark:bg-green-800 rounded text-xs">Alt + 1</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800 dark:text-green-200">Skip to navigation</span>
                    <kbd className="px-2 py-1 bg-green-200 dark:bg-green-800 rounded text-xs">Alt + 2</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800 dark:text-green-200">Emergency request</span>
                    <kbd className="px-2 py-1 bg-green-200 dark:bg-green-800 rounded text-xs">Alt + E</kbd>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800 dark:text-green-200">Search</span>
                    <kbd className="px-2 py-1 bg-green-200 dark:bg-green-800 rounded text-xs">Ctrl + K</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800 dark:text-green-200">Close modal/dropdown</span>
                    <kbd className="px-2 py-1 bg-green-200 dark:bg-green-800 rounded text-xs">Escape</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800 dark:text-green-200">Navigate lists</span>
                    <kbd className="px-2 py-1 bg-green-200 dark:bg-green-800 rounded text-xs">Arrow Keys</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'testing':
        return (
          <div className="space-y-6">
            {/* Test Controls */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <TestTube className="w-5 h-5 mr-2" />
                  Accessibility Testing
                </h4>
                <button
                  onClick={runAccessibilityTests}
                  disabled={isRunningTests}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRunningTests ? 'Running Tests...' : 'Run A11y Tests'}
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Run comprehensive accessibility tests to identify WCAG compliance issues.
              </p>
            </div>

            {/* Test Results */}
            {testResults && (
              <>
                {/* Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                    Test Results Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {testResults.summary.score}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Accessibility Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {testResults.summary.passedTests}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Tests Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {testResults.summary.errorCount}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                        {testResults.summary.warningCount}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Warnings</div>
                    </div>
                  </div>
                </div>

                {/* Issues List */}
                {testResults.issues.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                      Issues Found ({testResults.issues.length})
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {testResults.issues.map((issue, index) => (
                        <div key={index} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className={`font-medium ${getSeverityColor(issue.severity)}`}>
                              {issue.issue}
                            </h5>
                            <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                              WCAG {issue.wcag}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {issue.suggestion}
                          </p>
                          {issue.element && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-700 p-2 rounded">
                              {issue.element.tagName.toLowerCase()}
                              {issue.element.className && `.${issue.element.className.split(' ').join('.')}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {testResults.recommendations.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">
                      Recommendations
                    </h4>
                    <div className="space-y-3">
                      {testResults.recommendations.slice(0, 5).map((rec, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            rec.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}>
                            {rec.priority}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-blue-900 dark:text-blue-100">
                              {rec.type} ({rec.count} issues)
                            </h5>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              {rec.suggestion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Loading State */}
            {isRunningTests && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Running accessibility tests...
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 'features':
        return (
          <div className="space-y-6">
            {/* Implementation Features */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                Cross-Browser Compatibility Features
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Browser Detection</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Automatic browser and version detection with feature support mapping
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Polyfill Loading</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Automatic polyfill loading for missing browser features
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Graceful Degradation</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Fallback functionality for unsupported features
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">CSS Compatibility</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Browser-specific CSS classes and vendor prefixes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Event Handling</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Cross-browser event handling and touch support
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-slate-900 dark:text-white">Performance Monitoring</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Browser-specific performance optimization
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accessibility Features */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-4">
                Accessibility Compliance Features
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-green-900 dark:text-green-100">WCAG 2.1 AA Compliance</h5>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Full compliance with Web Content Accessibility Guidelines
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-green-900 dark:text-green-100">Automated Testing</h5>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Comprehensive automated accessibility testing suite
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-green-900 dark:text-green-100">Semantic HTML</h5>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Proper semantic structure with landmarks and headings
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-green-900 dark:text-green-100">ARIA Implementation</h5>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Comprehensive ARIA labels and live regions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-green-900 dark:text-green-100">Keyboard Navigation</h5>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Full keyboard navigation with focus management
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-green-900 dark:text-green-100">Screen Reader Support</h5>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Optimized for all major screen readers
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Browser Support Matrix */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                Browser Support Matrix
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-600">
                      <th className="text-left py-2">Feature</th>
                      <th className="text-center py-2">Chrome</th>
                      <th className="text-center py-2">Firefox</th>
                      <th className="text-center py-2">Safari</th>
                      <th className="text-center py-2">Edge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                    <tr>
                      <td className="py-2">Service Worker</td>
                      <td className="text-center py-2"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-2"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-2"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-2"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-2">Push Notifications</td>
                      <td className="text-center py-2"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-2"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-2"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></td>
                      <td className="text-center py-2"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-2">IndexedDB</td>
                      <td className="text-center py-2"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-2"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-2"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-2"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-2">Web Share API</td>
                      <td className="text-center py-2"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-2"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></td>
                      <td className="text-center py-2"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-2"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Cross-Browser Compatibility & Accessibility
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Comprehensive browser compatibility and WCAG 2.1 AA accessibility compliance implementation.
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
                  aria-controls={`${tab.id}-panel`}
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
      <div role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={activeTab}>
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

      {/* Technical Implementation Summary */}
      <div className="mt-8 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          Technical Implementation Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Automatic browser detection and feature support mapping</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Dynamic polyfill loading for missing features</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>WCAG 2.1 AA compliance with automated testing</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Comprehensive keyboard navigation support</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>ARIA labels and live regions for screen readers</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Color contrast validation and optimization</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Touch target optimization for mobile devices</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Reduced motion preference support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrossBrowserCompatibilityDemo;