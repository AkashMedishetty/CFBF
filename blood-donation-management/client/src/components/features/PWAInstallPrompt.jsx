/**
 * PWA Install Prompt Component
 * Shows install prompt for PWA when available
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

const PWAInstallPrompt = () => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;

        if (isStandalone) {
            setIsInstalled(true);
            return;
        }

        // Check if iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(iOS);

        // Listen for install prompt
        const handleInstallPrompt = (e) => {
            console.log('Install prompt available');
            setInstallPrompt(e.detail.prompt);

            // Show prompt after a delay (don't be too aggressive)
            setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
        };

        // Listen for successful installation
        const handleInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setInstallPrompt(null);
        };

        window.addEventListener('pwa:install-available', handleInstallPrompt);
        window.addEventListener('pwa:installed', handleInstalled);

        return () => {
            window.removeEventListener('pwa:install-available', handleInstallPrompt);
            window.removeEventListener('pwa:installed', handleInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;

        try {
            const result = await installPrompt.prompt();
            console.log('Install prompt result:', result);

            if (result.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
        } catch (error) {
            console.error('Error showing install prompt:', error);
        }

        setInstallPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Don't show again for this session
        sessionStorage.setItem('pwa-install-dismissed', 'true');
    };

    // Don't show if already installed or dismissed
    if (isInstalled || sessionStorage.getItem('pwa-install-dismissed')) {
        return null;
    }

    // iOS install instructions
    if (isIOS && showPrompt) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
                >
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex items-start space-x-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                                    Install CallforBlood Foundation
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                                    Add to your home screen for quick access to emergency blood requests.
                                </p>
                                <div className="text-xs text-slate-500 dark:text-slate-500 space-y-1">
                                    <p>1. Tap the share button <span className="inline-block">⬆️</span></p>
                                    <p>2. Select "Add to Home Screen"</p>
                                    <p>3. Tap "Add" to install</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // Standard install prompt
    if (showPrompt && installPrompt) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
                >
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex items-start space-x-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <Download className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                                    Install CallforBlood Foundation
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                                    Get instant notifications for emergency blood requests and work offline.
                                </p>
                                <div className="flex space-x-2">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleInstall}
                                        className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                                    >
                                        <Download className="w-3 h-3 inline mr-1" />
                                        Install
                                    </motion.button>
                                    <button
                                        onClick={handleDismiss}
                                        className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium"
                                    >
                                        Later
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return null;
};

export default PWAInstallPrompt;