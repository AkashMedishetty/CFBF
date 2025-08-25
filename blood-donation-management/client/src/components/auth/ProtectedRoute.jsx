
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
    userStatus: user?.status,
    isApproved: user?.isApproved,
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
      donor: '/dashboard',
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

  // For donors, check if they need to complete onboarding or are pending approval
  if (user?.role === 'donor' && !requiredRole) {
    const isOnboardingPath = location.pathname === '/onboarding';
    const isDashboardPath = location.pathname === '/dashboard';
    const isProfilePath = location.pathname === '/profile';
    
    // Check if user is approved - use multiple status indicators
    const isApproved = user?.isApproved === true || 
                      user?.status === 'approved' || 
                      user?.status === 'active' ||
                      user?.verification?.isVerified === true;
    
    // Check if user has completed onboarding
    const hasCompletedOnboarding = user?.onboardingCompleted || 
      (user?.documents && user?.documents.length > 0) || 
      user?.questionnaireCompleted || 
      user?.status === 'pending';
    
    logger.debug('🔍 Donor onboarding check', 'PROTECTED_ROUTE', {
      hasCompletedOnboarding,
      isApproved,
      isOnboardingPath,
      isDashboardPath,
      isProfilePath,
      userStatus: user?.status,
      userIsApproved: user?.isApproved,
      verificationStatus: user?.verification?.isVerified,
      documentsCount: user?.documents?.length || 0,
      hasQuestionnaire: !!user?.questionnaire
    });
    
    // If approved, allow access to dashboard and other pages
    if (isApproved) {
      logger.debug('✅ Approved donor accessing protected route', 'PROTECTED_ROUTE', {
        path: location.pathname,
        userStatus: user?.status,
        isApproved: user?.isApproved
      });
      // Allow access - don't redirect approved users to onboarding
      return children;
    }
    
    // If not approved and trying to access dashboard/other pages, redirect to onboarding
    if (!isApproved && !isOnboardingPath && !isProfilePath) {
      logger.debug('🔄 Redirecting unapproved donor to onboarding', 'PROTECTED_ROUTE', {
        from: location.pathname,
        to: '/onboarding',
        reason: 'pending_approval'
      });
      return <Navigate to="/onboarding" replace />;
    }
    
    // If not completed onboarding and trying to access other pages, redirect to onboarding
    if (!hasCompletedOnboarding && !isOnboardingPath) {
      logger.debug('🔄 Redirecting incomplete donor to onboarding', 'PROTECTED_ROUTE', {
        from: location.pathname,
        to: '/onboarding',
        reason: 'incomplete_onboarding'
      });
      return <Navigate to="/onboarding" replace />;
    }
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