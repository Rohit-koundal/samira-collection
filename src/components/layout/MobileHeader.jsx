import { useState } from 'react';
import logo from '../../assets/samira-collection-logo.png';
import Icon from './Icon';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { X } from 'lucide-react';

export default function MobileHeader({ navigate, route = '/' }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const { user, switchMode } = useAuth();
  const [open, setOpen] = useState(false);
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
        <div className="grid h-[58px] grid-cols-[44px_minmax(0,1fr)_84px] items-center gap-2 px-3 pt-1">
          <button onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center text-slate-600" aria-label="Open menu">
            <Icon name="menu" className="h-5.5 w-5.5" />
          </button>
          <button onClick={() => navigate('/')} className="header-title min-w-0 px-1">
            <img src={logo} alt="Samira Collection" className="mx-auto h-10 w-auto max-w-full" />
          </button>
          <div className="flex shrink-0 justify-end gap-1">
            <button onClick={() => navigate('/wishlist')} className="relative grid h-11 w-11 place-items-center text-slate-700" aria-label="Open wishlist">
              <Icon name="heart" className="h-5.5 w-5.5" />
              {wishlist.items.length > 0 && (
                <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[9px] font-black leading-none text-white">
                  {wishlist.items.length}
                </span>
              )}
            </button>
            <button onClick={() => navigate('/cart')} className="relative grid h-11 w-11 place-items-center text-slate-700" aria-label="Open cart">
              <Icon name="bag" className="h-5.5 w-5.5" />
              {cart.itemCount > 0 && (
                <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-wine px-1 text-[9px] font-black leading-none text-white">
                  {cart.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="px-3 pb-3">
          <label className="label-text flex h-12 w-full max-w-full items-center gap-3 overflow-hidden rounded-full bg-[#f4f1ec] px-4 text-slate-500">
            <Icon name="search" className="h-4.5 w-4.5" />
            <input
              value={searchValue}
              onFocus={() => {
                if (!route.startsWith('/search')) navigate('/search');
              }}
              onChange={(event) => updateSearch(event.target.value)}
              className="body-text min-w-0 flex-1 bg-transparent text-[14px] text-charcoal outline-none placeholder:text-slate-500"
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
          <aside className="absolute inset-y-0 left-0 w-80 max-w-[86vw] overflow-y-auto bg-white shadow-2xl">
            <div className="bg-[#3e3648] px-4 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10">
                    <Icon name="user" className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold leading-[1.1]">{user?.name || 'Guest'}</p>
                    <p className="mt-1 text-[11px] text-white/70">{user?.phone || user?.email || 'Sign in for a better experience'}</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full text-white/90" aria-label="Close menu">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="border-b border-slate-100 px-4 py-4">
              <button onClick={() => go('/profile')} className="flex w-full items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-left">
                <span className="text-[14px] font-bold text-charcoal">Account</span>
                <span className="text-slate-400">›</span>
              </button>
            </div>

            <div className="px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Shop for Women</p>
              <div className="mt-3 grid gap-2">
                {[
                  ['Sarees', '/products?search=Saree'],
                  ['Suits', '/products?search=Suit'],
                  ['Kurtis', '/products?search=Kurti'],
                  ['Dresses', '/products?search=Dress'],
                  ['Lehengas', '/products?search=Lehenga'],
                  ['Sale', '/products?discount=20'],
                ].map(([label, path]) => (
                  <button key={label} onClick={() => go(path)} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-left">
                    <span className="text-[14px] font-semibold text-charcoal">{label}</span>
                    <span className="text-slate-300">›</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Quick Links</p>
              <div className="mt-3 grid gap-2">
                {[
                  ['Orders', '/orders'],
                  ['Wishlist', '/wishlist'],
                  ['Addresses', '/profile/addresses'],
                  ['Coupons', '/profile'],
                  ['Gift Cards', '/contact'],
                ].map(([label, path]) => (
                  <button key={label} onClick={() => go(path)} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-left">
                    <span className="text-[14px] text-slate-700">{label}</span>
                    <span className="text-slate-300">›</span>
                  </button>
                ))}
              </div>
            </div>

            {user?.role === 'admin' && user?.availableModes?.includes('admin') && user?.activeMode !== 'admin' && (
              <div className="border-t border-slate-100 px-4 py-4">
                <button
                  onClick={() => switchMode('admin')}
                  className="w-full rounded-2xl bg-wine px-4 py-3 text-left text-[14px] font-semibold text-white"
                >
                  Switch to Admin
                </button>
              </div>
            )}

            <div className="mt-0 grid gap-2 px-4 pb-5">
              {[
                ['Home', '/'],
                ['Products', '/products'],
                ['Cart', '/cart'],
                ['Contact', '/contact'],
              ].map(([label, path]) => (
                <button key={label} onClick={() => go(path)} className="rounded-2xl bg-[#f8f2ec] px-4 py-3 text-left text-[14px] text-charcoal">
                  {label}
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
