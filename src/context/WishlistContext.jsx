import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { normalizeProduct } from '../services/normalize';
import { createStoragePlan, readScopedJson } from '../utils/userStorage';

const WishlistContext = createContext(null);

export function WishlistProvider({ children, storageName: storageNameProp, legacyStorageNames = [] }) {
  const defaultPlan = createStoragePlan('samira_wishlist', null);
  const storageName = storageNameProp || defaultPlan.storageName;
  const legacyNames = legacyStorageNames.length ? legacyStorageNames : defaultPlan.legacyStorageNames;
  const [items, setItems] = useState(() => loadWishlist(storageName, legacyNames));

  useEffect(() => {
    localStorage.setItem(storageName, JSON.stringify(items));
  }, [items, storageName]);

  const toggleWishlist = (product) => {
    const normalizedProduct = normalizeWishlistProduct(product);
    const productId = product._id || product.id || product.slug;
    setItems((current) => (
      current.some((item) => (item._id || item.id || item.slug) === productId)
        ? current.filter((item) => (item._id || item.id || item.slug) !== productId)
        : [...current, normalizedProduct]
    ));
  };
  const addToWishlist = (product) => {
    const normalizedProduct = normalizeWishlistProduct(product);
    const productId = product._id || product.id || product.slug;
    setItems((current) => (current.some((item) => (item._id || item.id || item.slug) === productId) ? current : [...current, normalizedProduct]));
  };

  const value = useMemo(() => ({ items, toggleWishlist, addToWishlist }), [items]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);

function loadWishlist(storageName, legacyStorageNames = []) {
  const items = readScopedJson(storageName, legacyStorageNames, []);
  return Array.isArray(items) ? items.map(normalizeWishlistProduct).filter(Boolean) : [];
}

function normalizeWishlistProduct(product) {
  if (!product || typeof product !== 'object') return null;
  return normalizeProduct({
    ...product,
    images: Array.isArray(product.images) && product.images.length
      ? product.images
      : [product.primaryImageUrl || product.primaryImage || product.image].filter(Boolean),
  });
}
