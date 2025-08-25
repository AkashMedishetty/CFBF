import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import Card from '../ui/Card';

const CommitmentSection = () => {
  return (
    <section className="py-16 bg-white dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 p-8">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Our Commitment to You
              </h3>
              <p className="text-lg text-gray-700 mb-6">
                "Every feature we build, every improvement we make, is driven by one simple goal: 
                ensuring that no one loses a loved one due to blood unavailability. This is not 
                just a platform - it's a promise to every family in India."
              </p>
              <div className="flex items-center justify-center space-x-2 text-red-600 font-semibold">
                <Heart className="w-5 h-5 fill-current" />
                <span>100% Free • Forever • For Everyone</span>
                <Heart className="w-5 h-5 fill-current" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default CommitmentSection;