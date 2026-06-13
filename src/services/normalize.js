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
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const configuredUrl = process.env.REACT_APP_API_URL;
  const isBrowser = typeof window !== 'undefined';
  const isLocalPage = isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const apiUrl = isLocalPage
    ? 'http://localhost:5000/api'
    : configuredUrl || 'https://samira-collection-backend-1.onrender.com/api';
  const apiRoot = apiUrl.replace(/\/api\/?$/, '');
  return `${apiRoot}${url.startsWith('/') ? url : `/${url}`}`;
}

export function isUsableImageUrl(url) {
  return Boolean(url && !isKnownMissingImage(url));
}

function isKnownMissingImage(url) {
  return /(^|\/)placeholder\.jpe?g($|\?)/i.test(String(url || ''));
}
