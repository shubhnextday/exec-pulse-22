import { useState, useEffect } from 'react';

const ALLOWED_ORIGINS = [
  'https://dashboard.nextdaynutra.com',
  'http://localhost:5173', // For local development
  'http://localhost:3000',
];

export const useEmbedProtection = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthorization = () => {
      // Check if we're in an iframe
      const isInIframe = window.self !== window.top;
      
      if (!isInIframe) {
        // Not in iframe - check if we're on the allowed domain directly
        const currentOrigin = window.location.origin;
        if (ALLOWED_ORIGINS.some(origin => currentOrigin.startsWith(origin.replace('https://', '').replace('http://', '')))) {
          setIsAuthorized(true);
          return;
        }
        // Allow localhost for development
        if (currentOrigin.includes('localhost') || currentOrigin.includes('lovable.app')) {
          setIsAuthorized(true);
          return;
        }
        setIsAuthorized(false);
        return;
      }

      // We're in an iframe - check the referrer/ancestor
      try {
        // Try to get ancestor origins (Chrome/Edge)
        if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
          const parentOrigin = window.location.ancestorOrigins[0];
          const isAllowed = ALLOWED_ORIGINS.some(origin => parentOrigin.startsWith(origin));
          setIsAuthorized(isAllowed);
          return;
        }
      } catch (e) {
        // ancestorOrigins not available
      }

      // Fallback to document.referrer
      const referrer = document.referrer;
      if (referrer) {
        const isAllowed = ALLOWED_ORIGINS.some(origin => referrer.startsWith(origin));
        setIsAuthorized(isAllowed);
        return;
      }

      // If no referrer and in iframe, deny by default for security
      // But allow lovable.app for preview
      if (window.location.origin.includes('lovable.app')) {
        setIsAuthorized(true);
        return;
      }

      setIsAuthorized(false);
    };

    checkAuthorization();
  }, []);

  return { isAuthorized, isLoading: isAuthorized === null };
};
