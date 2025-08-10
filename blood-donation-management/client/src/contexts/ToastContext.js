import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showEmergencyToast = useCallback((patientData, options = {}) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'emergency',
      patientData,
      isVisible: true,
      autoClose: options.autoClose || false,
      autoCloseDelay: options.autoCloseDelay || 10000,
      ...options
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const showToast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type,
      message,
      isVisible: true,
      autoClose: options.autoClose !== false,
      autoCloseDelay: options.autoCloseDelay || 5000,
      ...options
    };

    setToasts(prev => [...prev, newToast]);

    if (newToast.autoClose) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.autoCloseDelay);
    }

    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const updateToast = useCallback((id, updates) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  }, []);

  // Emergency toast specific methods
  const showEmergencyAlert = useCallback((patientData) => {
    return showEmergencyToast(patientData, {
      autoClose: false,
      priority: 'high'
    });
  }, [showEmergencyToast]);

  const showSuccessToast = useCallback((message, options = {}) => {
    return showToast(message, 'success', options);
  }, [showToast]);

  const showErrorToast = useCallback((message, options = {}) => {
    return showToast(message, 'error', options);
  }, [showToast]);

  const showWarningToast = useCallback((message, options = {}) => {
    return showToast(message, 'warning', options);
  }, [showToast]);

  const showInfoToast = useCallback((message, options = {}) => {
    return showToast(message, 'info', options);
  }, [showToast]);

  const value = {
    toasts,
    showEmergencyToast,
    showEmergencyAlert,
    showToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    hideToast,
    hideAllToasts,
    updateToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export default ToastContext;


