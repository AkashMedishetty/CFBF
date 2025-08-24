import React from 'react';
import { motion } from 'framer-motion';
import { Shield, EyeOff, Clock, Lock, Users, Heart } from 'lucide-react';
import Card from '../ui/Card';

const PrivacyConceptSection = () => {
  const concepts = [
    {
      id: 'donor-hiding',
      title: '3-Month Donor Hiding',
      description: 'After donating, your profile is automatically hidden for 3 months to prevent unwanted requests and give you recovery time.',
      icon: EyeOff,
      benefits: [
        'No unwanted calls or messages',
        'Proper recovery time between donations',
        'Complete peace of mind',
        'Automatic re-activation after 3 months'
      ],
      color: 'bg-blue-500'
    },
    {
      id: 'privacy-protection',
      title: 'Complete Privacy Protection',
      description: 'Your personal details are never shared with patients or hospitals. Only essential matching information is used.',
      icon: Shield,
      benefits: [
        'Phone number stays private',
        'Address details protected',
        'Medical history confidential',
        'Only blood type and location used for matching'
      ],
      color: 'bg-green-500'
    },
    {
      id: 'secure-communication',
      title: 'Secure Communication Channel',
      description: 'All communication happens through our secure platform. No direct contact between donors and patients.',
      icon: Lock,
      benefits: [
        'Platform-mediated communication',
        'No direct phone number sharing',
        'Verified hospital contacts only',
        'Emergency protocols in place'
      ],
      color: 'bg-purple-500'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-full text-primary-700 text-sm font-medium mb-4">
            <Shield className="w-4 h-4 mr-2" />
            India's First Privacy-Focused Platform
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Revolutionary Privacy Protection
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We've reimagined blood donation with three unique concepts that protect your privacy 
            while ensuring life-saving connections happen seamlessly.
          </p>
        </motion.div>

        {/* Privacy Concepts Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          {concepts.map((concept) => {
            const Icon = concept.icon;
            return (
              <motion.div key={concept.id} variants={cardVariants}>
                <Card 
                  hover={true}
                  className="h-full text-center group cursor-pointer"
                  padding="lg"
                >
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${concept.color} rounded-full mb-6 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {concept.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {concept.description}
                  </p>

                  {/* Benefits List */}
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900 mb-3">Key Benefits:</h4>
                    <ul className="space-y-2">
                      {concept.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Timeline Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-2xl p-8 shadow-lg"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              How the 3-Month Hiding Works
            </h3>
            <p className="text-gray-600">
              Your journey from donation to re-availability
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 md:space-x-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-white fill-current" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">You Donate</h4>
              <p className="text-sm text-gray-600">
                Complete your blood donation at the hospital
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden md:block">
              <div className="w-8 h-0.5 bg-gray-300"></div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <EyeOff className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Auto-Hidden</h4>
              <p className="text-sm text-gray-600">
                Your profile is immediately hidden from new requests
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden md:block">
              <div className="w-8 h-0.5 bg-gray-300"></div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Recovery Period</h4>
              <p className="text-sm text-gray-600">
                3 months of complete privacy and recovery time
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden md:block">
              <div className="w-8 h-0.5 bg-gray-300"></div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Re-Available</h4>
              <p className="text-sm text-gray-600">
                Automatically available for new donation requests
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PrivacyConceptSection;