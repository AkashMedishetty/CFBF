/**
 * Security Demo Component
 * Demonstrates implemented security measures and protections
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Key,
  Globe,
  FileText,
  Clock,
  Zap,
  Info
} from 'lucide-react';

import security from '../../utils/security';
import MobileOptimizedInput from '../ui/MobileOptimizedInput';

const SecurityDemo = () => {
  const [securityReport, setSecurityReport] = useState(null);
  const [testInput, setTestInput] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [rateLimitTest, setRateLimitTest] = useState({ count: 0, blocked: false });

  const securityFeatures = [
    {
      title: 'CSRF Protection',
      description: 'Cross-Site Request Forgery protection with secure tokens',
      icon: Shield,
      color: 'text-green-600',
      status: 'active'
    },
    {
      title: 'Content Security Policy',
      description: 'Prevents XSS attacks and unauthorized script execution',
      icon: FileText,
      color: 'text-blue-600',
      status: 'active'
    },
    {
      title: 'Input Validation & Sanitization',
      description: 'Comprehensive input validation and XSS prevention',
      icon: Eye,
      color: 'text-purple-600',
      status: 'active'
    },
    {
      title: 'Rate Limiting',
      description: 'Prevents abuse and brute force attacks',
      icon: Clock,
      color: 'text-orange-600',
      status: 'active'
    },
    {
      title: 'Secure Token Storage',
      description: 'Encrypted storage for sensitive data',
      icon: Key,
      color: 'text-red-600',
      status: 'active'
    },
    {
      title: 'Network Monitoring',
      description: 'Monitors and validates all network requests',
      icon: Globe,
      color: 'text-teal-600',
      status: 'active'
    },
    {
      title: 'DOM Monitoring',
      description: 'Detects and prevents malicious DOM modifications',
      icon: Zap,
      color: 'text-indigo-600',
      status: 'active'
    },
    {
      title: 'Security Event Logging',
      description: 'Comprehensive logging of security-related events',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      status: 'active'
    }
  ];

  const testInputs = [
    { label: 'Normal Text', value: 'Hello World', expected: 'valid' },
    { label: 'XSS Attempt', value: '<script>alert("xss")</script>', expected: 'invalid' },
    { label: 'SQL Injection', value: "'; DROP TABLE users; --", expected: 'invalid' },
    { label: 'JavaScript URL', value: 'data:text/html,<script>alert("xss")</script>', expected: 'invalid' },
    { label: 'Event Handler', value: '<img onerror="alert(1)" src="x">', expected: 'invalid' },
    { label: 'Valid Email', value: 'user@example.com', expected: 'valid' }
  ];

  useEffect(() => {
    loadSecurityReport();
  }, []);

  const loadSecurityReport = () => {
    const report = security.getSecurityReport();
    setSecurityReport(report);
  };

  const handleInputValidation = (input) => {
    setTestInput(input);
    
    if (input.trim()) {
      const result = security.validateInput(input, 'text', {
        maxLength: 100,
        allowHTML: false
      });
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  };

  const testRateLimit = () => {
    const allowed = security.checkRateLimit('demo_test', 5, 10000); // 5 requests per 10 seconds
    
    setRateLimitTest(prev => ({
      count: prev.count + 1,
      blocked: !allowed
    }));
    
    if (!allowed) {
      setTimeout(() => {
        setRateLimitTest({ count: 0, blocked: false });
      }, 10000);
    }
  };

  const testSecureStorage = () => {
    const testData = { message: 'This is encrypted data', timestamp: Date.now() };
    
    // Store encrypted
    const stored = security.secureStore('demo_data', testData, true);
    
    if (stored) {
      // Retrieve and decrypt
      const retrieved = security.secureRetrieve('demo_data', true);
      
      if (retrieved) {
        alert(`Secure storage test successful!\nOriginal: ${JSON.stringify(testData)}\nRetrieved: ${JSON.stringify(retrieved)}`);
      } else {
        alert('Failed to retrieve encrypted data');
      }
    } else {
      alert('Failed to store encrypted data');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Security Measures Demo
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Comprehensive client-side security implementation with real-time monitoring and protection.
        </p>
      </div>

      {/* Security Status */}
      {securityReport && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Security Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-900 dark:text-green-100">CSRF Token</h4>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                {securityReport.csrfToken}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-900 dark:text-blue-100">HTTPS</h4>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {securityReport.isHTTPS ? 'Enabled' : 'Disabled'}
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-purple-900 dark:text-purple-100">CSP</h4>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                {securityReport.hasCSP ? 'Active' : 'Inactive'}
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h4 className="font-medium text-orange-900 dark:text-orange-100">Events</h4>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {securityReport.securityEvents.length} Recent
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Features */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Implemented Security Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {securityFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div className={`p-2 rounded-lg bg-white dark:bg-slate-700 ${feature.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                      {feature.title}
                    </h4>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Input Validation Demo */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Input Validation & Sanitization Demo
        </h3>
        <div className="space-y-4">
          <div>
            <MobileOptimizedInput
              label="Test Input (try entering malicious code)"
              value={testInput}
              onChange={handleInputValidation}
              placeholder="Enter text to test validation..."
              error={validationResult && !validationResult.isValid ? validationResult.error : null}
              success={validationResult && validationResult.isValid ? 'Input is safe' : null}
            />
          </div>

          {validationResult && (
            <div className={`p-4 rounded-lg ${
              validationResult.isValid 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <h4 className={`font-medium mb-2 ${
                validationResult.isValid ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
              }`}>
                Validation Result
              </h4>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 ${
                    validationResult.isValid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    {validationResult.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
                {validationResult.error && (
                  <div>
                    <span className="font-medium">Error:</span>
                    <span className="ml-2 text-red-700 dark:text-red-300">
                      {validationResult.error}
                    </span>
                  </div>
                )}
                {validationResult.sanitized && (
                  <div>
                    <span className="font-medium">Sanitized:</span>
                    <span className="ml-2 font-mono text-slate-700 dark:text-slate-300">
                      {validationResult.sanitized}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Input Examples */}
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">
              Try these test inputs:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {testInputs.map((test, index) => (
                <button
                  key={index}
                  onClick={() => handleInputValidation(test.value)}
                  className="text-left p-2 bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="font-medium text-sm text-slate-900 dark:text-white">
                    {test.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {test.value.length > 30 ? test.value.substring(0, 30) + '...' : test.value}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limiting Demo */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Rate Limiting Demo
        </h3>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Click the button to test rate limiting (5 requests per 10 seconds)
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Requests: {rateLimitTest.count} | Status: {rateLimitTest.blocked ? 'Blocked' : 'Allowed'}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={testRateLimit}
              disabled={rateLimitTest.blocked}
              className={`px-4 py-2 rounded-lg font-medium transition-colors touch-manipulation ${
                rateLimitTest.blocked
                  ? 'bg-red-600 text-white cursor-not-allowed opacity-50'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {rateLimitTest.blocked ? 'Rate Limited' : 'Test Request'}
            </motion.button>
          </div>
          
          {rateLimitTest.blocked && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                Rate limit exceeded! Please wait 10 seconds before trying again.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Secure Storage Demo */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Secure Storage Demo
        </h3>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Test encrypted storage and retrieval of sensitive data
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={testSecureStorage}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors touch-manipulation"
          >
            Test Secure Storage
          </motion.button>
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Security Implementation Notes:</p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-400">
              <li>• CSRF tokens are automatically added to all state-changing requests</li>
              <li>• Content Security Policy prevents unauthorized script execution</li>
              <li>• All user inputs are validated and sanitized before processing</li>
              <li>• Rate limiting prevents abuse and brute force attacks</li>
              <li>• Sensitive data is encrypted before storage in localStorage</li>
              <li>• DOM and network monitoring detect suspicious activities</li>
              <li>• Security events are logged for monitoring and analysis</li>
              <li>• HTTPS enforcement and clickjacking protection included</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDemo;