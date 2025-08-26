import React from 'react';

const HelpPage = () => {
  return (
    <div className="min-h-screen py-16 bg-white dark:bg-dark-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">Help Center</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Find answers to common questions about registering, privacy, donations, and using the platform.
        </p>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">How do I register as a donor?</h2>
            <p className="text-slate-600 dark:text-slate-400">Go to the Register page and fill out your details. You can manage your profile anytime.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">How is my privacy protected?</h2>
            <p className="text-slate-600 dark:text-slate-400">We offer a 3-month hiding feature after each donation and strictly protect your personal details.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Need more help?</h2>
            <p className="text-slate-600 dark:text-slate-400">Contact us at <a href="mailto:info@callforbloodfoundation.com" className="text-primary-600">info@callforbloodfoundation.com</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;

