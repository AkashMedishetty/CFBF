import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Share2, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  MessageSquare, 
  Mail, 
  Copy, 
  Download,
  Image as ImageIcon,
  Edit3,
  Sparkles,
  Heart,
  Award,
  X,
  Check
} from 'lucide-react';

import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import logger from '../../utils/logger';

const SocialShare = ({ 
  type = 'achievement', // 'achievement', 'donation', 'milestone', 'certificate'
  data,
  onClose,
  className = ''
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [shareStats, setShareStats] = useState({
    totalShares: 0,
    platforms: {}
  });

  const platforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      borderColor: 'border-pink-200 dark:border-pink-800'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-800'
    }
  ];

  const getShareContent = () => {
    const baseUrl = 'https://callforbloodfoundation.com';
    
    switch (type) {
      case 'achievement':
        return {
          title: `🏆 Achievement Unlocked: ${data.title}`,
          description: data.description,
          defaultMessage: `🏆 I just unlocked the "${data.title}" achievement on Callforblood Foundation! ${data.description} Join me in saving lives through blood donation. #BloodDonation #LifeSaver #Achievement`,
          url: `${baseUrl}/achievements/${data.id}`,
          hashtags: ['BloodDonation', 'LifeSaver', 'Achievement', 'CallForBlood']
        };
      
      case 'donation':
        return {
          title: `❤️ Blood Donation Completed`,
          description: `Donated ${data.unitsContributed} unit(s) of ${data.bloodType} blood`,
          defaultMessage: `❤️ I just completed a blood donation at ${data.location.name}! Proud to be a life saver and help those in need. Every drop counts! #BloodDonation #LifeSaver #SaveLives`,
          url: `${baseUrl}/donations/${data.id}`,
          hashtags: ['BloodDonation', 'LifeSaver', 'SaveLives', 'CallForBlood']
        };
      
      case 'milestone':
        return {
          title: `🎯 Milestone Achieved: ${data.title}`,
          description: data.description,
          defaultMessage: `🎯 I've reached a major milestone: ${data.title}! ${data.description} Thank you for being part of this life-saving journey. #BloodDonation #Milestone #LifeSaver`,
          url: `${baseUrl}/milestones/${data.id}`,
          hashtags: ['BloodDonation', 'Milestone', 'LifeSaver', 'CallForBlood']
        };
      
      case 'certificate':
        return {
          title: `📜 Blood Donation Certificate`,
          description: `Official certificate for blood donation on ${new Date(data.date).toLocaleDateString()}`,
          defaultMessage: `📜 I received my official blood donation certificate! Proud to be recognized for helping save lives. Certificate ID: ${data.certificateId} #BloodDonation #Certificate #LifeSaver`,
          url: `${baseUrl}/verify/${data.certificateId}`,
          hashtags: ['BloodDonation', 'Certificate', 'LifeSaver', 'CallForBlood']
        };
      
      default:
        return {
          title: 'Blood Donation Achievement',
          description: 'Proud to be a blood donor',
          defaultMessage: 'I\'m proud to be a blood donor and help save lives! Join me at Callforblood Foundation. #BloodDonation #LifeSaver',
          url: baseUrl,
          hashtags: ['BloodDonation', 'LifeSaver', 'CallForBlood']
        };
    }
  };

  const shareContent = getShareContent();

  const handlePlatformToggle = (platformId) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleShare = async (platformId) => {
    const message = customMessage || shareContent.defaultMessage;
    const url = shareContent.url;
    
    logger.ui('CLICK', 'SocialShare', { platform: platformId, type }, 'SOCIAL_SHARE');
    
    try {
      switch (platformId) {
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`);
          break;
        
        case 'twitter':
          const twitterText = `${message} ${shareContent.hashtags.map(tag => `#${tag}`).join(' ')}`;
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(url)}`);
          break;
        
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareContent.title)}&summary=${encodeURIComponent(message)}`);
          break;
        
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`);
          break;
        
        case 'email':
          const emailSubject = shareContent.title;
          const emailBody = `${message}\n\nView more: ${url}`;
          window.open(`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`);
          break;
        
        case 'copy':
          await navigator.clipboard.writeText(`${message} ${url}`);
          logger.success('Content copied to clipboard!', 'SOCIAL_SHARE');
          break;
        
        default:
          break;
      }
      
      // Update share stats
      setShareStats(prev => ({
        totalShares: prev.totalShares + 1,
        platforms: {
          ...prev.platforms,
          [platformId]: (prev.platforms[platformId] || 0) + 1
        }
      }));
      
    } catch (error) {
      logger.error('Error sharing content', 'SOCIAL_SHARE', error);
    }
  };

  const handleShareAll = async () => {
    if (selectedPlatforms.length === 0) {
      logger.warning('Please select at least one platform', 'SOCIAL_SHARE');
      return;
    }
    
    for (const platformId of selectedPlatforms) {
      await handleShare(platformId);
      // Add small delay between shares
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const generateShareImage = async () => {
    setIsGeneratingImage(true);
    
    try {
      // In real app, this would generate a custom image with the achievement/donation details
      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock generated image URL
      const mockImageUrl = `https://api.placeholder.com/600x400/FF6B6B/FFFFFF?text=${encodeURIComponent(shareContent.title)}`;
      setGeneratedImage(mockImageUrl);
      
      logger.success('Share image generated!', 'SOCIAL_SHARE');
    } catch (error) {
      logger.error('Error generating share image', 'SOCIAL_SHARE', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `${type}-share-${Date.now()}.png`;
    link.click();
    
    logger.success('Share image downloaded!', 'SOCIAL_SHARE');
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'achievement': return <Award className="h-6 w-6 text-yellow-600" />;
      case 'donation': return <Heart className="h-6 w-6 text-red-600" />;
      case 'milestone': return <Sparkles className="h-6 w-6 text-purple-600" />;
      case 'certificate': return <ImageIcon className="h-6 w-6 text-blue-600" />;
      default: return <Share2 className="h-6 w-6 text-slate-600" />;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'achievement': return 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800';
      case 'donation': return 'from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800';
      case 'milestone': return 'from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800';
      case 'certificate': return 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800';
      default: return 'from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getTypeIcon()}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Share Your {type.charAt(0).toUpperCase() + type.slice(1)}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Inspire others to join the life-saving community
              </p>
            </div>
          </div>
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content Preview */}
        <Card className={`p-6 bg-gradient-to-br ${getTypeColor()}`}>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getTypeIcon()}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {shareContent.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {shareContent.description}
                </p>
              </div>
            </div>
            
            {/* Generated Image Preview */}
            {generatedImage && (
              <div className="mt-4">
                <img
                  src={generatedImage}
                  alt="Generated share image"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Custom Message */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Edit3 className="h-4 w-4 text-slate-500" />
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Custom Message (Optional)
              </label>
            </div>
            
            <Input
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={shareContent.defaultMessage}
              multiline
              rows={4}
              className="text-sm"
            />
            
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span>Suggested hashtags:</span>
              {shareContent.hashtags.map((tag, index) => (
                <Badge key={index} variant="outline" size="sm">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        {/* Platform Selection */}
        <Card className="p-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Choose Platforms
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);
                
                return (
                  <motion.button
                    key={platform.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePlatformToggle(platform.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? `${platform.bgColor} ${platform.borderColor} shadow-sm`
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Icon className={`h-6 w-6 ${isSelected ? platform.color : 'text-slate-400'}`} />
                      <span className={`text-sm font-medium ${
                        isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {platform.name}
                      </span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                        >
                          <Check className="h-2 w-2 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Image Generation */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Share Image
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Generate a custom image for better engagement
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {generatedImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadImage}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateShareImage}
                  loading={isGeneratingImage}
                >
                  <ImageIcon className="h-3 w-3 mr-1" />
                  {generatedImage ? 'Regenerate' : 'Generate'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Share Buttons */}
        <Card className="p-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Quick Share
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {platforms.slice(0, 4).map((platform) => {
                const Icon = platform.icon;
                
                return (
                  <Button
                    key={platform.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(platform.id)}
                    className="flex items-center space-x-2 justify-center"
                  >
                    <Icon className={`h-3 w-3 ${platform.color}`} />
                    <span>{platform.name}</span>
                  </Button>
                );
              })}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => handleShare('copy')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copy Link</span>
              </Button>
              
              <Button
                onClick={handleShareAll}
                disabled={selectedPlatforms.length === 0}
                className="flex items-center space-x-2"
              >
                <Share2 className="h-4 w-4" />
                <span>
                  Share to Selected ({selectedPlatforms.length})
                </span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Share Stats */}
        {shareStats.totalShares > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Shared {shareStats.totalShares} time{shareStats.totalShares > 1 ? 's' : ''} this session!
                </span>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SocialShare;