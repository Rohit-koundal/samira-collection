import { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { normalizeProduct } from '../services/normalize';
import { useAuth } from './AuthContext';
import { createStoragePlan, readScopedJson } from '../utils/userStorage';
import { findProductVariant, hasManagedVariants, variantStock } from '../utils/variants';
import { trackEvent } from '../utils/analytics';

export const CartContext = createContext(null);
const GUEST_STORAGE = createStoragePlan('samira_cart', null);

export function CartProvider({ children, storageName: storageNameProp, legacyStorageNames = [] }) {
  const { user } = useAuth();
  const requestIdRef = useRef(0);
  const [items, setItems] = useState([]);
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState('');

  const isAuthenticated = Boolean(user);
  const guestStorageName = storageNameProp && !isAuthenticated ? storageNameProp : GUEST_STORAGE.storageName;
  const guestLegacyStorageNames = !isAuthenticated && legacyStorageNames.length ? legacyStorageNames : GUEST_STORAGE.legacyStorageNames;

  useEffect(() => {
    let alive = true;
    const requestId = ++requestIdRef.current;

    async function hydrate() {
      setLoading(true);
      setHydrated(false);
      const guestCart = loadGuestCart(guestStorageName, guestLegacyStorageNames);
      const legacyCart = storageNameProp && storageNameProp !== guestStorageName
        ? loadGuestCart(storageNameProp, legacyStorageNames)
        : { items: [], coupon: null };
      const localItems = [...guestCart.items, ...legacyCart.items];

      try {
        let remoteCart = await api.get('/cart');
        let remoteItems = normalizeCartResponse(remoteCart);

        if (localItems.length) {
          remoteItems = await mergeGuestCartIntoRemote(localItems, remoteItems);
          clearGuestCart(guestStorageName, guestLegacyStorageNames);
          if (storageNameProp && storageNameProp !== guestStorageName) {
            clearGuestCart(storageNameProp, legacyStorageNames);
          }
        }

        if (!alive || requestId !== requestIdRef.current) return;
        setItems(remoteItems.length ? remoteItems : localItems);
        setCoupon(remoteItems.length ? null : (guestCart.coupon || legacyCart.coupon || null));
      } catch {
        if (!alive || requestId !== requestIdRef.current) return;
        setItems(localItems);
        setCoupon(guestCart.coupon || legacyCart.coupon || null);
      } finally {
        if (alive && requestId === requestIdRef.current) {
          setLoading(false);
          setHydrated(true);
        }
      }
    }

    hydrate();
    return () => {
      alive = false;
    };
  }, [guestLegacyStorageNames, guestStorageName, isAuthenticated, legacyStorageNames, storageNameProp, user?._id, user?.phone]);

  useEffect(() => {
    if (isAuthenticated) return;
    persistGuestCart(guestStorageName, guestLegacyStorageNames, { items, coupon });
  }, [coupon, guestLegacyStorageNames, guestStorageName, isAuthenticated, items]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (hydrated && !items.length && coupon) setCoupon(null);
  }, [coupon, hydrated, items.length]);

  const addToCart = (product, size = product.sizes?.[0] || 'M', color = product.colors?.[0] || 'Wine', variantId = product.variantId || product.selectedVariantId || '', quantity = 1) => {
    const normalizedProduct = normalizeCartProduct(product);
    const productId = getProductId(normalizedProduct);
    const addQuantity = Math.max(1, Number(quantity || 1));
    if (!productId) {
      setNotice('Could not add this product to cart.');
      return { ok: false, reason: 'invalid-product' };
    }

    const resolvedVariantId = variantId || findProductVariant(normalizedProduct, { size, color })?._id || '';
    const cartKey = getCartKey(productId, size, color, resolvedVariantId);
    const stock = getAvailableStock(normalizedProduct, { size, color, variantId: resolvedVariantId });
    if (stock === 0) {
      setNotice('This product is out of stock.');
      return { ok: false, reason: 'out-of-stock' };
    }

    const existing = items.find((item) => getItemKey(item) === cartKey);
    const nextQuantity = Number(existing?.quantity || 0) + addQuantity;
    if (stock !== null && nextQuantity > stock) {
      setNotice(`Only ${stock} item${stock === 1 ? '' : 's'} available in stock.`);
      return { ok: false, reason: 'stock-limit', quantity: existing?.quantity || 0 };
    }

    const previousItems = items;
    const nextItems = existing
      ? items.map((item) => (getItemKey(item) === cartKey ? { ...item, quantity: nextQuantity, product: { ...item.product, ...normalizedProduct }, cartKey } : item))
      : [...items, { product: normalizedProduct, productId, size, color, variantId: resolvedVariantId, cartKey, quantity: addQuantity }];

    setItems(nextItems);
    trackEvent('ADD_TO_CART', { productId });

    void (async () => {
      try {
        const response = await api.post('/cart', buildCartPayload(normalizedProduct, addQuantity, size, color, resolvedVariantId));
        setItems(normalizeCartResponse(response));
      } catch (error) {
        if (isAuthenticated) {
          setItems(previousItems);
          setNotice(error?.message || 'Unable to update cart.');
        }
      }
    })();

    return { ok: true, quantity: nextQuantity || addQuantity };
  };

  const updateQuantity = (productOrKey, quantity, options = {}) => {
    const key = resolveKey(productOrKey, options);
    let nextQuantity = Number(quantity || 0);
    const target = findCartItem(items, productOrKey, options);
    if (!target) return;

    const itemId = getBackendCartItemId(target);
    const previousItems = items;
    const nextItems = nextQuantity <= 0
      ? items.filter((item) => !matchesItem(item, key, options))
      : items.map((item) => {
        if (!matchesItem(item, key, options)) return item;
        const stock = getAvailableStock(item.product, { size: item.size, color: item.color, variantId: item.variantId });
        if (stock !== null && nextQuantity > stock) {
          setNotice(`Only ${stock} item${stock === 1 ? '' : 's'} available in stock.`);
          nextQuantity = stock;
          return { ...item, quantity: stock };
        }
        return { ...item, quantity: nextQuantity };
      });

    setItems(nextItems);

    void (async () => {
      try {
        let response;
        if (nextQuantity <= 0) {
          if (!itemId) return;
          response = await api.delete(`/cart/${itemId}`);
        } else {
          if (!itemId) return;
          response = await api.put(`/cart/${itemId}`, { quantity: nextQuantity });
        }
        setItems(normalizeCartResponse(response));
      } catch (error) {
        setItems(previousItems);
        if (isAuthenticated) setNotice(error?.message || 'Unable to update cart.');
      }
    })();
  };

  const increaseQuantity = (productOrKey, options = {}) => {
    const item = findCartItem(items, productOrKey, options);
    if (item) updateQuantity(getItemKey(item), Number(item.quantity || 0) + 1, { cartKey: getItemKey(item) });
  };

  const decreaseQuantity = (productOrKey, options = {}) => {
    const item = findCartItem(items, productOrKey, options);
    if (item) updateQuantity(getItemKey(item), Number(item.quantity || 0) - 1, { cartKey: getItemKey(item) });
  };

  const removeFromCart = (productOrKey, options = {}) => {
    const key = resolveKey(productOrKey, options);
    const target = findCartItem(items, productOrKey, options);
    if (!target) return;
    trackEvent('REMOVE_FROM_CART', { productId: getProductId(target.product) });

    const itemId = getBackendCartItemId(target);
    const previousItems = items;
    setItems((current) => current.filter((item) => !matchesItem(item, key, options)));

    if (!itemId) {
      setNotice('Item removed from checkout.');
      return;
    }

    void (async () => {
      try {
        const response = await api.delete(`/cart/${itemId}`);
        setItems(normalizeCartResponse(response));
      } catch (error) {
        setItems(previousItems);
        setNotice(error?.message || 'Unable to update cart.');
      }
    })();
  };

  const updateItemOptions = (productOrKey, options = {}) => {
    const currentItem = findCartItem(items, productOrKey, options);
    if (!currentItem) return;

    const key = resolveKey(productOrKey, { cartKey: options.cartKey });
    const nextSize = options.size ?? currentItem.size;
    const nextColor = options.color ?? currentItem.color;
    const nextVariantId = options.variantId ?? currentItem.variantId ?? '';
    const nextProductId = currentItem.productId || getProductId(currentItem.product);
    const nextKey = getCartKey(nextProductId, nextSize, nextColor, nextVariantId);
    const existing = items.find((entry) => getItemKey(entry) === nextKey && getItemKey(entry) !== key);
    const mergedQuantity = Number(existing?.quantity || 0) + Number(currentItem.quantity || 0);

    if (!isAuthenticated) {
      setItems((current) => {
        const item = current.find((entry) => getItemKey(entry) === key);
        if (!item) return current;

        const duplicate = current.find((entry) => getItemKey(entry) === nextKey && getItemKey(entry) !== key);
        if (duplicate) {
          const stock = getAvailableStock(duplicate.product);
          if (stock !== null && mergedQuantity > stock) {
            setNotice(`Only ${stock} item${stock === 1 ? '' : 's'} available in stock.`);
            return current;
          }
          return current
            .filter((entry) => getItemKey(entry) !== key)
            .map((entry) => (getItemKey(entry) === nextKey ? { ...entry, quantity: mergedQuantity } : entry));
        }

        return current.map((entry) => (getItemKey(entry) === key ? { ...entry, size: nextSize, color: nextColor, variantId: nextVariantId, cartKey: nextKey } : entry));
      });
      return;
    }

    const previousItems = items;
    const nextItems = existing
      ? items
        .filter((entry) => getItemKey(entry) !== key)
        .map((entry) => (getItemKey(entry) === nextKey ? { ...entry, quantity: mergedQuantity } : entry))
      : items.map((entry) => (getItemKey(entry) === key ? { ...entry, size: nextSize, color: nextColor, variantId: nextVariantId, cartKey: nextKey } : entry));

    setItems(nextItems);

    void (async () => {
      try {
        if (existing) {
          await api.delete(`/cart/${getBackendCartItemId(currentItem)}`);
          const response = await api.post('/cart', buildCartPayload(currentItem.product, mergedQuantity, nextSize, nextColor, nextVariantId));
          setItems(normalizeCartResponse(response));
          return;
        }

        await api.delete(`/cart/${getBackendCartItemId(currentItem)}`);
        const response = await api.post('/cart', buildCartPayload(currentItem.product, Number(currentItem.quantity || 1), nextSize, nextColor, nextVariantId));
        setItems(normalizeCartResponse(response));
      } catch (error) {
        setItems(previousItems);
        setNotice(error?.message || 'Unable to update cart.');
      }
    })();
  };

  const getCartItem = (productOrKey, options = {}) => findCartItem(items, productOrKey, options);

  const clearCart = () => {
    const previousItems = items;
    const previousCoupon = coupon;
    setItems([]);
    setCoupon(null);

    void (async () => {
      try {
        await api.delete('/cart');
        clearGuestCart(guestStorageName, guestLegacyStorageNames);
        if (storageNameProp && storageNameProp !== guestStorageName) {
          clearGuestCart(storageNameProp, legacyStorageNames);
        }
      } catch (error) {
        if (isAuthenticated) {
          setItems(previousItems);
          setCoupon(previousCoupon);
          setNotice(error?.message || 'Unable to update cart.');
        } else {
          clearGuestCart(guestStorageName, guestLegacyStorageNames);
        }
      }
    })();
  };

  const totalMRP = items.reduce((sum, item) => sum + Number(item.product.originalPrice || item.product.price || 0) * item.quantity, 0);
  const sellingTotal = items.reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0);
  const discount = Math.max(0, totalMRP - sellingTotal);
  const couponDiscount = coupon?.discount || 0;
  const deliveryCharge = items.length && sellingTotal <= 999 ? 99 : 0;
  const finalAmount = Math.max(0, sellingTotal - couponDiscount + deliveryCharge);
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const value = {
    items,
    itemCount,
    loading,
    hydrated,
    addToCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    updateItemOptions,
    getCartItem,
    clearCart,
    coupon,
    setCoupon,
    totalMRP,
    sellingTotal,
    discount,
    couponDiscount,
    deliveryCharge,
    finalAmount,
    isSynced: isAuthenticated,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {notice && (
        <button type="button" onClick={() => setNotice('')} className="fixed bottom-24 left-1/2 z-[90] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 rounded-xl bg-charcoal px-4 py-3 text-sm font-bold text-white shadow-2xl md:bottom-6">
          {notice}
        </button>
      )}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

function normalizeCartResponse(response) {
  const sourceItems = Array.isArray(response)
    ? response
    : Array.isArray(response?.items)
      ? response.items
      : Array.isArray(response?.data?.items)
        ? response.data.items
        : [];

  return sourceItems
    .filter((item) => item?.product || item?.productId)
    .map((item) => {
      const product = normalizeCartProduct(item.product || item);
      const productId = item.productId || getProductId(product);
      const size = item.size || product.sizes?.[0] || 'M';
      const color = item.color || product.colors?.[0] || 'Wine';
      const variantId = item.variantId || product.variantId || product.selectedVariantId || '';
      return {
        ...item,
        product,
        productId,
        size,
        color,
        variantId,
        cartKey: item.cartKey || getCartKey(productId, size, color, variantId),
        quantity: Math.max(1, Number(item.quantity || 1)),
      };
    })
    .filter((item) => Boolean(item.productId));
}

function loadGuestCart(storageName, legacyStorageNames = []) {
  const parsed = readScopedJson(storageName, legacyStorageNames, {});
  return {
    items: normalizeStoredItems(parsed.items || []),
    coupon: parsed.coupon || null,
  };
}

function persistGuestCart(storageName, legacyStorageNames = [], cartState = {}) {
  try {
    localStorage.setItem(storageName, JSON.stringify(cartState));
  } catch {
    // Ignore storage failures.
  }
  legacyStorageNames.forEach((name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Ignore storage failures.
    }
  });
}

function clearGuestCart(storageName, legacyStorageNames = []) {
  try {
    localStorage.removeItem(storageName);
  } catch {
    // Ignore storage failures.
  }
  legacyStorageNames.forEach((name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Ignore storage failures.
    }
  });
}

function normalizeStoredItems(storedItems) {
  if (!Array.isArray(storedItems)) return [];
  return storedItems
    .filter((item) => item?.product)
    .map((item) => {
      const product = normalizeCartProduct(item.product);
      const productId = item.productId || getProductId(product);
      const size = item.size || product.sizes?.[0] || 'M';
      const color = item.color || product.colors?.[0] || 'Wine';
      const variantId = item.variantId || product.variantId || product.selectedVariantId || '';
      return {
        ...item,
        product,
        productId,
        size,
        color,
        variantId,
        cartKey: item.cartKey || getCartKey(productId, size, color, variantId),
        quantity: Math.max(1, Number(item.quantity || 1)),
      };
    });
}

function normalizeCartProduct(product = {}) {
  return normalizeProduct({
    ...product,
    images: Array.isArray(product.images) ? product.images : [],
    videos: Array.isArray(product.videos) ? product.videos : [],
  });
}

async function mergeGuestCartIntoRemote(guestItems, remoteItems = []) {
  // The backend automatically transfers the server-side guest cart when the
  // first authenticated cart request includes the same session id. Only send
  // locally cached lines that did not make it to that server cart; otherwise
  // every OTP login would add the guest quantity a second time.
  const remoteKeys = new Set(remoteItems.map(getItemKey));
  for (const guestItem of guestItems) {
    const productId = guestItem.productId || getProductId(guestItem.product);
    if (!productId) continue;

    const guestKey = getItemKey({ ...guestItem, productId });
    if (remoteKeys.has(guestKey)) continue;

    const payload = buildCartPayload(guestItem.product, Number(guestItem.quantity || 1), guestItem.size, guestItem.color, guestItem.variantId);
    try {
      await api.post('/cart', payload);
      remoteKeys.add(guestKey);
    } catch {
      // Ignore guest items that can no longer be merged.
    }
  }

  const refreshed = await api.get('/cart');
  return normalizeCartResponse(refreshed);
}

function buildCartPayload(product, quantity, size, color, variantId) {
  return {
    product: getProductId(product),
    quantity: Math.max(1, Number(quantity || 1)),
    size: size || '',
    color: color || '',
    variantId: variantId || '',
    price: Number(product?.price || 0),
  };
}

function getProductId(product = {}) {
  return product._id || product.id || product.slug || '';
}

function getAvailableStock(product = {}, selection = {}) {
  if (hasManagedVariants(product)) {
    return variantStock(product, selection);
  }
  if (product.stock === undefined || product.stock === null || product.stock === '') return null;
  const stock = Number(product.stock);
  return Number.isFinite(stock) ? Math.max(0, stock) : null;
}

function getCartKey(productId, size = '', color = '', variantId = '') {
  return [productId, size || '', color || '', variantId || ''].join('::');
}

function getItemKey(item) {
  return item.cartKey || getCartKey(item.productId || getProductId(item.product), item.size, item.color, item.variantId);
}

function getBackendCartItemId(item = {}) {
  return item._id || item.id || item.cartItemId || '';
}

function resolveKey(productOrKey, options = {}) {
  if (options.cartKey) return options.cartKey;
  if (typeof productOrKey === 'string') {
    if (options.size || options.color || options.variantId) return getCartKey(productOrKey, options.size, options.color, options.variantId);
    return productOrKey;
  }
  const productId = getProductId(productOrKey);
  return getCartKey(productId, options.size || productOrKey?.sizes?.[0] || 'M', options.color || productOrKey?.colors?.[0] || 'Wine', options.variantId || productOrKey?.variantId || productOrKey?.selectedVariantId || '');
}

function matchesItem(item, key, options = {}) {
  if (options.cartKey || String(key).includes('::')) return getItemKey(item) === key;
  return String(item.productId || getProductId(item.product)) === String(key);
}

function findCartItem(items, productOrKey, options = {}) {
  const key = resolveKey(productOrKey, options);
  return items.find((item) => matchesItem(item, key, options));
}
