export const RESERVED_PATHS = new Set([
  'products', 'product', 'category', 'search', 'wishlist', 'cart', 'checkout',
  'login', 'register', 'profile', 'orders', 'order-detail', 'order-success',
  'payment-failed', 'contact', 'privacy-policy', 'terms', 'return-policy',
  'shipping-policy', 'cancellation-policy', 'size-guide', 'faqs', 'our-story',
  'returns', 'notifications', 'seller', 'admin', 'store', 'share', 'api', 'health', 'uploads',
  'robots.txt', 'sitemap.xml',
]);

export const ROUTE_CHANGE_EVENT = 'samira:routechange';

export function notifyRouteChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
}

export function consumeLegacyHash() {
  if (typeof window === 'undefined') return;
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return;
  const next = hash.startsWith('/') ? hash : `/${hash}`;
  window.history.replaceState(null, '', next);
  notifyRouteChange();
}

function normalizePathname(pathname = '/') {
  const cleaned = String(pathname || '/').replace(/\/{2,}/g, '/');
  return cleaned || '/';
}

export function readAppRoute() {
  consumeLegacyHash();
  const path = normalizePathname(window.location.pathname);
  const search = window.location.search || '';
  return `${path}${search}` || '/';
}

export function pushAppRoute(path) {
  const [rawPath, rawSearch = ''] = String(path || '/').split('?');
  const pathname = normalizePathname(rawPath.startsWith('/') ? rawPath : `/${rawPath}`);
  const next = rawSearch ? `${pathname}?${rawSearch}` : pathname;
  const current = `${normalizePathname(window.location.pathname)}${window.location.search}` || '/';
  if (current === next) return;
  window.history.pushState(null, '', next);
  notifyRouteChange();
}

export function boutiquePath(routePath = '/') {
  const path = String(routePath).split('?')[0] || '/';
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return '/';
  if (RESERVED_PATHS.has(parts[0])) return path;
  return `/store/${parts.join('/')}`;
}

export function parseProductKey(route = '') {
  const [path, queryString] = String(route).split('?');
  const queryId = new URLSearchParams(queryString || '').get('id');
  if (queryId) return queryId;
  const parts = boutiquePath(path).split('/').filter(Boolean);
  if (parts[0] === 'product' && parts[1]) return decodeURIComponent(parts[1]);
  if (parts[0] === 'store' && parts[2] === 'products' && parts[3]) return decodeURIComponent(parts[3]);
  if (parts[0] === 'store' && parts[2] === 'product' && parts[3]) return decodeURIComponent(parts[3]);
  return '';
}

export function productHref(product, storeSlug = '') {
  const key = product?.slug || product?._id || product?.id || '';
  if (!key) return '/products';
  if (storeSlug) return `/store/${storeSlug}/products/${encodeURIComponent(key)}`;
  return `/product/${encodeURIComponent(key)}`;
}

export function currentPath() {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}` || '/';
}
