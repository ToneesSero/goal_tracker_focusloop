import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import { authService } from '../services/auth.service';
import './AuthPage.css';

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('demo@goalflow.dev');
  const [password, setPassword] = useState('password123');
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
      } else {
        await authService.register(email, password, name || 'User');
        await authService.login(email, password);
      }
      navigate('/goals');
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось выполнить запрос');
    } finally {
      setLoading(false);
    }
  };

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
            Используйте демо аккаунт demo@goalflow.dev / password123 или создайте свой.
          </p>

          {error && <div className="auth-error">{error}</div>}

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
