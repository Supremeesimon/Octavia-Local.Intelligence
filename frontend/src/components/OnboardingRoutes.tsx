import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// This component maps the onboarding paths to the actual routes in the router
export function OnboardingRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    
    // Map the desired onboarding paths to the actual routes
    if (path === '/onboarding/api-key') {
      navigate('/api-key-input');
    } else if (path === '/onboarding/location') {
      navigate('/location-input');
    } else if (path === '/onboarding/loading') {
      navigate('/loading-screen');
    }
  }, [location.pathname, navigate]);

  return null;
}
