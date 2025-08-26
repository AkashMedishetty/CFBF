import React from 'react';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen py-16 bg-white dark:bg-dark-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">Privacy Policy</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Effective date: {new Date().getFullYear()}</p>
        <div className="space-y-6 text-slate-700 dark:text-slate-300">
          <p>We value your privacy. We collect the minimum data required to connect donors with recipients securely.</p>
          <p>Donor details are never publicly displayed. After each donation, your profile is automatically hidden for 3 months.</p>
          <p>You may request data deletion or export at any time by emailing us.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;

