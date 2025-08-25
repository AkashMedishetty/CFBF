import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import logger from '../../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Log error details
    logger.error('React Error Boundary caught an error', 'ERROR_BOUNDARY', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Report to error tracking service if available
    if (window.reportError) {
      window.reportError(error, errorInfo, errorId);
    }
  }

  handleRetry = () => {
    logger.info('User attempting to retry after error', 'ERROR_BOUNDARY', {
      errorId: this.state.errorId
    });
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    logger.info('User navigating to home after error', 'ERROR_BOUNDARY', {
      errorId: this.state.errorId
    });
    
    window.location.href = '/';
  };

  handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const bugReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Create mailto link with bug report
    const subject = encodeURIComponent(`Bug Report - Error ID: ${errorId}`);
    const body = encodeURIComponent(`
Error Details:
${JSON.stringify(bugReport, null, 2)}

Please describe what you were doing when this error occurred:
[Your description here]
    `);
    
    window.open(`mailto:support@callforbloodfoundation.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl w-full"
          >
            <Card className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Oops! Something went wrong
                </h1>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We encountered an unexpected error. Don't worry, our team has been notified 
                  and we're working to fix this issue.
                </p>

                {errorId && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Error ID: <code className="font-mono text-red-600">{errorId}</code>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Please include this ID when reporting the issue
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                  <Button
                    onClick={this.handleRetry}
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Try Again</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={this.handleGoHome}
                    className="flex items-center space-x-2"
                  >
                    <Home className="w-4 h-4" />
                    <span>Go Home</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={this.handleReportBug}
                    className="flex items-center space-x-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <Bug className="w-4 h-4" />
                    <span>Report Bug</span>
                  </Button>
                </div>

                {/* Development Error Details */}
                {isDevelopment && error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.6 }}
                    className="text-left bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <h3 className="text-sm font-semibold text-red-800 mb-2">
                      Development Error Details:
                    </h3>
                    <pre className="text-xs text-red-700 overflow-auto max-h-40">
                      {error.message}
                      {'\n\n'}
                      {error.stack}
                    </pre>
                  </motion.div>
                )}

                <div className="mt-6 text-xs text-gray-500">
                  <p>
                    If this problem persists, please contact our support team at{' '}
                    <a 
                      href="mailto:support@callforbloodfoundation.com" 
                      className="text-blue-600 hover:underline"
                    >
                      support@callforbloodfoundation.com
                    </a>
                  </p>
                </div>
              </motion.div>
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for functional components
export const withErrorBoundary = (Component, fallback) => {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Hook for error reporting in functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error, errorInfo = {}) => {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    logger.error('Manual error report', 'ERROR_HANDLER', {
      error: error.message || error,
      stack: error.stack,
      errorId,
      ...errorInfo
    });

    // Report to error tracking service if available
    if (window.reportError) {
      window.reportError(error, errorInfo, errorId);
    }

    return errorId;
  }, []);

  return { handleError };
};

export default ErrorBoundary;