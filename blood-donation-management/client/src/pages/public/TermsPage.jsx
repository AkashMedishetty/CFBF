import React from 'react';

const TermsPage = () => {
  return (
    <div className="min-h-screen py-16 bg-white dark:bg-dark-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">Terms of Service</h1>
        <div className="space-y-6 text-slate-700 dark:text-slate-300">
          <p>By using this platform, you agree to provide accurate information and use the services responsibly.</p>
          <p>We do not provide medical advice. Always consult qualified healthcare professionals.</p>
          <p>We reserve the right to suspend accounts involved in misuse or fraudulent activity.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;

