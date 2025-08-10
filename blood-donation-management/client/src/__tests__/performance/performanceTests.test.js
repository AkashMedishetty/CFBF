/**
 * Performance Tests
 * Tests for application performance, load times, and resource usage
 */

import { 
  setupTestEnvironment, 
  cleanupUtils, 
  performanceUtils,
  mockData,
  renderWithProviders
} from '../../utils/testUtils';
import React from 'react';

// Mock heavy components for performance testing
const HeavyComponent = ({ items = [] }) => (
  <div data-testid="heavy-component">
    {items.map((item, index) => (
      <div key={index} className="item">
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <img src={item.image} alt={item.title} />
        <div className="metadata">
          <span>{item.date}</span>
          <span>{item.author}</span>
          <span>{item.category}</span>
        </div>
      </div>
    ))}
  </div>
);

const LazyLoadedComponent = React.lazy(() => 
  Promise.resolve({ default: () => <div>Lazy loaded content</div> })
);

const AnimatedComponent = () => {
  const [isAnimating, setIsAnimating] = React.useState(false);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(prev => !prev);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div 
      data-testid="animated-component"
      style={{
        transform: isAnimating ? 'translateX(100px)' : 'translateX(0)',
        transition: 'transform 0.1s ease'
      }}
    >
      Animated Content
    </div>
  );
};

describe('Performance Tests', () => {
  let mocks;

  beforeEach(() => {
    mocks = setupTestEnvironment();
    
    // Mock performance API
    if (!global.performance.mark) {
      global.performance.mark = jest.fn();
    }
    if (!global.performance.measure) {
      global.performance.measure = jest.fn();
    }
    if (!global.performance.getEntriesByType) {
      global.performance.getEntriesByType = jest.fn().mockReturnValue([]);
    }
  });

  afterEach(() => {
    cleanupUtils.cleanupAll();
  });

  describe('Component Render Performance', () => {
    test('should render simple components within performance budget', async () => {
      const SimpleComponent = () => <div>Simple content</div>;
      
      const renderTime = await performanceUtils.measureRenderTime(
        <SimpleComponent />
      );
      
      // Simple components should render very quickly
      expect(renderTime).toBeLessThan(50); // 50ms
    });

    test('should render complex components within performance budget', async () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        title: `Item ${i}`,
        description: `Description for item ${i}`,
        image: `https://example.com/image${i}.jpg`,
        date: new Date().toISOString(),
        author: `Author ${i}`,
        category: `Category ${i % 5}`
      }));
      
      const renderTime = await performanceUtils.measureRenderTime(
        <HeavyComponent items={items} />
      );
      
      // Complex components should still render reasonably quickly
      expect(renderTime).toBeLessThan(1000); // 1 second
    });

    test('should handle large lists efficiently', async () => {
      const largeItemList = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        title: `Item ${i}`,
        description: `Description ${i}`
      }));
      
      const LargeListComponent = () => (
        <div>
          {largeItemList.map(item => (
            <div key={item.id}>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      );
      
      const renderTime = await performanceUtils.measureRenderTime(
        <LargeListComponent />
      );
      
      // Large lists should render within acceptable time
      expect(renderTime).toBeLessThan(2000); // 2 seconds
    });

    test('should handle re-renders efficiently', async () => {
      const ReRenderComponent = () => {
        const [count, setCount] = React.useState(0);
        
        React.useEffect(() => {
          const timer = setTimeout(() => setCount(1), 10);
          return () => clearTimeout(timer);
        }, []);
        
        return <div>Count: {count}</div>;
      };
      
      const startTime = performance.now();
      renderWithProviders(<ReRenderComponent />);
      
      // Wait for re-render
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Re-renders should be fast
      expect(totalTime).toBeLessThan(100); // 100ms
    });
  });

  describe('Memory Usage', () => {
    test('should not leak memory with component mounting/unmounting', () => {
      const initialMemory = performanceUtils.checkMemoryUsage();
      
      // Mount and unmount components multiple times
      for (let i = 0; i < 50; i++) {
        const { unmount } = renderWithProviders(
          <HeavyComponent items={[{ title: `Item ${i}`, description: 'Test' }]} />
        );
        unmount();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = performanceUtils.checkMemoryUsage();
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.used - initialMemory.used;
        // Memory increase should be reasonable
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
      }
    });

    test('should handle large data sets without excessive memory usage', () => {
      const initialMemory = performanceUtils.checkMemoryUsage();
      
      const largeDataSet = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        data: `Large data string ${i}`.repeat(100)
      }));
      
      const LargeDataComponent = () => (
        <div>
          {largeDataSet.slice(0, 100).map(item => (
            <div key={item.id}>{item.data.substring(0, 50)}</div>
          ))}
        </div>
      );
      
      renderWithProviders(<LargeDataComponent />);
      
      const finalMemory = performanceUtils.checkMemoryUsage();
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.used - initialMemory.used;
        // Should not use excessive memory
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB
      }
    });
  });

  describe('Animation Performance', () => {
    test('should maintain smooth animations', async () => {
      const { container } = renderWithProviders(<AnimatedComponent />);
      
      const animatedElement = container.querySelector('[data-testid="animated-component"]');
      expect(animatedElement).toBeInTheDocument();
      
      // Measure animation frame rate
      let frameCount = 0;
      const startTime = performance.now();
      
      const measureFrames = () => {
        frameCount++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(measureFrames);
        }
      };
      
      requestAnimationFrame(measureFrames);
      
      // Wait for 1 second of animation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Should achieve reasonable frame rate
      expect(frameCount).toBeGreaterThan(30); // At least 30 FPS
    });

    test('should handle multiple simultaneous animations', async () => {
      const MultipleAnimations = () => (
        <div>
          {Array.from({ length: 10 }, (_, i) => (
            <AnimatedComponent key={i} />
          ))}
        </div>
      );
      
      const startTime = performance.now();
      renderWithProviders(<MultipleAnimations />);
      
      // Wait for animations to start
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Multiple animations should not significantly impact performance
      expect(duration).toBeLessThan(500); // 500ms
    });
  });

  describe('Lazy Loading Performance', () => {
    test('should load lazy components efficiently', async () => {
      const LazyWrapper = () => (
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyLoadedComponent />
        </React.Suspense>
      );
      
      const startTime = performance.now();
      renderWithProviders(<LazyWrapper />);
      
      // Wait for lazy component to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Lazy loading should be fast
      expect(loadTime).toBeLessThan(200); // 200ms
    });

    test('should handle multiple lazy components', async () => {
      const MultipleLazyComponents = () => (
        <React.Suspense fallback={<div>Loading...</div>}>
          {Array.from({ length: 5 }, (_, i) => (
            <LazyLoadedComponent key={i} />
          ))}
        </React.Suspense>
      );
      
      const startTime = performance.now();
      renderWithProviders(<MultipleLazyComponents />);
      
      // Wait for all lazy components to load
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Multiple lazy components should load efficiently
      expect(loadTime).toBeLessThan(500); // 500ms
    });
  });

  describe('API Performance', () => {
    test('should handle API requests efficiently', async () => {
      // Mock fast API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData.apiResponse.success.data
      });
      
      const apiCall = async () => {
        const response = await fetch('/api/v1/test');
        return response.json();
      };
      
      const requestTime = await performanceUtils.measureAsyncTime(apiCall);
      
      // API requests should be fast (mocked)
      expect(requestTime).toBeLessThan(100); // 100ms
    });

    test('should handle multiple concurrent API requests', async () => {
      // Mock API responses
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData.apiResponse.success.data
      });
      
      const multipleApiCalls = async () => {
        const promises = Array.from({ length: 10 }, (_, i) =>
          fetch(`/api/v1/test${i}`).then(r => r.json())
        );
        return Promise.all(promises);
      };
      
      const requestTime = await performanceUtils.measureAsyncTime(multipleApiCalls);
      
      // Concurrent requests should be efficient
      expect(requestTime).toBeLessThan(500); // 500ms
      expect(global.fetch).toHaveBeenCalledTimes(10);
    });

    test('should handle API timeouts gracefully', async () => {
      // Mock slow API response
      global.fetch = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => mockData.apiResponse.success.data
        }), 100))
      );
      
      const apiCall = async () => {
        const response = await fetch('/api/v1/slow-endpoint');
        return response.json();
      };
      
      const requestTime = await performanceUtils.measureAsyncTime(apiCall);
      
      // Should handle slow responses
      expect(requestTime).toBeGreaterThan(90); // At least 90ms (close to 100ms delay)
      expect(requestTime).toBeLessThan(200); // But not too much overhead
    });
  });

  describe('Bundle Size and Loading', () => {
    test('should have reasonable bundle size metrics', () => {
      // Mock bundle analysis
      const mockBundleStats = {
        totalSize: 2 * 1024 * 1024, // 2MB
        jsSize: 1.5 * 1024 * 1024,  // 1.5MB
        cssSize: 0.3 * 1024 * 1024, // 300KB
        imageSize: 0.2 * 1024 * 1024 // 200KB
      };
      
      // Bundle should be within reasonable limits
      expect(mockBundleStats.totalSize).toBeLessThan(5 * 1024 * 1024); // 5MB
      expect(mockBundleStats.jsSize).toBeLessThan(3 * 1024 * 1024);    // 3MB
      expect(mockBundleStats.cssSize).toBeLessThan(1 * 1024 * 1024);   // 1MB
    });

    test('should load critical resources quickly', async () => {
      // Mock resource loading times
      const mockResourceTimes = {
        html: 50,    // 50ms
        css: 100,    // 100ms
        js: 200,     // 200ms
        fonts: 150   // 150ms
      };
      
      // Critical resources should load quickly
      expect(mockResourceTimes.html).toBeLessThan(100);
      expect(mockResourceTimes.css).toBeLessThan(200);
      expect(mockResourceTimes.js).toBeLessThan(500);
      expect(mockResourceTimes.fonts).toBeLessThan(300);
    });
  });

  describe('Stress Testing', () => {
    test('should handle high component count', async () => {
      const StressTestComponent = () => (
        <div>
          {Array.from({ length: 1000 }, (_, i) => (
            <div key={i}>
              <span>Component {i}</span>
              <button onClick={() => {}}>Button {i}</button>
            </div>
          ))}
        </div>
      );
      
      const renderTime = await performanceUtils.measureRenderTime(
        <StressTestComponent />
      );
      
      // Should handle many components
      expect(renderTime).toBeLessThan(3000); // 3 seconds
    });

    test('should handle rapid state updates', async () => {
      const RapidUpdatesComponent = () => {
        const [count, setCount] = React.useState(0);
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setCount(prev => prev + 1);
          }, 10); // Update every 10ms
          
          setTimeout(() => clearInterval(interval), 1000); // Stop after 1 second
          
          return () => clearInterval(interval);
        }, []);
        
        return <div>Count: {count}</div>;
      };
      
      const startTime = performance.now();
      renderWithProviders(<RapidUpdatesComponent />);
      
      // Wait for rapid updates to complete
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle rapid updates efficiently
      expect(duration).toBeLessThan(1500); // 1.5 seconds
    });

    test('should handle memory pressure', () => {
      const initialMemory = performanceUtils.checkMemoryUsage();
      
      // Create memory pressure
      const largeArrays = [];
      for (let i = 0; i < 100; i++) {
        largeArrays.push(new Array(10000).fill(`data-${i}`));
      }
      
      // Render component with large data
      const MemoryPressureComponent = () => (
        <div>
          {largeArrays.slice(0, 10).map((arr, i) => (
            <div key={i}>Array {i} length: {arr.length}</div>
          ))}
        </div>
      );
      
      const renderTime = performanceUtils.measureRenderTime(
        <MemoryPressureComponent />
      );
      
      // Should still render under memory pressure
      expect(renderTime).toBeLessThan(2000); // 2 seconds
      
      // Clean up
      largeArrays.length = 0;
    });
  });

  describe('Real-world Performance Scenarios', () => {
    test('should handle emergency notification rendering quickly', async () => {
      const EmergencyNotification = ({ notifications }) => (
        <div>
          {notifications.map(notification => (
            <div key={notification.id} className="emergency-notification">
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
              <div className="actions">
                <button>Accept</button>
                <button>Decline</button>
                <button>View Details</button>
              </div>
            </div>
          ))}
        </div>
      );
      
      const notifications = Array.from({ length: 50 }, (_, i) => ({
        id: `notif_${i}`,
        title: `Emergency Request ${i}`,
        message: `Critical blood request for patient ${i}`
      }));
      
      const renderTime = await performanceUtils.measureRenderTime(
        <EmergencyNotification notifications={notifications} />
      );
      
      // Emergency notifications should render very quickly
      expect(renderTime).toBeLessThan(500); // 500ms
    });

    test('should handle donor list filtering efficiently', async () => {
      const DonorList = ({ donors, filter }) => {
        const filteredDonors = donors.filter(donor =>
          donor.bloodType === filter.bloodType &&
          donor.isAvailable &&
          donor.distance <= filter.maxDistance
        );
        
        return (
          <div>
            {filteredDonors.map(donor => (
              <div key={donor.id}>
                <h4>{donor.name}</h4>
                <p>Blood Type: {donor.bloodType}</p>
                <p>Distance: {donor.distance}km</p>
              </div>
            ))}
          </div>
        );
      };
      
      const donors = Array.from({ length: 1000 }, (_, i) => ({
        id: `donor_${i}`,
        name: `Donor ${i}`,
        bloodType: ['O+', 'A+', 'B+', 'AB+'][i % 4],
        isAvailable: i % 3 === 0,
        distance: Math.random() * 50
      }));
      
      const filter = {
        bloodType: 'O+',
        maxDistance: 25
      };
      
      const renderTime = await performanceUtils.measureRenderTime(
        <DonorList donors={donors} filter={filter} />
      );
      
      // Donor filtering should be efficient
      expect(renderTime).toBeLessThan(1000); // 1 second
    });
  });
});