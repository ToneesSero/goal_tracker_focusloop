import api from '../utils/api';

export const goalsService = {
  async getGoals(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.color) params.append('color', filters.color);
    if (filters.sort) params.append('sort', filters.sort);

    const response = await api.get(`/goals?${params.toString()}`);
    return response.data;
  },

  async createGoal(goalData) {
    const response = await api.post('/goals', goalData);
    return response.data;
  },

  async getGoal(id) {
    const response = await api.get(`/goals/${id}`);
    return response.data;
  },

  async updateGoal(id, updates) {
    const response = await api.put(`/goals/${id}`, updates);
    return response.data;
  },

  async deleteGoal(id) {
    await api.delete(`/goals/${id}`);
  },

  async updateProgress(id, delta, note = null) {
    const response = await api.post(`/goals/${id}/progress`, {
      delta,
      note,
    });
    return response.data;
  },

  async completeGoal(id) {
    const response = await api.post(`/goals/${id}/complete`);
    return response.data;
  },

  async getHistory(id) {
    const response = await api.get(`/goals/${id}/history`);
    return response.data;
  },
};
