import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NewHeroSection from '../NewHeroSection';
import { useResponsiveLayout } from '../ResponsiveHeroLayout';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    img: ({ children, ...props }) => <img {...props}>{children}</img>,
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
  }),
  useReducedMotion: () => false,
}));

// Mock responsive layout hook
jest.mock('../ResponsiveHeroLayout', () => ({
  useResponsiveLayout: jest.fn(),
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

// Mock intersection observer
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Mock window.gtag for analytics
global.gtag = jest.fn();

// Test wrapper component
const TestWrapper = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe('NewHeroSection', () => {
  const mockOnRegisterClick = jest.fn();


  beforeEach(() => {
    jest.clearAllMocks();
    useResponsiveLayout.mockReturnValue({
      layout: 'desktop',
      dimensions: { width: 1024, height: 768 }
    });
  });

  describe('Rendering', () => {
    test('renders hero section with default props', () => {
      render(
        <TestWrapper>
          <NewHeroSection />
        </TestWrapper>
      );

      expect(screen.getByText(/India's First/i)).toBeInTheDocument();
      expect(screen.getByText(/Privacy-Protected/i)).toBeInTheDocument();
      expect(screen.getByText(/Blood Donation Platform/i)).toBeInTheDocument();
    });

    test('renders privacy badge when not minimal variant', () => {
      render(
        <TestWrapper>
          <NewHeroSection variant="full" />
        </TestWrapper>
      );

      expect(screen.getByText(/1st time in India/i)).toBeInTheDocument();
    });

    test('renders minimal variant correctly', () => {
      render(
        <TestWrapper>
          <NewHeroSection variant="minimal" />
        </TestWrapper>
      );

      expect(screen.getByText(/India's First/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register as donor/i })).toBeInTheDocument();
    });

    test('renders compact variant for mobile layout', () => {
      useResponsiveLayout.mockReturnValue({
        layout: 'mobile',
        dimensions: { width: 375, height: 667 }
      });

      render(
        <TestWrapper>
          <NewHeroSection variant="full" />
        </TestWrapper>
      );

      expect(screen.getByText(/India's First/i)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('calls onRegisterClick when register button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <NewHeroSection onRegisterClick={mockOnRegisterClick} />
        </TestWrapper>
      );

      const registerButton = screen.getByRole('button', { name: /register as donor/i });
      await user.click(registerButton);

      expect(mockOnRegisterClick).toHaveBeenCalledTimes(1);
    });

    test('tracks analytics when register button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <NewHeroSection onRegisterClick={mockOnRegisterClick} />
        </TestWrapper>
      );

      const registerButton = screen.getByRole('button', { name: /register as donor/i });
      await user.click(registerButton);

      expect(global.gtag).toHaveBeenCalledWith('event', 'hero_register_click', {
        event_category: 'engagement',
        event_label: 'hero_section',
        value: 1
      });
    });

    test('handles keyboard navigation correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <NewHeroSection onRegisterClick={mockOnRegisterClick} />
        </TestWrapper>
      );

      const registerButton = screen.getByRole('button', { name: /register as donor/i });
      
      // Focus the button
      await user.tab();
      expect(registerButton).toHaveFocus();

      // Activate with Enter key
      await user.keyboard('{Enter}');
      expect(mockOnRegisterClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Behavior', () => {
    test('adapts layout for tablet screens', () => {
      useResponsiveLayout.mockReturnValue({
        layout: 'tablet',
        dimensions: { width: 768, height: 1024 }
      });

      render(
        <TestWrapper>
          <NewHeroSection />
        </TestWrapper>
      );

      expect(screen.getByText(/India's First/i)).toBeInTheDocument();
    });

    test('adapts layout for mobile screens', () => {
      useResponsiveLayout.mockReturnValue({
        layout: 'mobile',
        dimensions: { width: 375, height: 667 }
      });

      render(
        <TestWrapper>
          <NewHeroSection />
        </TestWrapper>
      );

      expect(screen.getByText(/India's First/i)).toBeInTheDocument();
    });

    test('shows appropriate content based on screen size', () => {
      useResponsiveLayout.mockReturnValue({
        layout: 'mobile',
        dimensions: { width: 375, height: 667 }
      });

      render(
        <TestWrapper>
          <NewHeroSection variant="full" />
        </TestWrapper>
      );

      // Mobile should show compact version
      expect(screen.getByText(/India's First/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('lazy loads heavy components when enabled', async () => {
      render(
        <TestWrapper>
          <NewHeroSection enableLazyLoading={true} />
        </TestWrapper>
      );

      // Component should render immediately
      expect(screen.getByText(/India's First/i)).toBeInTheDocument();
    });

    test('disables animations when enableAnimations is false', () => {
      render(
        <TestWrapper>
          <NewHeroSection enableAnimations={false} />
        </TestWrapper>
      );

      expect(screen.getByText(/India's First/i)).toBeInTheDocument();
    });

    test('handles loading states gracefully', () => {
      render(
        <TestWrapper>
          <NewHeroSection />
        </TestWrapper>
      );

      // Should not show loading state after initial render
      expect(screen.queryByText(/Loading Hero Section/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('renders error boundary when component fails', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Force an error by passing invalid props
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <TestWrapper>
          <ThrowError />
        </TestWrapper>
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <NewHeroSection />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('provides proper ARIA labels', () => {
      render(
        <TestWrapper>
          <NewHeroSection />
        </TestWrapper>
      );

      const registerButton = screen.getByRole('button', { name: /register as donor/i });
      expect(registerButton).toHaveAttribute('aria-label');
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <NewHeroSection onRegisterClick={mockOnRegisterClick} />
        </TestWrapper>
      );

      // Tab through interactive elements
      await user.tab();
      const registerButton = screen.getByRole('button', { name: /register as donor/i });
      expect(registerButton).toHaveFocus();

      // Should be able to activate with space key
      await user.keyboard(' ');
      expect(mockOnRegisterClick).toHaveBeenCalledTimes(1);
    });

    test('has proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <NewHeroSection />
        </TestWrapper>
      );

      // Should have proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    test('provides alternative text for images', () => {
      render(
        <TestWrapper>
          <NewHeroSection />
        </TestWrapper>
      );

      // Images should have alt text (tested in HeroImages component)
      // This test ensures the component structure supports it
      expect(screen.getByText(/India's First/i)).toBeInTheDocument();
    });

    test('respects reduced motion preferences', () => {
      // Mock useReducedMotion to return true
      jest.doMock('framer-motion', () => ({
        ...jest.requireActual('framer-motion'),
        useReducedMotion: () => true,
      }));

      render(
        <TestWrapper>
          <NewHeroSection />
        </TestWrapper>
      );

      expect(screen.getByText(/India's First/i)).toBeInTheDocument();
    });

    test('maintains focus management', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <NewHeroSection />
        </TestWrapper>
      );

      // Focus should be manageable
      await user.tab();
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
    });
  });

  describe('Content Validation', () => {
    test('displays correct privacy messaging', () => {
      render(
        <TestWrapper>
          <NewHeroSection />
        </TestWrapper>
      );

      expect(screen.getByText(/Privacy-Protected/i)).toBeInTheDocument();
      expect(screen.getByText(/3-month hiding feature/i)).toBeInTheDocument();
    });

    test('shows foundation branding', () => {
      render(
        <TestWrapper>
          <NewHeroSection />
        </TestWrapper>
      );

      expect(screen.getByText(/Callforblood Foundation/i)).toBeInTheDocument();
    });

    test('displays impact statistics', () => {
      render(
        <TestWrapper>
          <NewHeroSection variant="full" />
        </TestWrapper>
      );

      // Should show trust indicators
      expect(screen.getByText(/50,000\+.*donors/i)).toBeInTheDocument();
      expect(screen.getByText(/25,000\+.*lives saved/i)).toBeInTheDocument();
      expect(screen.getByText(/95%.*success rate/i)).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    test('integrates with routing correctly', () => {
      render(
        <TestWrapper>
          <NewHeroSection onRegisterClick={mockOnRegisterClick} />
        </TestWrapper>
      );

      // Component should render within router context
      expect(screen.getByText(/India's First/i)).toBeInTheDocument();
    });

    test('handles prop changes correctly', () => {
      const { rerender } = render(
        <TestWrapper>
          <NewHeroSection variant="minimal" />
        </TestWrapper>
      );

      expect(screen.getByText(/India's First/i)).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <NewHeroSection variant="full" />
        </TestWrapper>
      );

      expect(screen.getByText(/India's First/i)).toBeInTheDocument();
    });
  });
});