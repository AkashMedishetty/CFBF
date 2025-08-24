/**
 * React Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { motion } from 'framer-motion';
import logger from '../../utils/logger';
import errorHandler from '../../utils/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    const errorId = errorHandler.handleError(error, {
      type: 'react_error_boundary',
      source: 'error_boundary',
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unknown'
    });

    logger.error('Error caught by Error Boundary', 'ERROR_BOUNDARY', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId
    });

    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Report to external service if configured
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }));

    logger.info('Error boundary retry attempted', 'ERROR_BOUNDARY', {
      retryCount: this.state.retryCount + 1
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportIssue = () => {
    const { error, errorInfo, errorId } = this.state;
    
    // Create issue report
    const report = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    // In a real app, this would open a support form or send to an issue tracker
    const subject = encodeURIComponent(`Error Report: ${error?.message || 'Unknown Error'}`);
    const body = encodeURIComponent(`Error ID: ${errorId}\n\nPlease describe what you were doing when this error occurred:\n\n\n\nTechnical Details:\n${JSON.stringify(report, null, 2)}`);
    
    window.open(`mailto:support@callforblood.org?subject=${subject}&body=${body}`, '_self');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.handleRetry);
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center"
          >
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            {/* Error Message */}
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {this.props.message || 
                'An unexpected error occurred. We apologize for the inconvenience.'}
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-left">
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                  Error Details:
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 font-mono mb-2">
                  {this.state.error.message}
                </p>
                {this.state.errorId && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Error ID: {this.state.errorId}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Retry Button */}
              {this.state.retryCount < 3 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors touch-manipulation"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </motion.button>
              )}

              {/* Reload Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={this.handleReload}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors touch-manipulation"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </motion.button>

              {/* Go Home Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors touch-manipulation"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </motion.button>

              {/* Report Issue Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={this.handleReportIssue}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors touch-manipulation"
              >
                <Bug className="w-4 h-4" />
                <span>Report Issue</span>
              </motion.button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-dark-border">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                If this problem persists, please contact our support team.
              </p>
              {this.state.errorId && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Reference ID: {this.state.errorId}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for error boundary context
export const useErrorHandler = () => {
  const reportError = (error, context = {}) => {
    return errorHandler.handleError(error, {
      ...context,
      source: 'user_reported'
    });
  };

  const reportUserError = (message, context = {}) => {
    return errorHandler.reportUserError(message, context);
  };

  return {
    reportError,
    reportUserError
  };
};

export default ErrorBoundary;