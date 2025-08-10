import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useCallback } from 'react';

export const useNavigateWithLoading = () => {
  const navigate = useNavigate();
  const { showLoading } = useLoading();

  const navigateWithLoading = useCallback((to, options = {}) => {
    const { message = 'Loading page...', delay = 600 } = options;
    
    // Show loading immediately
    showLoading(message);
    
    // Navigate after a brief delay to show the loader
    setTimeout(() => {
      navigate(to);
    }, delay);
  }, [navigate, showLoading]);

  return navigateWithLoading;
};

export default useNavigateWithLoading;


