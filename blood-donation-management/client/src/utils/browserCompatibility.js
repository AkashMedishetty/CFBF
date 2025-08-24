/**
 * Browser Compatibility Utility
 * Handles cross-browser compatibility and feature detection
 */

class BrowserCompatibilityManager {
  constructor() {
    this.browserInfo = this.detectBrowser();
    this.features = this.detectFeatures();
    this.polyfills = new Map();
    
    this.initializeCompatibility();
  }

  // Detect browser and version
  detectBrowser() {
    const userAgent = navigator.userAgent;
    let browser = 'unknown';
    let version = 'unknown';
    let engine = 'unknown';

    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'unknown';
      engine = 'blink';
    }
    // Firefox
    else if (userAgent.includes('Firefox')) {
      browser = 'firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'unknown';
      engine = 'gecko';
    }
    // Safari
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : 'unknown';
      engine = 'webkit';
    }
    // Edge
    else if (userAgent.includes('Edg')) {
      browser = 'edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? match[1] : 'unknown';
      engine = 'blink';
    }
    // Internet Explorer
    else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      browser = 'ie';
      const match = userAgent.match(/(?:MSIE |rv:)(\d+)/);
      version = match ? match[1] : 'unknown';
      engine = 'trident';
    }

    return {
      name: browser,
      version: parseInt(version),
      engine,
      userAgent,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isTablet: /iPad|Android(?=.*\bMobile\b)/i.test(userAgent),
      isDesktop: !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    };
  }

  // Detect browser features
  detectFeatures() {
    const features = {
      // Service Worker
      serviceWorker: 'serviceWorker' in navigator,
      
      // Push Notifications
      pushNotifications: 'PushManager' in window && 'Notification' in window,
      
      // IndexedDB
      indexedDB: 'indexedDB' in window,
      
      // Local Storage
      localStorage: (() => {
        try {
          const test = 'test';
          localStorage.setItem(test, test);
          localStorage.removeItem(test);
          return true;
        } catch (e) {
          return false;
        }
      })(),
      
      // Session Storage
      sessionStorage: (() => {
        try {
          const test = 'test';
          sessionStorage.setItem(test, test);
          sessionStorage.removeItem(test);
          return true;
        } catch (e) {
          return false;
        }
      })(),
      
      // Geolocation
      geolocation: 'geolocation' in navigator,
      
      // Camera/Media
      mediaDevices: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      
      // Web Share API
      webShare: 'share' in navigator,
      
      // Intersection Observer
      intersectionObserver: 'IntersectionObserver' in window,
      
      // Performance Observer
      performanceObserver: 'PerformanceObserver' in window,
      
      // Fetch API
      fetch: 'fetch' in window,
      
      // Promises
      promises: 'Promise' in window,
      
      // ES6 Features
      es6: (() => {
        try {
          // Test for generator functions without eval
          return typeof function*(){} === 'function';
        } catch (e) {
          return false;
        }
      })(),
      
      // CSS Grid
      cssGrid: CSS.supports('display', 'grid'),
      
      // CSS Flexbox
      cssFlexbox: CSS.supports('display', 'flex'),
      
      // CSS Custom Properties
      cssCustomProperties: CSS.supports('--test', 'test'),
      
      // Touch Events
      touchEvents: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      
      // Pointer Events
      pointerEvents: 'PointerEvent' in window,
      
      // Web Animations API
      webAnimations: 'animate' in document.createElement('div'),
      
      // Clipboard API
      clipboard: 'clipboard' in navigator,
      
      // Battery API
      battery: 'getBattery' in navigator,
      
      // Network Information API
      networkInformation: 'connection' in navigator,
      
      // Device Memory API
      deviceMemory: 'deviceMemory' in navigator,
      
      // Hardware Concurrency
      hardwareConcurrency: 'hardwareConcurrency' in navigator,
      
      // Vibration API
      vibration: 'vibrate' in navigator,
      
      // Web Workers
      webWorkers: 'Worker' in window,
      
      // Shared Array Buffer
      sharedArrayBuffer: 'SharedArrayBuffer' in window,
      
      // WebAssembly
      webAssembly: 'WebAssembly' in window,
      
      // ResizeObserver
      resizeObserver: 'ResizeObserver' in window,
      
      // MutationObserver
      mutationObserver: 'MutationObserver' in window,
      
      // WebGL
      webgl: (() => {
        try {
          const canvas = document.createElement('canvas');
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
          return false;
        }
      })(),
      
      // WebRTC
      webrtc: 'RTCPeerConnection' in window,
      
      // File API
      fileApi: 'File' in window && 'FileReader' in window,
      
      // Drag and Drop
      dragAndDrop: 'draggable' in document.createElement('div'),
      
      // History API
      historyApi: 'pushState' in window.history,
      
      // Page Visibility API
      pageVisibility: 'visibilityState' in document,
      
      // Fullscreen API
      fullscreen: 'requestFullscreen' in document.documentElement ||
                  'webkitRequestFullscreen' in document.documentElement ||
                  'mozRequestFullScreen' in document.documentElement ||
                  'msRequestFullscreen' in document.documentElement
    };

    return features;
  }

  // Initialize compatibility fixes
  initializeCompatibility() {
    this.addBrowserClasses();
    this.loadPolyfills();
    this.setupEventListeners();
    this.logCompatibilityInfo();
  }

  // Add browser-specific CSS classes
  addBrowserClasses() {
    const html = document.documentElement;
    const { name, version, engine, isMobile, isTablet } = this.browserInfo;
    
    html.classList.add(`browser-${name}`);
    html.classList.add(`browser-${name}-${version}`);
    html.classList.add(`engine-${engine}`);
    
    if (isMobile) html.classList.add('is-mobile');
    if (isTablet) html.classList.add('is-tablet');
    if (!isMobile && !isTablet) html.classList.add('is-desktop');
    
    // Add feature classes
    Object.entries(this.features).forEach(([feature, supported]) => {
      html.classList.add(supported ? `has-${feature}` : `no-${feature}`);
    });
  }

  // Load necessary polyfills
  async loadPolyfills() {
    const polyfillsToLoad = [];

    // Intersection Observer polyfill
    if (!this.features.intersectionObserver) {
      polyfillsToLoad.push(this.loadIntersectionObserverPolyfill());
    }

    // ResizeObserver polyfill
    if (!this.features.resizeObserver) {
      polyfillsToLoad.push(this.loadResizeObserverPolyfill());
    }

    // Fetch polyfill
    if (!this.features.fetch) {
      polyfillsToLoad.push(this.loadFetchPolyfill());
    }

    // Promise polyfill
    if (!this.features.promises) {
      polyfillsToLoad.push(this.loadPromisePolyfill());
    }

    // Web Animations polyfill
    if (!this.features.webAnimations) {
      polyfillsToLoad.push(this.loadWebAnimationsPolyfill());
    }

    // CSS Custom Properties polyfill for IE
    if (!this.features.cssCustomProperties && this.browserInfo.name === 'ie') {
      polyfillsToLoad.push(this.loadCSSCustomPropertiesPolyfill());
    }

    await Promise.allSettled(polyfillsToLoad);
  }

  // Intersection Observer polyfill
  async loadIntersectionObserverPolyfill() {
    if (this.polyfills.has('intersectionObserver')) return;
    
    try {
      // Simple polyfill implementation
      window.IntersectionObserver = class IntersectionObserver {
        constructor(callback, options = {}) {
          this.callback = callback;
          this.options = options;
          this.observedElements = new Set();
        }
        
        observe(element) {
          this.observedElements.add(element);
          // Fallback: immediately trigger callback
          setTimeout(() => {
            this.callback([{
              target: element,
              isIntersecting: true,
              intersectionRatio: 1
            }]);
          }, 100);
        }
        
        unobserve(element) {
          this.observedElements.delete(element);
        }
        
        disconnect() {
          this.observedElements.clear();
        }
      };
      
      this.polyfills.set('intersectionObserver', true);
      console.log('[Compatibility] IntersectionObserver polyfill loaded');
    } catch (error) {
      console.warn('[Compatibility] Failed to load IntersectionObserver polyfill:', error);
    }
  }

  // ResizeObserver polyfill
  async loadResizeObserverPolyfill() {
    if (this.polyfills.has('resizeObserver')) return;
    
    try {
      window.ResizeObserver = class ResizeObserver {
        constructor(callback) {
          this.callback = callback;
          this.observedElements = new Set();
        }
        
        observe(element) {
          this.observedElements.add(element);
          // Fallback: use window resize event
          const resizeHandler = () => {
            this.callback([{
              target: element,
              contentRect: element.getBoundingClientRect()
            }]);
          };
          
          element._resizeHandler = resizeHandler;
          window.addEventListener('resize', resizeHandler);
        }
        
        unobserve(element) {
          if (element._resizeHandler) {
            window.removeEventListener('resize', element._resizeHandler);
            delete element._resizeHandler;
          }
          this.observedElements.delete(element);
        }
        
        disconnect() {
          this.observedElements.forEach(element => this.unobserve(element));
        }
      };
      
      this.polyfills.set('resizeObserver', true);
      console.log('[Compatibility] ResizeObserver polyfill loaded');
    } catch (error) {
      console.warn('[Compatibility] Failed to load ResizeObserver polyfill:', error);
    }
  }

  // Fetch polyfill
  async loadFetchPolyfill() {
    if (this.polyfills.has('fetch')) return;
    
    try {
      // Simple fetch polyfill using XMLHttpRequest
      window.fetch = function(url, options = {}) {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(options.method || 'GET', url);
          
          // Set headers
          if (options.headers) {
            Object.entries(options.headers).forEach(([key, value]) => {
              xhr.setRequestHeader(key, value);
            });
          }
          
          xhr.onload = () => {
            const response = {
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              json: () => Promise.resolve(JSON.parse(xhr.responseText)),
              text: () => Promise.resolve(xhr.responseText)
            };
            resolve(response);
          };
          
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(options.body);
        });
      };
      
      this.polyfills.set('fetch', true);
      console.log('[Compatibility] Fetch polyfill loaded');
    } catch (error) {
      console.warn('[Compatibility] Failed to load Fetch polyfill:', error);
    }
  }

  // Promise polyfill
  async loadPromisePolyfill() {
    if (this.polyfills.has('promise')) return;
    
    try {
      // Basic Promise polyfill
      if (!window.Promise) {
        window.Promise = class Promise {
          constructor(executor) {
            this.state = 'pending';
            this.value = undefined;
            this.handlers = [];
            
            const resolve = (value) => {
              if (this.state === 'pending') {
                this.state = 'fulfilled';
                this.value = value;
                this.handlers.forEach(handler => handler.onFulfilled(value));
              }
            };
            
            const reject = (reason) => {
              if (this.state === 'pending') {
                this.state = 'rejected';
                this.value = reason;
                this.handlers.forEach(handler => handler.onRejected(reason));
              }
            };
            
            try {
              executor(resolve, reject);
            } catch (error) {
              reject(error);
            }
          }
          
          then(onFulfilled, onRejected) {
            return new Promise((resolve, reject) => {
              const handler = {
                onFulfilled: (value) => {
                  try {
                    const result = onFulfilled ? onFulfilled(value) : value;
                    resolve(result);
                  } catch (error) {
                    reject(error);
                  }
                },
                onRejected: (reason) => {
                  try {
                    const result = onRejected ? onRejected(reason) : reason;
                    reject(result);
                  } catch (error) {
                    reject(error);
                  }
                }
              };
              
              if (this.state === 'fulfilled') {
                handler.onFulfilled(this.value);
              } else if (this.state === 'rejected') {
                handler.onRejected(this.value);
              } else {
                this.handlers.push(handler);
              }
            });
          }
          
          catch(onRejected) {
            return this.then(null, onRejected);
          }
          
          static resolve(value) {
            return new Promise(resolve => resolve(value));
          }
          
          static reject(reason) {
            return new Promise((resolve, reject) => reject(reason));
          }
        };
      }
      
      this.polyfills.set('promise', true);
      console.log('[Compatibility] Promise polyfill loaded');
    } catch (error) {
      console.warn('[Compatibility] Failed to load Promise polyfill:', error);
    }
  }

  // Web Animations polyfill
  async loadWebAnimationsPolyfill() {
    if (this.polyfills.has('webAnimations')) return;
    
    try {
      // Basic animate polyfill
      if (!Element.prototype.animate) {
        Element.prototype.animate = function(keyframes, options) {
          const element = this;
          const duration = typeof options === 'number' ? options : (options?.duration || 1000);
          
          // Simple CSS transition fallback
          
          const animation = {
            finished: new Promise(resolve => {
              setTimeout(() => {
                // Apply final keyframe styles
                const finalKeyframe = keyframes[keyframes.length - 1];
                Object.assign(element.style, finalKeyframe);
                resolve();
              }, duration);
            }),
            cancel: () => {
              // Reset styles
              Object.keys(keyframes[0] || {}).forEach(prop => {
                element.style[prop] = '';
              });
            },
            pause: () => {},
            play: () => {},
            reverse: () => {}
          };
          
          return animation;
        };
      }
      
      this.polyfills.set('webAnimations', true);
      console.log('[Compatibility] Web Animations polyfill loaded');
    } catch (error) {
      console.warn('[Compatibility] Failed to load Web Animations polyfill:', error);
    }
  }

  // CSS Custom Properties polyfill
  async loadCSSCustomPropertiesPolyfill() {
    if (this.polyfills.has('cssCustomProperties')) return;
    
    try {
      // Basic CSS custom properties support for IE
      const customProperties = new Map();
      
      // Parse CSS for custom properties
      const parseCustomProperties = () => {
        const sheets = Array.from(document.styleSheets);
        sheets.forEach(sheet => {
          try {
            const rules = Array.from(sheet.cssRules || []);
            rules.forEach(rule => {
              if (rule.style) {
                for (let i = 0; i < rule.style.length; i++) {
                  const prop = rule.style[i];
                  if (prop.startsWith('--')) {
                    customProperties.set(prop, rule.style.getPropertyValue(prop));
                  }
                }
              }
            });
          } catch (e) {
            // Cross-origin stylesheets may throw errors
          }
        });
      };
      
      // Apply custom properties
      const applyCustomProperties = () => {
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
          const styles = getComputedStyle(element);
          for (let i = 0; i < styles.length; i++) {
            const prop = styles[i];
            const value = styles.getPropertyValue(prop);
            if (value.includes('var(--')) {
              const matches = value.match(/var\((--[^,)]+)(?:,([^)]+))?\)/g);
              if (matches) {
                let newValue = value;
                matches.forEach(match => {
                  const varMatch = match.match(/var\((--[^,)]+)(?:,([^)]+))?\)/);
                  if (varMatch) {
                    const varName = varMatch[1];
                    const fallback = varMatch[2] || '';
                    const varValue = customProperties.get(varName) || fallback;
                    newValue = newValue.replace(match, varValue);
                  }
                });
                element.style.setProperty(prop, newValue);
              }
            }
          }
        });
      };
      
      parseCustomProperties();
      applyCustomProperties();
      
      // Re-apply on DOM changes
      const observer = new MutationObserver(() => {
        parseCustomProperties();
        applyCustomProperties();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      
      this.polyfills.set('cssCustomProperties', true);
      console.log('[Compatibility] CSS Custom Properties polyfill loaded');
    } catch (error) {
      console.warn('[Compatibility] Failed to load CSS Custom Properties polyfill:', error);
    }
  }

  // Setup event listeners for compatibility
  setupEventListeners() {
    // Handle orientation changes
    if ('orientation' in window) {
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      });
    }
    
    // Handle visibility changes
    if (this.features.pageVisibility) {
      document.addEventListener('visibilitychange', () => {
        const event = new CustomEvent('app:visibilitychange', {
          detail: { hidden: document.hidden }
        });
        window.dispatchEvent(event);
      });
    }
  }

  // Log compatibility information
  logCompatibilityInfo() {
    console.group('[Browser Compatibility]');
    console.log('Browser:', this.browserInfo);
    console.log('Features:', this.features);
    console.log('Polyfills loaded:', Array.from(this.polyfills.keys()));
    console.groupEnd();
  }

  // Get compatibility report
  getCompatibilityReport() {
    const unsupportedFeatures = Object.entries(this.features)
      .filter(([feature, supported]) => !supported)
      .map(([feature]) => feature);
    
    const criticalFeatures = [
      'serviceWorker',
      'pushNotifications',
      'indexedDB',
      'localStorage',
      'fetch',
      'promises'
    ];
    
    const criticalUnsupported = unsupportedFeatures.filter(feature => 
      criticalFeatures.includes(feature)
    );
    
    return {
      browser: this.browserInfo,
      features: this.features,
      unsupportedFeatures,
      criticalUnsupported,
      polyfillsLoaded: Array.from(this.polyfills.keys()),
      isCompatible: criticalUnsupported.length === 0,
      compatibilityScore: Math.round(
        (Object.values(this.features).filter(Boolean).length / Object.keys(this.features).length) * 100
      )
    };
  }

  // Check if specific feature is supported
  isSupported(feature) {
    return this.features[feature] || false;
  }

  // Get browser-specific CSS prefix
  getCSSPrefix() {
    const prefixes = {
      webkit: '-webkit-',
      moz: '-moz-',
      ms: '-ms-',
      o: '-o-'
    };
    
    return prefixes[this.browserInfo.engine] || '';
  }

  // Apply browser-specific fixes
  applyBrowserFixes() {
    // Safari iOS viewport fix
    if (this.browserInfo.name === 'safari' && this.browserInfo.isMobile) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          viewport.getAttribute('content') + ', viewport-fit=cover'
        );
      }
    }
    
    // IE flexbox fixes
    if (this.browserInfo.name === 'ie') {
      document.body.classList.add('ie-flexbox-fix');
    }
    
    // Firefox focus outline fix
    if (this.browserInfo.name === 'firefox') {
      document.body.classList.add('firefox-focus-fix');
    }
  }
}

// Create singleton instance
const browserCompatibility = new BrowserCompatibilityManager();

export default browserCompatibility;