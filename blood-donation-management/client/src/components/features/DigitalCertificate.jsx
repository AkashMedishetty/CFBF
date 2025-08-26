import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Share2, 
  Award, 
  Calendar,
  MapPin,
  Droplet,
  CheckCircle,
  QrCode,
  Star,
  Heart,
  Copy
} from 'lucide-react';

import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import logger from '../../utils/logger';

const DigitalCertificate = ({ 
  donation, 
  donor, 
  onDownload, 
  onShare, 
  className = '' 
}) => {
  const certificateRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQRCode = (certificateId) => {
    // In real app, this would generate an actual QR code
    // For now, return a placeholder
    return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://callforblood.org/verify/${certificateId}`)}`;
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    
    try {
      // In real app, this would generate a PDF certificate
      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onDownload) {
        await onDownload(donation.certificateId);
      }
      
      logger.success('Certificate downloaded', 'DIGITAL_CERTIFICATE');
    } catch (error) {
      logger.error('Error downloading certificate', 'DIGITAL_CERTIFICATE', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = () => {
    const shareText = `🏆 I just received my blood donation certificate! Proud to be a life saver. Certificate ID: ${donation.certificateId} #BloodDonation #LifeSaver`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Blood Donation Certificate',
        text: shareText,
        url: `https://callforblood.org/verify/${donation.certificateId}`
      });
    } else {
      navigator.clipboard.writeText(shareText);
      logger.success('Certificate link copied to clipboard!', 'DIGITAL_CERTIFICATE');
    }
    
    if (onShare) {
      onShare(donation.certificateId);
    }
  };

  const copyVerificationLink = () => {
    const link = `https://callforblood.org/verify/${donation.certificateId}`;
    navigator.clipboard.writeText(link);
    logger.success('Verification link copied!', 'DIGITAL_CERTIFICATE');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mb-4"
          >
            <Award className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Digital Certificate of Appreciation
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Thank you for your life-saving contribution
          </p>
        </div>

        {/* Certificate */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card 
            ref={certificateRef}
            className="p-8 bg-gradient-to-br from-white via-red-50 to-yellow-50 dark:from-slate-800 dark:via-red-900/10 dark:to-yellow-900/10 border-2 border-yellow-200 dark:border-yellow-800 relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-4">
                <Heart className="h-32 w-32 text-red-500" />
              </div>
              <div className="absolute bottom-4 right-4">
                <Droplet className="h-24 w-24 text-red-500" />
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Award className="h-40 w-40 text-yellow-500" />
              </div>
            </div>

            {/* Certificate Content */}
            <div className="relative z-10 text-center space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Heart className="h-8 w-8 text-red-600" />
                  <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
                    Callforblood Foundation
                  </h1>
                  <Heart className="h-8 w-8 text-red-600" />
                </div>
                
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Certificate of Appreciation
                </h2>
                
                <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-yellow-500 mx-auto rounded-full"></div>
              </div>

              {/* Main Content */}
              <div className="space-y-6">
                <p className="text-lg text-slate-700 dark:text-slate-300">
                  This is to certify that
                </p>
                
                <div className="space-y-2">
                  <h3 className="text-4xl font-bold text-slate-900 dark:text-white">
                    {donor.name}
                  </h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400">
                    Donor ID: {donor.donorId}
                  </p>
                </div>
                
                <p className="text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  has generously donated blood and made a significant contribution to saving lives in our community. 
                  Your selfless act of kindness demonstrates the highest values of humanity and compassion.
                </p>

                {/* Donation Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                  <div className="text-center p-4 bg-white/50 dark:bg-slate-700/50 rounded-lg">
                    <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Donation Date</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatDate(donation.date)}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-white/50 dark:bg-slate-700/50 rounded-lg">
                    <Droplet className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Blood Type</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {donation.bloodType}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-white/50 dark:bg-slate-700/50 rounded-lg">
                    <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Location</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {donation.location.name}
                    </p>
                  </div>
                </div>

                {/* Impact Statement */}
                {donation.impactStory && (
                  <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                          Your Impact
                        </h4>
                        <p className="text-green-700 dark:text-green-300 text-sm">
                          {donation.impactStory}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Milestones */}
                {donation.milestones && donation.milestones.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Achievements Unlocked
                    </h4>
                    <div className="flex flex-wrap justify-center gap-2">
                      {donation.milestones.map((milestone, index) => (
                        <Badge key={index} variant="yellow" className="text-sm">
                          <Star className="h-3 w-3 mr-1" />
                          {milestone}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Certificate ID
                      </p>
                      <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                        {donation.certificateId}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Issued on {formatDate(donation.verificationDate)}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <img
                        src={generateQRCode(donation.certificateId)}
                        alt="Verification QR Code"
                        className="w-16 h-16 mx-auto mb-2"
                      />
                      <p className="text-xs text-slate-500">
                        Scan to verify
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Verified by
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {donation.verifiedBy}
                      </p>
                      <div className="flex items-center justify-end mt-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-xs text-green-600">Verified</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div className="text-center pt-4">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Thank you for being a Life Saver! ❤️
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    "The gift of blood is the gift of life"
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
        >
          <Button
            onClick={handleDownload}
            loading={isGenerating}
            className="flex items-center space-x-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span>Download Certificate</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={handleShare}
            className="flex items-center space-x-2 w-full sm:w-auto"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Achievement</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={copyVerificationLink}
            className="flex items-center space-x-2 w-full sm:w-auto"
          >
            <Copy className="h-4 w-4" />
            <span>Copy Verification Link</span>
          </Button>
        </motion.div>

        {/* Verification Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-4">
              <QrCode className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Certificate Verification
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  This certificate can be verified using the QR code or by visiting our verification portal 
                  with the certificate ID: <span className="font-mono font-semibold">{donation.certificateId}</span>
                </p>
                <div className="flex items-center space-x-4 text-xs text-blue-700 dark:text-blue-300">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Blockchain Secured</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="h-3 w-3" />
                    <span>Officially Recognized</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>Lifetime Valid</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DigitalCertificate;