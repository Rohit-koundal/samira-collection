import logo from '../../assets/samira-collection-logo.png';
import Icon from './Icon';
import { Button, TextInput } from '../ui';
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
      <div className="small-text bg-wine px-4 py-2 text-center font-bold uppercase tracking-[0.24em] text-white">
        Free Shipping on Orders Above Rs. 999 | New Festive Collection Live Now
      </div>
      <div className="container-page flex h-[72px] items-center gap-4 lg:h-20 lg:gap-5">
        <button onClick={() => navigate('/')} className="shrink-0" aria-label="Samira Collection home">
          <img src={logo} alt="Samira Collection" className="h-14 w-auto" />
        </button>
        <nav className="hidden flex-1 items-center justify-center gap-4 label-text text-charcoal lg:flex xl:gap-5">
          {links.map(([label, path]) => (
            <button key={label} onClick={() => navigate(path)} className="transition hover:text-wine">
              {label}
            </button>
          ))}
        </nav>
        <label className="flex min-w-[220px] max-w-[320px] flex-1 items-center gap-3 rounded-full bg-[#f5f1eb] px-4 text-slate-500">
          <Icon name="search" className="h-4 w-4" />
          <TextInput
            value={searchValue}
            onFocus={() => {
              if (!route.startsWith('/search')) navigate('/search');
            }}
            onChange={(event) => updateSearch(event.target.value)}
            className="h-11 min-w-0 flex-1 border-0 bg-transparent px-0 text-charcoal shadow-none ring-0 placeholder:text-slate-500 focus:border-0 focus:ring-0"
            placeholder="Search sarees, suits, kurtis..."
            inputMode="search"
            enterKeyHint="search"
          />
        </label>
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && user?.availableModes?.includes('admin') && user?.activeMode !== 'admin' && (
            <Button onClick={() => switchMode('admin')} className="h-11 rounded-full px-4 text-xs uppercase">
              Admin Mode
            </Button>
          )}
          <Button onClick={() => navigate('/profile')} variant="outline" size="icon" className="rounded-full"><Icon name="user" /></Button>
          <Button onClick={() => navigate('/wishlist')} variant="outline" size="icon" className="relative rounded-full">
            <Icon name="heart" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-rose text-[10px] font-black text-white">{wishlist.items.length}</span>
          </Button>
          <Button onClick={() => navigate('/cart')} variant="secondary" size="icon" className="relative rounded-full bg-charcoal text-white hover:bg-charcoal/90">
            <Icon name="bag" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-rose text-[10px] font-black text-white">{cart.itemCount}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
