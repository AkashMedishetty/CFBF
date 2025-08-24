import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield, Users, Clock } from 'lucide-react';
import Button from '../ui/Button';

const HeroSection = ({ onRegisterClick }) => {
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

  return (
    <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-red-800 text-white overflow-hidden min-h-screen flex items-center">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-black/10">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6"
          >
            <Shield className="w-4 h-4 mr-2" />
            1st time in India with Unique Privacy Concept
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            India's First
            <span className="block text-red-200">Privacy-Protected</span>
            <span className="block">Blood Donation Platform</span>
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-red-100 mb-8 max-w-4xl mx-auto leading-relaxed"
          >
            Revolutionary donor privacy protection with 3-month hiding feature. 
            Connect with patients while keeping your details completely secure.
          </motion.p>

          {/* Privacy Highlights */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-6 mb-10"
          >
            <div className="flex items-center text-red-100">
              <Shield className="w-5 h-5 mr-2" />
              <span>Complete Privacy Protection</span>
            </div>
            <div className="flex items-center text-red-100">
              <Users className="w-5 h-5 mr-2" />
              <span>3-Month Donor Hiding</span>
            </div>
            <div className="flex items-center text-red-100">
              <Clock className="w-5 h-5 mr-2" />
              <span>Instant Matching</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              variant="secondary"
              size="xl"
              onClick={onRegisterClick}
              className="!bg-white !text-primary-900 hover:!bg-gray-50 hover:!text-primary-950 shadow-lg px-8 py-4 text-lg font-bold border-2 border-white"
              leftIcon={<Heart className="w-5 h-5 !text-primary-900" />}
            >
              Register as Donor - 100% Free
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="border-2 border-white bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-primary-800 px-8 py-4 text-lg font-medium"
            >
              Learn About Privacy Protection
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={itemVariants}
            className="mt-12 text-red-100 text-sm"
          >
            <p>Trusted by 50,000+ donors • 25,000+ lives saved • 95% success rate</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating elements */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 left-10 opacity-20"
      >
        <Heart className="h-16 w-16 text-white fill-current" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-20 right-10 opacity-20"
      >
        <Shield className="h-12 w-12 text-white fill-current" />
      </motion.div>
    </section>
  );
};

export default HeroSection;