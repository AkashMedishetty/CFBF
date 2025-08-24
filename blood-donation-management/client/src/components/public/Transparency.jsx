import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Award, 
  FileText, 
  Download, 
  Eye,
  CheckCircle,
  Calendar,
  TrendingUp,
  Users,
  Heart,
  Building,
  Globe,
  Lock,
  Verified
} from 'lucide-react';

const Transparency = () => {
  const [selectedReport, setSelectedReport] = useState(null);

  const certifications = [
    {
      id: 1,
      name: 'ISO 27001:2013',
      description: 'Information Security Management System',
      issuer: 'International Organization for Standardization',
      validUntil: '2025-12-31',
      status: 'active',
      icon: Shield,
      color: 'text-blue-600'
    },
    {
      id: 2,
      name: 'HIPAA Compliance',
      description: 'Health Insurance Portability and Accountability Act',
      issuer: 'US Department of Health & Human Services',
      validUntil: '2024-12-31',
      status: 'active',
      icon: Lock,
      color: 'text-green-600'
    },
    {
      id: 3,
      name: 'NABH Accreditation',
      description: 'National Accreditation Board for Hospitals',
      issuer: 'Quality Council of India',
      validUntil: '2025-06-30',
      status: 'active',
      icon: Award,
      color: 'text-purple-600'
    },
    {
      id: 4,
      name: 'FDA Registration',
      description: 'Food and Drug Administration Registration',
      issuer: 'US Food and Drug Administration',
      validUntil: '2024-12-31',
      status: 'active',
      icon: Verified,
      color: 'text-red-600'
    }
  ];

  const impactReports = [
    {
      id: 1,
      title: 'Annual Impact Report 2023',
      description: 'Comprehensive overview of our impact, achievements, and financial transparency',
      type: 'Annual Report',
      date: '2024-01-15',
      size: '2.4 MB',
      pages: 48,
      downloads: 1250,
      highlights: [
        '15,420 active donors registered',
        '45,680 successful blood donations',
        '137,040 lives impacted',
        '96.4% request fulfillment rate'
      ]
    },
    {
      id: 2,
      title: 'Financial Transparency Report 2023',
      description: 'Detailed breakdown of funding sources, expenses, and financial accountability',
      type: 'Financial Report',
      date: '2024-02-01',
      size: '1.8 MB',
      pages: 24,
      downloads: 890,
      highlights: [
        '₹2.4 Cr total funding received',
        '78% spent on direct programs',
        '15% on technology development',
        '7% on administrative costs'
      ]
    },
    {
      id: 3,
      title: 'Technology & Security Audit 2023',
      description: 'Independent audit of our technology infrastructure and security measures',
      type: 'Security Audit',
      date: '2023-12-15',
      size: '1.2 MB',
      pages: 16,
      downloads: 456,
      highlights: [
        '99.9% system uptime achieved',
        'Zero data breaches reported',
        'ISO 27001 compliance maintained',
        'End-to-end encryption implemented'
      ]
    },
    {
      id: 4,
      title: 'Quarterly Impact Report Q4 2023',
      description: 'Latest quarterly update on our programs and impact metrics',
      type: 'Quarterly Report',
      date: '2024-01-31',
      size: '0.8 MB',
      pages: 12,
      downloads: 678,
      highlights: [
        '3,420 new donors in Q4',
        '12,450 donations facilitated',
        '18 minutes average response time',
        '520+ partner institutions'
      ]
    }
  ];

  const governanceStructure = [
    {
      role: 'Board of Directors',
      members: 7,
      description: 'Independent board providing strategic oversight and governance',
      responsibilities: ['Strategic planning', 'Risk management', 'Performance oversight']
    },
    {
      role: 'Medical Advisory Committee',
      members: 5,
      description: 'Medical experts ensuring clinical standards and safety protocols',
      responsibilities: ['Medical guidelines', 'Safety protocols', 'Quality assurance']
    },
    {
      role: 'Ethics Committee',
      members: 4,
      description: 'Ensuring ethical practices and donor rights protection',
      responsibilities: ['Ethical guidelines', 'Donor rights', 'Complaint resolution']
    },
    {
      role: 'Technology Committee',
      members: 6,
      description: 'Overseeing technology development and security measures',
      responsibilities: ['Technology strategy', 'Security oversight', 'Innovation guidance']
    }
  ];

  const keyMetrics = [
    {
      metric: 'Donor Satisfaction',
      value: '4.8/5',
      trend: '+0.2',
      icon: Heart,
      color: 'text-red-600'
    },
    {
      metric: 'Response Time',
      value: '18 min',
      trend: '-2 min',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      metric: 'System Uptime',
      value: '99.9%',
      trend: '+0.1%',
      icon: Shield,
      color: 'text-blue-600'
    },
    {
      metric: 'Partner Satisfaction',
      value: '4.7/5',
      trend: '+0.3',
      icon: Building,
      color: 'text-purple-600'
    }
  ];

  const handleDownloadReport = (reportId) => {
    // In a real implementation, this would trigger a download
    console.log(`Downloading report ${reportId}`);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Transparency & Accountability
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-4xl mx-auto leading-relaxed">
              We believe in complete transparency. Access our certifications, impact reports, 
              and governance information to see how we're making a difference.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Key Performance Metrics
            </h2>
            <p className="text-xl text-gray-600">
              Real-time metrics showing our commitment to excellence
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {keyMetrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-lg text-center"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {metric.metric}
                </div>
                <div className={`text-sm font-medium ${
                  metric.trend.startsWith('+') || metric.trend.startsWith('-') && !metric.trend.includes('min')
                    ? 'text-green-600' 
                    : 'text-green-600'
                }`}>
                  {metric.trend} from last quarter
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Certifications & Accreditations
            </h2>
            <p className="text-xl text-gray-600">
              Our commitment to quality and security is validated by leading certification bodies
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <cert.icon className={`w-6 h-6 ${cert.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {cert.name}
                      </h3>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        Active
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">
                      {cert.description}
                    </p>
                    <div className="text-sm text-gray-500">
                      <div>Issued by: {cert.issuer}</div>
                      <div>Valid until: {new Date(cert.validUntil).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Reports */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Impact Reports & Documentation
            </h2>
            <p className="text-xl text-gray-600">
              Download our comprehensive reports to see our impact and financial transparency
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {impactReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {report.title}
                      </h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {report.type}
                      </span>
                    </div>
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>

                  <p className="text-gray-600 mb-4">
                    {report.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(report.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>{report.pages} pages</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>{report.downloads} downloads</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>{report.size}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Key Highlights:</h4>
                    <ul className="space-y-1">
                      {report.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleViewReport(report)}
                      className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => handleDownloadReport(report.id)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Governance Structure */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Governance Structure
            </h2>
            <p className="text-xl text-gray-600">
              Our governance framework ensures accountability and ethical operations
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {governanceStructure.map((structure, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {structure.role}
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {structure.members} members
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">
                  {structure.description}
                </p>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Key Responsibilities:</h4>
                  <ul className="space-y-1">
                    {structure.responsibilities.map((responsibility, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact for Transparency */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Questions About Our Operations?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              We're committed to complete transparency. If you have any questions about our 
              operations, governance, or impact, we're here to help.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Contact Governance Team
              </button>
              <button className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
                Request Information
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Report Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-bg-secondary rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedReport.title}
                </h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-8 text-center mb-6">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Report preview would be displayed here in a real implementation.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleDownloadReport(selectedReport.id)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full Report</span>
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Transparency;