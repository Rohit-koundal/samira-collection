import { samiraApi } from '../store/apiSlice';
import { store } from '../store/store';
import { startMobileLoader, stopMobileLoader } from '../utils/mobileLoader';

function customerSafeMessage(message, status, path = '', code = '') {
  if (code === 'PERSISTENT_UPLOAD_STORAGE_REQUIRED') {
    return 'Image storage is not configured for production uploads yet. Please connect Cloudinary or R2, then upload again.';
  }
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
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : undefined;
  const endpoint = method === 'GET' ? samiraApi.endpoints.request : samiraApi.endpoints.mutate;
  const action = method === 'GET'
    ? endpoint.initiate({ path })
    : endpoint.initiate({ path, method, body });
  const promise = store.dispatch(action);
  startMobileLoader();

  try {
    const result = await promise.unwrap();
    return result;
  } catch (error) {
    throw toCustomerError(error, path);
  } finally {
    stopMobileLoader();
    if (method === 'GET') promise.unsubscribe?.();
  }
}

const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: async (path, files) => {
    startMobileLoader();
    try {
      return await store.dispatch(samiraApi.endpoints.upload.initiate({ path, files })).unwrap();
    } catch (error) {
      throw toCustomerError(error, path, 'Upload failed');
    } finally {
      stopMobileLoader();
    }
  },
};

function toCustomerError(error, path, fallbackMessage) {
  const status = error?.status || error?.originalStatus || 500;
  const data = error?.data || {};
  const message = data.message || error?.message || fallbackMessage;
  const customerError = new Error(customerSafeMessage(message, status, path, data.code));
  customerError.status = status;
  customerError.code = data.code;
  customerError.details = message;
  return customerError;
}

export default api;
