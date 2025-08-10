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
      {/* Hero Section */}
      <section className="relative overflow-hidden text-white bg-[#0f121a] dark:bg-[#0b0d13]">
        {/* Background pattern */}
        {/* EmergencyToast-style highlight glow and conic border */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -inset-6 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,rgba(255,107,107,0.22),transparent_65%)] blur-3xl" />
          <div className="absolute inset-0 rounded-[3rem]">
            <div className="absolute -inset-2 bg-[conic-gradient(from_0deg,_#ff6b6b,_transparent_30%)] rounded-[3rem] opacity-20 blur-sm" />
          </div>
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
              <span className="block text-white">Call For Blood Foundation</span>
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
        {/* Heart + heartbeat line visual (subtle animation) */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Heart className="h-40 w-40 text-[#fca5a5]" />
        </motion.div>

        {/* Centered heartbeat line (stationary, pulsing) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <svg
            width="560"
            height="56"
            viewBox="0 0 560 56"
            fill="none"
            className="opacity-80"
          >
            <defs>
              <filter id="centerGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <motion.path
              d="M0 28 H100 L120 28 L130 18 L140 38 L150 28 H220 L240 28 L250 10 L260 46 L270 28 H340 L360 28 L370 18 L380 38 L390 28 H460 L560 28"
              stroke="rgba(252,165,165,0.9)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              filter="url(#centerGlow)"
              animate={{ opacity: [0.6, 1, 0.6], strokeWidth: [2, 3, 2] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
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
              className="border-2 border-[#ff6b6b] text-[#ff6b6b] bg-transparent hover:bg-[#ff6b6b]/10"
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
              className="border-2 border-[#ff6b6b] text-[#ff6b6b] bg-transparent hover:bg-[#ff6b6b]/10"
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