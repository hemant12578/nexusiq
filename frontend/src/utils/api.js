export const getApiUrl = (apiProp) => {
  let url = apiProp || (import.meta.env && import.meta.env.VITE_API_URL) || 'https://nexusiq-backend-production.up.railway.app';
  if (typeof url !== 'string' || !url || url.trim() === '' || url === 'undefined' || url === 'null') {
    url = 'https://nexusiq-backend-production.up.railway.app';
  }
  return url.replace(/\/+$/, '');
};
