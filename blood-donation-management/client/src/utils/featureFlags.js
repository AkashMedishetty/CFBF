// Feature flag configuration
const FEATURE_FLAGS = {
  // Core features that are enabled
  donorRegistration: true,
  homePageRedesign: true,
  privacyProtection: true,
  locationDetection: true,
  pwaSupport: true,
  
  // Features that are temporarily disabled
  bloodRequests: false,
  emergencyServices: false,
  bloodBankDirectory: false,
  hospitalDashboard: false,
  advancedMatching: false,
  phoneVerification: false,
  documentUpload: false,
  whatsappIntegration: false,
  smsNotifications: false,
  emailNotifications: false,
  donorDashboard: false,
  donationHistory: false,
  certificateGeneration: false,
  referralSystem: false,
  analyticsReporting: false,
  adminPanel: false,
  hospitalRegistration: false,
  inventoryManagement: false,
  
  // Development/testing features
  debugMode: process.env.NODE_ENV === 'development',
  mockData: process.env.NODE_ENV === 'development'
};

// Feature flag manager
export const featureFlags = {
  // Check if a feature is enabled
  isEnabled: (featureName) => {
    return FEATURE_FLAGS[featureName] === true;
  },

  // Check if a feature is disabled
  isDisabled: (featureName) => {
    return FEATURE_FLAGS[featureName] === false;
  },

  // Get all enabled features
  getEnabledFeatures: () => {
    return Object.keys(FEATURE_FLAGS).filter(key => FEATURE_FLAGS[key] === true);
  },

  // Get all disabled features
  getDisabledFeatures: () => {
    return Object.keys(FEATURE_FLAGS).filter(key => FEATURE_FLAGS[key] === false);
  },

  // Get feature status
  getFeatureStatus: (featureName) => {
    return FEATURE_FLAGS[featureName];
  },

  // Get all feature flags
  getAllFlags: () => {
    return { ...FEATURE_FLAGS };
  },

  // Enable a feature (for development/testing)
  enableFeature: (featureName) => {
    if (process.env.NODE_ENV === 'development') {
      FEATURE_FLAGS[featureName] = true;
      console.log(`Feature '${featureName}' enabled`);
    }
  },

  // Disable a feature (for development/testing)
  disableFeature: (featureName) => {
    if (process.env.NODE_ENV === 'development') {
      FEATURE_FLAGS[featureName] = false;
      console.log(`Feature '${featureName}' disabled`);
    }
  },

  // Check if user should see a feature
  shouldShowFeature: (featureName, userRole = 'donor') => {
    const isEnabled = featureFlags.isEnabled(featureName);
    
    // Additional role-based checks can be added here
    switch (featureName) {
      case 'adminPanel':
        return isEnabled && userRole === 'admin';
      case 'hospitalDashboard':
        return isEnabled && userRole === 'hospital';
      default:
        return isEnabled;
    }
  }
};

// Feature flag hooks for React components
export const useFeatureFlag = (featureName) => {
  return featureFlags.isEnabled(featureName);
};

export const useFeatureFlags = (featureNames) => {
  const flags = {};
  featureNames.forEach(name => {
    flags[name] = featureFlags.isEnabled(name);
  });
  return flags;
};

// Feature flag component wrapper
export const FeatureFlag = ({ feature, children, fallback = null }) => {
  if (featureFlags.isEnabled(feature)) {
    return children;
  }
  return fallback;
};

// Conditional rendering based on feature flags
export const withFeatureFlag = (WrappedComponent, featureName, FallbackComponent = null) => {
  return (props) => {
    if (featureFlags.isEnabled(featureName)) {
      return <WrappedComponent {...props} />;
    }
    return FallbackComponent ? <FallbackComponent {...props} /> : null;
  };
};

// Feature flag middleware for routes
export const requireFeature = (featureName) => {
  return (Component) => {
    return (props) => {
      if (featureFlags.isEnabled(featureName)) {
        return <Component {...props} />;
      }
      
      // Return a disabled feature message
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-8V7m0 0V5m0 2h2m-2 0H10" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Feature Coming Soon</h2>
              <p className="text-gray-600 mb-4">
                This feature is currently under development and will be available soon.
              </p>
              <button
                onClick={() => window.history.back()}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    };
  };
};

// Debug helper to log feature flags
export const logFeatureFlags = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🚩 Feature Flags Status');
    console.log('Enabled features:', featureFlags.getEnabledFeatures());
    console.log('Disabled features:', featureFlags.getDisabledFeatures());
    console.log('All flags:', featureFlags.getAllFlags());
    console.groupEnd();
  }
};

// Initialize feature flags logging in development
if (process.env.NODE_ENV === 'development') {
  logFeatureFlags();
}

export default featureFlags;