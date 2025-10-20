import api from '../utils/api';

export const statsService = {
  async getUserStats(period = 30) {
    const response = await api.get(`/api/stats?period=${period}`);
    return response.data;
  },
};
