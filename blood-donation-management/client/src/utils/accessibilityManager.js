/**
 * Accessibility Manager
 * Handles ARIA labels, keyboard navigation, and accessibility compliance
 */

class AccessibilityManager {
  constructor() {
    this.focusableElements = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    this.keyboardListeners = new Map();
    this.focusTrap = null;
    this.announcements = [];
    
    this.initialize();
  }

  // Initialize accessibility features
  initialize() {
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupScreenReaderSupport();
    this.setupReducedMotionSupport();
    this.addAccessibilityCSS();
    this.monitorAccessibility();
  }

  // Setup keyboard navigation
  setupKeyboardNavigation() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      this.handleGlobalKeyboard(event);
    });

    // Skip to main content
    this.addSkipLink();
    
    // Escape key handling for modals and overlays
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.handleEscapeKey(event);
      }
    });

    // Tab navigation enhancement
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        this.handleTabNavigation(event);
      }
    });
  }

  // Handle global keyboard shortcuts
  handleGlobalKeyboard(event) {
    const { key, ctrlKey, altKey, metaKey } = event;
    
    // Alt + 1: Skip to main content
    if (altKey && key === '1') {
      event.preventDefault();
      this.skipToMainContent();
    }
    
    // Alt + 2: Skip to navigation
    if (altKey && key === '2') {
      event.preventDefault();
      this.skipToNavigation();
    }
    
    // Alt + E: Emergency request (critical accessibility feature)
    if (altKey && key.toLowerCase() === 'e') {
      event.preventDefault();
      this.triggerEmergencyRequest();
    }
    
    // Ctrl/Cmd + K: Search
    if ((ctrlKey || metaKey) && key.toLowerCase() === 'k') {
      event.preventDefault();
      this.focusSearch();
    }
  }

  // Add skip link for keyboard users
  addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 10000;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // Setup focus management
  setupFocusManagement() {
    // Track focus for debugging
    if (process.env.NODE_ENV === 'development') {
      document.addEventListener('focusin', (event) => {
        console.log('[A11y] Focus:', event.target);
      });
    }
    
    // Ensure focus is visible
    document.addEventListener('focusin', (event) => {
      this.ensureFocusVisible(event.target);
    });
    
    // Handle focus restoration
    this.setupFocusRestoration();
  }

  // Ensure focused element is visible
  ensureFocusVisible(element) {
    if (!element) return;
    
    // Add focus indicator class
    element.classList.add('keyboard-focused');
    
    // Remove on mouse interaction
    const removeKeyboardFocus = () => {
      element.classList.remove('keyboard-focused');
      element.removeEventListener('mousedown', removeKeyboardFocus);
      element.removeEventListener('touchstart', removeKeyboardFocus);
    };
    
    element.addEventListener('mousedown', removeKeyboardFocus);
    element.addEventListener('touchstart', removeKeyboardFocus);
    
    // Scroll into view if needed
    const rect = element.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    
    if (!isVisible) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  // Setup focus restoration for SPAs
  setupFocusRestoration() {
    let lastFocusedElement = null;
    
    // Store focus before navigation
    window.addEventListener('beforeunload', () => {
      lastFocusedElement = document.activeElement;
    });
    
    // Restore focus after navigation
    window.addEventListener('load', () => {
      if (lastFocusedElement && document.contains(lastFocusedElement)) {
        lastFocusedElement.focus();
      } else {
        this.focusMainContent();
      }
    });
  }

  // Setup screen reader support
  setupScreenReaderSupport() {
    // Create live region for announcements
    this.createLiveRegion();
    
    // Setup ARIA live regions
    this.setupLiveRegions();
    
    // Handle dynamic content updates
    this.setupDynamicContentAnnouncements();
  }

  // Create ARIA live region
  createLiveRegion() {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(liveRegion);
    this.liveRegion = liveRegion;
  }

  // Setup live regions for different announcement types
  setupLiveRegions() {
    // Alert region for important messages
    const alertRegion = document.createElement('div');
    alertRegion.id = 'aria-alert-region';
    alertRegion.setAttribute('aria-live', 'assertive');
    alertRegion.setAttribute('aria-atomic', 'true');
    alertRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(alertRegion);
    this.alertRegion = alertRegion;
    
    // Status region for status updates
    const statusRegion = document.createElement('div');
    statusRegion.id = 'aria-status-region';
    statusRegion.setAttribute('aria-live', 'polite');
    statusRegion.setAttribute('aria-atomic', 'false');
    statusRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(statusRegion);
    this.statusRegion = statusRegion;
  }

  // Setup dynamic content announcements
  setupDynamicContentAnnouncements() {
    // Monitor DOM changes for accessibility updates
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.processNewElement(node);
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Process new elements for accessibility
  processNewElement(element) {
    // Add missing ARIA labels
    this.addMissingAriaLabels(element);
    
    // Setup keyboard navigation for new interactive elements
    this.setupElementKeyboardNavigation(element);
    
    // Announce important new content
    if (element.hasAttribute('data-announce')) {
      const message = element.getAttribute('data-announce');
      this.announce(message);
    }
  }

  // Add missing ARIA labels
  addMissingAriaLabels(element) {
    // Buttons without accessible names
    const buttons = element.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach((button) => {
      if (!button.textContent.trim()) {
        const icon = button.querySelector('svg, i, [class*="icon"]');
        if (icon) {
          button.setAttribute('aria-label', this.generateButtonLabel(button));
        }
      }
    });
    
    // Links without accessible names
    const links = element.querySelectorAll('a:not([aria-label]):not([aria-labelledby])');
    links.forEach((link) => {
      if (!link.textContent.trim()) {
        link.setAttribute('aria-label', this.generateLinkLabel(link));
      }
    });
    
    // Form inputs without labels
    const inputs = element.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach((input) => {
      const label = element.querySelector(`label[for="${input.id}"]`);
      if (!label && input.placeholder) {
        input.setAttribute('aria-label', input.placeholder);
      }
    });
    
    // Images without alt text
    const images = element.querySelectorAll('img:not([alt])');
    images.forEach((img) => {
      img.setAttribute('alt', this.generateImageAlt(img));
    });
  }

  // Generate button label from context
  generateButtonLabel(button) {
    if (!button) return 'Button';
    // Prefer explicitly provided labels
    if (button.hasAttribute('data-label')) {
      return button.getAttribute('data-label');
    }
    if (button.hasAttribute('title')) {
      return button.getAttribute('title');
    }

    const icon = button.querySelector('svg, i, [class*="icon"]');
    const parent = button.closest('[data-label]');
    
    if (parent) {
      return parent.getAttribute('data-label');
    }
    
    if (icon) {
      // Normalize class names across HTML/SVG elements
      let classNames = '';
      if (typeof icon.className === 'string') {
        classNames = icon.className;
      } else if (icon.classList && typeof icon.classList.value === 'string') {
        classNames = icon.classList.value;
      } else if (icon.className && typeof icon.className.baseVal === 'string') {
        // SVGAnimatedString
        classNames = icon.className.baseVal;
      } else {
        classNames = icon.getAttribute('class') || '';
      }

      const iconClass = classNames.toLowerCase();
      if (iconClass.includes('close') || iconClass.includes('x')) return 'Close';
      if (iconClass.includes('menu') || iconClass.includes('hamburger')) return 'Menu';
      if (iconClass.includes('search')) return 'Search';
      if (iconClass.includes('heart') || iconClass.includes('favorite')) return 'Favorite';
      if (iconClass.includes('share')) return 'Share';
      if (iconClass.includes('edit') || iconClass.includes('pencil')) return 'Edit';
      if (iconClass.includes('delete') || iconClass.includes('trash') || iconClass.includes('remove')) return 'Delete';
      if (iconClass.includes('add') || iconClass.includes('plus') || iconClass.includes('new')) return 'Add';
      if (iconClass.includes('download')) return 'Download';
      if (iconClass.includes('upload')) return 'Upload';
      if (iconClass.includes('play')) return 'Play';
      if (iconClass.includes('pause')) return 'Pause';
    }
    
    return 'Button';
  }

  // Generate link label from context
  generateLinkLabel(link) {
    const href = link.getAttribute('href');
    if (href) {
      if (href.startsWith('tel:')) return `Call ${href.replace('tel:', '')}`;
      if (href.startsWith('mailto:')) return `Email ${href.replace('mailto:', '')}`;
      if (href.startsWith('http')) return `Visit ${new URL(href).hostname}`;
    }
    return 'Link';
  }

  // Generate image alt text
  generateImageAlt(img) {
    const src = img.src;
    if (src) {
      const filename = src.split('/').pop().split('.')[0];
      return filename.replace(/[-_]/g, ' ');
    }
    return 'Image';
  }

  // Setup keyboard navigation for element
  setupElementKeyboardNavigation(element) {
    // Handle arrow key navigation for lists
    const lists = element.querySelectorAll('[role="listbox"], [role="menu"], [role="tablist"]');
    lists.forEach((list) => {
      this.setupArrowKeyNavigation(list);
    });
    
    // Handle Enter/Space for custom buttons
    const customButtons = element.querySelectorAll('[role="button"]:not(button)');
    customButtons.forEach((button) => {
      this.setupCustomButtonKeyboard(button);
    });
  }

  // Setup arrow key navigation for lists
  setupArrowKeyNavigation(list) {
    list.addEventListener('keydown', (event) => {
      const items = Array.from(list.querySelectorAll('[role="option"], [role="menuitem"], [role="tab"]'));
      const currentIndex = items.indexOf(event.target);
      
      let nextIndex = currentIndex;
      
      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          nextIndex = (currentIndex + 1) % items.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
          break;
        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          nextIndex = items.length - 1;
          break;
        default:
          // No action needed for other keys
          break;
      }
      
      if (nextIndex !== currentIndex && items[nextIndex]) {
        items[nextIndex].focus();
      }
    });
  }

  // Setup keyboard support for custom buttons
  setupCustomButtonKeyboard(button) {
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        button.click();
      }
    });
  }

  // Setup reduced motion support
  setupReducedMotionSupport() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleReducedMotion = (e) => {
      if (e.matches) {
        document.body.classList.add('reduce-motion');
        this.announce('Animations reduced for accessibility');
      } else {
        document.body.classList.remove('reduce-motion');
      }
    };
    
    handleReducedMotion(mediaQuery);
    mediaQuery.addEventListener('change', handleReducedMotion);
  }

  // Add accessibility CSS
  addAccessibilityCSS() {
    const style = document.createElement('style');
    style.textContent = `
      /* Focus indicators */
      .keyboard-focused {
        outline: 2px solid #0066cc !important;
        outline-offset: 2px !important;
      }
      
      /* Skip link */
      .skip-link:focus {
        position: absolute !important;
        top: 6px !important;
        left: 6px !important;
        z-index: 10000 !important;
      }
      
      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .reduce-motion *,
        .reduce-motion *::before,
        .reduce-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        * {
          border-color: ButtonText !important;
        }
        
        button, input, select, textarea {
          border: 1px solid ButtonText !important;
        }
      }
      
      /* Screen reader only content */
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
      
      /* Focus within for containers */
      .focus-within:focus-within {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
      }
      
      /* Touch target minimum size */
      button, a, input, select, textarea, [role="button"], [role="link"] {
        min-height: 44px;
        min-width: 44px;
      }
      
      /* Ensure text contrast */
      .low-contrast {
        color: #000 !important;
        background-color: #fff !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  // Monitor accessibility issues
  monitorAccessibility() {
    // Only run if explicitly enabled via env flag
    const enabled = process.env.REACT_APP_A11Y_LOGS === 'true';
    if (!enabled) return;
    if (process.env.NODE_ENV === 'development') {
      // Check for common accessibility issues
      setInterval(() => {
        this.checkAccessibilityIssues();
      }, 5000);
    }
  }

  // Check for accessibility issues
  checkAccessibilityIssues() {
    // Honor env flag to silence logs unless explicitly enabled
    const enabled = process.env.REACT_APP_A11Y_LOGS === 'true';
    if (!enabled) return [];
    const issues = [];
    
    // Missing alt text
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} images missing alt text`);
    }
    
    // Buttons without accessible names
    const buttonsWithoutNames = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    const emptyButtons = Array.from(buttonsWithoutNames).filter(btn => !btn.textContent.trim());
    if (emptyButtons.length > 0) {
      issues.push(`${emptyButtons.length} buttons without accessible names`);
    }
    
    // Form inputs without labels
    const inputsWithoutLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    const unlabeledInputs = Array.from(inputsWithoutLabels).filter(input => {
      return !document.querySelector(`label[for="${input.id}"]`);
    });
    if (unlabeledInputs.length > 0) {
      issues.push(`${unlabeledInputs.length} form inputs without labels`);
    }
    
    // Low contrast elements
    const lowContrastElements = this.findLowContrastElements();
    if (lowContrastElements.length > 0) {
      issues.push(`${lowContrastElements.length} elements with low contrast`);
    }
    
    if (issues.length > 0) {
      // Keep logs behind the flag only
      console.warn('[A11y Issues]', issues);
    }
    return issues;
  }

  // Find elements with low contrast
  findLowContrastElements() {
    const elements = document.querySelectorAll('*');
    const lowContrast = [];
    
    elements.forEach(element => {
      const styles = getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const contrast = this.calculateContrast(color, backgroundColor);
        if (contrast < 4.5) { // WCAG AA standard
          lowContrast.push(element);
        }
      }
    });
    
    return lowContrast;
  }

  // Calculate color contrast ratio
  calculateContrast(color1, color2) {
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);
    
    if (!rgb1 || !rgb2) return 21; // Assume good contrast if can't parse
    
    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Parse CSS color to RGB
  parseColor(color) {
    const div = document.createElement('div');
    div.style.color = color;
    document.body.appendChild(div);
    const computed = getComputedStyle(div).color;
    document.body.removeChild(div);
    
    const match = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    return null;
  }

  // Get relative luminance
  getLuminance({ r, g, b }) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Public methods for components to use

  // Announce message to screen readers
  announce(message, priority = 'polite') {
    const region = priority === 'assertive' ? this.alertRegion : this.liveRegion;
    
    if (region) {
      region.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
    
    this.announcements.push({
      message,
      priority,
      timestamp: Date.now()
    });
  }

  // Create focus trap for modals
  createFocusTrap(container) {
    const focusableElements = container.querySelectorAll(this.focusableElements);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const trapFocus = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    container.addEventListener('keydown', trapFocus);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }
    
    return {
      destroy: () => {
        container.removeEventListener('keydown', trapFocus);
      }
    };
  }

  // Remove focus trap
  removeFocusTrap() {
    if (this.focusTrap) {
      this.focusTrap.destroy();
      this.focusTrap = null;
    }
  }

  // Navigation helpers
  skipToMainContent() {
    const main = document.querySelector('main, #main-content, [role="main"]');
    if (main) {
      main.focus();
      main.scrollIntoView({ behavior: 'smooth' });
    }
  }

  skipToNavigation() {
    const nav = document.querySelector('nav, [role="navigation"]');
    if (nav) {
      const firstLink = nav.querySelector('a, button');
      if (firstLink) {
        firstLink.focus();
      }
    }
  }

  focusMainContent() {
    const main = document.querySelector('main, #main-content, [role="main"]');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus();
    }
  }

  focusSearch() {
    const search = document.querySelector('input[type="search"], [role="searchbox"]');
    if (search) {
      search.focus();
    }
  }

  triggerEmergencyRequest() {
    const emergencyButton = document.querySelector('[data-emergency-button], .emergency-button');
    if (emergencyButton) {
      emergencyButton.click();
      this.announce('Emergency request activated', 'assertive');
    }
  }

  // Handle escape key
  handleEscapeKey(event) {
    // Close modals
    const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
    if (modal) {
      const closeButton = modal.querySelector('[data-close], .close-button');
      if (closeButton) {
        closeButton.click();
      }
    }
    
    // Close dropdowns
    const dropdown = document.querySelector('[aria-expanded="true"]');
    if (dropdown) {
      dropdown.setAttribute('aria-expanded', 'false');
    }
  }

  // Handle tab navigation
  handleTabNavigation(event) {
    // Ensure focus is visible
    setTimeout(() => {
      if (document.activeElement) {
        this.ensureFocusVisible(document.activeElement);
      }
    }, 0);
  }

  // Get accessibility report
  getAccessibilityReport() {
    return {
      announcements: this.announcements,
      focusableElementsCount: document.querySelectorAll(this.focusableElements).length,
      hasSkipLink: !!document.querySelector('.skip-link'),
      hasLiveRegions: !!(this.liveRegion && this.alertRegion),
      reducedMotion: document.body.classList.contains('reduce-motion'),
      issues: this.checkAccessibilityIssues()
    };
  }
}

// Create singleton instance
const accessibilityManager = new AccessibilityManager();

export default accessibilityManager;