import { motion } from 'framer-motion';
import {
  Heart,
  Target,
  Eye,
  Users,
  Award,
  CheckCircle
} from 'lucide-react';
import FounderStorySection from '../../components/home/FounderStorySection';

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
    <div className="min-h-screen">
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
              About CallforBlood Foundation
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
      <section className="py-20 bg-white dark:bg-dark-bg">
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
      <section className="py-20 bg-slate-50 dark:bg-dark-bg-secondary">
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
            {values.map((value) => {
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

      {/* Founder's Story Section */}
      <FounderStorySection />

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
              {achievements.map((achievement) => (
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

      {/* Awards & Recognition Section */}
      <section className="py-20 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10">
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
              Awards & Recognition
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto"
            >
              Honored for our commitment to saving lives and serving the community
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* Award 1: National Mother Teresa Award 2021 */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mr-4">
                    <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">National Mother Teresa Award</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">2021</p>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Organized by Media Academy Federation of India, New Delhi
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <img
                    src="/Awards/Award-1.jpg"
                    alt="National Mother Teresa Award 2021"
                    className="w-full h-24 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <img
                    src="/Awards/Award-1.1.jpg"
                    alt="National Mother Teresa Award 2021 - Certificate"
                    className="w-full h-24 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Award 2: Best Blood Donors Award 2025 */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mr-4">
                    <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Best Blood Donors Award</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">January 12, 2025</p>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Organized by Kamareddy Blood donors Samuha committee
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <img
                    src="/Awards/Award-2.jpg"
                    alt="Best Blood Donors Award 2025"
                    className="w-full h-24 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <img
                    src="/Awards/Award-2.1.JPG"
                    alt="Best Blood Donors Award 2025 - Certificate"
                    className="w-full h-24 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Award 3: Seva Icon Award 2025 */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Seva Icon Award</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">June 22, 2025</p>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Organized by Viswa arts, Mana kalakshetram foundation, Hyderabad
                </p>
                <img
                  src="/Awards/Award-3.jpg"
                  alt="Seva Icon Award 2025"
                  className="w-full h-24 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </motion.div>

            {/* Award 4: Best Social Activist Award 2025 */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-4">
                    <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Best Social Activist Award</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">July 21, 2025</p>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  Organized by Holy Prince Foundation/KBs Mathrudevobhava foundation, Hyderabad
                </p>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  <p>1. With Sri Sajjanar, IPS CP Hyderabad</p>
                  <p>2. With Sri Parikipandla Narahari garu, IAS Bhopal, M.P.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <img
                    src="/Awards/Award-4.JPG"
                    alt="Best Social Activist Award 2025 - With Sri Sajjanar, IPS CP Hyderabad"
                    className="w-full h-24 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <img
                    src="/Awards/Award-4.1.JPG"
                    alt="Best Social Activist Award 2025 - With Sri Parikipandla Narahari garu, IAS Bhopal, M.P."
                    className="w-full h-24 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Award 5: Appreciation Certificate from Maa Gulf News, Dubai */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mr-4">
                    <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Appreciation Certificate</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Maa Gulf News, Dubai</p>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  International recognition for our humanitarian efforts
                </p>
                <img
                  src="/Awards/Award-5.jpg"
                  alt="Appreciation Certificate from Maa Gulf News, Dubai"
                  className="w-full h-24 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </motion.div>

            {/* Award 6: Appreciation Award from WSO Hyderabad */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mr-4">
                    <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Appreciation Award</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">WSO (We Shall Overcome) Hyderabad</p>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Recognition for community service and social impact
                </p>
                <img
                  src="/Awards/Award-6.jpg"
                  alt="Appreciation Award from WSO (We Shall Overcome) Hyderabad"
                  className="w-full h-24 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </motion.div>

            {/* Award 7: Excellence in Healthcare Award */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow md:col-span-2 lg:col-span-1"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/20 rounded-full flex items-center justify-center mr-4">
                    <Award className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Excellence in Healthcare Award</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">2025</p>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Recognition for outstanding contribution to healthcare innovation and community service
                </p>
                <img
                  src="/Awards/Award-7.jpg"
                  alt="Excellence in Healthcare Award 2025"
                  className="w-full h-24 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-20 bg-slate-50 dark:bg-dark-bg-secondary">
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
                href="mailto:info@callforbloodfoundation.com"
                className="btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contact Us
              </a>
              <a
                href="/register"
                className="btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
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