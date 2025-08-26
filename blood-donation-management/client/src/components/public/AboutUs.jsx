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
    <div className="min-h-screen bg-white dark:bg-dark-bg">
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
                className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-lg text-center"
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

      {/* Awards Section */}
      <section className="py-20 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Awards & Recognition
            </h2>
            <p className="text-xl text-gray-600">
              Honored for our commitment to saving lives and serving the community
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Award 1: National Mother Teresa Award 2021 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">National Mother Teresa Award</h3>
                    <p className="text-sm text-gray-500">2021</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
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
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Best Blood Donors Award</h3>
                    <p className="text-sm text-gray-500">January 12, 2025</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
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
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Seva Icon Award</h3>
                    <p className="text-sm text-gray-500">June 22, 2025</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
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
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden md:col-span-2 lg:col-span-1"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Best Social Activist Award</h3>
                    <p className="text-sm text-gray-500">July 21, 2025</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-2">
                  Organized by Holy Prince Foundation/KBs Mathrudevobhava foundation, Hyderabad
                </p>
                <div className="text-sm text-gray-500 mb-4">
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
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Appreciation Certificate</h3>
                    <p className="text-sm text-gray-500">Maa Gulf News, Dubai</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  International recognition for our humanitarian efforts
                </p>
                <img
                  src="/Awards/Award-5.jpeg"
                  alt="Appreciation Certificate from Maa Gulf News, Dubai"
                  className="w-full max-h-56 object-contain rounded-lg bg-white"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </motion.div>

            {/* Award 6: Appreciation Award from WSO Hyderabad */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                    <Award className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Appreciation Award</h3>
                    <p className="text-sm text-gray-500">WSO (We Shall Overcome) Hyderabad</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Recognition for community service and social impact
                </p>
                <img
                  src="/Awards/Award-6.JPG"
                  alt="Appreciation Award from WSO (We Shall Overcome) Hyderabad"
                  className="w-full max-h-56 object-contain rounded-lg bg-white"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </motion.div>

            {/* Award 7: Additional Recognition Award */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                    <Award className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Excellence in Healthcare Award</h3>
                    <p className="text-sm text-gray-500">2025</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Recognition for outstanding contribution to healthcare innovation and community service
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <img
                    src="/Awards/Award-7.jpeg"
                    alt="Excellence in Healthcare Award 2025"
                    className="w-full max-h-56 object-contain rounded-lg bg-white"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <img
                    src="/Awards/Award-7.1.jpeg"
                    alt="Excellence in Healthcare Award 2025 - Additional"
                    className="w-full max-h-56 object-contain rounded-lg bg-white"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </motion.div>
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
                className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'
                  } mb-12`}
              >
                <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                  <div className={`bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-lg ${index % 2 === 0 ? 'text-right' : 'text-left'
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

      {/* Awards and Recognition Section */}
      <section className="py-20 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Awards & Recognition
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our commitment to excellence in healthcare technology and social impact has been recognized by leading organizations
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Healthcare Innovation Award 2024",
                organization: "National Healthcare Technology Council",
                year: "2024",
                description: "Recognized for revolutionary blood donation management platform that saved over 15,000 lives",
                image: "/images/awards/healthcare-innovation-2024.jpg",
                category: "Technology Innovation"
              },
              {
                title: "Social Impact Excellence Award",
                organization: "Indian Social Enterprise Awards",
                year: "2023",
                description: "Honored for creating sustainable impact in healthcare accessibility and emergency response",
                image: "/images/awards/social-impact-2023.jpg",
                category: "Social Impact"
              },
              {
                title: "Digital Health Pioneer Award",
                organization: "Digital India Healthcare Summit",
                year: "2023",
                description: "Acknowledged for pioneering WhatsApp-based emergency blood request system",
                image: "/images/awards/digital-health-2023.jpg",
                category: "Digital Innovation"
              },
              {
                title: "Startup of the Year - Healthcare",
                organization: "Indian Startup Awards",
                year: "2022",
                description: "Selected as the most promising healthcare startup for scalable blood donation solutions",
                image: "/images/awards/startup-2022.jpg",
                category: "Startup Excellence"
              },
              {
                title: "Community Service Excellence",
                organization: "Rotary International",
                year: "2022",
                description: "Recognized for outstanding community service in healthcare and emergency response",
                image: "/images/awards/community-service-2022.jpg",
                category: "Community Service"
              },
              {
                title: "Technology for Good Award",
                organization: "Tech4Good India",
                year: "2021",
                description: "Honored for using technology to solve critical healthcare challenges and save lives",
                image: "/images/awards/tech4good-2021.jpg",
                category: "Technology for Good"
              }
            ].map((award, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
              >
                <div className="h-48 bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center relative overflow-hidden">
                  <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Award className="w-10 h-10 text-yellow-800" />
                  </div>
                  <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-1 rounded-full">
                    <span className="text-sm font-semibold text-gray-700">{award.year}</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      {award.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">
                    {award.title}
                  </h3>

                  <p className="text-sm font-medium text-gray-600 mb-3">
                    {award.organization}
                  </p>

                  <p className="text-sm text-gray-600 leading-relaxed">
                    {award.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mt-12"
          >
            <div className="bg-white rounded-xl p-8 shadow-lg max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Recognition Highlights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">6+</div>
                  <p className="text-gray-600">Major Awards</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">15+</div>
                  <p className="text-gray-600">Industry Recognitions</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">3</div>
                  <p className="text-gray-600">Years of Excellence</p>
                </div>
              </div>
            </div>
          </motion.div>
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
                className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg overflow-hidden"
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
              <p className="text-red-400 font-semibold">info@callforbloodfoundation.com</p>
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