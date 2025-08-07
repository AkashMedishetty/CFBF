import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Shield, AlertCircle, CheckCircle } from 'lucide-react';

import Modal from './Modal';
import OTPInput from './OTPInput';
import CountdownTimer from './CountdownTimer';
import Button from './Button';
import logger from '../../utils/logger';

const OTPModal = ({
  isOpen,
  onClose,
  phoneNumber,
  purpose = 'verification',
  onVerificationSuccess,
  onVerificationError,
  autoRequest = true,
  className = ''
}) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);

  useEffect(() => {
    if (isOpen) {
      logger.componentMount('OTPModal', { phoneNumber: phoneNumber?.slice(-4), purpose, autoRequest });
      
      // Auto-request OTP when modal opens
      if (autoRequest && !otpRequested) {
        requestOTP();
      }
    }
    
    return () => {
      if (isOpen) {
        logger.componentUnmount('OTPModal');
      }
    };
  }, [isOpen, autoRequest, otpRequested]);

  useEffect(() => {
    // Reset state when modal opens/closes
    if (isOpen) {
      setOtp('');
      setError('');
      setSuccess('');
      setRemainingAttempts(3);
    } else {
      setOtpRequested(false);
      setTimerKey(0);
    }
  }, [isOpen]);

  const requestOTP = async () => {
    if (!phoneNumber) {
      logger.error('No phone number provided for OTP request', 'OTP_MODAL');
      setError('Phone number is required');
      return;
    }

    logger.ui('REQUEST', 'OTP', { phoneNumber: phoneNumber.slice(-4), purpose }, 'OTP_MODAL');
    setIsRequesting(true);
    setError('');

    try {
      const response = await fetch('/api/v1/otp/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          purpose
        }),
      });

      const data = await response.json();

      if (data.success) {
        logger.success('OTP requested successfully', 'OTP_MODAL');
        setOtpRequested(true);
        setTimerKey(prev => prev + 1); // Reset timer
        setSuccess('OTP sent successfully to your phone');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        logger.error('OTP request failed', 'OTP_MODAL');
        setError(data.message || 'Failed to send OTP');
        
        if (onVerificationError) {
          onVerificationError(data);
        }
      }
    } catch (error) {
      logger.error('Network error during OTP request', 'OTP_MODAL', error);
      setError('Network error. Please check your connection and try again.');
      
      if (onVerificationError) {
        onVerificationError({ error: 'NETWORK_ERROR', message: error.message });
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const verifyOTP = async (otpCode) => {
    if (!otpCode || otpCode.length !== 6) {
      logger.warn('Invalid OTP length', 'OTP_MODAL');
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    logger.ui('VERIFY', 'OTP', { phoneNumber: phoneNumber?.slice(-4), otpLength: otpCode.length }, 'OTP_MODAL');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          otp: otpCode
        }),
      });

      const data = await response.json();

      if (data.success) {
        logger.success('OTP verified successfully', 'OTP_MODAL');
        setSuccess('Phone number verified successfully!');
        
        if (onVerificationSuccess) {
          onVerificationSuccess(data);
        }
        
        // Close modal after success
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        logger.warn('OTP verification failed', 'OTP_MODAL');
        setError(data.message || 'Invalid OTP');
        setRemainingAttempts(data.data?.remainingAttempts || 0);
        setOtp(''); // Clear OTP input
        
        if (onVerificationError) {
          onVerificationError(data);
        }
      }
    } catch (error) {
      logger.error('Network error during OTP verification', 'OTP_MODAL', error);
      setError('Network error. Please check your connection and try again.');
      
      if (onVerificationError) {
        onVerificationError({ error: 'NETWORK_ERROR', message: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPComplete = (otpCode) => {
    logger.ui('COMPLETE', 'OTPInput', { otpLength: otpCode.length }, 'OTP_MODAL');
    verifyOTP(otpCode);
  };

  const handleResendOTP = async () => {
    logger.ui('RESEND', 'OTP', { phoneNumber: phoneNumber?.slice(-4) }, 'OTP_MODAL');
    await requestOTP();
  };

  const handleOTPExpire = () => {
    logger.ui('EXPIRE', 'OTP', { phoneNumber: phoneNumber?.slice(-4) }, 'OTP_MODAL');
    setError('OTP has expired. Please request a new one.');
  };

  const maskPhoneNumber = (phone) => {
    if (!phone || phone.length < 4) return '****';
    return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
  };

  const getPurposeText = () => {
    const purposeTexts = {
      'registration': 'complete your registration',
      'login': 'log into your account',
      'verification': 'verify your phone number',
      'password_reset': 'reset your password'
    };
    return purposeTexts[purpose] || 'verify your phone number';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Phone Verification"
      size="md"
      className={className}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4">
            <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Verify Your Phone Number
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            We've sent a verification code to {maskPhoneNumber(phoneNumber)} to {getPurposeText()}.
          </p>
        </div>

        {/* Phone Number Display */}
        <div className="flex items-center justify-center space-x-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <Phone className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {maskPhoneNumber(phoneNumber)}
          </span>
        </div>

        {/* OTP Input */}
        {otpRequested && (
          <OTPInput
            value={otp}
            onChange={setOtp}
            onComplete={handleOTPComplete}
            disabled={isLoading}
            error={error}
            success={success}
          />
        )}

        {/* Countdown Timer */}
        {otpRequested && (
          <CountdownTimer
            key={timerKey}
            initialTime={300} // 5 minutes
            onExpire={handleOTPExpire}
            onResend={handleResendOTP}
            showResendButton={true}
          />
        )}

        {/* Remaining Attempts */}
        {remainingAttempts < 3 && remainingAttempts > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-2 text-sm text-orange-600 dark:text-orange-400"
          >
            <AlertCircle className="h-4 w-4" />
            <span>{remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining</span>
          </motion.div>
        )}

        {/* Success State */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {!otpRequested ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isRequesting}
              >
                Cancel
              </Button>
              <Button
                onClick={requestOTP}
                loading={isRequesting}
                className="flex-1"
              >
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => verifyOTP(otp)}
                loading={isLoading}
                disabled={otp.length !== 6}
                className="flex-1"
              >
                Verify
              </Button>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          <p>Didn't receive the code? Check your messages or try resending after the timer expires.</p>
          <p className="mt-1">For help, contact us at +91-911-BLOOD</p>
        </div>
      </div>
    </Modal>
  );
};

export default OTPModal;