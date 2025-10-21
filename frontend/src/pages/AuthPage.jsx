import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import TelegramLoginButton from '../components/TelegramLoginButton';
import { authService } from '../services/auth.service';
import './AuthPage.css';

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await authService.login(email, password);
        navigate('/goals');
      } else {
        await authService.register(email, password, name || 'User');
        // After successful registration, login automatically
        await authService.login(email, password);
        navigate('/goals');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось выполнить запрос');
    } finally {
      setLoading(false);
    }
  };

  // Memoize Telegram auth handler to prevent button re-renders
  const handleTelegramAuth = useCallback(async (user) => {
    setLoading(true);
    setError('');
    try {
      await authService.telegramLogin(user);
      navigate('/goals');
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось войти через Telegram');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  return (
    <div className="auth-page">
      <Header onMenuClick={() => {}} rightContent={null} />
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-toggle">
            <button
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
              type="button"
            >
              Вход
            </button>
            <button
              className={mode === 'register' ? 'active' : ''}
              onClick={() => setMode('register')}
              type="button"
            >
              Регистрация
            </button>
          </div>

          <h1 className="auth-title">
            {mode === 'login' ? 'Войти в focusloop' : 'Создать аккаунт'}
          </h1>
          <p className="auth-subtitle">
            Введите данные для входа или создайте новый аккаунт.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <div className="telegram-auth-section">
            <TelegramLoginButton
              botUsername={import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'focusloop_goal_bot'}
              onAuth={handleTelegramAuth}
              buttonSize="large"
            />
            <div className="auth-divider">
              <span>или</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <Input
                label="Имя"
                name="name"
                value={name}
                onChange={setName}
                placeholder="Ваше имя"
              />
            )}
            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Пароль"
              type="password"
              name="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
            />
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Отправка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
