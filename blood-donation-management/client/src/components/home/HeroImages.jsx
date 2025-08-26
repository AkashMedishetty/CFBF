import { useEffect } from 'react';
import { motion } from 'framer-motion';
import OptimizedImage from '../ui/OptimizedImage';
import { imagePreloader } from '../../utils/imagePreloader';

const HeroImages = ({ layout = 'desktop', className = '' }) => {
  const images = {
    primary: {
      src: '/bd1.jpg',
      alt: 'Blood donation process showing donor privacy protection and safe donation environment',
      fallback: '/assets/fallback-blood-donation-1.svg'
    },
    secondary: {
      src: '/bd2.jpg',
      alt: 'Community blood donation highlighting social impact and life-saving mission',
      fallback: '/assets/fallback-blood-donation-2.svg'
    }
  };

  // Ensure images are preloaded
  useEffect(() => {
    imagePreloader.preloadHeroImages().catch(error => {
      console.warn('Failed to preload hero images:', error);
    });
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.6
      }
    }
  };

  const imageVariants = {
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
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const hoverVariants = {
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  // Desktop layout - Enforce same-size images
  if (layout === 'desktop') {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`relative w-full h-full flex flex-col space-y-4 ${className}`}
      >
        {/* Primary image - fixed size */}
        <motion.div
          variants={imageVariants}
          whileHover="hover"
          className="relative w-full"
        >
          <motion.div
            variants={hoverVariants}
            className="relative w-full"
          >
            <OptimizedImage
              src={images.primary.src}
              alt={images.primary.alt}
              fallbackSrc={images.primary.fallback}
              className="rounded-2xl shadow-2xl w-full h-auto object-cover"
              aspectRatio="16/10"
              priority={true}
              retryAttempts={3}
              sizes="(min-width: 1024px) 42vw, 50vw"
            />
            {/* Subtle overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5 rounded-2xl pointer-events-none" />
          </motion.div>
        </motion.div>

        {/* Secondary image - same aspect ratio and constrained width */}
        <motion.div
          variants={imageVariants}
          whileHover="hover"
          className="relative w-full"
        >
          <motion.div
            variants={hoverVariants}
            className="relative w-full"
          >
            <OptimizedImage
              src={images.secondary.src}
              alt={images.secondary.alt}
              fallbackSrc={images.secondary.fallback}
              className="rounded-2xl shadow-2xl w-full h-auto object-cover"
              aspectRatio="16/10"
              retryAttempts={3}
              sizes="(min-width: 1024px) 42vw, 50vw"
            />
            {/* Subtle overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5 rounded-2xl pointer-events-none" />
          </motion.div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -left-4 w-20 h-20 bg-primary-100 rounded-full opacity-20 blur-xl" />
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-100 rounded-full opacity-15 blur-2xl" />
      </motion.div>
    );
  }

  // Tablet layout - Enforce same-size images
  if (layout === 'tablet') {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`relative w-full max-w-2xl mx-auto flex flex-col items-center space-y-6 ${className}`}
      >
        {/* Primary image */}
        <motion.div
          variants={imageVariants}
          whileHover="hover"
          className="relative w-full"
        >
          <motion.div variants={hoverVariants}>
            <OptimizedImage
              src={images.primary.src}
              alt={images.primary.alt}
              fallbackSrc={images.primary.fallback}
              className="rounded-xl shadow-xl w-full h-auto"
              aspectRatio="16/10"
              priority={true}
              retryAttempts={3}
              sizes="(min-width: 768px) 70vw, 85vw"
            />
          </motion.div>
        </motion.div>

        {/* Secondary image - same size */}
        <motion.div
          variants={imageVariants}
          whileHover="hover"
          className="relative w-full"
        >
          <motion.div variants={hoverVariants}>
            <OptimizedImage
              src={images.secondary.src}
              alt={images.secondary.alt}
              fallbackSrc={images.secondary.fallback}
              className="rounded-xl shadow-xl w-full h-auto"
              aspectRatio="16/10"
              retryAttempts={3}
              sizes="(min-width: 768px) 70vw, 85vw"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  // Mobile layout - Enforce same-size images
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`w-full max-w-lg mx-auto flex flex-col space-y-4 ${className}`}
    >
      {/* Primary image */}
      <motion.div
        variants={imageVariants}
        className="relative w-full"
      >
        <OptimizedImage
          src={images.primary.src}
          alt={images.primary.alt}
          fallbackSrc={images.primary.fallback}
          className="rounded-lg shadow-lg w-full h-auto"
          aspectRatio="16/10"
          priority={true}
          retryAttempts={3}
          sizes="92vw"
        />
      </motion.div>

      {/* Secondary image */}
      <motion.div
        variants={imageVariants}
        className="relative w-full"
      >
        <OptimizedImage
          src={images.secondary.src}
          alt={images.secondary.alt}
          fallbackSrc={images.secondary.fallback}
          className="rounded-lg shadow-lg w-full h-auto"
          aspectRatio="16/10"
          retryAttempts={3}
          sizes="92vw"
        />
      </motion.div>
    </motion.div>
  );
};

export default HeroImages;