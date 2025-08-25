import { useState, useEffect, useRef, useCallback } from 'react';
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
  email,
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
  const [isVerified, setIsVerified] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  // Use useRef to store the timeout ID
  const successTimeoutRef = useRef(null);

  const requestOTP = useCallback(async () => {
    const identifier = email || phoneNumber;
    const isEmail = email && email.includes('@');
    
    if (!identifier) {
      logger.error('No phone number or email provided for OTP request', 'OTP_MODAL');
      setError(isEmail ? 'Email is required' : 'Phone number is required');
      return;
    }

    // Prevent multiple simultaneous requests
    if (isRequesting) {
      logger.warn('OTP request already in progress', 'OTP_MODAL');
      return;
    }

    logger.ui('REQUEST', 'OTP', { 
      identifier: isEmail ? identifier : identifier.slice(-4), 
      purpose, 
      type: isEmail ? 'email' : 'phone' 
    }, 'OTP_MODAL');
    
    setIsRequesting(true);
    setError('');

    try {
      // Use different endpoints for email vs phone
      const endpoint = isEmail ? '/api/v1/otp/email/request' : '/api/v1/otp/request';
      const requestBody = isEmail 
        ? { email: identifier, purpose }
        : { phoneNumber: identifier, purpose };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        logger.success('OTP requested successfully', 'OTP_MODAL');
        setOtpRequested(true);
        setTimerKey(prev => prev + 1); // Reset timer
        setSuccess(`OTP sent successfully to your ${isEmail ? 'email' : 'phone'}`);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        logger.error('OTP request failed', 'OTP_MODAL');
        setError(data.message || 'Failed to send OTP');

        if (onVerificationError) {
          try {
            onVerificationError(data);
          } catch (callbackError) {
            logger.error('Error in onVerificationError callback', 'OTP_MODAL', callbackError);
          }
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
  }, [phoneNumber, email, purpose]); // Removed isRequesting and onVerificationError to prevent re-renders

  useEffect(() => {
    if (isOpen) {
      logger.componentMount('OTPModal', { 
        identifier: email ? email : phoneNumber?.slice(-4), 
        purpose, 
        autoRequest,
        type: email ? 'email' : 'phone'
      });

      // Reset state when modal opens
      setOtp('');
      setError('');
      setSuccess('');
      setRemainingAttempts(3);
      setVerificationAttempted(false);
      setIsVerified(false);

      // Auto-request OTP when modal opens if enabled and not already requested
      if (autoRequest && !otpRequested) {
        // Call requestOTP directly to avoid dependency issues
        const identifier = email || phoneNumber;
        const isEmailType = email && email.includes('@');
        
        if (identifier && !isRequesting) {
          setIsRequesting(true);
          setError('');

          const endpoint = isEmailType ? '/api/v1/otp/email/request' : '/api/v1/otp/request';
          const requestBody = isEmailType 
            ? { email: identifier, purpose }
            : { phoneNumber: identifier, purpose };

          fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              setOtpRequested(true);
              setTimerKey(prev => prev + 1);
              setSuccess(`OTP sent successfully to your ${isEmailType ? 'email' : 'phone'}`);
              setTimeout(() => setSuccess(''), 3000);
            } else {
              setError(data.message || 'Failed to send OTP');
            }
          })
          .catch(error => {
            setError('Network error. Please check your connection and try again.');
          })
          .finally(() => {
            setIsRequesting(false);
          });
        }
      }
    } else {
      // Reset state when modal closes
      setOtpRequested(false);
      setTimerKey(prev => prev + 1);
      setIsVerified(false);
      setVerificationAttempted(false);
    }

    return () => {
      if (isOpen) {
        logger.componentUnmount('OTPModal');
      }
      // Cleanup timeout on unmount
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, [isOpen, autoRequest, otpRequested, phoneNumber, email, purpose]); // Removed requestOTP from deps

  const verifyOTP = async (otpCode) => {
    const identifier = email || phoneNumber;
    const isEmail = email && email.includes('@');
    
    // Prevent multiple verification attempts
    if (isVerified) {
      logger.warn('OTP already verified', 'OTP_MODAL');
      if (onVerificationSuccess) {
        onVerificationSuccess({ message: 'Already verified' });
      }
      return { success: true };
    }

    if (verificationAttempted) {
      logger.warn('OTP verification already in progress', 'OTP_MODAL');
      return { success: false, message: 'Verification already in progress' };
    }

    if (!otpCode || otpCode.length !== 6) {
      logger.warn('Invalid OTP length', 'OTP_MODAL');
      setError('Please enter a valid 6-digit OTP');
      return { success: false, message: 'Invalid OTP length' };
    }

    logger.ui('VERIFY', 'OTP', {
      identifier: isEmail ? identifier : identifier?.slice(-4),
      otpLength: otpCode.length,
      type: isEmail ? 'email' : 'phone'
    }, 'OTP_MODAL');

    setIsLoading(true);
    setError('');
    setVerificationAttempted(true);

    try {
      // Use different endpoints for email vs phone
      const endpoint = isEmail ? '/api/v1/otp/email/verify' : '/api/v1/otp/verify';
      const requestBody = isEmail 
        ? { email: identifier, otp: otpCode, purpose }
        : { phoneNumber: identifier, otp: otpCode, purpose };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      logger.debug('OTP verification response:', 'OTP_MODAL', data);

      if (data.success) {
        logger.success('OTP verified successfully', 'OTP_MODAL');
        setSuccess(`${isEmail ? 'Email' : 'Phone number'} verified successfully!`);
        setIsVerified(true);

        // Store token if provided in response
        if (data.token) {
          localStorage.setItem('token', data.token);
          logger.debug('Auth token stored', 'OTP_MODAL');
        }

        // Clear any existing timeouts to prevent multiple calls
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }

        // Call success callback with response data and OTP
        if (onVerificationSuccess) {
          logger.debug('Calling onVerificationSuccess with data:', 'OTP_MODAL', data);
          onVerificationSuccess({
            ...data,
            otp: otpCode // Include the OTP code for login
          });
        } else {
          logger.warn('No onVerificationSuccess callback provided', 'OTP_MODAL');
        }

        // Close modal after success
        successTimeoutRef.current = setTimeout(() => {
          logger.debug('Closing OTP modal after successful verification', 'OTP_MODAL');
          onClose?.();
        }, 1500);

        return { success: true, data };
      } else {
        throw new Error(data.error?.message || data.message || 'OTP verification failed');
      }
    } catch (err) {
      logger.error('OTP verification error', 'OTP_MODAL', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to verify OTP. Please try again.';
      setError(errorMessage);
      setRemainingAttempts(prev => Math.max(0, prev - 1));

      if (onVerificationError) {
        onVerificationError({
          error: 'VERIFICATION_FAILED',
          message: errorMessage,
          remainingAttempts: remainingAttempts - 1
        });
      }

      return {
        success: false,
        error: errorMessage,
        remainingAttempts: remainingAttempts - 1
      };
    } finally {
      setIsLoading(false);
      setVerificationAttempted(false);
    }
  };

  const handleOTPComplete = async (otpCode) => {
    if (isVerified || verificationAttempted) {
      logger.warn('OTP already verified or verification in progress', 'OTP_MODAL');
      return;
    }

    logger.ui('COMPLETE', 'OTPInput', { otpLength: otpCode.length }, 'OTP_MODAL');

    try {
      const result = await verifyOTP(otpCode);
      if (result?.success && onVerificationSuccess) {
        onVerificationSuccess(result.data);
      }
    } catch (error) {
      // Error is already handled in verifyOTP
      logger.error('Error in handleOTPComplete', 'OTP_MODAL', error);
    }
  };

  const handleResendOTP = async () => {
    if (isVerified || isRequesting) {
      logger.warn('Cannot resend OTP - already verified or request in progress', 'OTP_MODAL');
      return;
    }

    logger.ui('RESEND', 'OTP', { 
      identifier: email ? email : phoneNumber?.slice(-4),
      type: email ? 'email' : 'phone'
    }, 'OTP_MODAL');

    try {
      // Reset OTP state before requesting new one
      setOtp('');
      setError('');
      setSuccess('');
      setOtpRequested(false);
      setRemainingAttempts(3); // Reset attempts on resend

      await requestOTP();
    } catch (error) {
      logger.error('Error resending OTP', 'OTP_MODAL', error);
      setError('Failed to resend OTP. Please try again.');
    }
  };

  const handleOTPExpire = () => {
    logger.ui('EXPIRE', 'OTP', { 
      identifier: email ? email : phoneNumber?.slice(-4),
      type: email ? 'email' : 'phone'
    }, 'OTP_MODAL');
    setError('OTP has expired. Please request a new one.');
  };

  const maskIdentifier = (identifier) => {
    if (!identifier) return '****';
    
    // Check if it's an email
    if (identifier.includes('@')) {
      const [username, domain] = identifier.split('@');
      if (username.length <= 2) return `${username}***@${domain}`;
      return `${username.slice(0, 2)}***@${domain}`;
    }
    
    // Phone number masking
    if (identifier.length < 4) return '****';
    return identifier.slice(0, 2) + '*'.repeat(identifier.length - 4) + identifier.slice(-2);
  };

  const getPurposeText = () => {
    const isEmail = email && email.includes('@');
    const purposeTexts = {
      'registration': 'complete your registration',
      'login': 'log into your account',
      'verification': `verify your ${isEmail ? 'email address' : 'phone number'}`,
      'password_reset': 'reset your password',
      'password-reset': 'reset your password'
    };
    return purposeTexts[purpose] || `verify your ${isEmail ? 'email address' : 'phone number'}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={email && email.includes('@') ? "Email Verification" : "Phone Verification"}
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
            {email && email.includes('@') ? 'Verify Your Email' : 'Verify Your Phone Number'}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            We've sent a verification code to {maskIdentifier(email || phoneNumber)} to {getPurposeText()}.
          </p>
        </div>

        {/* Identifier Display */}
        <div className="flex items-center justify-center space-x-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          {email && email.includes('@') ? (
            <svg className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ) : (
            <Phone className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          )}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {maskIdentifier(email || phoneNumber)}
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
          <p className="mt-1">For help, contact us at http://wa.me/919491254120</p>
        </div>
      </div>
    </Modal>
  );
};

export default OTPModal;