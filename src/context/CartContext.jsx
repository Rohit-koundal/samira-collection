import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('samira_cart') || '[]'));
  const [coupon, setCoupon] = useState(null);

  useEffect(() => {
    localStorage.setItem('samira_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, size = product.sizes?.[0] || 'M', color = product.colors?.[0] || 'Wine') => {
    setItems((current) => {
      const productId = product._id || product.id || product.slug;
      const existing = current.find((item) => (item.product._id || item.product.id || item.product.slug) === productId && item.size === size && item.color === color);
      if (existing) return current.map((item) => (item === existing ? { ...item, quantity: item.quantity + 1 } : item));
      return [...current, { product, size, color, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    setItems((current) => current.map((item) => ((item.product._id || item.product.id || item.product.slug) === productId ? { ...item, quantity: Math.max(1, quantity) } : item)));
  };

  const removeFromCart = (productId) => setItems((current) => current.filter((item) => (item.product._id || item.product.id || item.product.slug) !== productId));
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

  const value = useMemo(
    () => ({ items, addToCart, updateQuantity, removeFromCart, clearCart, coupon, setCoupon, totalMRP, sellingTotal, discount, couponDiscount, deliveryCharge, finalAmount }),
    [coupon, couponDiscount, deliveryCharge, discount, finalAmount, items, sellingTotal, totalMRP]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
