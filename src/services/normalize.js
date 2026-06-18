import { getApiBaseUrl } from '../store/apiBaseUrl';

export function normalizeProduct(product) {
  const images = (product.images || [])
    .map((image) => ({ ...image, url: normalizeImageUrl(image.url) }))
    .filter((image) => isUsableImageUrl(image.url));
  return {
    ...product,
    images,
    id: product._id || product.id,
    category: product.category?.name || product.category || 'Collection',
    categoryId: product.category?._id || product.category,
    rating: product.rating || 0,
    numReviews: product.numReviews || 0,
    colors: product.colors?.length ? product.colors : ['Wine'],
    originalPrice: product.originalPrice || product.price,
    discountPercentage: product.discountPercentage || 0,
  };
}

export function normalizeProducts(products = []) {
  return products.map(normalizeProduct);
}

export function normalizeImageUrl(url) {
  if (!url || isKnownMissingImage(url)) return '';

  if (isInaccessibleImageUrl(url) && isRemoteClient()) {
    const uploadsPath = extractUploadsPath(url);
    return uploadsPath ? `${getApiRootUrl()}${uploadsPath}` : '';
  }

  if (url.startsWith('http') || url.startsWith('data:')) return url;

  const apiRoot = getApiRootUrl();
  return `${apiRoot}${url.startsWith('/') ? url : `/${url}`}`;
}

export function isUsableImageUrl(url) {
  if (!url || isKnownMissingImage(url)) return false;
  if (isInaccessibleImageUrl(url) && isRemoteClient()) return false;
  return true;
}

function getApiRootUrl() {
  return getApiBaseUrl().replace(/\/api\/?$/, '');
}

function extractUploadsPath(url = '') {
  const match = String(url).match(/\/uploads\/[^?#\s]+/i);
  return match ? match[0] : '';
}

function isInaccessibleImageUrl(url) {
  return /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(String(url || ''));
}

function isRemoteClient() {
  if (typeof window === 'undefined') return false;
  return !['localhost', '127.0.0.1'].includes(window.location.hostname);
}

function isKnownMissingImage(url) {
  return /(^|\/)placeholder\.jpe?g($|\?)/i.test(String(url || ''));
}
