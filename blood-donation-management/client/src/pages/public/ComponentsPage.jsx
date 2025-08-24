import React, { useState } from 'react';
import { 
  Heart, 
  Star, 
  User, 
  Settings,
  Bell,
  Shield
} from 'lucide-react';

import logger from '../../utils/logger';
import {
  AnimatedCard,
  AnimatedButton,
  Dropdown,
  Tooltip,
  Badge,
  BadgeGroup,
  Alert,
  AlertList,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Input,
  OTPInput,
  OTPModal,
  CountdownTimer,
  LoadingSpinner,
  SkeletonLoader,
  ProgressBar,
  FadeInWhenVisible,

} from '../../components/ui';

import PerformanceOptimizationDemo from '../../components/features/PerformanceOptimizationDemo';
import MobileFirstDesignDemo from '../../components/features/MobileFirstDesignDemo';
import CrossBrowserCompatibilityDemo from '../../components/features/CrossBrowserCompatibilityDemo';
import MultiLanguageDemo from '../../components/features/MultiLanguageDemo';
import I18nDemo from '../../components/features/I18nDemo';
import SecurityDemo from '../../components/features/SecurityDemo';
import MonitoringDashboard from '../../components/features/MonitoringDashboard';


const ComponentsPage = () => {
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [selectedMultiple, setSelectedMultiple] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [badges, setBadges] = useState([
    { id: 1, label: 'React', variant: 'primary', removable: true },
    { id: 2, label: 'JavaScript', variant: 'success', removable: true },
    { id: 3, label: 'Tailwind', variant: 'info', removable: true },
    { id: 4, label: 'Framer Motion', variant: 'warning', removable: true }
  ]);

  React.useEffect(() => {
    logger.componentMount('ComponentsPage');
    
    return () => {
      logger.componentUnmount('ComponentsPage');
    };
  }, []);

  const bloodTypeOptions = [
    { value: 'A+', label: 'A+ (A Positive)' },
    { value: 'A-', label: 'A- (A Negative)' },
    { value: 'B+', label: 'B+ (B Positive)' },
    { value: 'B-', label: 'B- (B Negative)' },
    { value: 'AB+', label: 'AB+ (AB Positive)' },
    { value: 'AB-', label: 'AB- (AB Negative)' },
    { value: 'O+', label: 'O+ (O Positive)' },
    { value: 'O-', label: 'O- (O Negative)' }
  ];

  const skillOptions = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue.js' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'node', label: 'Node.js' },
    { value: 'python', label: 'Python' }
  ];

  const addAlert = (variant) => {
    const messages = {
      success: 'Your blood donation request has been submitted successfully!',
      error: 'Failed to process your request. Please try again.',
      warning: 'Your profile is incomplete. Please update your information.',
      info: 'New donors are needed in your area. Consider donating today!'
    };

    const newAlert = {
      id: Date.now(),
      variant,
      title: variant.charAt(0).toUpperCase() + variant.slice(1),
      message: messages[variant]
    };

    setAlerts(prev => [...prev, newAlert]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== newAlert.id));
    }, 5000);
  };

  const removeBadge = (index) => {
    setBadges(prev => prev.filter((_, i) => i !== index));
  };

  const removeAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <FadeInWhenVisible>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Premium Component Library
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              A comprehensive collection of beautiful, accessible, and animated UI components
              built with React, Tailwind CSS, and Framer Motion.
            </p>
          </div>
        </FadeInWhenVisible>

        {/* Tabs Demo */}
        <FadeInWhenVisible>
          <AnimatedCard className="mb-12">
            <AnimatedCard.Header>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Interactive Tabs
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Smooth animated tabs with different variants
              </p>
            </AnimatedCard.Header>
            
            <AnimatedCard.Body>
              <Tabs defaultTab={0} variant="default" className="mb-8">
                <TabList>
                  <Tab>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Tab>
                  <Tab>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Tab>
                  <Tab>
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </Tab>
                </TabList>
                
                <TabPanels>
                  <TabPanel>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h3 className="font-semibold mb-2">Profile Information</h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Manage your personal information and donation history.
                      </p>
                    </div>
                  </TabPanel>
                  <TabPanel>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h3 className="font-semibold mb-2">Account Settings</h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Configure your account preferences and privacy settings.
                      </p>
                    </div>
                  </TabPanel>
                  <TabPanel>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h3 className="font-semibold mb-2">Notification Preferences</h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Choose how you want to receive donation requests and updates.
                      </p>
                    </div>
                  </TabPanel>
                </TabPanels>
              </Tabs>

              {/* Pills variant */}
              <Tabs defaultTab={0} variant="pills">
                <TabList>
                  <Tab>Dashboard</Tab>
                  <Tab>Analytics</Tab>
                  <Tab>Reports</Tab>
                </TabList>
                
                <TabPanels>
                  <TabPanel>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                        <h4 className="font-semibold text-primary-900 dark:text-primary-100">Total Donors</h4>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">1,234</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900 dark:text-green-100">Successful Donations</h4>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">856</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">Lives Saved</h4>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">2,568</p>
                      </div>
                    </div>
                  </TabPanel>
                  <TabPanel>
                    <SkeletonLoader lines={5} />
                  </TabPanel>
                  <TabPanel>
                    <div className="text-center py-8">
                      <p className="text-slate-500 dark:text-slate-400">Reports will be available soon</p>
                    </div>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </AnimatedCard.Body>
          </AnimatedCard>
        </FadeInWhenVisible>

        {/* Dropdowns Demo */}
        <FadeInWhenVisible>
          <AnimatedCard className="mb-12">
            <AnimatedCard.Header>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Advanced Dropdowns
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Feature-rich dropdowns with search, multi-select, and animations
              </p>
            </AnimatedCard.Header>
            
            <AnimatedCard.Body>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Dropdown
                    label="Blood Type"
                    placeholder="Select your blood type"
                    options={bloodTypeOptions}
                    value={selectedBloodType}
                    onChange={setSelectedBloodType}
                    required
                  />
                </div>
                
                <div>
                  <Dropdown
                    label="Skills (Multi-select)"
                    placeholder="Select your skills"
                    options={skillOptions}
                    value={selectedMultiple}
                    onChange={setSelectedMultiple}
                    multiple
                    searchable
                  />
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Selected Blood Type: <span className="font-medium">{selectedBloodType || 'None'}</span>
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Selected Skills: <span className="font-medium">{selectedMultiple.length > 0 ? selectedMultiple.join(', ') : 'None'}</span>
                </p>
              </div>
            </AnimatedCard.Body>
          </AnimatedCard>
        </FadeInWhenVisible>

        {/* Badges Demo */}
        <FadeInWhenVisible>
          <AnimatedCard className="mb-12">
            <AnimatedCard.Header>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Badges & Tags
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Colorful badges with icons and removal functionality
              </p>
            </AnimatedCard.Header>
            
            <AnimatedCard.Body>
              <div className="space-y-6">
                {/* Individual Badges */}
                <div>
                  <h3 className="font-semibold mb-3">Badge Variants</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="primary" icon={Heart}>Primary</Badge>
                    <Badge variant="success" icon={Shield}>Success</Badge>
                    <Badge variant="warning" icon={Bell}>Warning</Badge>
                    <Badge variant="danger">Danger</Badge>
                    <Badge variant="info" icon={Star}>Info</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="solid">Solid</Badge>
                  </div>
                </div>

                {/* Badge Sizes */}
                <div>
                  <h3 className="font-semibold mb-3">Badge Sizes</h3>
                  <div className="flex items-center gap-2">
                    <Badge size="sm" variant="primary">Small</Badge>
                    <Badge size="md" variant="primary">Medium</Badge>
                    <Badge size="lg" variant="primary">Large</Badge>
                  </div>
                </div>

                {/* Removable Badges */}
                <div>
                  <h3 className="font-semibold mb-3">Removable Badges</h3>
                  <BadgeGroup 
                    badges={badges}
                    onRemove={removeBadge}
                    maxVisible={6}
                  />
                </div>
              </div>
            </AnimatedCard.Body>
          </AnimatedCard>
        </FadeInWhenVisible>

        {/* Tooltips Demo */}
        <FadeInWhenVisible>
          <AnimatedCard className="mb-12">
            <AnimatedCard.Header>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Interactive Tooltips
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Smart tooltips with auto-positioning and multiple triggers
              </p>
            </AnimatedCard.Header>
            
            <AnimatedCard.Body>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <Tooltip content="This tooltip appears on top" position="top">
                  <AnimatedButton variant="outline">Top Tooltip</AnimatedButton>
                </Tooltip>
                
                <Tooltip content="This tooltip appears on the right side" position="right">
                  <AnimatedButton variant="outline">Right Tooltip</AnimatedButton>
                </Tooltip>
                
                <Tooltip content="This tooltip appears at the bottom" position="bottom">
                  <AnimatedButton variant="outline">Bottom Tooltip</AnimatedButton>
                </Tooltip>
                
                <Tooltip content="This tooltip appears on the left side" position="left">
                  <AnimatedButton variant="outline">Left Tooltip</AnimatedButton>
                </Tooltip>
              </div>
              
              <div className="mt-8 text-center">
                <Tooltip 
                  content="Click me to toggle this tooltip!" 
                  trigger="click"
                  position="top"
                >
                  <AnimatedButton variant="primary">Click Tooltip</AnimatedButton>
                </Tooltip>
              </div>
            </AnimatedCard.Body>
          </AnimatedCard>
        </FadeInWhenVisible>

        {/* Alerts Demo */}
        <FadeInWhenVisible>
          <AnimatedCard className="mb-12">
            <AnimatedCard.Header>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Alert System
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Beautiful alerts with animations and auto-dismiss functionality
              </p>
            </AnimatedCard.Header>
            
            <AnimatedCard.Body>
              <div className="space-y-4">
                {/* Static Alerts */}
                <Alert variant="success" title="Success!" dismissible>
                  Your blood donation has been successfully registered.
                </Alert>
                
                <Alert variant="warning" title="Warning">
                  Please complete your profile to receive donation requests.
                </Alert>
                
                <Alert variant="error" title="Error" dismissible>
                  Failed to connect to the server. Please try again.
                </Alert>
                
                <Alert variant="info" title="Information">
                  New blood donation drive starting next week in your area.
                </Alert>

                {/* Alert Triggers */}
                <div className="flex flex-wrap gap-2 pt-4">
                  <AnimatedButton 
                    variant="success" 
                    size="sm"
                    onClick={() => addAlert('success')}
                  >
                    Show Success
                  </AnimatedButton>
                  <AnimatedButton 
                    variant="danger" 
                    size="sm"
                    onClick={() => addAlert('error')}
                  >
                    Show Error
                  </AnimatedButton>
                  <AnimatedButton 
                    variant="warning" 
                    size="sm"
                    onClick={() => addAlert('warning')}
                  >
                    Show Warning
                  </AnimatedButton>
                  <AnimatedButton 
                    variant="secondary" 
                    size="sm"
                    onClick={() => addAlert('info')}
                  >
                    Show Info
                  </AnimatedButton>
                </div>
              </div>
            </AnimatedCard.Body>
          </AnimatedCard>
        </FadeInWhenVisible>

        {/* Form Components Demo */}
        <FadeInWhenVisible>
          <AnimatedCard className="mb-12">
            <AnimatedCard.Header>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Form Components
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Advanced form inputs with validation and animations
              </p>
            </AnimatedCard.Header>
            
            <AnimatedCard.Body>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    required
                  />
                  
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    success="Email format is valid"
                  />
                  
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    error="Password must be at least 8 characters"
                  />
                </div>
                
                <div className="space-y-4">
                  <Input
                    label="Phone Number"
                    placeholder="+1 (555) 123-4567"
                    disabled
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Upload Progress
                    </label>
                    <ProgressBar progress={75} animated />
                  </div>
                  
                  <div className="text-center">
                    <LoadingSpinner 
                      variant="spinner" 
                      size="md" 
                      text="Processing..." 
                    />
                  </div>
                </div>
              </div>
            </AnimatedCard.Body>
          </AnimatedCard>
        </FadeInWhenVisible>

        {/* OTP Components */}
        <FadeInWhenVisible>
          <AnimatedCard>
            <AnimatedCard.Header>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  OTP Components
                </h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Secure phone verification components with WhatsApp integration
              </p>
            </AnimatedCard.Header>
            <AnimatedCard.Body>
              <div className="space-y-8">
                {/* OTP Input Component */}
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                    OTP Input
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Default OTP Input
                      </label>
                      <OTPInput
                        onChange={(otp) => console.log('OTP:', otp)}
                        onComplete={(otp) => console.log('OTP Complete:', otp)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        OTP Input with Error
                      </label>
                      <OTPInput
                        error="Invalid OTP. Please try again."
                        onChange={(otp) => console.log('OTP:', otp)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        OTP Input with Success
                      </label>
                      <OTPInput
                        success="OTP verified successfully!"
                        value="123456"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                {/* Countdown Timer Component */}
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                    Countdown Timer
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        5 Minute Timer
                      </label>
                      <CountdownTimer
                        initialTime={300}
                        onExpire={() => console.log('Timer expired')}
                        onResend={() => console.log('Resend requested')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        30 Second Timer (Warning State)
                      </label>
                      <CountdownTimer
                        initialTime={30}
                        onExpire={() => console.log('Timer expired')}
                        onResend={() => console.log('Resend requested')}
                      />
                    </div>
                  </div>
                </div>

                {/* OTP Modal Demo */}
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                    OTP Modal
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Phone Verification Modal
                      </label>
                      <AnimatedButton
                        onClick={() => setShowOTPModal(true)}
                        variant="primary"
                        icon={Shield}
                      >
                        Test OTP Verification
                      </AnimatedButton>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Click to simulate OTP verification flow (demo mode)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Integration Example */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                    Integration Example
                  </h4>
                  <pre className="text-sm text-slate-600 dark:text-slate-400 overflow-x-auto">
{`// Basic OTP verification flow
const [showOTPModal, setShowOTPModal] = useState(false);

<OTPModal
  isOpen={showOTPModal}
  onClose={() => setShowOTPModal(false)}
  phoneNumber="+919876543210"
  purpose="registration"
  onVerificationSuccess={(data) => {
    console.log('Phone verified:', data);
    // Proceed with registration
  }}
  onVerificationError={(error) => {
    console.error('Verification failed:', error);
  }}
/>`}
                  </pre>
                </div>
              </div>
            </AnimatedCard.Body>
          </AnimatedCard>
        </FadeInWhenVisible>

        {/* Performance Optimization Demo */}
        <FadeInWhenVisible>
          <PerformanceOptimizationDemo />
        </FadeInWhenVisible>

        {/* Mobile First Design Demo */}
        <FadeInWhenVisible>
          <div className="mt-8">
            <MobileFirstDesignDemo />
          </div>
        </FadeInWhenVisible>

        {/* Cross-Browser Compatibility Demo */}
        <FadeInWhenVisible>
          <div className="mt-8">
            <CrossBrowserCompatibilityDemo />
          </div>
        </FadeInWhenVisible>

        {/* Multi-Language Support Demo */}
        <FadeInWhenVisible>
          <div className="mt-8">
            <MultiLanguageDemo />
          </div>
        </FadeInWhenVisible>

        {/* I18n Demo */}
        <FadeInWhenVisible>
          <div className="mt-8">
            <I18nDemo />
          </div>
        </FadeInWhenVisible>

        {/* Security Demo */}
        <FadeInWhenVisible>
          <div className="mt-8">
            <SecurityDemo />
          </div>
        </FadeInWhenVisible>

        {/* Monitoring Dashboard */}
        <FadeInWhenVisible>
          <div className="mt-8">
            <MonitoringDashboard />
          </div>
        </FadeInWhenVisible>

        {/* iOS PWA Demo */}
        <FadeInWhenVisible>
          <div className="mt-8">
            
          </div>
        </FadeInWhenVisible>

        {/* Performance Note */}
        <FadeInWhenVisible>
          <div className="mt-8 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <Heart className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
                  Built for CallforBlood Foundation
                </h3>
                <p className="text-primary-800 dark:text-primary-200 text-sm">
                  This premium component library is specifically designed for the Blood Donation Management System. 
                  All components include comprehensive logging, accessibility features, and respect user motion preferences. 
                  Perfect for building life-saving applications with beautiful, performant user interfaces.
                </p>
              </div>
            </div>
          </div>
        </FadeInWhenVisible>
      </div>

      {/* Alert List for dynamic alerts */}
      <AlertList 
        alerts={alerts}
        onDismiss={removeAlert}
        position="top-right"
      />

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        phoneNumber="+919876543210"
        purpose="verification"
        onVerificationSuccess={(verificationData) => {
          console.log('OTP verification successful:', verificationData);
          logger.success('OTP verification successful', 'COMPONENTS_PAGE');
          addAlert('success');
          setShowOTPModal(false);
        }}
        onVerificationError={(error) => {
          logger.error('OTP verification failed', 'COMPONENTS_PAGE', error);
          addAlert('error');
        }}
      />
    </div>
  );
};

export default ComponentsPage;