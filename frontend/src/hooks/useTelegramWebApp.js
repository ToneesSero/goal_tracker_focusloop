import { useEffect, useState } from 'react';

export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState(null);
  const [user, setUser] = useState(null);
  const [initData, setInitData] = useState(null);
  const [isInTelegram, setIsInTelegram] = useState(false);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      setIsInTelegram(true);

      // Initialize Telegram WebApp
      tg.ready();
      tg.expand();

      // Get user data
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }

      // Get initData for authentication
      if (tg.initData) {
        setInitData(tg.initData);
      }

      // Apply Telegram theme
      if (tg.themeParams) {
        applyTelegramTheme(tg.themeParams);
      }
    }
  }, []);

  const applyTelegramTheme = (themeParams) => {
    const root = document.documentElement;

    if (themeParams.bg_color) {
      root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
    }
    if (themeParams.text_color) {
      root.style.setProperty('--tg-theme-text-color', themeParams.text_color);
    }
    if (themeParams.hint_color) {
      root.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
    }
    if (themeParams.link_color) {
      root.style.setProperty('--tg-theme-link-color', themeParams.link_color);
    }
    if (themeParams.button_color) {
      root.style.setProperty('--tg-theme-button-color', themeParams.button_color);
    }
    if (themeParams.button_text_color) {
      root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
    }
  };

  const showBackButton = (onClick) => {
    if (webApp?.BackButton) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(onClick);
    }
  };

  const hideBackButton = () => {
    if (webApp?.BackButton) {
      webApp.BackButton.hide();
    }
  };

  const showMainButton = (text, onClick) => {
    if (webApp?.MainButton) {
      webApp.MainButton.setText(text);
      webApp.MainButton.show();
      webApp.MainButton.onClick(onClick);
    }
  };

  const hideMainButton = () => {
    if (webApp?.MainButton) {
      webApp.MainButton.hide();
    }
  };

  const close = () => {
    if (webApp) {
      webApp.close();
    }
  };

  return {
    webApp,
    user,
    initData,
    isInTelegram,
    showBackButton,
    hideBackButton,
    showMainButton,
    hideMainButton,
    close,
  };
};
