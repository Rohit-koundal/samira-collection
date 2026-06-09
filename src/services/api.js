const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function customerSafeMessage(message, status) {
  const text = String(message || '').toLowerCase();
  if (status === 503 || text.includes('database unavailable') || text.includes('mongodb') || text.includes('mongo_uri') || text.includes('atlas')) {
    return 'Login service is temporarily unavailable. Please try again in a few minutes.';
  }
  if (status >= 500 || text.includes('server error') || text.includes('internal')) {
    return 'Something went wrong on our side. Please try again shortly.';
  }
  if (!message) return 'Something went wrong. Please try again.';
  return message;
}

async function request(path, options = {}) {
  const token = localStorage.getItem('samira_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(customerSafeMessage(data.message, response.status));
    error.status = response.status;
    error.code = data.code;
    error.details = data.message;
    throw error;
  }

  return data;
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
      const error = new Error(customerSafeMessage(data.message || 'Upload failed', response.status));
      error.status = response.status;
      error.code = data.code;
      error.details = data.message;
      throw error;
    }
    return data;
  },
};

export default api;
