import { motion } from 'framer-motion';
import { Heart, ArrowRight, Shield, Users, Clock, Droplets } from 'lucide-react';
import Button from '../ui/Button';

const CallToActionSection = ({ onRegisterClick }) => {
  const features = [
    {
      icon: Shield,
      text: 'Complete Privacy Protection'
    },
    {
      icon: Users,
      text: '50,000+ Trusted Donors'
    },
    {
      icon: Clock,
      text: 'Instant Emergency Response'
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
    <section className="relative py-20 bg-gradient-to-br from-primary-600 via-red-600 to-red-700 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/10">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center text-white"
        >
          {/* Main Headline */}
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <Heart className="w-4 h-4 mr-2 fill-current" />
              Join India's Most Trusted Blood Donation Platform
            </div>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            Ready to Save Lives?
            <span className="block text-red-200">Your Privacy Protected</span>
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-red-100 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Join thousands of heroes who are making a difference with complete privacy protection. 
            Your donation can save up to 3 lives, and your details stay completely secure.
          </motion.p>

          {/* Feature Highlights */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-6 mb-10"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center text-red-100">
                  <Icon className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              );
            })}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
          >
            <Button
              variant="secondary"
              size="xl"
              onClick={onRegisterClick}
              className="!bg-white !text-primary-900 hover:!bg-gray-50 hover:!text-primary-950 shadow-lg px-8 py-4 text-lg font-bold group border-2 border-white"
              leftIcon={<Droplets className="w-6 h-6 !text-primary-900 group-hover:scale-110 transition-transform" />}
              rightIcon={<ArrowRight className="w-5 h-5 !text-primary-900 group-hover:translate-x-1 transition-transform" />}
            >
              Register as Donor - FREE Forever
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="border-2 border-white bg-white/10 backdrop-blur-sm !text-white hover:!bg-white hover:!text-primary-900 px-8 py-4 text-lg font-medium"
            >
              Learn About Privacy Features
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={itemVariants}
            className="text-red-100 text-sm space-y-2"
          >
            <p className="font-medium">✓ 100% Free Service • ✓ No Hidden Charges • ✓ Complete Privacy</p>
            <p>Trusted by 50,000+ donors • 25,000+ lives saved • 95% success rate</p>
          </motion.div>


        </motion.div>
      </div>

      {/* Floating Hearts */}
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
        className="absolute top-20 left-10 opacity-20"
      >
        <Heart className="h-16 w-16 text-white fill-current" />
      </motion.div>
      
      <motion.div
        animate={{ 
          y: [0, 15, 0],
          rotate: [0, -5, 0]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity, 
          ease: 'easeInOut',
          delay: 1
        }}
        className="absolute bottom-20 right-10 opacity-20"
      >
        <Heart className="h-12 w-12 text-white fill-current" />
      </motion.div>

      <motion.div
        animate={{ 
          y: [0, -10, 0],
          x: [0, 5, 0]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: 'easeInOut',
          delay: 2
        }}
        className="absolute top-1/2 right-20 opacity-15"
      >
        <Shield className="h-10 w-10 text-white" />
      </motion.div>
    </section>
  );
};

export default CallToActionSection;