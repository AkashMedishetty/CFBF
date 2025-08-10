/**
 * Analytics Hook
 * React hook for easy analytics integration
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from '../utils/analytics';
import logger from '../utils/logger';

export const useAnalytics = (options = {}) => {
  const location = useLocation();
  const previousLocation = useRef(location);
  const {
    trackPageViews = true,
    trackPerformance = true,
    userId = null
  } = options;

  // Set user ID
  useEffect(() => {
    if (userId) {
      analytics.setUserId(userId);
    }
  }, [userId]);

  // Track page views
  useEffect(() => {
    if (trackPageViews && location !== previousLocation.current) {
      const pageTitle = document.title;
      analytics.trackPageView(location.pathname + location.search, pageTitle);
      previousLocation.current = location;
    }
  }, [location, trackPageViews]);

  // Track component performance
  const trackComponentPerformance = useCallback((componentName, renderTime) => {
    if (trackPerformance) {
      analytics.trackPerformance(`component_render_${componentName}`, renderTime, {
        component: componentName,
        path: location.pathname
      });
    }
  }, [trackPerformance, location.pathname]);

  // Track user interactions
  const trackInteraction = useCallback((type, element, details = {}) => {
    analytics.trackInteraction(type, element, {
      ...details,
      path: location.pathname
    });
  }, [location.pathname]);

  // Track feature usage
  const trackFeature = useCallback((featureName, action = 'used', metadata = {}) => {
    analytics.trackFeatureUsage(featureName, action, {
      ...metadata,
      path: location.pathname
    });
  }, [location.pathname]);

  // Track custom events
  const track = useCallback((eventName, properties = {}) => {
    analytics.track(eventName, {
      ...properties,
      path: location.pathname
    });
  }, [location.pathname]);

  // Track PWA events
  const trackPWA = useCallback((eventType, data = {}) => {
    analytics.trackPWAEvent(eventType, data);
  }, []);

  // Track notifications
  const trackNotification = useCallback((eventType, notificationData = {}) => {
    analytics.trackNotification(eventType, notificationData);
  }, []);

  // Track emergency requests
  const trackEmergencyRequest = useCallback((eventType, requestData = {}) => {
    analytics.trackEmergencyRequest(eventType, requestData);
  }, []);

  // Track donor responses
  const trackDonorResponse = useCallback((eventType, responseData = {}) => {
    analytics.trackDonorResponse(eventType, responseData);
  }, []);

  return {
    track,
    trackInteraction,
    trackFeature,
    trackPWA,
    trackNotification,
    trackEmergencyRequest,
    trackDonorResponse,
    trackComponentPerformance,
    analytics
  };
};

// Hook for component performance tracking
export const useComponentPerformance = (componentName) => {
  const { trackComponentPerformance } = useAnalytics();
  const startTime = useRef(null);

  useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current;
        trackComponentPerformance(componentName, renderTime);
      }
    };
  }, [componentName, trackComponentPerformance]);
};

// Hook for tracking user engagement
export const useEngagementTracking = () => {
  const { track } = useAnalytics();

  const trackEngagement = useCallback((engagementType, data = {}) => {
    track('user_engagement', {
      engagementType,
      ...data,
      timestamp: Date.now()
    });
  }, [track]);

  const trackTimeSpent = useCallback((startTime, endTime, context = {}) => {
    const duration = endTime - startTime;
    track('time_spent', {
      duration,
      ...context
    });
  }, [track]);

  const trackScrollDepth = useCallback((depth, maxDepth = 100) => {
    const percentage = Math.round((depth / maxDepth) * 100);
    track('scroll_depth', {
      depth,
      percentage,
      maxDepth
    });
  }, [track]);

  return {
    trackEngagement,
    trackTimeSpent,
    trackScrollDepth
  };
};

// Hook for error tracking
export const useErrorTracking = () => {
  const { track } = useAnalytics();

  const trackError = useCallback((error, context = {}) => {
    track('application_error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    });
    
    logger.error('Error tracked via analytics', 'ANALYTICS', { error, context });
  }, [track]);

  const trackUserError = useCallback((errorMessage, context = {}) => {
    track('user_reported_error', {
      message: errorMessage,
      ...context
    });
  }, [track]);

  return {
    trackError,
    trackUserError
  };
};

// Hook for conversion tracking
export const useConversionTracking = () => {
  const { track } = useAnalytics();

  const trackConversion = useCallback((conversionType, value = null, metadata = {}) => {
    track('conversion', {
      conversionType,
      value,
      ...metadata,
      timestamp: Date.now()
    });
  }, [track]);

  const trackGoal = useCallback((goalName, goalValue = null, metadata = {}) => {
    track('goal_completion', {
      goalName,
      goalValue,
      ...metadata,
      timestamp: Date.now()
    });
  }, [track]);

  return {
    trackConversion,
    trackGoal
  };
};

// Hook for A/B testing
export const useABTesting = () => {
  const { track } = useAnalytics();

  const trackExperiment = useCallback((experimentName, variant, metadata = {}) => {
    track('ab_test_exposure', {
      experimentName,
      variant,
      ...metadata
    });
  }, [track]);

  const trackExperimentConversion = useCallback((experimentName, variant, conversionType, metadata = {}) => {
    track('ab_test_conversion', {
      experimentName,
      variant,
      conversionType,
      ...metadata
    });
  }, [track]);

  return {
    trackExperiment,
    trackExperimentConversion
  };
};

// Higher-order component for analytics
export const withAnalytics = (Component, options = {}) => {
  const WrappedComponent = (props) => {
    const analyticsProps = useAnalytics(options);
    return <Component {...props} {...analyticsProps} />;
  };

  WrappedComponent.displayName = `withAnalytics(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default useAnalytics;