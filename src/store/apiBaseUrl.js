const LOCAL_API_PORT = '5000';
const PRODUCTION_API_URL = 'https://samira-collection-backend-1.onrender.com/api';

function isLocalHostname(hostname = '') {
  if (['localhost', '127.0.0.1', '::1'].includes(hostname)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  return false;
}

function withApiSuffix(url = '') {
  const trimmed = String(url || '').trim().replace(/\/$/, '');
  if (!trimmed) return '';
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

/**
 * Local `npm start` always talks to the machine's backend.
 * Render / live site uses REACT_APP_API_URL from `.env.production`.
 */
export function getApiBaseUrl() {
  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : '';

  if (isLocalHostname(hostname)) {
    const host = hostname === '::1' ? '127.0.0.1' : hostname;
    return `http://${host}:${LOCAL_API_PORT}/api`;
  }

  return withApiSuffix(process.env.REACT_APP_API_URL) || PRODUCTION_API_URL;
}
