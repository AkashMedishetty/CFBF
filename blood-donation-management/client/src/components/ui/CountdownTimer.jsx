import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, RefreshCw } from 'lucide-react';
import logger from '../../utils/logger';

const CountdownTimer = ({
  initialTime = 300, // 5 minutes in seconds
  onExpire,
  onResend,
  showResendButton = true,
  resendText = 'Resend OTP',
  expiredText = 'OTP Expired',
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isExpired, setIsExpired] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    logger.componentMount('CountdownTimer', { initialTime, showResendButton });
    
    return () => {
      logger.componentUnmount('CountdownTimer');
    };
  }, [initialTime, showResendButton]);

  useEffect(() => {
    // Reset timer when initialTime changes (e.g., after resend)
    setTimeLeft(initialTime);
    setIsExpired(false);
    logger.debug(`Timer reset to ${initialTime} seconds`, 'COUNTDOWN_TIMER');
  }, [initialTime]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!isExpired) {
        setIsExpired(true);
        logger.ui('EXPIRE', 'CountdownTimer', { timeLeft: 0 }, 'COUNTDOWN_TIMER');
        if (onExpire) {
          onExpire();
        }
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;
        
        // Log countdown at specific intervals
        if (newTime % 60 === 0 || newTime <= 10) {
          logger.debug(`Timer: ${newTime} seconds remaining`, 'COUNTDOWN_TIMER');
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isExpired, onExpire]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleResend = async () => {
    if (isResending || !onResend) return;

    logger.ui('CLICK', 'ResendButton', null, 'COUNTDOWN_TIMER');
    setIsResending(true);

    try {
      await onResend();
      logger.success('OTP resend successful', 'COUNTDOWN_TIMER');
    } catch (error) {
      logger.error('OTP resend failed', 'COUNTDOWN_TIMER', error);
    } finally {
      setIsResending(false);
    }
  };

  const getTimerColor = () => {
    if (isExpired) return 'text-red-600 dark:text-red-400';
    if (timeLeft <= 30) return 'text-orange-600 dark:text-orange-400';
    if (timeLeft <= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  const getProgressPercentage = () => {
    return ((initialTime - timeLeft) / initialTime) * 100;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Timer Display */}
      <div className="flex items-center justify-center space-x-2">
        <Clock className={`h-4 w-4 ${getTimerColor()}`} />
        <motion.span
          key={timeLeft} // Re-animate on time change
          initial={{ scale: 1 }}
          animate={{ 
            scale: timeLeft <= 10 && !isExpired ? [1, 1.1, 1] : 1,
            color: isExpired ? '#dc2626' : undefined
          }}
          transition={{ duration: 0.3 }}
          className={`text-sm font-medium ${getTimerColor()}`}
        >
          {isExpired ? expiredText : `${formatTime(timeLeft)} remaining`}
        </motion.span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full rounded-full transition-colors duration-300 ${
            isExpired 
              ? 'bg-red-500' 
              : timeLeft <= 30 
                ? 'bg-orange-500' 
                : timeLeft <= 60 
                  ? 'bg-yellow-500' 
                  : 'bg-primary-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${getProgressPercentage()}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Resend Button */}
      {showResendButton && isExpired && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <button
            onClick={handleResend}
            disabled={isResending}
            className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
            <span>{isResending ? 'Sending...' : resendText}</span>
          </button>
        </motion.div>
      )}

      {/* Status Messages */}
      {isExpired && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p className="text-sm text-red-700 dark:text-red-300">
            Your OTP has expired. Please request a new one to continue.
          </p>
        </motion.div>
      )}

      {timeLeft <= 30 && !isExpired && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
        >
          <p className="text-sm text-orange-700 dark:text-orange-300">
            Your OTP will expire soon. Please enter it quickly.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default CountdownTimer;