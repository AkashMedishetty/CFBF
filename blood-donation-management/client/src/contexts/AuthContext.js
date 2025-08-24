import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../utils/api';
import sessionManager from '../utils/sessionManager';
import logger from '../utils/logger';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check if user is authenticated on app load
    useEffect(() => {
        checkAuthStatus();
        
        // Cleanup session manager on unmount
        return () => {
            sessionManager.destroy();
        };
    }, [checkAuthStatus]);

    const checkAuthStatus = useCallback(async () => {
        logger.debug('🔍 Starting enhanced auth status check', 'AUTH_CONTEXT');
        
        try {
            // Initialize session manager
            await sessionManager.init();
            
            // Try to get session from persistent storage
            const session = await sessionManager.getSession();
            
            logger.debug('📱 Checking persistent session', 'AUTH_CONTEXT', {
                hasSession: !!session,
                userId: session?.userId,
                sessionExpiry: session ? new Date(session.expiresAt).toISOString() : 'none'
            });

            if (!session) {
                logger.debug('❌ No valid session found', 'AUTH_CONTEXT');
                setUser(null);
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }

            // Check if token needs refresh
            if (sessionManager.shouldRefreshToken(session.tokens.expiresIn)) {
                logger.debug('🔄 Token needs refresh, attempting refresh', 'AUTH_CONTEXT');
                try {
                    const refreshedSession = await sessionManager.refreshTokens(session);
                    session.tokens = refreshedSession.tokens;
                } catch (refreshError) {
                    logger.warn('⚠️ Token refresh failed, clearing session', 'AUTH_CONTEXT', refreshError);
                    await sessionManager.clearSession();
                    setUser(null);
                    setIsAuthenticated(false);
                    setLoading(false);
                    return;
                }
            }

            logger.debug('🔐 Valid session found, verifying with server', 'AUTH_CONTEXT');

            // Verify token with server and get user data
            const response = await authApi.getCurrentUser();
            
            logger.debug('📡 Server response received', 'AUTH_CONTEXT', {
                success: response.success,
                hasUser: !!response.data?.user,
                userId: response.data?.user?._id,
                error: response.error,
                message: response.message
            });

            if (response.success) {
                logger.success('✅ User authenticated successfully', 'AUTH_CONTEXT', {
                    userId: response.data.user._id,
                    role: response.data.user.role,
                    status: response.data.user.status,
                    phone: response.data.user.phoneNumber
                });

                setUser(response.data.user);
                setIsAuthenticated(true);
                
                // Update session with latest user data
                await sessionManager.storeSession({
                    user: response.data.user,
                    tokens: session.tokens
                });
            } else {
                logger.warn('⚠️ Token verification failed', 'AUTH_CONTEXT', {
                    error: response.error,
                    message: response.message
                });
                // Clear invalid session
                await sessionManager.clearSession();
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            logger.error('💥 Auth status check failed', 'AUTH_CONTEXT', error);
            // Clear potentially invalid session
            await sessionManager.clearSession();
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            logger.debug('🏁 Auth status check completed', 'AUTH_CONTEXT', {
                isAuthenticated,
                hasUser: !!user,
                loading: false
            });
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    const login = async (userData, tokens) => {
        try {
            logger.info('🚀 Starting enhanced login process', 'AUTH_CONTEXT', { 
                userId: userData.id || userData._id,
                hasTokens: !!tokens,
                hasAccessToken: !!tokens?.accessToken,
                hasRefreshToken: !!tokens?.refreshToken
            });

            if (!tokens?.accessToken) {
                logger.warn('⚠️ No access token provided', 'AUTH_CONTEXT', { 
                    tokens,
                    tokensType: typeof tokens,
                    tokensKeys: tokens ? Object.keys(tokens) : 'null'
                });
                throw new Error('Access token is required');
            }

            // Store session using enhanced session manager
            await sessionManager.storeSession({
                user: userData,
                tokens: tokens
            });

            logger.debug('💾 Session stored using SessionManager', 'AUTH_CONTEXT', {
                userId: userData.id || userData._id,
                sessionDuration: sessionManager.config.maxSessionDuration / (24 * 60 * 60 * 1000) + ' days'
            });

            // Set user state
            setUser(userData);
            setIsAuthenticated(true);

            // Auto-subscribe to push notifications after login (mandatory notifications)
            try {
                const { subscribeUser } = await import('../utils/push');
                const uid = userData.id || userData._id;
                await subscribeUser(uid);
            } catch (e) {
                logger.warn('Push auto-subscribe failed', 'AUTH_CONTEXT', e);
            }

            logger.success('✅ User logged in successfully with persistent session', 'AUTH_CONTEXT', {
                userId: userData.id || userData._id,
                role: userData.role,
                status: userData.status,
                phone: userData.phoneNumber || userData.phone
            });

            return { success: true };
        } catch (error) {
            logger.error('💥 Enhanced login failed', 'AUTH_CONTEXT', error);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            logger.info('Logging out user with session cleanup', 'AUTH_CONTEXT', { userId: user?.id || user?._id });

            // Call logout API if available
            try {
                await authApi.logout();
            } catch (error) {
                logger.warn('Logout API call failed', 'AUTH_CONTEXT', error);
            }

            // Clear persistent session
            await sessionManager.clearSession();

            // Clear state
            setUser(null);
            setIsAuthenticated(false);

            logger.success('User logged out successfully with session cleanup', 'AUTH_CONTEXT');

            return { success: true };
        } catch (error) {
            logger.error('Enhanced logout failed', 'AUTH_CONTEXT', error);
            return { success: false, error: error.message };
        }
    };

    const updateUser = (updatedUserData) => {
        logger.info('Updating user data', 'AUTH_CONTEXT', { userId: updatedUserData.id });
        setUser(prevUser => ({
            ...prevUser,
            ...updatedUserData
        }));
    };

    const refreshToken = async () => {
        try {
            const session = await sessionManager.getSession();

            if (!session?.tokens?.refreshToken) {
                throw new Error('No refresh token available');
            }

            const refreshedSession = await sessionManager.refreshTokens(session);
            
            logger.success('Token refreshed successfully via SessionManager', 'AUTH_CONTEXT');
            return { success: true, tokens: refreshedSession.tokens };
        } catch (error) {
            logger.error('Token refresh failed', 'AUTH_CONTEXT', error);
            // Force logout on refresh failure
            await logout();
            return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        updateUser,
        refreshToken,
        checkAuthStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;