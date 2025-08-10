/**
 * Test Setup Configuration
 * Global test setup and configuration for Jest and React Testing Library
 */

import '@testing-library/jest-dom';
import { setupTestEnvironment, cleanupUtils, customMatchers } from './utils/testUtils';

// Extend Jest matchers with custom matchers
expect.extend(customMatchers);

// Global test setup
beforeAll(() => {
  // Setup global test environment
  setupTestEnvironment();
  
  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    // Keep error and warn for debugging
    error: jest.fn(),
    warn: jest.fn(),
    // Mock info, log, debug to reduce noise
    info: jest.fn(),
    log: jest.fn(),
    debug: jest.fn()
  };
  
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  
  // Mock window.scrollTo
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: jest.fn()
  });
  
  // Mock window.scroll
  Object.defineProperty(window, 'scroll', {
    writable: true,
    value: jest.fn()
  });
  
  // Mock Element.scrollIntoView
  Element.prototype.scrollIntoView = jest.fn();
  
  // Mock HTMLCanvasElement.getContext
  HTMLCanvasElement.prototype.getContext = jest.fn();
  
  // Mock URL.createObjectURL
  global.URL.createObjectURL = jest.fn(() => 'mocked-url');
  global.URL.revokeObjectURL = jest.fn();
  
  // Mock crypto.getRandomValues
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: jest.fn().mockImplementation((arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      })
    }
  });
  
  // Mock TextEncoder/TextDecoder
  global.TextEncoder = class TextEncoder {
    encode(str) {
      return new Uint8Array([...str].map(char => char.charCodeAt(0)));
    }
  };
  
  global.TextDecoder = class TextDecoder {
    decode(arr) {
      return String.fromCharCode(...arr);
    }
  };
  
  // Mock requestAnimationFrame
  global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
  global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));
  
  // Mock performance.now
  global.performance.now = jest.fn(() => Date.now());
  
  // Mock Image constructor
  global.Image = class Image {
    constructor() {
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 100);
    }
  };
  
  // Mock FileReader
  global.FileReader = class FileReader {
    constructor() {
      this.readAsDataURL = jest.fn(() => {
        setTimeout(() => {
          this.result = 'data:image/jpeg;base64,mock-data';
          if (this.onload) this.onload();
        }, 100);
      });
      this.readAsText = jest.fn(() => {
        setTimeout(() => {
          this.result = 'mock file content';
          if (this.onload) this.onload();
        }, 100);
      });
    }
  };
  
  // Mock Blob
  global.Blob = class Blob {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
      this.size = parts.reduce((size, part) => size + part.length, 0);
      this.type = options?.type || '';
    }
    
    text() {
      return Promise.resolve(this.parts.join(''));
    }
    
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(this.size));
    }
  };
  
  // Mock File
  global.File = class File extends Blob {
    constructor(parts, name, options) {
      super(parts, options);
      this.name = name;
      this.lastModified = Date.now();
    }
  };
  
  // Mock MediaDevices
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: jest.fn().mockResolvedValue({
        getTracks: () => [{
          stop: jest.fn(),
          getSettings: () => ({ width: 640, height: 480 })
        }]
      }),
      enumerateDevices: jest.fn().mockResolvedValue([
        { deviceId: 'camera1', kind: 'videoinput', label: 'Mock Camera' }
      ])
    }
  });
  
  // Mock clipboard API
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: {
      writeText: jest.fn().mockResolvedValue(),
      readText: jest.fn().mockResolvedValue('mock clipboard text')
    }
  });
  
  // Mock share API
  Object.defineProperty(navigator, 'share', {
    writable: true,
    value: jest.fn().mockResolvedValue()
  });
  
  // Mock vibrate API
  Object.defineProperty(navigator, 'vibrate', {
    writable: true,
    value: jest.fn()
  });
  
  // Mock battery API
  Object.defineProperty(navigator, 'getBattery', {
    writable: true,
    value: jest.fn().mockResolvedValue({
      level: 0.8,
      charging: false,
      chargingTime: Infinity,
      dischargingTime: 3600
    })
  });
  
  // Mock connection API
  Object.defineProperty(navigator, 'connection', {
    writable: true,
    value: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false
    }
  });
  
  // Mock device memory API
  Object.defineProperty(navigator, 'deviceMemory', {
    writable: true,
    value: 8
  });
  
  // Mock hardware concurrency
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    writable: true,
    value: 4
  });
});

// Global test cleanup
afterEach(() => {
  // Clean up after each test
  cleanupUtils.cleanupAll();
  
  // Reset all mocks
  jest.clearAllMocks();
});

// Global test teardown
afterAll(() => {
  // Final cleanup
  cleanupUtils.cleanupAll();
  
  // Restore console
  global.console = console;
});

// Increase timeout for async tests
jest.setTimeout(30000);

// Mock modules that cause issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    span: 'span',
    img: 'img',
    form: 'form',
    input: 'input',
    textarea: 'textarea',
    select: 'select'
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn()
  }),
  useMotionValue: (initial) => ({ get: () => initial, set: jest.fn() }),
  useTransform: (value, input, output) => ({ get: () => output[0] }),
  useSpring: (value) => ({ get: () => value })
}));

// Mock Leaflet for map components
jest.mock('leaflet', () => ({
  map: jest.fn(() => ({
    setView: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn()
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn()
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    bindPopup: jest.fn(),
    openPopup: jest.fn()
  })),
  icon: jest.fn(() => ({})),
  divIcon: jest.fn(() => ({}))
}));

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), jest.fn()]
}));

// Error boundary for tests
global.ErrorBoundary = class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Test Error Boundary caught an error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong in test.</div>;
    }
    
    return this.props.children;
  }
};

// Custom test utilities
global.testUtils = {
  // Wait for next tick
  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Wait for multiple ticks
  waitForTicks: (count = 1) => new Promise(resolve => {
    let remaining = count;
    const tick = () => {
      remaining--;
      if (remaining <= 0) {
        resolve();
      } else {
        setTimeout(tick, 0);
      }
    };
    tick();
  }),
  
  // Create mock event
  createMockEvent: (type, properties = {}) => ({
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: { value: '' },
    currentTarget: { value: '' },
    ...properties
  }),
  
  // Create mock file
  createMockFile: (name = 'test.txt', content = 'test content', type = 'text/plain') => {
    return new File([content], name, { type });
  },
  
  // Create mock image
  createMockImage: (width = 100, height = 100) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas.toDataURL();
  }
};

// Performance testing utilities
global.performanceTest = {
  // Measure execution time
  measure: async (fn) => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  },
  
  // Check memory usage (if available)
  checkMemory: () => {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }
};

// Accessibility testing utilities
global.a11yTest = {
  // Check for required ARIA attributes
  checkAriaAttributes: (element) => {
    const requiredAttributes = ['aria-label', 'aria-labelledby', 'aria-describedby'];
    const interactive = element.matches('button, input, select, textarea, [role="button"], [role="link"]');
    
    if (interactive) {
      const hasAriaAttribute = requiredAttributes.some(attr => element.hasAttribute(attr));
      const hasTextContent = element.textContent.trim().length > 0;
      const hasLabel = element.labels && element.labels.length > 0;
      
      return hasAriaAttribute || hasTextContent || hasLabel;
    }
    
    return true;
  },
  
  // Check color contrast (simplified)
  checkContrast: (element) => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    // Simplified check - in real testing, use proper contrast calculation
    return color !== backgroundColor;
  }
};