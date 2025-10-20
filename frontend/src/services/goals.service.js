import api from '../utils/api';

export const goalsService = {
  async getGoals(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.color) params.append('color', filters.color);
    if (filters.sort) params.append('sort', filters.sort);

    const response = await api.get(`/api/goals?${params.toString()}`);
    return response.data;
  },

  async createGoal(goalData) {
    const response = await api.post('/api/goals', goalData);
    return response.data;
  },

  async getGoal(id) {
    const response = await api.get(`/api/goals/${id}`);
    return response.data;
  },

  async updateGoal(id, updates) {
    const response = await api.put(`/api/goals/${id}`, updates);
    return response.data;
  },

  async deleteGoal(id) {
    await api.delete(`/api/goals/${id}`);
  },

  async updateProgress(id, delta, note = null) {
    const response = await api.post(`/api/goals/${id}/progress`, {
      delta,
      note,
    });
    return response.data;
  },

  async completeGoal(id) {
    const response = await api.post(`/api/goals/${id}/complete`);
    return response.data;
  },

  async getHistory(id) {
    const response = await api.get(`/api/goals/${id}/history`);
    return response.data;
  },
};
