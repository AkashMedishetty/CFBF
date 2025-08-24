import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Users, MapPin, Clock, Award, Heart } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const ServicesSection = () => {
  const services = [
    {
      type: 'grouping',
      title: 'Free Blood Grouping',
      description: 'Professional blood group testing at your convenience. Know your blood type and join our donor network.',
      icon: Droplets,
      targetAudience: 'Anyone who wants to know their blood group',
      benefits: [
        'Professional lab-grade testing',
        'Instant digital certificate',
        'Free of cost service',
        'Convenient location testing',
        'Immediate donor registration'
      ],
      features: [
        'ABO and Rh factor testing',
        'Digital certificate generation',
        'QR code verification',
        'Instant platform registration'
      ],
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      type: 'donation',
      title: 'Donation Camps',
      description: 'Organized blood donation camps in communities, offices, and educational institutions across India.',
      icon: Users,
      targetAudience: 'Communities, offices, colleges, and organizations',
      benefits: [
        'Professional medical supervision',
        'Safe and hygienic environment',
        'Immediate health checkup',
        'Donation certificates',
        'Community impact tracking'
      ],
      features: [
        'Mobile donation units',
        'Qualified medical staff',
        'Real-time inventory updates',
        'Donor appreciation programs'
      ],
      color: 'bg-red-500',
      gradient: 'from-red-500 to-red-600'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
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
    <section className="py-20 bg-gray-50 dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 bg-red-100 rounded-full text-red-700 text-sm font-medium mb-4">
            <Heart className="w-4 h-4 mr-2" />
            Our Services
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Beyond Just Matching
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We provide comprehensive blood donation services to make the entire process 
            seamless, safe, and accessible for everyone in the community.
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid lg:grid-cols-2 gap-8 mb-16"
        >
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <motion.div key={service.type} variants={cardVariants}>
                <Card className="h-full overflow-hidden group hover:shadow-xl transition-all duration-300">
                  {/* Header with gradient */}
                  <div className={`bg-gradient-to-r ${service.gradient} p-6 text-white`}>
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{service.title}</h3>
                        <p className="text-white/80 text-sm">
                          {service.targetAudience}
                        </p>
                      </div>
                    </div>
                    <p className="text-white/90 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Benefits */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Award className="w-4 h-4 mr-2 text-green-500" />
                        Key Benefits
                      </h4>
                      <ul className="space-y-2">
                        {service.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Features */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-blue-500" />
                        Service Features
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {service.features.map((feature, idx) => (
                          <div key={idx} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <Button
                      variant="outline"
                      className="w-full group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all duration-200"
                      leftIcon={<MapPin className="w-4 h-4" />}
                    >
                      {service.type === 'grouping' ? 'Find Testing Center' : 'Schedule Camp'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Service Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl p-8 shadow-lg"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Service Impact
            </h3>
            <p className="text-gray-600">
              Making a difference in communities across India
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">15,000+</div>
              <div className="text-sm text-gray-600">Blood Groups Tested</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">500+</div>
              <div className="text-sm text-gray-600">Donation Camps</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">200+</div>
              <div className="text-sm text-gray-600">Partner Organizations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-sm text-gray-600">Cities Covered</div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Whether you want to know your blood group or organize a donation camp, 
            we're here to help you make a difference in your community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              leftIcon={<Droplets className="w-5 h-5" />}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Blood Group Test
            </Button>
            <Button
              variant="outline"
              size="lg"
              leftIcon={<Users className="w-5 h-5" />}
            >
              Organize Donation Camp
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;