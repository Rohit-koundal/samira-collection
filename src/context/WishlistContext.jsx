import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('samira_wishlist') || '[]'));

  useEffect(() => {
    localStorage.setItem('samira_wishlist', JSON.stringify(items));
  }, [items]);

  const toggleWishlist = (product) => {
    const productId = product._id || product.id;
    setItems((current) => (current.some((item) => (item._id || item.id) === productId) ? current.filter((item) => (item._id || item.id) !== productId) : [...current, product]));
  };

  const value = useMemo(() => ({ items, toggleWishlist }), [items]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
