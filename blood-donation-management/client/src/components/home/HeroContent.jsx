import { motion } from 'framer-motion';
import { Heart, ArrowRight, Droplet, Droplets } from 'lucide-react';
import Button from '../ui/Button';

const HeroContent = ({ 
  onRegisterClick,
  className = ''
}) => {
  const contentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const highlightVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        delay: 0.4
      }
    }
  };

  return (
    <motion.div
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      className={`space-y-8 ${className}`}
    >
      {/* Main Headline */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
          <span className="block text-white">
            India's First
          </span>
          <span className="block text-red-400">
            Privacy-Protected
          </span>
          <span className="block text-white">
            Blood Donation Platform
          </span>
        </h1>
        
        {/* Foundation Branding */}
        {/* Branding line removed per request */}
        {/* Associations moved to footer */}
      </motion.div>

      {/* Tagline */}
      <motion.div variants={itemVariants}>
        <div className="inline-block bg-red-600 text-white rounded-xl px-4 py-3 shadow-md max-w-2xl border border-red-700">
          <p className="text-base md:text-lg lg:text-xl leading-relaxed">
            Revolutionary donor privacy protection with <span className="font-bold">3-month hiding feature</span>. Connect with patients while keeping your details completely secure.
          </p>
        </div>
      </motion.div>

      {/* Privacy Highlights */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="flex items-center space-x-4 bg-red-600 text-white rounded-xl px-5 py-4 border border-red-700"
          >
            <Droplets className="w-7 h-7 text-white flex-shrink-0" />
            <div>
              <p className="font-semibold text-white text-base">Complete Privacy</p>
              <p className="text-white/90 text-sm">Your details stay protected</p>
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="flex items-center space-x-4 bg-red-600 text-white rounded-xl px-5 py-4 border border-red-700"
          >
            <Droplet className="w-7 h-7 text-white flex-shrink-0" />
            <div>
              <p className="font-semibold text-white text-base">3-Month Hiding</p>
              <p className="text-white/90 text-sm">Automatic privacy protection</p>
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="flex items-center space-x-4 bg-red-600 text-white rounded-xl px-5 py-4 border border-red-700"
          >
            <Droplet className="w-7 h-7 text-white flex-shrink-0" />
            <div>
              <p className="font-semibold text-white text-base">Instant Matching</p>
              <p className="text-white/90 text-sm">Quick donor connections</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Mission Statement */}
      <motion.div variants={itemVariants}>
        <div className="bg-red-100 rounded-2xl p-6 border border-red-200 max-w-2xl">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-700" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Saving Lives Through Innovation
              </h3>
              <p className="text-slate-800 leading-relaxed">
                Every donation through our platform can save up to 3 lives. Join thousands of donors 
                who trust our privacy-first approach to make a meaningful difference in their communities 
                while keeping their personal information completely secure.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <Button
            variant="primary"
            size="xl"
            onClick={onRegisterClick}
            className="!bg-red-600 !text-white hover:!bg-red-700 shadow-xl px-8 py-4 text-lg font-bold border-2 border-red-700 group transition-all duration-300"
            leftIcon={<Droplets className="w-6 h-6 !text-white group-hover:scale-110 transition-transform" />}
            rightIcon={<ArrowRight className="w-5 h-5 !text-white group-hover:translate-x-1 transition-transform" />}
          >
            Register as Donor - 100% Free
          </Button>
          
          <Button
            variant="outline"
            size="xl"
            className="border-2 border-primary-600 bg-transparent text-primary-800 hover:bg-primary-50 px-8 py-4 text-lg font-medium transition-all duration-300"
          >
            Learn About Privacy Protection
          </Button>
        </div>
        
        {/* Trust Indicators */}
        <div className="mt-6 flex flex-wrap items-center gap-7 text-slate-700 text-lg md:text-xl">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span>50,000+ trusted donors</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
            <span>25,000+ lives saved</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
            <span>95% success rate</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Compact version for mobile
export const CompactHeroContent = ({ 
  onRegisterClick,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className={`space-y-6 text-center ${className}`}
    >
      {/* Compact Headline */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight text-white">
          India's First<br />
          <span className="text-red-400">Privacy-Protected</span><br />
          <span className="text-white">Blood Donation Platform</span>
        </h1>
        <p className="text-sm text-white font-medium">by Callforblood Foundation</p>
      </div>

      {/* Compact Tagline */}
      <p className="text-lg text-red-100 leading-relaxed">
        Revolutionary donor privacy with 3-month hiding feature. 
        Connect safely while keeping your details secure.
      </p>

      {/* Compact CTA */}
      <div className="space-y-3">
        <Button
          variant="secondary"
          size="lg"
          onClick={onRegisterClick}
          className="!bg-white !text-primary-900 hover:!bg-gray-50 w-full font-bold"
          leftIcon={<Droplets className="w-5 h-5 !text-primary-900" />}
        >
          Register as Donor - Free
        </Button>
        
        <p className="text-xs text-red-200">
          50,000+ donors • 25,000+ lives saved • 95% success rate
        </p>
      </div>
    </motion.div>
  );
};

export default HeroContent;