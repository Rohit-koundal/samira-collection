import logo from '../../assets/samira-collection-logo.svg';
import Icon from './Icon';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

const links = [
  ['Home', '/'],
  ['New Arrivals', '/products?newArrival=true'],
  ['Sarees', '/products?search=Saree'],
  ['Suits', '/products?search=Suit'],
  ['Kurtis', '/products?search=Kurti'],
  ['Dresses', '/products?search=Dress'],
  ['Sale', '/products?discount=20'],
  ['Contact', '/contact'],
];

export default function DesktopHeader({ navigate, route = '/' }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const { user, switchMode } = useAuth();
  const searchValue = new URLSearchParams(route.split('?')[1] || '').get('search') || '';

  const updateSearch = (value) => {
    const params = new URLSearchParams(route.split('?')[1] || '');
    if (value) params.set('search', value);
    else params.delete('search');
    navigate(`/search${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <header className="sticky top-0 z-50 hidden bg-white/95 shadow-sm backdrop-blur md:block">
      <div className="bg-wine px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.24em] text-white">
        Free Shipping on Orders Above Rs. 999 | New Festive Collection Live Now
      </div>
      <div className="container-page flex h-20 items-center gap-6">
        <button onClick={() => navigate('/')} className="shrink-0" aria-label="Samira Collection home">
          <img src={logo} alt="Samira Collection" className="h-14 w-auto" />
        </button>
        <nav className="hidden flex-1 items-center justify-center gap-5 text-sm font-bold text-charcoal lg:flex">
          {links.map(([label, path]) => (
            <button key={label} onClick={() => navigate(path)} className="transition hover:text-wine">
              {label}
            </button>
          ))}
        </nav>
        <label className="flex h-11 min-w-[280px] items-center gap-3 rounded-full bg-[#f5f1eb] px-4 text-sm font-semibold text-slate-500">
          <Icon name="search" className="h-4 w-4" />
          <input
            value={searchValue}
            onFocus={() => {
              if (!route.startsWith('/search')) navigate('/search');
            }}
            onChange={(event) => updateSearch(event.target.value)}
            className="min-w-0 flex-1 bg-transparent font-semibold text-charcoal outline-none placeholder:text-slate-500"
            placeholder="Search sarees, suits, kurtis..."
            inputMode="search"
            enterKeyHint="search"
          />
        </label>
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && user?.availableModes?.includes('admin') && user?.activeMode !== 'admin' && (
            <button onClick={() => switchMode('admin')} className="h-11 rounded-full bg-wine px-4 text-xs font-black uppercase text-white">
              Admin Mode
            </button>
          )}
          <button onClick={() => navigate('/profile')} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200"><Icon name="user" /></button>
          <button onClick={() => navigate('/wishlist')} className="relative grid h-11 w-11 place-items-center rounded-full border border-slate-200">
            <Icon name="heart" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-rose text-[10px] font-black text-white">{wishlist.items.length}</span>
          </button>
          <button onClick={() => navigate('/cart')} className="relative grid h-11 w-11 place-items-center rounded-full bg-charcoal text-white">
            <Icon name="bag" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-rose text-[10px] font-black text-white">{cart.items.length}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
