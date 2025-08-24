import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Award, Target } from 'lucide-react';
import Card from '../ui/Card';

const FounderStorySection = () => {
  const storyPoints = [
    {
      icon: Heart,
      title: 'Personal Loss',
      description: 'Lost my father due to unavailability of blood during a critical emergency. This personal tragedy became the driving force behind creating a solution.',
      color: 'bg-red-500'
    },
    {
      icon: Target,
      title: 'Mission Born',
      description: 'Determined to ensure no family faces what we did. Started working on a platform to connect donors and patients instantly.',
      color: 'bg-blue-500'
    },
    {
      icon: Users,
      title: 'Health Challenges',
      description: 'Despite my own health issues preventing me from donating, I channeled my energy into building technology that saves lives.',
      color: 'bg-green-500'
    },
    {
      icon: Award,
      title: '100% Free Commitment',
      description: 'Committed to keeping this service completely free forever. No charges, no hidden fees - just pure dedication to saving lives.',
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

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };

  return (
    <section className="py-20 bg-white dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Story Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center px-4 py-2 bg-red-100 rounded-full text-red-700 text-sm font-medium mb-6">
              <Heart className="w-4 h-4 mr-2" />
              Founder's Story
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              From Personal Tragedy to
              <span className="block text-red-600">Life-Saving Mission</span>
            </h2>

            <div className="prose prose-lg text-gray-600 mb-8">
              <p className="mb-4">
                "When I lost my father due to the unavailability of blood during a critical emergency, 
                I realized how broken our blood donation system was. Families were running from hospital 
                to hospital, posting desperate messages on social media, while potential donors had no 
                way to know about urgent needs."
              </p>
              
              <p className="mb-4">
                "Despite my own health challenges that prevent me from donating blood, I knew I could 
                contribute in a different way. I decided to build the technology that could connect 
                donors and patients instantly, ensuring no family would face what we did."
              </p>

              <p className="font-semibold text-gray-900">
                "This platform is my way of donating - not blood, but hope. And it will remain 
                100% free forever, because saving lives should never have a price tag."
              </p>
            </div>

            {/* Mission Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">50,000+</div>
                <div className="text-sm text-gray-600">Registered Donors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">25,000+</div>
                <div className="text-sm text-gray-600">Lives Saved</div>
              </div>
            </div>
          </motion.div>

          {/* Story Timeline */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {storyPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-12 h-12 ${point.color} rounded-full flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {point.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {point.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 p-8">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Our Commitment to You
              </h3>
              <p className="text-lg text-gray-700 mb-6">
                "Every feature we build, every improvement we make, is driven by one simple goal: 
                ensuring that no one loses a loved one due to blood unavailability. This is not 
                just a platform - it's a promise to every family in India."
              </p>
              <div className="flex items-center justify-center space-x-2 text-red-600 font-semibold">
                <Heart className="w-5 h-5 fill-current" />
                <span>100% Free • Forever • For Everyone</span>
                <Heart className="w-5 h-5 fill-current" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default FounderStorySection;