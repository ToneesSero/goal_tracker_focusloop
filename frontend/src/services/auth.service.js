import api from '../utils/api';

export const authService = {
  async register(email, password, name) {
    const response = await api.post('/api/auth/register', {
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

    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
  },

  async getCurrentUser() {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};
