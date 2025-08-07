import React from 'react';
import EducationHub from '../../components/public/EducationHub';

const EducationPage = () => {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Education Hub
        </h1>
        <EducationHub />
      </div>
    </div>
  );
};

export default EducationPage;