import { createContext, useContext, useMemo, useState } from 'react';
import products from '../data/seedProducts';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => products.slice(1, 4));
  const toggleWishlist = (product) => {
    setItems((current) => (current.some((item) => item.id === product.id) ? current.filter((item) => item.id !== product.id) : [...current, product]));
  };

  const value = useMemo(() => ({ items, toggleWishlist }), [items]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
