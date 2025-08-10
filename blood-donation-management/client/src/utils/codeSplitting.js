/**
 * Code Splitting Utility
 * Enhanced lazy loading with error boundaries and loading states
 */

import React, { Suspense, lazy } from 'react';
import performanceMonitor from './performanceMonitor';

class CodeSplittingManager {
  constructor() {
    this.loadedChunks = new Set();
    this.failedChunks = new Set();
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    
    // Component cache for faster subsequent loads
    this.componentCache = new Map();
  }

  // Create lazy component with enhanced error handling
  createLazyComponent(importFunction, options = {}) {
    const {
      fallback = null,
      errorFallback = null,
      retryDelay = 1000,
      preload = false,
      chunkName = 'unknown'
    } = options;

    // Wrap import function with performance monitoring and error handling
    const enhancedImport = async () => {
      const startTime = performance.now();
      
      try {
        // Check if component is already cached
        if (this.componentCache.has(chunkName)) {
          return this.componentCache.get(chunkName);
        }
        
        const module = await performanceMonitor.measureAsyncOperation(
          `chunk_load_${chunkName}`,
          importFunction
        );
        
        // Cache the loaded component
        this.componentCache.set(chunkName, module);
        this.loadedChunks.add(chunkName);
        
        const endTime = performance.now();
        console.log(`[CodeSplitting] Loaded chunk ${chunkName} in ${(endTime - startTime).toFixed(2)}ms`);
        
        return module;
        
      } catch (error) {
        this.handleChunkLoadError(chunkName, error, importFunction, retryDelay);
        throw error;
      }
    };

    const LazyComponent = lazy(enhancedImport);

    // Preload if requested
    if (preload) {
      this.preloadComponent(enhancedImport, chunkName);
    }

    // Return wrapped component with error boundary
    return this.wrapWithErrorBoundary(LazyComponent, {
      fallback,
      errorFallback,
      chunkName
    });
  }

  // Handle chunk loading errors with retry logic
  async handleChunkLoadError(chunkName, error, importFunction, retryDelay) {
    console.error(`[CodeSplitting] Failed to load chunk ${chunkName}:`, error);
    
    const attempts = this.retryAttempts.get(chunkName) || 0;
    
    if (attempts < this.maxRetries) {
      this.retryAttempts.set(chunkName, attempts + 1);
      
      console.log(`[CodeSplitting] Retrying chunk ${chunkName} (attempt ${attempts + 1}/${this.maxRetries})`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempts + 1)));
      
      try {
        return await importFunction();
      } catch (retryError) {
        return this.handleChunkLoadError(chunkName, retryError, importFunction, retryDelay);
      }
    } else {
      this.failedChunks.add(chunkName);
      throw new Error(`Failed to load chunk ${chunkName} after ${this.maxRetries} attempts`);
    }
  }

  // Wrap component with error boundary
  wrapWithErrorBoundary(LazyComponent, options) {
    const { fallback, errorFallback, chunkName } = options;

    return React.forwardRef((props, ref) => (
      <ChunkErrorBoundary
        fallback={errorFallback}
        chunkName={chunkName}
        onError={(error) => this.onChunkError(chunkName, error)}
      >
        <Suspense fallback={fallback || <ChunkLoadingFallback chunkName={chunkName} />}>
          <LazyComponent {...props} ref={ref} />
        </Suspense>
      </ChunkErrorBoundary>
    ));
  }

  // Handle chunk errors
  onChunkError(chunkName, error) {
    console.error(`[CodeSplitting] Chunk error for ${chunkName}:`, error);
    
    performanceMonitor.recordMetric('chunk_error', {
      chunkName,
      error: error.message,
      timestamp: Date.now()
    });
  }

  // Preload component
  async preloadComponent(importFunction, chunkName) {
    if (this.loadedChunks.has(chunkName) || this.failedChunks.has(chunkName)) {
      return;
    }

    try {
      await importFunction();
      console.log(`[CodeSplitting] Preloaded chunk: ${chunkName}`);
    } catch (error) {
      console.warn(`[CodeSplitting] Failed to preload chunk ${chunkName}:`, error);
    }
  }

  // Preload multiple components
  async preloadComponents(components) {
    const preloadPromises = components.map(({ importFunction, chunkName }) =>
      this.preloadComponent(importFunction, chunkName)
    );
    
    await Promise.allSettled(preloadPromises);
  }

  // Create route-based lazy component
  createLazyRoute(importFunction, routeName) {
    return this.createLazyComponent(importFunction, {
      chunkName: `route_${routeName}`,
      fallback: <RouteLoadingFallback routeName={routeName} />,
      errorFallback: <RouteErrorFallback routeName={routeName} />,
      preload: false
    });
  }

  // Create feature-based lazy component
  createLazyFeature(importFunction, featureName) {
    return this.createLazyComponent(importFunction, {
      chunkName: `feature_${featureName}`,
      fallback: <FeatureLoadingFallback featureName={featureName} />,
      errorFallback: <FeatureErrorFallback featureName={featureName} />,
      preload: false
    });
  }

  // Get loading statistics
  getLoadingStats() {
    return {
      loadedChunks: Array.from(this.loadedChunks),
      failedChunks: Array.from(this.failedChunks),
      retryAttempts: Object.fromEntries(this.retryAttempts),
      cacheSize: this.componentCache.size
    };
  }

  // Clear component cache
  clearCache() {
    this.componentCache.clear();
    this.loadedChunks.clear();
    this.retryAttempts.clear();
    console.log('[CodeSplitting] Cache cleared');
  }

  // Prefetch critical chunks
  async prefetchCriticalChunks() {
    const criticalChunks = [
      {
        importFunction: () => import('../pages/public/EmergencyRequestPage'),
        chunkName: 'emergency_request'
      },
      {
        importFunction: () => import('../components/features/GuestEmergencyRequest'),
        chunkName: 'guest_emergency'
      },
      {
        importFunction: () => import('../pages/auth/SignInPage'),
        chunkName: 'signin'
      }
    ];

    await this.preloadComponents(criticalChunks);
  }
}

// Error boundary for chunk loading errors
class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ChunkErrorBoundary] Error in chunk ${this.props.chunkName}:`, error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="chunk-error-fallback p-4 text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold">Loading Error</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Failed to load component. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading fallback for chunks
const ChunkLoadingFallback = ({ chunkName }) => (
  <div className="chunk-loading-fallback flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading component...</p>
      {process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-gray-500 mt-1">Chunk: {chunkName}</p>
      )}
    </div>
  </div>
);

// Route loading fallback
const RouteLoadingFallback = ({ routeName }) => (
  <div className="route-loading-fallback min-h-[50vh] flex items-center justify-center">
    <div className="text-center">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto"></div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mt-4">Loading {routeName}...</p>
    </div>
  </div>
);

// Route error fallback
const RouteErrorFallback = ({ routeName }) => (
  <div className="route-error-fallback min-h-[50vh] flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="text-red-600 dark:text-red-400 mb-4">
        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-semibold">Page Unavailable</h2>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Sorry, we couldn't load the {routeName} page. This might be due to a network issue.
      </p>
      <div className="space-x-4">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
);

// Feature loading fallback
const FeatureLoadingFallback = ({ featureName }) => (
  <div className="feature-loading-fallback p-4">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    </div>
  </div>
);

// Feature error fallback
const FeatureErrorFallback = () => (
  <div className="feature-error-fallback p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
    <div className="text-red-600 dark:text-red-400 text-sm">
      <p className="font-medium">Feature temporarily unavailable</p>
      <p className="mt-1">This feature couldn't be loaded. Please try refreshing the page.</p>
    </div>
  </div>
);

// Create singleton instance
const codeSplittingManager = new CodeSplittingManager();

export default codeSplittingManager;
export { ChunkErrorBoundary, ChunkLoadingFallback, RouteLoadingFallback, RouteErrorFallback, FeatureLoadingFallback, FeatureErrorFallback };