/**
 * PWA Status Component
 * Shows PWA installation status and debugging information
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Smartphone,
    CheckCircle,
    AlertCircle,
    Info,
    Wifi,
    Bell
} from 'lucide-react';

const PWAStatus = () => {
    const [pwaStatus, setPwaStatus] = useState({
        isInstallable: false,
        isInstalled: false,
        hasServiceWorker: false,
        isOnline: navigator.onLine,
        supportsNotifications: 'Notification' in window,
        notificationPermission: Notification.permission,
        manifestExists: false,
        serviceWorkerState: 'unknown'
    });

    useEffect(() => {
        const checkPWAStatus = async () => {
            const status = { ...pwaStatus };

            // Check if PWA is installed
            status.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true;

            // Check service worker
            if ('serviceWorker' in navigator) {
                status.hasServiceWorker = true;
                try {
                    const registration = await navigator.serviceWorker.getRegistration();
                    if (registration) {
                        if (registration.active) {
                            status.serviceWorkerState = 'active';
                        } else if (registration.installing) {
                            status.serviceWorkerState = 'installing';
                        } else if (registration.waiting) {
                            status.serviceWorkerState = 'waiting';
                        }
                    } else {
                        status.serviceWorkerState = 'not_registered';
                    }
                } catch (error) {
                    status.serviceWorkerState = 'error';
                }
            }

            // Check manifest
            try {
                const response = await fetch('/manifest.json');
                status.manifestExists = response.ok;
            } catch (error) {
                status.manifestExists = false;
            }

            // Update notification permission
            if ('Notification' in window) {
                status.notificationPermission = Notification.permission;
            }

            setPwaStatus(status);
        };

        checkPWAStatus();

        // Recheck status every 2 seconds to catch service worker registration
        const interval = setInterval(checkPWAStatus, 2000);

        // Listen for PWA events
        const handleInstallPrompt = () => {
            setPwaStatus(prev => ({ ...prev, isInstallable: true }));
        };

        const handleInstalled = () => {
            setPwaStatus(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
        };

        const handleOnline = () => {
            setPwaStatus(prev => ({ ...prev, isOnline: true }));
        };

        const handleOffline = () => {
            setPwaStatus(prev => ({ ...prev, isOnline: false }));
        };

        window.addEventListener('beforeinstallprompt', handleInstallPrompt);
        window.addEventListener('appinstalled', handleInstalled);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            clearInterval(interval);
            window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
            window.removeEventListener('appinstalled', handleInstalled);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const getStatusIcon = (condition) => {
        return condition ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
        );
    };

    const getStatusColor = (condition) => {
        return condition ? 'text-green-600' : 'text-red-600';
    };

    // Only show in development mode
    if (process.env.NODE_ENV === 'production') {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed top-4 right-4 z-50 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg border border-slate-200 dark:border-dark-border p-4 max-w-sm"
        >
            <div className="flex items-center space-x-2 mb-3">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white">PWA Status</h3>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Installable</span>
                    <div className="flex items-center space-x-1">
                        {getStatusIcon(pwaStatus.isInstallable)}
                        <span className={getStatusColor(pwaStatus.isInstallable)}>
                            {pwaStatus.isInstallable ? 'Yes' : 'No'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Installed</span>
                    <div className="flex items-center space-x-1">
                        {getStatusIcon(pwaStatus.isInstalled)}
                        <span className={getStatusColor(pwaStatus.isInstalled)}>
                            {pwaStatus.isInstalled ? 'Yes' : 'No'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Service Worker</span>
                    <div className="flex items-center space-x-1">
                        {getStatusIcon(pwaStatus.hasServiceWorker && pwaStatus.serviceWorkerState === 'active')}
                        <span className={getStatusColor(pwaStatus.hasServiceWorker && pwaStatus.serviceWorkerState === 'active')}>
                            {pwaStatus.serviceWorkerState}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Manifest</span>
                    <div className="flex items-center space-x-1">
                        {getStatusIcon(pwaStatus.manifestExists)}
                        <span className={getStatusColor(pwaStatus.manifestExists)}>
                            {pwaStatus.manifestExists ? 'Found' : 'Missing'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Online</span>
                    <div className="flex items-center space-x-1">
                        <Wifi className={`w-4 h-4 ${pwaStatus.isOnline ? 'text-green-600' : 'text-red-600'}`} />
                        <span className={getStatusColor(pwaStatus.isOnline)}>
                            {pwaStatus.isOnline ? 'Yes' : 'No'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Notifications</span>
                    <div className="flex items-center space-x-1">
                        <Bell className={`w-4 h-4 ${pwaStatus.notificationPermission === 'granted' ? 'text-green-600' : 'text-yellow-600'}`} />
                        <span className={pwaStatus.notificationPermission === 'granted' ? 'text-green-600' : 'text-yellow-600'}>
                            {pwaStatus.notificationPermission}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-dark-border">
                <div className="flex items-start space-x-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {pwaStatus.isInstalled ? (
                            "PWA is installed and running in standalone mode."
                        ) : pwaStatus.isInstallable ? (
                            "PWA is installable. Look for the install button in your browser."
                        ) : (
                            "PWA requirements not met. Check service worker and manifest."
                        )}
                    </div>
                </div>
                
                {pwaStatus.serviceWorkerState === 'not_registered' && (
                    <button
                        onClick={async () => {
                            try {
                                const swUrl = process.env.NODE_ENV === 'production' ? '/service-worker.js' : '/sw-dev.js';
                                const registration = await navigator.serviceWorker.register(swUrl);
                                console.log('Manual SW registration:', registration);
                            } catch (error) {
                                console.error('Manual SW registration failed:', error);
                            }
                        }}
                        className="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Register Service Worker
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default PWAStatus;