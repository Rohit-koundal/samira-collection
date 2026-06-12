import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('samira_wishlist') || '[]'));

  useEffect(() => {
    localStorage.setItem('samira_wishlist', JSON.stringify(items));
  }, [items]);

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
