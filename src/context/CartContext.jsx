import { createContext, useContext, useMemo, useState } from 'react';
import products from '../data/seedProducts';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => [{ product: products[0], size: 'Free Size', color: 'Wine', quantity: 1 }]);
  const [coupon, setCoupon] = useState(null);

  const addToCart = (product, size = product.sizes?.[0] || 'M', color = product.colors?.[0] || 'Wine') => {
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id && item.size === size && item.color === color);
      if (existing) {
        return current.map((item) => (item === existing ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { product, size, color, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    setItems((current) => current.map((item) => (item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item)));
  };

  const removeFromCart = (productId) => setItems((current) => current.filter((item) => item.product.id !== productId));
  const totalMRP = items.reduce((sum, item) => sum + item.product.originalPrice * item.quantity, 0);
  const sellingTotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = totalMRP - sellingTotal;
  const couponDiscount = coupon ? Math.min(500, Math.round(sellingTotal * 0.1)) : 0;
  const deliveryCharge = sellingTotal > 999 ? 0 : 99;
  const finalAmount = sellingTotal - couponDiscount + deliveryCharge;

  const value = useMemo(
    () => ({ items, addToCart, updateQuantity, removeFromCart, coupon, setCoupon, totalMRP, discount, couponDiscount, deliveryCharge, finalAmount }),
    [coupon, couponDiscount, deliveryCharge, discount, finalAmount, items, totalMRP]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
