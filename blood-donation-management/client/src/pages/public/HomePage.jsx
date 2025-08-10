import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Users, 
  Clock, 
  Award, 
  ArrowRight,
  Phone,
  MapPin,
  Shield
} from 'lucide-react';

import logger from '../../utils/logger';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { useLoading } from '../../contexts/LoadingContext';
import useNavigateWithLoading from '../../hooks/useNavigateWithLoading';
import { 
  AnimatedButton, 
  AnimatedCard, 
  AnimatedList, 
  AnimatedListItem,
  FadeInWhenVisible 
} from '../../components/ui';

const HomePage = () => {
  const navigateWithLoading = useNavigateWithLoading();
  const { /* showToast, showEmergencyAlert */ } = useToast();
  const { /* showLoading */ } = useLoading();

  const [isFestivalOpen, setIsFestivalOpen] = useState(false);

  useEffect(() => {
    logger.componentMount('HomePage');
    logger.startTimer('HomePage Render');
    
    return () => {
      logger.componentUnmount('HomePage');
      logger.endTimer('HomePage Render');
    };
    // Festival modal once per day
    try {
      const key = `festival-banner-${new Date().toISOString().slice(0,10)}`;
      const seen = localStorage.getItem(key);
      if (!seen) {
        setIsFestivalOpen(true);
        localStorage.setItem(key, '1');
      }
    } catch {}

  }, []);

  // const handleEmergencyRequest = () => {
  //   showEmergencyAlert({
  //     name: 'Unidentified Patient',
  //     bloodType: 'O+',
  //     location: 'City Hospital, Ward 3',
  //     timeNeeded: 'ASAP',
  //     condition: 'Critical transfusion required'
  //   });
  // };

  // Animation variants
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

  const stats = [
    { label: 'Registered Donors', value: '50,000+', icon: Users },
    { label: 'Lives Saved', value: '25,000+', icon: Heart },
    { label: 'Response Time', value: '< 2 min', icon: Clock },
    { label: 'Success Rate', value: '95%', icon: Award },
  ];

  const features = [
    {
      icon: Phone,
      title: 'WhatsApp Integration',
      description: 'Receive and respond to blood requests directly through WhatsApp with one-click responses.'
    },
    {
      icon: MapPin,
      title: 'Smart Matching',
      description: 'AI-powered algorithm matches donors based on location, blood type, and availability.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your medical data is encrypted and protected with enterprise-grade security.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden text-white bg-gradient-to-br from-[#0f0f14] via-[#141824] to-[#1c2230] dark:from-[#0b0d13] dark:via-[#10131b] dark:to-[#121726]">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight"
            >
              A Beating Promise to Save Lives
              <span className="block text-red-300">Call For Blood Foundation</span>
            </motion.h1>
            
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Premium, verified, and secure connections between donors and recipients with real-time response and meaningful impact.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button type="button">
                <AnimatedButton
                  size="xl"
                  className="border-2 border-[#ff6b6b] text-[#ff6b6b] bg-transparent hover:bg-[#ff6b6b]/10"
                  onClick={() => {
                    logger.ui('CLICK', 'NeedBloodNowButton', null, 'HOMEPAGE_HERO');
                    navigateWithLoading('/emergency', { message: 'Opening emergency request...' });
                  }}
                >
                  Need Blood Now
                </AnimatedButton>
              </button>
              <button type="button">
                <AnimatedButton
                  variant="outline"
                  size="xl"
                  className="border-2 border-[#ff6b6b] text-[#ff6b6b] bg-transparent hover:bg-[#ff6b6b]/10"
                  onClick={() => {
                    logger.ui('CLICK', 'BecomeDonorButton', null, 'HOMEPAGE_HERO');
                    navigateWithLoading('/register', { message: 'Preparing registration...' });
                  }}
                >
                  Become a Donor
                </AnimatedButton>
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating elements */}
        {/* Heart + heartbeat line visual */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
          <Heart className="h-40 w-40 text-[#ff6b6b]" />
        </div>
      </section>

      {/* Festival / Special Occasion Modal */}
      <Modal
        isOpen={isFestivalOpen}
        onClose={() => setIsFestivalOpen(false)}
        title="Wishing You Joy and Good Health"
        size="lg"
      >
        <div className="space-y-4 text-slate-700 dark:text-slate-100">
          <p className="text-base">On this special day, join hands to save lives. Your one donation can make a world of difference.</p>
          <div className="flex items-center justify-end gap-3">
            <AnimatedButton
              variant="outline"
              className="border-2 border-[#ff6b6b] text-[#ff6b6b] bg-transparent hover:bg-[#ff6b6b]/10"
              onClick={() => setIsFestivalOpen(false)}
            >
              Close
            </AnimatedButton>
            <AnimatedButton
              className="border-2 border-[#ff6b6b] text-[#ff6b6b] bg-transparent hover:bg-[#ff6b6b]/10"
              onClick={() => {
                setIsFestivalOpen(false);
                navigateWithLoading('/register', { message: 'Redirecting to registration...' });
              }}
            >
              Register as Donor
            </AnimatedButton>
          </div>
        </div>
      </Modal>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible>
            <AnimatedList className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <AnimatedListItem
                    key={stat.label}
                    className="text-center"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4">
                      <Icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                      {stat.value}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {stat.label}
                    </div>
                  </AnimatedListItem>
                );
              })}
            </AnimatedList>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800">
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
              Why Choose Call For Blood?
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto"
            >
              Our platform combines cutting-edge technology with compassionate care 
              to create the most efficient blood donation ecosystem.
            </motion.p>
          </motion.div>

          <FadeInWhenVisible>
            <AnimatedList className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <AnimatedListItem key={feature.title}>
                    <AnimatedCard 
                      hover={true}
                      className="text-center"
                      onClick={() => {
                        logger.ui('CLICK', 'FeatureCard', { feature: feature.title }, 'HOMEPAGE_FEATURES');
                      }}
                    >
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-6">
                        <Icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </AnimatedCard>
                  </AnimatedListItem>
                );
              })}
            </AnimatedList>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#121726] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              Ready to Save Lives?
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-xl text-white/80 mb-8 max-w-2xl mx-auto"
            >
              Join thousands of heroes who are making a difference in their communities. 
              Your donation can save up to 3 lives.
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to="/register">
                <AnimatedButton
                  size="xl"
                  className="border-2 border-[#ff6b6b] text-[#ff6b6b] bg-transparent hover:bg-[#ff6b6b]/10"
                  onClick={() => {
                    logger.ui('CLICK', 'RegisterAsDonorButton', null, 'HOMEPAGE_CTA');
                  }}
                >
                  Register as Donor
                  <ArrowRight className="ml-2 h-5 w-5" />
                </AnimatedButton>
              </Link>
              <Link to="/about">
                <AnimatedButton
                  variant="outline"
                  size="xl"
                  className="border-2 border-[#ff6b6b] text-[#ff6b6b] bg-transparent hover:bg-[#ff6b6b]/10"
                  onClick={() => {
                    logger.ui('CLICK', 'LearnMoreButton', null, 'HOMEPAGE_CTA');
                  }}
                >
                  Learn More
                </AnimatedButton>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;