/**
 * Keyboard Navigation Hook
 * Provides keyboard navigation utilities for React components
 */

import { useEffect, useRef, useCallback } from 'react';
import accessibilityManager from '../utils/accessibilityManager';

export const useKeyboardNavigation = (options = {}) => {
  const {
    enableArrowKeys = false,
    enableTabTrapping = false,
    enableEscapeHandling = false,
    customKeyHandlers = {},
    autoFocus = false,
    restoreFocus = true
  } = options;

  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);
  const focusTrapRef = useRef(null);

  // Store previous focus when component mounts
  useEffect(() => {
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement;
    }
    
    return () => {
      // Restore focus when component unmounts
      if (restoreFocus && previousFocusRef.current && document.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      }
    };
  }, [restoreFocus]);

  // Auto focus first focusable element
  useEffect(() => {
    if (autoFocus && containerRef.current) {
      const firstFocusable = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [autoFocus]);

  // Setup focus trap
  useEffect(() => {
    if (enableTabTrapping && containerRef.current) {
      focusTrapRef.current = accessibilityManager.createFocusTrap(containerRef.current);
      
      return () => {
        if (focusTrapRef.current) {
          focusTrapRef.current.destroy();
        }
      };
    }
  }, [enableTabTrapping]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event) => {
    const { key, shiftKey, ctrlKey, altKey, metaKey } = event;
    
    // Handle custom key handlers first
    if (customKeyHandlers[key]) {
      const handled = customKeyHandlers[key](event);
      if (handled) return;
    }
    
    // Handle escape key
    if (enableEscapeHandling && key === 'Escape') {
      event.preventDefault();
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
      return;
    }
    
    // Handle arrow key navigation
    if (enableArrowKeys && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      handleArrowKeyNavigation(event);
    }
    
    // Handle Enter and Space for custom interactive elements
    if ((key === 'Enter' || key === ' ') && event.target.getAttribute('role') === 'button') {
      event.preventDefault();
      event.target.click();
    }
    
  }, [customKeyHandlers, enableEscapeHandling, enableArrowKeys, restoreFocus, handleArrowKeyNavigation]);

  // Handle arrow key navigation
  const handleArrowKeyNavigation = useCallback((event) => {
    if (!containerRef.current) return;
    
    const focusableElements = Array.from(
      containerRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    
    const currentIndex = focusableElements.indexOf(event.target);
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = (currentIndex + 1) % focusableElements.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
        break;
      default:
        return;
    }
    
    if (focusableElements[nextIndex]) {
      focusableElements[nextIndex].focus();
    }
  }, []);

  // Setup keyboard event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    containerRef,
    focusFirst: useCallback(() => {
      if (containerRef.current) {
        const firstFocusable = containerRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
    }, []),
    focusLast: useCallback(() => {
      if (containerRef.current) {
        const focusableElements = containerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const lastFocusable = focusableElements[focusableElements.length - 1];
        if (lastFocusable) {
          lastFocusable.focus();
        }
      }
    }, [])
  };
};

// Hook for managing focus within lists
export const useListNavigation = (items = [], options = {}) => {
  const {
    orientation = 'vertical', // 'vertical' | 'horizontal' | 'both'
    wrap = true,
    onSelectionChange
  } = options;

  const listRef = useRef(null);
  const currentIndexRef = useRef(0);

  const handleKeyDown = useCallback((event) => {
    if (!listRef.current) return;
    
    const { key } = event;
    const isVertical = orientation === 'vertical' || orientation === 'both';
    const isHorizontal = orientation === 'horizontal' || orientation === 'both';
    
    let handled = false;
    let newIndex = currentIndexRef.current;
    
    if ((key === 'ArrowDown' && isVertical) || (key === 'ArrowRight' && isHorizontal)) {
      event.preventDefault();
      newIndex = wrap ? (currentIndexRef.current + 1) % items.length : Math.min(currentIndexRef.current + 1, items.length - 1);
      handled = true;
    } else if ((key === 'ArrowUp' && isVertical) || (key === 'ArrowLeft' && isHorizontal)) {
      event.preventDefault();
      newIndex = wrap ? (currentIndexRef.current - 1 + items.length) % items.length : Math.max(currentIndexRef.current - 1, 0);
      handled = true;
    } else if (key === 'Home') {
      event.preventDefault();
      newIndex = 0;
      handled = true;
    } else if (key === 'End') {
      event.preventDefault();
      newIndex = items.length - 1;
      handled = true;
    }
    
    if (handled && newIndex !== currentIndexRef.current) {
      currentIndexRef.current = newIndex;
      
      // Focus the new item
      const itemElements = listRef.current.querySelectorAll('[role="option"], [role="menuitem"], [role="tab"], li');
      if (itemElements[newIndex]) {
        itemElements[newIndex].focus();
      }
      
      if (onSelectionChange) {
        onSelectionChange(newIndex, items[newIndex]);
      }
    }
  }, [items, orientation, wrap, onSelectionChange]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    
    list.addEventListener('keydown', handleKeyDown);
    
    return () => {
      list.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    listRef,
    currentIndex: currentIndexRef.current,
    setCurrentIndex: useCallback((index) => {
      if (index >= 0 && index < items.length) {
        currentIndexRef.current = index;
      }
    }, [items.length])
  };
};

// Hook for managing modal focus
export const useModalFocus = (isOpen = false) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const focusTrapRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement;
      
      // Create focus trap
      if (modalRef.current) {
        focusTrapRef.current = accessibilityManager.createFocusTrap(modalRef.current);
      }
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Remove focus trap
        if (focusTrapRef.current) {
          focusTrapRef.current.destroy();
        }
        
        // Restore focus
        if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen]);

  const closeModal = useCallback(() => {
    // This should be provided by the parent component
    console.warn('closeModal function not provided to useModalFocus');
  }, []);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
    }
  }, [closeModal]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  return {
    modalRef,
    setCloseModal: useCallback((closeFn) => {
      closeModal.current = closeFn;
    }, [closeModal])
  };
};

// Hook for managing dropdown focus
export const useDropdownFocus = (isOpen = false) => {
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleKeyDown = useCallback((event) => {
    if (!isOpen) return;
    
    const { key } = event;
    
    if (key === 'Escape') {
      event.preventDefault();
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    } else if (key === 'Tab') {
      // Allow normal tab behavior but close dropdown
      setTimeout(() => {
        if (dropdownRef.current && !dropdownRef.current.contains(document.activeElement)) {
          // Focus moved outside dropdown, close it
          if (triggerRef.current) {
            triggerRef.current.setAttribute('aria-expanded', 'false');
          }
        }
      }, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      
      // Focus first item in dropdown
      if (dropdownRef.current) {
        const firstItem = dropdownRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstItem) {
          firstItem.focus();
        }
      }
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  return {
    triggerRef,
    dropdownRef
  };
};

// Hook for managing form navigation
export const useFormNavigation = () => {
  const formRef = useRef(null);

  const handleKeyDown = useCallback((event) => {
    if (!formRef.current) return;
    
    const { key, ctrlKey, metaKey } = event;
    
    // Ctrl/Cmd + Enter to submit form
    if ((ctrlKey || metaKey) && key === 'Enter') {
      event.preventDefault();
      const submitButton = formRef.current.querySelector('button[type="submit"], input[type="submit"]');
      if (submitButton) {
        submitButton.click();
      }
    }
  }, []);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    
    form.addEventListener('keydown', handleKeyDown);
    
    return () => {
      form.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const focusFirstError = useCallback(() => {
    if (formRef.current) {
      const firstError = formRef.current.querySelector('[aria-invalid="true"], .error input, .error select, .error textarea');
      if (firstError) {
        firstError.focus();
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  return {
    formRef,
    focusFirstError
  };
};

export default useKeyboardNavigation;