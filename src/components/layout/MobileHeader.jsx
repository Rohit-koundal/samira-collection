import { useState } from 'react';
import logo from '../../assets/samira-collection-logo.svg';
import Icon from './Icon';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import categories from '../../data/categories';

export default function MobileHeader({ navigate }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const [open, setOpen] = useState(false);

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white md:hidden">
        <div className="flex h-14 items-center justify-between px-3">
          <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center text-slate-600" aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <button onClick={() => navigate('/')} className="flex-1">
            <img src={logo} alt="Samira Collection" className="mx-auto h-11 w-auto" />
          </button>
          <div className="flex gap-1">
            <button onClick={() => navigate('/wishlist')} className="relative grid h-10 w-10 place-items-center text-slate-700">
              <Icon name="heart" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose" aria-label={`${wishlist.items.length} wishlist items`} />
            </button>
            <button onClick={() => navigate('/cart')} className="relative grid h-10 w-10 place-items-center text-slate-700">
              <Icon name="bag" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-wine" aria-label={`${cart.items.length} cart items`} />
            </button>
          </div>
        </div>
        <div className="px-3 pb-3">
          <button onClick={() => navigate('/search')} className="flex h-11 w-full items-center gap-2 rounded-full bg-[#f4f1ec] px-4 text-sm font-semibold text-slate-500">
            <Icon name="search" className="h-4 w-4" />
            Search sarees, suits, kurtis...
          </button>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-[75] md:hidden">
          <button type="button" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/45" aria-label="Close menu" />
          <aside className="absolute inset-y-0 left-0 w-80 max-w-[86vw] overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <img src={logo} alt="Samira Collection" className="h-14 w-auto" />
              <button onClick={() => setOpen(false)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black">Close</button>
            </div>
            <div className="mt-6 grid gap-2">
              {[
                ['Home', '/'],
                ['Products', '/products'],
                ['Wishlist', '/wishlist'],
                ['Cart', '/cart'],
                ['Profile', '/profile'],
                ['Contact', '/contact'],
              ].map(([label, path]) => (
                <button key={label} onClick={() => go(path)} className="rounded-2xl bg-[#f8f2ec] px-4 py-3 text-left text-sm font-black text-charcoal">
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-wine">Categories</p>
            <div className="mt-3 grid gap-2">
              {categories.map((category) => (
                <button key={category.id} onClick={() => go('/category')} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-left text-sm font-bold text-slate-700">
                  {category.name}
                  <span className="text-xs text-slate-400">{category.count}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
