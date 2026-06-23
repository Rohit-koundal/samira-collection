export function getApiBaseUrl() {
  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : '';
  const isLocalPage = ['localhost', '127.0.0.1', '::1'].includes(hostname);
  const configuredUrl = process.env.REACT_APP_API_URL;

  if (isLocalPage) return 'http://localhost:5000/api';
  if (configuredUrl) return configuredUrl;
  return 'https://samira-collection-backend-1.onrender.com/api';
}
