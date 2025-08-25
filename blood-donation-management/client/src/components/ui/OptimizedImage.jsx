import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { imagePreloader } from '../../utils/imagePreloader';

const OptimizedImage = ({
  src,
  alt,
  className = '',
  aspectRatio = '16/10',
  priority = false,
  sizes = '100vw',
  fallbackSrc,
  retryAttempts = 3,
  onLoad,
  onError,
  loadingStrategy = 'progressive',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const loadStartTime = useRef(null);

  // Promise-based image loading (defined first to avoid hoisting issues)
  const loadImagePromise = useCallback((imageSrc) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        setLoadingProgress(100);
        resolve(img);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${imageSrc}`));
      };
      
      // Track loading progress (simulated for most browsers)
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 30;
          if (progress >= 90) {
            clearInterval(interval);
            progress = 90; // Leave final 10% for actual load completion
          }
          setLoadingProgress(progress);
        }, 100);
        
        return interval;
      };
      
      const progressInterval = simulateProgress();
      
      img.onload = () => {
        clearInterval(progressInterval);
        setLoadingProgress(100);
        resolve(img);
      };
      
      img.src = imageSrc;
    });
  }, []);

  // Fallback image sources with better logic
  const getFallbackSources = useCallback(() => {
    const fallbacks = [];
    
    // Use provided fallback first
    if (fallbackSrc) {
      fallbacks.push(fallbackSrc);
    }
    
    // Smart fallback based on image type
    if (src.includes('bd1') || src.includes('Blood Donation 1')) {
      fallbacks.push('/assets/fallback-blood-donation-1.svg');
    } else if (src.includes('bd2') || src.includes('Blood Donation 2')) {
      fallbacks.push('/assets/fallback-blood-donation-2.svg');
    }
    
    // Generic medical placeholder as final fallback
    fallbacks.push('/assets/placeholder-medical.svg');
    
    return fallbacks;
  }, [src, fallbackSrc]);

  // Enhanced retry mechanism with better error handling
  const retryImageLoad = useCallback(async (imageSrc, attempt = 0) => {
    setIsRetrying(true);
    
    if (attempt >= retryAttempts) {
      console.warn(`Max retry attempts reached for ${imageSrc}, trying fallbacks`);
      
      // Try fallback sources
      const fallbacks = getFallbackSources();
      for (const fallback of fallbacks) {
        try {
          console.log(`Trying fallback: ${fallback}`);
          await loadImagePromise(fallback);
          setCurrentSrc(fallback);
          setIsRetrying(false);
          return;
        } catch (error) {
          console.warn(`Fallback image failed: ${fallback}`, error);
        }
      }
      
      // All fallbacks failed
      setHasError(true);
      setIsRetrying(false);
      onError?.(new Error(`Failed to load image after ${retryAttempts} attempts and all fallbacks`));
      return;
    }

    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
    console.log(`Retrying image load in ${delay}ms (attempt ${attempt + 1}/${retryAttempts})`);
    
    retryTimeoutRef.current = setTimeout(async () => {
      try {
        await loadImagePromise(imageSrc);
        setCurrentSrc(imageSrc);
        setIsRetrying(false);
      } catch (error) {
        console.warn(`Image load attempt ${attempt + 1} failed:`, error);
        setRetryCount(attempt + 1);
        retryImageLoad(imageSrc, attempt + 1);
      }
    }, delay);
  }, [retryAttempts, getFallbackSources, onError, loadImagePromise]);

  // Enhanced intersection observer with better performance
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      loadStartTime.current = performance.now();
      return;
    }

    if (isInView) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          loadStartTime.current = performance.now();
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '150px', // Increased margin for better UX
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  // Check if image is already cached
  useEffect(() => {
    if (isInView && imagePreloader.isCached(src)) {
      const cachedImg = imagePreloader.getCachedImage(src);
      if (cachedImg) {
        setIsLoaded(true);
        setCurrentSrc(src);
        setLoadingProgress(100);
      }
    }
  }, [isInView, src]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Generate optimized image sources with better fallback logic
  const getOptimizedSrc = useCallback((originalSrc, format = 'webp') => {
    if (!originalSrc) return '';
    
    // Get base path without extension for optimized versions
    const basePath = originalSrc.replace(/\.[^/.]+$/, '');
    
    switch (format) {
      case 'avif':
        return `${basePath}.avif`;
      case 'webp':
        return `${basePath}.webp`;
      default:
        return originalSrc;
    }
  }, []);

  // Enhanced load handler with performance tracking
  const handleLoad = useCallback((e) => {
    setIsLoaded(true);
    setLoadingProgress(100);
    setHasError(false);
    setIsRetrying(false);
    
    // Performance tracking
    if (loadStartTime.current && typeof window !== 'undefined' && window.performance) {
      const loadTime = performance.now() - loadStartTime.current;
      console.log(`Image loaded successfully: ${currentSrc} in ${loadTime.toFixed(2)}ms`);
      
      // Track performance metrics
      if (window.gtag) {
        window.gtag('event', 'image_load_time', {
          event_category: 'performance',
          event_label: currentSrc,
          value: Math.round(loadTime)
        });
      }
    }
    
    onLoad?.(e);
  }, [currentSrc, onLoad]);

  // Enhanced error handler with retry logic
  const handleError = useCallback((e) => {
    console.error(`Image load error for: ${currentSrc}`, e);
    
    // Don't retry if we're already using a fallback
    if (currentSrc !== src) {
      setHasError(true);
      onError?.(e);
      return;
    }
    
    // Start retry process
    retryImageLoad(src, retryCount);
  }, [currentSrc, src, retryCount, retryImageLoad, onError]);

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      {/* Enhanced loading placeholder with progress */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          
          {/* Loading progress indicator */}
          {priority && loadingProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
              <div 
                className="h-full bg-primary-600 transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          )}
          
          {/* Retry indicator */}
          {retryCount > 0 && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
              Retry {retryCount}/{retryAttempts}
            </div>
          )}
          
          {/* Medical icon placeholder for blood donation images */}
          {(src.includes('bd') || src.includes('blood')) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Main image - simplified to use only existing formats */}
      {isInView && !hasError && (
        <motion.img
          src={currentSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          style={{
            filter: isLoaded ? 'none' : 'blur(2px)',
          }}
          {...props}
        />
      )}

      {/* Enhanced error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="text-center text-gray-500 p-4">
            {/* Different icons based on image type */}
            {src.includes('bd') || src.includes('blood') ? (
              <svg className="w-16 h-16 mx-auto mb-3 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            ) : (
              <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
              </svg>
            )}
            <p className="text-sm font-medium mb-1">Image unavailable</p>
            <p className="text-xs text-gray-400">
              {retryCount > 0 ? `Failed after ${retryCount} attempts` : 'Unable to load image'}
            </p>
          </div>
        </div>
      )}

      {/* Enhanced loading indicator for priority images */}
      {priority && !isLoaded && !hasError && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs text-gray-600 font-medium">Loading image...</p>
            {retryCount > 0 && (
              <p className="text-xs text-yellow-600 mt-1">Retrying... ({retryCount}/{retryAttempts})</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;