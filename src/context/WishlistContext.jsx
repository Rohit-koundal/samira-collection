import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { normalizeProduct } from '../services/normalize';
import { useAuth } from './AuthContext';
import { createStoragePlan, readScopedJson } from '../utils/userStorage';

const WishlistContext = createContext(null);
const GUEST_STORAGE = createStoragePlan('samira_wishlist', null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const requestIdRef = useRef(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    let alive = true;
    const requestId = ++requestIdRef.current;

    async function hydrate() {
      if (!user) {
        const guestItems = loadGuestWishlist();
        if (!alive || requestId !== requestIdRef.current) return;
        setItems(guestItems);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const guestItems = loadGuestWishlist();
        let remoteItems = await api.get('/wishlist');
        remoteItems = Array.isArray(remoteItems) ? remoteItems.map(normalizeWishlistProduct).filter(Boolean) : [];

        if (guestItems.length) {
          const remoteIds = new Set(remoteItems.map(getWishlistItemId));
          for (const guestItem of guestItems) {
            const productId = getWishlistItemId(guestItem);
            if (!productId || remoteIds.has(productId)) continue;
            remoteItems = await api.post(`/wishlist/${productId}`);
            remoteItems = Array.isArray(remoteItems) ? remoteItems.map(normalizeWishlistProduct).filter(Boolean) : [];
          }
          clearGuestWishlist();
        }

        if (!alive || requestId !== requestIdRef.current) return;
        setItems(remoteItems);
      } catch {
        const fallback = loadGuestWishlist();
        if (!alive || requestId !== requestIdRef.current) return;
        setItems(fallback);
      } finally {
        if (alive && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }

    hydrate();
    return () => {
      alive = false;
    };
  }, [user?._id, user?.phone]);

  useEffect(() => {
    if (user) return;
    persistGuestWishlist(items);
  }, [items, user]);

  const updateWishlist = async (nextItems) => {
    if (user) {
      setItems(nextItems);
      return;
    }
    setItems(nextItems);
    persistGuestWishlist(nextItems);
  };

  const toggleWishlist = async (product) => {
    const normalizedProduct = normalizeWishlistProduct(product);
    if (!normalizedProduct) return;
    const productId = getWishlistItemId(normalizedProduct);
    if (!productId) return;

    if (!user) {
      const exists = items.some((item) => getWishlistItemId(item) === productId);
      const nextItems = exists
        ? items.filter((item) => getWishlistItemId(item) !== productId)
        : [...items, normalizedProduct];
      await updateWishlist(nextItems);
      return;
    }

    try {
      const exists = items.some((item) => getWishlistItemId(item) === productId);
      const response = exists ? await api.delete(`/wishlist/${productId}`) : await api.post(`/wishlist/${productId}`);
      const nextItems = Array.isArray(response) ? response.map(normalizeWishlistProduct).filter(Boolean) : [];
      await updateWishlist(nextItems);
    } catch {
      // Keep the UI stable if the backend request fails.
    }
  };

  const addToWishlist = async (product) => {
    const normalizedProduct = normalizeWishlistProduct(product);
    if (!normalizedProduct) return;
    const productId = getWishlistItemId(normalizedProduct);
    if (!productId) return;

    if (!user) {
      if (items.some((item) => getWishlistItemId(item) === productId)) return;
      await updateWishlist([...items, normalizedProduct]);
      return;
    }

    try {
      if (items.some((item) => getWishlistItemId(item) === productId)) return;
      const response = await api.post(`/wishlist/${productId}`);
      const nextItems = Array.isArray(response) ? response.map(normalizeWishlistProduct).filter(Boolean) : [];
      await updateWishlist(nextItems);
    } catch {
      // Keep the UI stable if the backend request fails.
    }
  };

  const removeFromWishlist = async (productOrId) => {
    const productId = typeof productOrId === 'string' ? productOrId : getWishlistItemId(productOrId);
    if (!productId) return;

    if (!user) {
      await updateWishlist(items.filter((item) => getWishlistItemId(item) !== productId));
      return;
    }

    try {
      const response = await api.delete(`/wishlist/${productId}`);
      const nextItems = Array.isArray(response) ? response.map(normalizeWishlistProduct).filter(Boolean) : [];
      await updateWishlist(nextItems);
    } catch {
      // Keep the UI stable if the backend request fails.
    }
  };

  const value = useMemo(() => ({
    items,
    loading,
    toggleWishlist,
    addToWishlist,
    removeFromWishlist,
    isSynced: Boolean(user),
  }), [addToWishlist, items, loading, removeFromWishlist, toggleWishlist, user]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);

function loadGuestWishlist() {
  const items = readScopedJson(GUEST_STORAGE.storageName, GUEST_STORAGE.legacyStorageNames, []);
  return Array.isArray(items) ? items.map(normalizeWishlistProduct).filter(Boolean) : [];
}

function persistGuestWishlist(items = []) {
  try {
    localStorage.setItem(GUEST_STORAGE.storageName, JSON.stringify(items));
  } catch {
    // Ignore storage failures.
  }
}

function clearGuestWishlist() {
  try {
    localStorage.removeItem(GUEST_STORAGE.storageName);
    GUEST_STORAGE.legacyStorageNames.forEach((name) => localStorage.removeItem(name));
  } catch {
    // Ignore storage failures.
  }
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

function getWishlistItemId(product = {}) {
  return product._id || product.id || product.slug || '';
}
