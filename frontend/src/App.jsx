import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import AllGoalsPage from './pages/AllGoalsPage';
import CreateGoalPage from './pages/CreateGoalPage';
import AuthPage from './pages/AuthPage';
import UserStatsPage from './pages/UserStatsPage';
import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import { authService } from './services/auth.service';

export default function App() {
  const navigate = useNavigate();
  const { isInTelegram, initData } = useTelegramWebApp();

  useEffect(() => {
    // Auto-authenticate if opened in Telegram and not already authenticated
    const handleTelegramAuth = async () => {
      if (isInTelegram && initData && !authService.isAuthenticated()) {
        try {
          await authService.telegramMiniAppLogin(initData);
          // Redirect to goals page after successful auto-auth
          navigate('/goals');
        } catch (error) {
          console.error('Telegram Mini App auth failed:', error);
          // Redirect to auth page if auto-auth fails
          navigate('/auth');
        }
      }
    };

    handleTelegramAuth();
  }, [isInTelegram, initData, navigate]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/goals" element={<AllGoalsPage />} />
      <Route path="/create" element={<CreateGoalPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/stats" element={<UserStatsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
