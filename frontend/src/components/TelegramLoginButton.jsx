import { useEffect, useRef, useCallback } from 'react';

const TelegramLoginButton = ({ botUsername, onAuth, buttonSize = 'large', requestAccess = 'write' }) => {
  const containerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  // Memoize callback to prevent re-renders
  const handleAuth = useCallback((user) => {
    if (onAuth) {
      onAuth(user);
    }
  }, [onAuth]);

  useEffect(() => {
    // Only load script once
    if (scriptLoadedRef.current) return;

    // Define global callback for Telegram auth
    window.onTelegramAuth = handleAuth;

    // Create script element for Telegram widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-userpic', 'true');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');

    // Append script to container
    if (containerRef.current) {
      containerRef.current.appendChild(script);
      scriptLoadedRef.current = true;
    }

    // Cleanup
    return () => {
      // Don't delete window.onTelegramAuth as it might be used by loaded widget
      // Just mark as unloaded if component unmounts
      scriptLoadedRef.current = false;
    };
  }, [botUsername, buttonSize, requestAccess, handleAuth]);

  // Update callback when onAuth changes
  useEffect(() => {
    window.onTelegramAuth = handleAuth;
  }, [handleAuth]);

  return <div ref={containerRef} />;
};

export default TelegramLoginButton;
