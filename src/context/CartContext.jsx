import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => normalizeStoredItems(JSON.parse(localStorage.getItem('samira_cart') || '[]')));
  const [coupon, setCoupon] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    localStorage.setItem('samira_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const addToCart = (product, size = product.sizes?.[0] || 'M', color = product.colors?.[0] || 'Wine', variantId = product.variantId || product.selectedVariantId || '') => {
    const productId = getProductId(product);
    const cartKey = getCartKey(productId, size, color, variantId);
    const stock = getAvailableStock(product);
    if (stock === 0) {
      setNotice('This product is out of stock.');
      return { ok: false, reason: 'out-of-stock' };
    }

    let result = { ok: true, quantity: 1 };
    setItems((current) => {
      const existing = current.find((item) => getItemKey(item) === cartKey);
      if (existing) {
        const nextQuantity = Number(existing.quantity || 0) + 1;
        if (stock !== null && nextQuantity > stock) {
          result = { ok: false, reason: 'stock-limit', quantity: existing.quantity };
          setNotice(`Only ${stock} item${stock === 1 ? '' : 's'} available in stock.`);
          return current;
        }
        result = { ok: true, quantity: nextQuantity };
        return current.map((item) => (getItemKey(item) === cartKey ? { ...item, quantity: nextQuantity, product: { ...item.product, ...product }, cartKey } : item));
      }
      result = { ok: true, quantity: 1 };
      return [...current, { product, productId, size, color, variantId, cartKey, quantity: 1 }];
    });
    return result;
  };

  const updateQuantity = (productOrKey, quantity, options = {}) => {
    const key = resolveKey(productOrKey, options);
    const nextQuantity = Number(quantity || 0);
    setItems((current) => current.flatMap((item) => {
      if (!matchesItem(item, key, options)) return [item];
      if (nextQuantity <= 0) return [];
      const stock = getAvailableStock(item.product);
      if (stock !== null && nextQuantity > stock) {
        setNotice(`Only ${stock} item${stock === 1 ? '' : 's'} available in stock.`);
        return [{ ...item, quantity: stock }];
      }
      return [{ ...item, quantity: nextQuantity }];
    }));
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
    setItems((current) => current.filter((item) => !matchesItem(item, key, options)));
  };

  const updateItemOptions = (productOrKey, options = {}) => {
    const key = resolveKey(productOrKey, { cartKey: options.cartKey });
    setItems((current) => {
      const item = current.find((entry) => getItemKey(entry) === key);
      if (!item) return current;

      const nextSize = options.size ?? item.size;
      const nextColor = options.color ?? item.color;
      const nextVariantId = options.variantId ?? item.variantId ?? '';
      const nextKey = getCartKey(item.productId || getProductId(item.product), nextSize, nextColor, nextVariantId);
      const existing = current.find((entry) => getItemKey(entry) === nextKey && getItemKey(entry) !== key);

      if (existing) {
        const stock = getAvailableStock(existing.product);
        const mergedQuantity = Number(existing.quantity || 0) + Number(item.quantity || 0);
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
  };

  const getCartItem = (productOrKey, options = {}) => findCartItem(items, productOrKey, options);

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
  };

  const totalMRP = items.reduce((sum, item) => sum + Number(item.product.originalPrice || item.product.price || 0) * item.quantity, 0);
  const sellingTotal = items.reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0);
  const discount = Math.max(0, totalMRP - sellingTotal);
  const couponDiscount = coupon?.discount || 0;
  const deliveryCharge = sellingTotal > 999 ? 0 : 99;
  const finalAmount = Math.max(0, sellingTotal - couponDiscount + deliveryCharge);
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const value = {
    items,
    itemCount,
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

function normalizeStoredItems(storedItems) {
  if (!Array.isArray(storedItems)) return [];
  return storedItems
    .filter((item) => item?.product)
    .map((item) => {
      const productId = item.productId || getProductId(item.product);
      const size = item.size || item.product.sizes?.[0] || 'M';
      const color = item.color || item.product.colors?.[0] || 'Wine';
      const variantId = item.variantId || item.product.variantId || item.product.selectedVariantId || '';
      return {
        ...item,
        productId,
        size,
        color,
        variantId,
        cartKey: item.cartKey || getCartKey(productId, size, color, variantId),
        quantity: Math.max(1, Number(item.quantity || 1)),
      };
    });
}

function getProductId(product = {}) {
  return product._id || product.id || product.slug;
}

function getAvailableStock(product = {}) {
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
