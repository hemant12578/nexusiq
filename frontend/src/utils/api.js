import axios from 'axios';

const FALLBACK = 'https://nexusiq-backend-production.up.railway.app';

// Axios retry interceptor — silently retries transient failures
axios.interceptors.response.use(
  (res) => res,
  async (err) => {
    const cfg = err.config;
    if (!cfg) return Promise.reject(err);
    cfg._retryCount = cfg._retryCount || 0;
    const isTransient = !err.response || err.response.status >= 500 || err.message === 'Network Error';
    if (isTransient && cfg._retryCount < 3) {
      cfg._retryCount++;
      // Clear Content-Type for FormData so browser regenerates multipart boundary
      if (cfg.data instanceof FormData && cfg.headers) {
        delete cfg.headers['Content-Type'];
        delete cfg.headers['content-type'];
      }
      await new Promise(r => setTimeout(r, cfg._retryCount * 1500));
      return axios(cfg);
    }
    return Promise.reject(err);
  }
);

export const getApiUrl = (apiProp) => {
  const url = apiProp || (import.meta.env && import.meta.env.VITE_API_URL) || FALLBACK;
  if (typeof url !== 'string' || !url || url === 'undefined' || url === 'null') return FALLBACK;
  return url.replace(/\/+$/, '');
};

export const friendlyError = (e) => {
  if (e.code === 'ECONNABORTED') return 'Request timed out. Please retry.';
  const detail = e.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (e.message === 'Network Error' || !e.response) return 'Hardware / Server Not Connected';
  return 'Hardware Not Connected';
};
