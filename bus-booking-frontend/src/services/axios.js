import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
  headers: { 'Content-Type': 'application/json' }
});

client.interceptors.request.use((config) => {
  if (config.requiresAuth !== false) {
    try {
      const session = JSON.parse(sessionStorage.getItem('bb_user'));
      if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
    } catch {
      sessionStorage.removeItem('bb_user');
    }
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const responseData = error.response?.data;
    if (status === 401) {
      sessionStorage.removeItem('bb_user');
      window.dispatchEvent(new Event('bb:unauthorized'));
    }
    if (status === 403) {
      error.message = responseData?.message || 'You do not have permission to perform this action.';
    } else {
      error.message = responseData?.message || responseData?.error || error.message ||
        'The request could not be completed.';
    }
    error.status = status;
    return Promise.reject(error);
  }
);

export default client;
