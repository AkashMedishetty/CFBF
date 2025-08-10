import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import logger from '../../utils/logger';

const ProtectedRoute = ({ children, requiredRole = null, redirectTo = '/login' }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  logger.debug('🛡️ ProtectedRoute check', 'PROTECTED_ROUTE', {
    path: location.pathname,
    isAuthenticated,
    loading,
    hasUser: !!user,
    userId: user?.id,
    userRole: user?.role,
    requiredRole,
    redirectTo
  });

  // Show loading while checking authentication
  if (loading) {
    logger.debug('⏳ Showing loading screen', 'PROTECTED_ROUTE');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    logger.warn('❌ Unauthorized access attempt', 'PROTECTED_ROUTE', {
      path: location.pathname,
      redirectTo,
      hasUser: !!user,
      loading,
      requiredRole
    });
    
    // Redirect admins to dedicated admin login
    const finalRedirectTo = requiredRole === 'admin' ? '/admin/login' : redirectTo;
    
    logger.debug('🔄 Redirecting to login', 'PROTECTED_ROUTE', {
      originalRedirect: redirectTo,
      finalRedirect: finalRedirectTo,
      reason: requiredRole === 'admin' ? 'admin_login_required' : 'authentication_required'
    });
    
    return <Navigate to={finalRedirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && user?.role !== requiredRole) {
    logger.warn('❌ Insufficient permissions', 'PROTECTED_ROUTE', {
      userRole: user?.role,
      requiredRole,
      path: location.pathname,
      userId: user?.id
    });
    
    // Redirect based on user role
    const roleRedirects = {
      admin: '/admin',
      donor: '/donor/dashboard',
      hospital: '/hospital/dashboard'
    };
    
    const defaultRedirect = roleRedirects[user?.role] || '/';
    logger.debug('🔄 Redirecting to role-appropriate page', 'PROTECTED_ROUTE', {
      from: location.pathname,
      to: defaultRedirect,
      userRole: user?.role
    });
    
    return <Navigate to={defaultRedirect} replace />;
  }

  logger.debug('✅ Access granted to protected route', 'PROTECTED_ROUTE', {
    path: location.pathname,
    userRole: user?.role,
    userId: user?.id,
    requiredRole: requiredRole || 'none'
  });

  return children;
};

export default ProtectedRoute;