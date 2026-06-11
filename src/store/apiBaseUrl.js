export function getApiBaseUrl() {
  const configuredUrl = process.env.REACT_APP_API_URL;
  const isBrowser = typeof window !== 'undefined';
  const isLocalPage = isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname);

  if (configuredUrl && !(isBrowser && configuredUrl.includes('localhost') && !isLocalPage)) {
    return configuredUrl;
  }

  return isLocalPage ? 'http://localhost:5000/api' : 'https://samira-collection-backend-1.onrender.com/api';
}
