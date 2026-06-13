export function getApiBaseUrl() {
  const configuredUrl = process.env.REACT_APP_API_URL;
  const isBrowser = typeof window !== 'undefined';
  const isLocalPage = isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname);

  if (isLocalPage) return 'http://localhost:5000/api';
  if (configuredUrl) return configuredUrl;
  return 'https://samira-collection-backend-1.onrender.com/api';
}
