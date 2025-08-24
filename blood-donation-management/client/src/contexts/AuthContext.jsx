import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      isAuthenticated: false,
      user: null,
      handleLogout: () => {},
      handleEnableNotifications: () => {},
      isEnablingPush: false,
      pushEnabled: false
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    // Add logout logic here
  };

  const handleEnableNotifications = async () => {
    setIsEnablingPush(true);
    try {
      // Add notification enabling logic here
      setPushEnabled(true);
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      setIsEnablingPush(false);
    }
  };

  const value = {
    isAuthenticated,
    user,
    handleLogout,
    handleEnableNotifications,
    isEnablingPush,
    pushEnabled
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};