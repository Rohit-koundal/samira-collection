import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
    const productId = product._id || product.id || product.slug;
    setItems((current) => (current.some((item) => (item._id || item.id || item.slug) === productId) ? current.filter((item) => (item._id || item.id || item.slug) !== productId) : [...current, product]));
  };
  const addToWishlist = (product) => {
    const productId = product._id || product.id || product.slug;
    setItems((current) => (current.some((item) => (item._id || item.id || item.slug) === productId) ? current : [...current, product]));
  };

  const value = useMemo(() => ({ items, toggleWishlist, addToWishlist }), [items]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);

function loadWishlist(storageName, legacyStorageNames = []) {
  return readScopedJson(storageName, legacyStorageNames, []);
}
