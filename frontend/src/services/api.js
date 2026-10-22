/**
 * API Service client for House Price Prediction Backend
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(d => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`).join(', ');
        } else {
          errorMessage = errorData.detail;
        }
      }
    } catch {
      // Keep fallback message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  getHealth: () => request('/health'),
  getModelMetrics: () => request('/model/metrics'),
  predict: (data) =>
    request('/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPredictions: (page = 1, pageSize = 10) =>
    request(`/predictions?page=${page}&page_size=${pageSize}`),
  getPredictionById: (id) => request(`/predictions/${id}`),
  deletePrediction: (id) =>
    request(`/predictions/${id}`, {
      method: 'DELETE',
    }),
  getDashboardStats: () => request('/dashboard/stats'),
  getChartData: () => request('/dashboard/chart-data'),
  getSmtpStatus: () => request('/auth/smtp-status'),
  sendResetCode: (email) =>
    request('/auth/send-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verifyResetCode: (email, code) =>
    request('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),
  verifyTotp: (secret, code) =>
    request('/auth/verify-totp', {
      method: 'POST',
      body: JSON.stringify({ secret, code }),
    }),
};

export default api;

