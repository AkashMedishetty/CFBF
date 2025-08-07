import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Users, 
  Target, 
  Award, 
  Shield, 
  Zap,
  Globe,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  CheckCircle
} from 'lucide-react';

const AboutUs = () => {
  const teamMembers = [
    {
      name: 'Dr. Rajesh Kumar',
      role: 'Founder & Medical Director',
      image: '/images/team/rajesh.jpg',
      bio: 'With 15+ years in emergency medicine, Dr. Kumar founded BDMS to bridge the gap between blood donors and recipients.',
      specialization: 'Emergency Medicine'
    },
    {
      name: 'Priya Sharma',
      role: 'Chief Technology Officer',
      image: '/images/team/priya.jpg',
      bio: 'Former tech lead at major healthcare companies, Priya leads our technology innovation and platform development.',
      specialization: 'Healthcare Technology'
    },
    {
      name: 'Amit Singh',
      role: 'Operations Director',
      image: '/images/team/amit.jpg',
      bio: 'Healthcare operations expert with a passion for process optimization and donor experience enhancement.',
      specialization: 'Healthcare Operations'
    },
    {
      name: 'Dr. Meera Patel',
      role: 'Medical Advisor',
      image: '/images/team/meera.jpg',
      bio: 'Hematologist and blood bank specialist ensuring medical accuracy and safety protocols.',
      specialization: 'Hematology'
    }
  ];

  const milestones = [
    {
      year: '2020',
      title: 'Foundation',
      description: 'BDMS was founded with a vision to revolutionize blood donation in India',
      icon: Heart
    },
    {
      year: '2021',
      title: 'First 1000 Donors',
      description: 'Reached our first milestone of 1000 registered donors',
      icon: Users
    },
    {
      year: '2022',
      title: 'WhatsApp Integration',
      description: 'Launched WhatsApp-based communication for instant donor alerts',
      icon: Zap
    },
    {
      year: '2023',
      title: 'National Expansion',
      description: 'Expanded operations to 50+ cities across India',
      icon: Globe
    },
    {
      year: '2024',
      title: '15,000+ Lives Saved',
      description: 'Crossed the milestone of saving 15,000+ lives through our platform',
      icon: Award
    }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Compassion',
      description: 'Every action we take is driven by empathy and care for human life',
      color: 'text-red-600'
    },
    {
      icon: Shield,
      title: 'Trust & Safety',
      description: 'We maintain the highest standards of safety and verification',
      color: 'text-blue-600'
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Leveraging technology to make blood donation more efficient',
      color: 'text-yellow-600'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building a strong network of donors, recipients, and healthcare partners',
      color: 'text-green-600'
    }
  ];

  const achievements = [
    { number: '15,420+', label: 'Active Donors', icon: Users },
    { number: '45,680+', label: 'Successful Donations', icon: Heart },
    { number: '137,040+', label: 'Lives Impacted', icon: TrendingUp },
    { number: '520+', label: 'Partner Hospitals', icon: Shield },
    { number: '18 min', label: 'Average Response Time', icon: Zap },
    { number: '96.4%', label: 'Request Fulfillment Rate', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              About BDMS
            </h1>
            <p className="text-xl md:text-2xl text-red-100 mb-8 max-w-4xl mx-auto leading-relaxed">
              We're on a mission to save lives by connecting blood donors with those in need 
              through intelligent technology and compassionate care.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To create a seamless, technology-driven ecosystem that connects blood donors 
                with recipients instantly, ensuring no life is lost due to blood unavailability.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To become India's most trusted and efficient blood donation platform, 
                making blood donation as simple as sending a message.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Purpose</h3>
              <p className="text-gray-600 leading-relaxed">
                Every drop of blood donated through our platform represents hope, 
                compassion, and the power of human connection in saving lives.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These values guide every decision we make and every feature we build
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <value.icon className={`w-6 h-6 ${value.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Impact in Numbers
            </h2>
            <p className="text-xl text-gray-600">
              Real metrics that showcase the lives we've touched
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <achievement.icon className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {achievement.number}
                </div>
                <div className="text-sm text-gray-600">
                  {achievement.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600">
              Key milestones in our mission to save lives
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-red-200"></div>
            
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`relative flex items-center ${
                  index % 2 === 0 ? 'justify-start' : 'justify-end'
                } mb-12`}
              >
                <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                  <div className={`bg-white rounded-xl p-6 shadow-lg ${
                    index % 2 === 0 ? 'text-right' : 'text-left'
                  }`}>
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                      <milestone.icon className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600 mb-2">
                      {milestone.year}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {milestone.title}
                    </h3>
                    <p className="text-gray-600">
                      {milestone.description}
                    </p>
                  </div>
                </div>
                
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full border-4 border-white shadow"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600">
              The passionate individuals behind BDMS
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className="h-64 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                  <div className="w-24 h-24 bg-red-300 rounded-full flex items-center justify-center">
                    <Users className="w-12 h-12 text-red-600" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-red-600 font-medium mb-2">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm mb-3">
                    {member.bio}
                  </p>
                  <div className="text-xs text-gray-500">
                    {member.specialization}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-300">
              Have questions? We're here to help
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Emergency Hotline</h3>
              <p className="text-gray-300 mb-2">24/7 Emergency Support</p>
              <p className="text-red-400 font-semibold text-lg">1800-BLOOD-1</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Email Support</h3>
              <p className="text-gray-300 mb-2">General Inquiries</p>
              <p className="text-red-400 font-semibold">support@callforblood.org</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Headquarters</h3>
              <p className="text-gray-300 mb-2">New Delhi, India</p>
              <p className="text-red-400 font-semibold">Connaught Place</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;