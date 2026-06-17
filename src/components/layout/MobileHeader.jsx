import { useState } from 'react';
import logo from '../../assets/samira-collection-logo.png';
import Icon from './Icon';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useGetCategoriesQuery } from '../../store/apiSlice';

export default function MobileHeader({ navigate, route = '/' }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const { user, switchMode } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: categories = [] } = useGetCategoriesQuery();
  const searchValue = new URLSearchParams(route.split('?')[1] || '').get('search') || '';

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const updateSearch = (value) => {
    const params = new URLSearchParams(route.split('?')[1] || '');
    if (value) params.set('search', value);
    else params.delete('search');
    navigate(`/search${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <>
      <header className="sticky top-0 z-50 overflow-hidden border-b border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="grid h-[52px] grid-cols-[40px_minmax(0,1fr)_76px] items-center gap-2 px-3 pt-1">
          <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center text-slate-600" aria-label="Open menu">
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <button onClick={() => navigate('/')} className="header-title min-w-0 px-1">
            <img src={logo} alt="Samira Collection" className="mx-auto h-9 w-auto max-w-full" />
          </button>
          <div className="flex shrink-0 justify-end gap-1">
            <button onClick={() => navigate('/wishlist')} className="relative grid h-10 w-10 place-items-center text-slate-700" aria-label="Open wishlist">
              <Icon name="heart" className="h-5 w-5" />
              {wishlist.items.length > 0 && (
                <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[9px] font-black leading-none text-white">
                  {wishlist.items.length}
                </span>
              )}
            </button>
            <button onClick={() => navigate('/cart')} className="relative grid h-10 w-10 place-items-center text-slate-700" aria-label="Open cart">
              <Icon name="bag" className="h-5 w-5" />
              {cart.itemCount > 0 && (
                <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-wine px-1 text-[9px] font-black leading-none text-white">
                  {cart.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="px-3 pb-2">
          <label className="label-text flex h-10 w-full max-w-full items-center gap-2 overflow-hidden rounded-full bg-[#f4f1ec] px-4 text-slate-500">
            <Icon name="search" className="h-4 w-4" />
            <input
              value={searchValue}
              onFocus={() => {
                if (!route.startsWith('/search')) navigate('/search');
              }}
              onChange={(event) => updateSearch(event.target.value)}
              className="body-text min-w-0 flex-1 bg-transparent text-charcoal outline-none placeholder:text-slate-500"
              placeholder="Search sarees, suits, kurtis..."
              inputMode="search"
              enterKeyHint="search"
            />
          </label>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-[75] md:hidden">
          <button type="button" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/45" aria-label="Close menu" />
          <aside className="absolute inset-y-0 left-0 w-80 max-w-[86vw] overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <img src={logo} alt="Samira Collection" className="h-14 w-auto" />
              <button onClick={() => setOpen(false)} className="rounded-full bg-slate-100 px-4 py-2">Close</button>
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
                <button key={label} onClick={() => go(path)} className="rounded-2xl bg-[#f8f2ec] px-4 py-3 text-left text-charcoal">
                  {label}
                </button>
              ))}
            </div>
            {user?.role === 'admin' && user?.availableModes?.includes('admin') && user?.activeMode !== 'admin' && (
              <button onClick={() => switchMode('admin')} className="mt-3 w-full rounded-2xl bg-wine px-4 py-3 text-left text-white">
                Switch to Admin
              </button>
            )}
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-wine">Categories</p>
            <div className="mt-3 grid gap-2">
              {categories.map((category) => (
                <button key={category._id || category.id} onClick={() => go(`/products?category=${category._id || ''}`)} className="label-text flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-left text-slate-700">
                  {category.name}
                  <span className="small-text text-slate-400">{category.count || ''}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
