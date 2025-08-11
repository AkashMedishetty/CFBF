import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import HeroDroplet3D from '../../components/features/HeroDroplet3D';
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
  const { showEmergencyAlert } = useToast();

  const [isFestivalOpen, setIsFestivalOpen] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    logger.componentMount('HomePage');
    logger.startTimer('HomePage Render');
    // Always show festival modal by default; allow explicit suppression via ?banner=0
    // and persistent suppression via localStorage when user checks "Do not show again".
    try {
      const params = new URLSearchParams(window.location.search);
      const forceBanner = params.get('banner') === '1';
      const disableBanner = params.get('banner') === '0';
      const hiddenPref = localStorage.getItem('hide-festival-banner') === '1';

      if (forceBanner) {
        setIsFestivalOpen(true);
      } else if (disableBanner || hiddenPref) {
        setIsFestivalOpen(false);
      } else {
        setIsFestivalOpen(true);
      }
    } catch {}

    // Always show emergency toast by default; allow explicit suppression via ?toast=0
    try {
      const params = new URLSearchParams(window.location.search);
      const disableToast = params.get('toast') === '0';
      if (!disableToast) {
        setTimeout(() => {
          showEmergencyAlert({
            name: 'John Doe',
            bloodType: 'A+',
            location: 'City Hospital, Ward 3',
            timeNeeded: 'ASAP',
            condition: 'Critical transfusion required'
          });
        }, 600);
      }
    } catch {}
    
    return () => {
      logger.componentUnmount('HomePage');
      logger.endTimer('HomePage Render');
    };
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
      {/* Hero Section (updated to match attached image with 3D droplet) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#2b0e0e] via-[#330d0d] to-[#2a0a0a] text-white">
        {/* Premium light streaks behind headline */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-20 h-96 w-[36rem] rotate-[-18deg] bg-gradient-to-r from-[#f51414]/35 via-[#ff8a8a]/10 to-transparent blur-2xl" />
          <div className="absolute top-[20%] -left-10 h-72 w-[28rem] rotate-[-22deg] bg-gradient-to-r from-[#f51414]/25 to-transparent blur-2xl" />
          <div className="absolute -bottom-16 -right-24 h-96 w-[36rem] rotate-[16deg] bg-gradient-to-l from-[#f51414]/20 via-[#ff8a8a]/10 to-transparent blur-2xl" />
        </div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,20,20,0.20),transparent_60%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: headline and actions */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 will-change-transform">
              <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight drop-shadow-[0_6px_18px_rgba(245,20,20,0.35)]">
                BLOOD
                <br />
                DONATION
            </motion.h1>
              <motion.p variants={itemVariants} className="text-3xl md:text-4xl font-semibold text-white/95">
                Give blood, save a life
              </motion.p>
              <motion.p variants={itemVariants} className="max-w-xl text-white/85 text-lg">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </motion.p>

              <motion.div variants={itemVariants}>
                <AnimatedButton
                  size="xl"
                  className="bg-[#f51414] hover:bg-[#d11212] text-white px-8"
                  onClick={() => {
                    logger.ui('CLICK', 'DonateNowHero', null, 'HOMEPAGE_HERO');
                    navigateWithLoading('/register', { message: 'Taking you to registration…' });
                  }}
                >
                  DONATE NOW
                </AnimatedButton>
              </motion.div>
            </motion.div>

            {/* Right: 3D droplet */}
            <motion.div
              className="relative will-change-transform"
              initial={{ y: 10 }}
              whileInView={{ y: 0 }}
              transition={{ type: 'spring', stiffness: 60, damping: 12 }}
            >
              <div className="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,rgba(245,20,20,0.25),transparent_60%)] blur-2xl" />
              <HeroDroplet3D />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Festival / Special Occasion Modal */}
      <Modal
        isOpen={isFestivalOpen}
        onClose={() => {
          if (dontShowAgain) {
            try { localStorage.setItem('hide-festival-banner', '1'); } catch {}
          }
          setIsFestivalOpen(false);
        }}
        title="Wishing You Joy and Good Health"
        size="lg"
      >
        <div className="space-y-4 text-slate-700 dark:text-slate-100">
          <p className="text-base">On this special day, join hands to save lives. Your one donation can make a world of difference.</p>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            Do not show this again
          </label>
          <div className="flex items-center justify-end gap-3">
            <AnimatedButton
              variant="outline"
              className="border-2 border-[#f51414] text-[#f51414] bg-transparent hover:bg-[#f51414]/10"
              onClick={() => {
                if (dontShowAgain) {
                  try { localStorage.setItem('hide-festival-banner', '1'); } catch {}
                }
                setIsFestivalOpen(false);
              }}
            >
              Close
            </AnimatedButton>
            <AnimatedButton
              variant="outline"
              className="border-2 border-[#f51414] text-[#f51414] bg-transparent hover:bg-[#f51414]/10"
              onClick={() => {
                if (dontShowAgain) {
                  try { localStorage.setItem('hide-festival-banner', '1'); } catch {}
                }
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
              Ready to Save Lives?
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-xl text-slate-600 dark:text-white/80 mb-8 max-w-2xl mx-auto"
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
                  variant="outline"
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