import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Target, 
  Eye, 
  Users, 
  Award,
  CheckCircle
} from 'lucide-react';

const AboutPage = () => {
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };

  const values = [
    {
      icon: Heart,
      title: 'Compassion',
      description: 'We believe every life is precious and deserves a chance to be saved through the generosity of donors.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building a strong network of donors and recipients who support each other in times of need.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Committed to providing the highest quality service with cutting-edge technology and best practices.'
    }
  ];

  const achievements = [
    '50,000+ Registered Donors',
    '25,000+ Lives Saved',
    '95% Success Rate',
    '24/7 Emergency Response',
    'Nationwide Coverage',
    'HIPAA Compliant Platform'
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#121726]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              About Call For Blood
              <span className="block text-primary-400">Foundation</span>
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
            >
              Revolutionizing blood donation through technology, compassion, and community
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-white dark:bg-[#121726]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={itemVariants}>
              <div className="flex items-center mb-6">
                <Target className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Our Mission</h2>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                To bridge the critical gap between blood donors and recipients through intelligent 
                automation, real-time communication, and comprehensive data management. We strive 
                to achieve a 90% reduction in response time for blood requests and maintain a 95% 
                request fulfillment rate.
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                Our platform leverages WhatsApp's ubiquitous presence and advanced backend systems 
                to create the most efficient blood donation ecosystem, ensuring that no life is 
                lost due to lack of blood availability.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="flex items-center mb-6">
                <Eye className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Our Vision</h2>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                To create a world where no one dies due to lack of blood. We envision a future 
                where blood donation is seamlessly integrated into society, supported by technology 
                that makes the process effortless, transparent, and rewarding for all participants.
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                We aim to build the largest network of voluntary blood donors globally, fostering 
                a culture of giving that transcends geographical, social, and economic boundaries.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white dark:bg-[#121726]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4"
            >
              Our Core Values
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto"
            >
              The principles that guide everything we do
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  variants={itemVariants}
                  className="card text-center hover:shadow-medium transition-shadow duration-300"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-6">
                    <Icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    {value.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white dark:bg-[#121726]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8"
            >
              Our Story
            </motion.h2>
            <motion.div
              variants={itemVariants}
              className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed space-y-6"
            >
              <p>
                Call For Blood Foundation was born from a simple yet powerful realization: 
                in emergency situations, every second counts, and traditional methods of 
                finding blood donors were simply too slow and inefficient.
              </p>
              <p>
                Founded by a team of healthcare professionals, technology experts, and 
                social activists, our organization emerged from the urgent need to modernize 
                blood donation systems. We witnessed firsthand how lives were lost not due 
                to lack of willing donors, but due to the inability to connect donors with 
                recipients quickly enough.
              </p>
              <p>
                Today, we're proud to have created a platform that has revolutionized blood 
                donation in India. Our intelligent matching system, WhatsApp integration, 
                and comprehensive donor management have helped save thousands of lives and 
                continue to grow our impact every day.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl font-bold text-white mb-12"
            >
              Our Achievements
            </motion.h2>
            
            <motion.div
              variants={containerVariants}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement}
                  variants={itemVariants}
                  className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white"
                >
                  <CheckCircle className="h-6 w-6 text-green-300 mr-3 flex-shrink-0" />
                  <span className="font-medium">{achievement}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-20 bg-white dark:bg-[#121726]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6"
            >
              Want to Learn More?
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto"
            >
              Get in touch with our team to learn more about our mission, 
              partnerships, or how you can get involved.
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <a
                href="mailto:info@callforblood.org"
                className="btn-primary"
              >
                Contact Us
              </a>
              <a
                href="/register"
                className="btn-secondary"
              >
                Join Our Mission
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;