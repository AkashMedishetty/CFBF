import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeroSection from './HeroSection';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    img: ({ children, ...props }) => <img {...props}>{children}</img>,
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({ start: jest.fn(), stop: jest.fn() }),
  useReducedMotion: () => false,
}));

// Mock responsive layout
jest.mock('./ResponsiveHeroLayout', () => ({
  useResponsiveLayout: () => ({
    layout: 'desktop',
    dimensions: { width: 1024, height: 768 }
  }),
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

const TestWrapper = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe('HeroSection', () => {
  test('renders hero section with main content', () => {
    render(
      <TestWrapper>
        <HeroSection />
      </TestWrapper>
    );

    expect(screen.getByText(/India's First/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy-Protected/i)).toBeInTheDocument();
    expect(screen.getByText(/Blood Donation Platform/i)).toBeInTheDocument();
  });

  test('renders register button', () => {
    render(
      <TestWrapper>
        <HeroSection />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /register as donor/i })).toBeInTheDocument();
  });
});