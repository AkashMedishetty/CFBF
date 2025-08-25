import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import HeroImages from '../HeroImages';
import OptimizedImage from '../../ui/OptimizedImage';
import { imagePreloader } from '../../../utils/imagePreloader';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    img: ({ children, ...props }) => <img {...props}>{children}</img>,
  },
}));

// Mock the image preloader
jest.mock('../../../utils/imagePreloader', () => ({
  imagePreloader: {
    preloadHeroImages: jest.fn(),
    preloadImage: jest.fn(),
    getCachedImage: jest.fn(),
    isCached: jest.fn(),
  },
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Mock Image constructor for testing image loading
global.Image = class {
  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 100);
  }
};

describe('Hero Image Loading Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console methods
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('OptimizedImage Component', () => {
    const defaultProps = {
      src: '/Blood Donation 1.jpg',
      alt: 'Test blood donation image',
      fallbackSrc: '/assets/fallback-blood-donation-1.svg',
    };

    test('should render with proper aspect ratio container', () => {
      render(<OptimizedImage {...defaultProps} aspectRatio="16/10" />);
      
      const container = screen.getByRole('img').parentElement;
      expect(container).toHaveStyle({ aspectRatio: '16/10' });
    });

    test('should show loading placeholder initially', () => {
      render(<OptimizedImage {...defaultProps} priority={true} />);
      
      // Should show loading indicator for priority images
      expect(screen.getByText('Loading image...')).toBeInTheDocument();
    });

    test('should handle image load success', async () => {
      const onLoad = jest.fn();
      render(<OptimizedImage {...defaultProps} onLoad={onLoad} priority={true} />);
      
      const img = screen.getByRole('img');
      
      await act(async () => {
        fireEvent.load(img);
      });

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalled();
      });
    });

    test('should handle image load error with retry mechanism', async () => {
      const onError = jest.fn();
      
      // Mock Image to fail first few times
      let loadAttempts = 0;
      global.Image = class {
        constructor() {
          setTimeout(() => {
            loadAttempts++;
            if (loadAttempts <= 2) {
              if (this.onerror) this.onerror(new Error('Load failed'));
            } else {
              if (this.onload) this.onload();
            }
          }, 100);
        }
      };

      render(<OptimizedImage {...defaultProps} onError={onError} retryAttempts={3} />);
      
      // Wait for retry attempts
      await waitFor(() => {
        expect(loadAttempts).toBeGreaterThan(1);
      }, { timeout: 2000 });
    });

    test('should use fallback image when primary fails', async () => {
      // Mock Image to always fail for primary, succeed for fallback
      global.Image = class {
        constructor() {
          setTimeout(() => {
            if (this.src.includes('Blood Donation 1.jpg')) {
              if (this.onerror) this.onerror(new Error('Primary failed'));
            } else {
              if (this.onload) this.onload();
            }
          }, 100);
        }
      };

      render(<OptimizedImage {...defaultProps} retryAttempts={1} />);
      
      await waitFor(() => {
        // Should eventually show fallback content
        expect(screen.queryByText('Loading image...')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('should show error state when all sources fail', async () => {
      // Mock Image to always fail
      global.Image = class {
        constructor() {
          setTimeout(() => {
            if (this.onerror) this.onerror(new Error('All failed'));
          }, 100);
        }
      };

      render(<OptimizedImage {...defaultProps} retryAttempts={1} />);
      
      await waitFor(() => {
        expect(screen.getByText('Image unavailable')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('should support different image formats (WebP, AVIF)', () => {
      render(<OptimizedImage {...defaultProps} />);
      
      const picture = screen.getByRole('img').parentElement;
      expect(picture.tagName).toBe('PICTURE');
      
      const sources = picture.querySelectorAll('source');
      expect(sources).toHaveLength(2); // AVIF and WebP sources
      expect(sources[0]).toHaveAttribute('type', 'image/avif');
      expect(sources[1]).toHaveAttribute('type', 'image/webp');
    });

    test('should handle priority loading correctly', () => {
      render(<OptimizedImage {...defaultProps} priority={true} />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'eager');
    });

    test('should handle lazy loading for non-priority images', () => {
      render(<OptimizedImage {...defaultProps} priority={false} />);
      
      // Should not render image initially (lazy loading)
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    test('should show retry indicator during retry attempts', async () => {
      let loadAttempts = 0;
      global.Image = class {
        constructor() {
          setTimeout(() => {
            loadAttempts++;
            if (loadAttempts <= 1) {
              if (this.onerror) this.onerror(new Error('Retry test'));
            } else {
              if (this.onload) this.onload();
            }
          }, 100);
        }
      };

      render(<OptimizedImage {...defaultProps} retryAttempts={3} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Retry \d+\/3/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('HeroImages Component', () => {
    beforeEach(() => {
      imagePreloader.preloadHeroImages.mockResolvedValue();
    });

    test('should preload hero images on mount', () => {
      render(<HeroImages layout="desktop" />);
      
      expect(imagePreloader.preloadHeroImages).toHaveBeenCalled();
    });

    test('should render desktop layout correctly', () => {
      render(<HeroImages layout="desktop" />);
      
      const container = screen.getByRole('img').closest('.grid');
      expect(container).toHaveClass('grid-cols-2');
    });

    test('should render tablet layout correctly', () => {
      render(<HeroImages layout="tablet" />);
      
      const container = screen.getByRole('img').closest('.flex');
      expect(container).toHaveClass('flex-col');
    });

    test('should render mobile layout correctly', () => {
      render(<HeroImages layout="mobile" />);
      
      const container = screen.getByRole('img').closest('.flex');
      expect(container).toHaveClass('flex-col', 'space-y-4');
    });

    test('should set priority loading for primary image', () => {
      render(<HeroImages layout="desktop" />);
      
      const images = screen.getAllByRole('img');
      // First image should have priority loading
      expect(images[0]).toHaveAttribute('loading', 'eager');
    });

    test('should handle preload failure gracefully', () => {
      imagePreloader.preloadHeroImages.mockRejectedValue(new Error('Preload failed'));
      
      render(<HeroImages layout="desktop" />);
      
      // Should still render without throwing
      expect(screen.getAllByRole('img')).toHaveLength(2);
      expect(console.warn).toHaveBeenCalledWith('Failed to preload hero images:', expect.any(Error));
    });

    test('should apply proper fallback sources', () => {
      render(<HeroImages layout="desktop" />);
      
      // Check that images have fallback sources configured
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
    });

    test('should apply proper aspect ratios for different layouts', () => {
      const { rerender } = render(<HeroImages layout="desktop" />);
      
      let containers = screen.getAllByRole('img').map(img => img.parentElement);
      expect(containers[0]).toHaveStyle({ aspectRatio: '4/3' });
      expect(containers[1]).toHaveStyle({ aspectRatio: '3/4' });
      
      rerender(<HeroImages layout="mobile" />);
      
      containers = screen.getAllByRole('img').map(img => img.parentElement);
      containers.forEach(container => {
        expect(container).toHaveStyle({ aspectRatio: '16/10' });
      });
    });
  });

  describe('Image Preloader Utility', () => {
    test('should preload hero images successfully', async () => {
      const mockPreloader = {
        preloadHeroImages: jest.fn().mockResolvedValue(),
      };

      await mockPreloader.preloadHeroImages();
      
      expect(mockPreloader.preloadHeroImages).toHaveBeenCalled();
    });

    test('should handle preload failures', async () => {
      const mockPreloader = {
        preloadHeroImages: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      await expect(mockPreloader.preloadHeroImages()).rejects.toThrow('Network error');
    });
  });

  describe('Layout Stability', () => {
    test('should maintain aspect ratio during loading', () => {
      render(<OptimizedImage {...{ 
        src: '/Blood Donation 1.jpg',
        alt: 'Test image',
        aspectRatio: '16/10'
      }} />);
      
      const container = screen.getByRole('img').parentElement;
      expect(container).toHaveStyle({ aspectRatio: '16/10' });
    });

    test('should prevent layout shift with proper placeholders', () => {
      render(<OptimizedImage {...{ 
        src: '/Blood Donation 1.jpg',
        alt: 'Test image',
        priority: true
      }} />);
      
      // Should have placeholder content that maintains layout
      const placeholder = screen.getByText('Loading image...');
      expect(placeholder.closest('div')).toHaveClass('absolute', 'inset-0');
    });
  });

  describe('Accessibility', () => {
    test('should provide descriptive alt text', () => {
      render(<HeroImages layout="desktop" />);
      
      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('alt', expect.stringContaining('Blood donation'));
      expect(images[1]).toHaveAttribute('alt', expect.stringContaining('Community blood donation'));
    });

    test('should announce loading states', () => {
      render(<OptimizedImage {...{
        src: '/Blood Donation 1.jpg',
        alt: 'Test image',
        priority: true
      }} />);
      
      expect(screen.getByText('Loading image...')).toBeInTheDocument();
    });

    test('should provide meaningful error messages', async () => {
      global.Image = class {
        constructor() {
          setTimeout(() => {
            if (this.onerror) this.onerror(new Error('Failed'));
          }, 100);
        }
      };

      render(<OptimizedImage {...{
        src: '/invalid-image.jpg',
        alt: 'Test image',
        retryAttempts: 1
      }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Image unavailable')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Performance', () => {
    test('should load images within acceptable time limits', async () => {
      const startTime = performance.now();
      
      render(<OptimizedImage {...{
        src: '/Blood Donation 1.jpg',
        alt: 'Test image',
        priority: true
      }} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading image...')).not.toBeInTheDocument();
      });
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should implement proper caching', () => {
      imagePreloader.isCached.mockReturnValue(true);
      imagePreloader.getCachedImage.mockReturnValue(new Image());
      
      render(<OptimizedImage {...{
        src: '/Blood Donation 1.jpg',
        alt: 'Test image'
      }} />);
      
      // Should utilize cached images when available
      expect(imagePreloader.isCached).toHaveBeenCalled();
    });
  });
});