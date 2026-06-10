const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
let refreshPromise = null;

function customerSafeMessage(message, status, path = '') {
  const text = String(message || '').toLowerCase();
  if (status === 503 || text.includes('database unavailable') || text.includes('mongodb') || text.includes('mongo_uri') || text.includes('atlas')) {
    if (path.includes('/auth/')) return 'Login service is temporarily unavailable. Please try again in a few minutes.';
    if (path.includes('/coupons')) return 'Coupon service is temporarily unavailable. Please try again in a few minutes.';
    if (path.includes('/orders') || path.includes('/payments')) return 'Checkout service is temporarily unavailable. Please try again in a few minutes.';
    if (path.includes('/uploads')) return 'Image upload service is temporarily unavailable. Please try again in a few minutes.';
    if (path.includes('/admin/')) return 'Admin data service is temporarily unavailable. Please try again in a few minutes.';
    if (path.includes('/products') || path.includes('/categories') || path.includes('/banners') || path.includes('/settings')) return 'Store data service is temporarily unavailable. Please try again in a few minutes.';
    if (path.includes('/user/addresses')) return 'Address service is temporarily unavailable. Please try again in a few minutes.';
    if (path.includes('/wishlist') || path.includes('/cart')) return 'Shopping service is temporarily unavailable. Please try again in a few minutes.';
    return 'Service is temporarily unavailable. Please try again in a few minutes.';
  }
  if (status >= 500 || text.includes('server error') || text.includes('internal')) {
    return 'Something went wrong on our side. Please try again shortly.';
  }
  if (!message) return 'Something went wrong. Please try again.';
  return message;
}

async function request(path, options = {}) {
  return requestWithAuth(path, options, true);
}

async function requestWithAuth(path, options = {}, allowRefresh) {
  const token = localStorage.getItem('samira_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && allowRefresh && !path.includes('/auth/refresh')) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return requestWithAuth(path, options, false);
    }
    const error = new Error(customerSafeMessage(data.message, response.status, path));
    error.status = response.status;
    error.code = data.code;
    error.details = data.message;
    throw error;
  }

  return data;
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('samira_refresh_token');
  if (!refreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.token || !data.user) throw new Error(data.message || 'Session refresh failed');
        localStorage.setItem('samira_token', data.token);
        if (data.refreshToken) localStorage.setItem('samira_refresh_token', data.refreshToken);
        localStorage.setItem('samira_user', JSON.stringify(data.user));
        window.dispatchEvent(new CustomEvent('samira:session-refreshed', { detail: data.user }));
        return true;
      })
      .catch(() => {
        localStorage.removeItem('samira_token');
        localStorage.removeItem('samira_refresh_token');
        localStorage.removeItem('samira_user');
        window.dispatchEvent(new Event('samira:session-expired'));
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: async (path, files) => {
    const token = localStorage.getItem('samira_token');
    const form = new FormData();
    Array.from(files).forEach((file) => form.append('images', file));
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && !path.includes('/auth/refresh')) {
        const refreshed = await refreshAccessToken();
        if (refreshed) return api.upload(path, files);
      }
      const error = new Error(customerSafeMessage(data.message || 'Upload failed', response.status, path));
      error.status = response.status;
      error.code = data.code;
      error.details = data.message;
      throw error;
    }
    return data;
  },
};

export default api;
