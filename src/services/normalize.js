export function normalizeProduct(product) {
  const images = (product.images || []).map((image) => ({ ...image, url: normalizeImageUrl(image.url) }));
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
  if (!url || url.startsWith('http') || url.startsWith('data:')) return url;
  const apiRoot = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  return `${apiRoot}${url.startsWith('/') ? url : `/${url}`}`;
}
