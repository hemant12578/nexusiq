import axios from 'axios';

// Configure Axios automatic retry interceptor for idle tab reconnects & network hiccups
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    // Retry up to 3 times on Network Error or 5xx server drops
    if (config && (!config._retryCount || config._retryCount < 3)) {
      if (!error.response || error.response.status >= 500 || error.message === 'Network Error') {
        config._retryCount = (config._retryCount || 0) + 1;
        const delayMs = config._retryCount * 800; // 800ms, 1600ms, 2400ms
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return axios(config);
      }
    }
    return Promise.reject(error);
  }
);

export const getApiUrl = (apiProp) => {
  let url = apiProp || (import.meta.env && import.meta.env.VITE_API_URL) || 'https://nexusiq-backend-production.up.railway.app';
  if (typeof url !== 'string' || !url || url.trim() === '' || url === 'undefined' || url === 'null') {
    url = 'https://nexusiq-backend-production.up.railway.app';
  }
  return url.replace(/\/+$/, '');
};
