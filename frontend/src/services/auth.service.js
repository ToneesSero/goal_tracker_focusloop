import api from '../utils/api';

export const authService = {
  async register(email, password, name) {
    const response = await api.post('/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  },

  async login(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    return response.data;
  },

  async telegramLogin(telegramUser) {
    const response = await api.post('/auth/telegram', telegramUser);
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    return response.data;
  },

  async telegramMiniAppLogin(initData) {
    const response = await api.post('/auth/telegram-miniapp', { initData });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};
