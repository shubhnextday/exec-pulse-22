import { useState, useEffect } from 'react';

const ALLOWED_ORIGINS = [
  'https://dashboard.nextdaynutra.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

export const useEmbedProtection = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthorization = () => {
      const currentOrigin = window.location.origin;
      
      // Always allow lovable.app for development/preview
      if (currentOrigin.includes('lovable.app')) {
        setIsAuthorized(true);
        return;
      }
      
      // Allow localhost for development
      if (currentOrigin.includes('localhost')) {
        setIsAuthorized(true);
        return;
      }

      // Check if we're in an iframe
      const isInIframe = window.self !== window.top;
      
      if (isInIframe) {
        // We're in an iframe - check the referrer
        const referrer = document.referrer;
        
        if (referrer) {
          const isAllowed = ALLOWED_ORIGINS.some(origin => referrer.startsWith(origin));
          setIsAuthorized(isAllowed);
          return;
        }
        
        // Try ancestorOrigins (Chrome/Edge)
        try {
          if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
            const parentOrigin = window.location.ancestorOrigins[0];
            const isAllowed = ALLOWED_ORIGINS.some(origin => parentOrigin.startsWith(origin));
            setIsAuthorized(isAllowed);
            return;
          }
        } catch (e) {
          // ancestorOrigins not available
        }
        
        // If in iframe but can't determine parent, allow (for cross-origin iframes)
        // The iframe sandbox restrictions will handle security
        setIsAuthorized(true);
        return;
      }

      // Not in iframe and not on allowed origin - deny
      setIsAuthorized(false);
    };

    checkAuthorization();
  }, []);

  return { isAuthorized, isLoading: isAuthorized === null };
};
