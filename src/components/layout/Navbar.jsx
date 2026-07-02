import { useMemo } from 'react';
import { ChevronDown, Flower2, Heart, HelpCircle, Search, ShoppingBag, Shield, Truck, UserRound } from 'lucide-react';
import logoFallback from '../../assets/samira-collection-logo.png';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import './Navbar.css';

const desktopLinks = [
  { label: 'Home', path: '/' },
  { label: 'New In', path: '/products?newArrival=true' },
  { label: 'Shop', path: '/products', hasCaret: true },
  { label: 'Occasions', path: '/products?occasion=Wedding' },
  { label: 'Ethnic Sets', path: '/products?search=Ethnic Set' },
  { label: 'Sarees', path: '/products?search=Saree' },
  { label: 'Bestsellers', path: '/products?bestSeller=true' },
  { label: 'Accessories', path: '/products?search=Accessory' },
  { label: 'Sale', path: '/products?discount=20', isSale: true },
];

export default function Navbar({
  navigate,
  route = '/',
  logoSrc = logoFallback,
  cartCount: cartCountProp,
  wishlistCount: wishlistCountProp,
  onNavigate,
  onSearch,
  onAccountClick,
  onWishlistClick,
  onCartClick,
  onTrackOrderClick,
  onHelpClick,
  isAdmin: isAdminProp,
}) {
  const cart = useCart();
  const wishlist = useWishlist();
  const { user, switchMode } = useAuth();
  const routePath = route.split('?')[0];
  const searchValue = useMemo(() => new URLSearchParams(route.split('?')[1] || '').get('search') || '', [route]);
  const cartCount = Number.isFinite(Number(cartCountProp)) ? Number(cartCountProp) : Number(cart?.itemCount || 0);
  const wishlistCount = Number.isFinite(Number(wishlistCountProp)) ? Number(wishlistCountProp) : Number(wishlist?.items?.length || 0);
  const go = onNavigate || navigate || (() => {});
  const isAdmin = typeof isAdminProp === 'boolean' ? isAdminProp : user?.role === 'admin';
  const showAdminPill = isAdmin && user?.availableModes?.includes('admin') && user?.activeMode !== 'admin';

  const updateSearch = (value) => {
    if (onSearch) {
      onSearch(value);
      return;
    }

    const params = new URLSearchParams(route.split('?')[1] || '');
    if (value) params.set('search', value);
    else params.delete('search');
    go(`/search${params.toString() ? `?${params}` : ''}`);
  };

  const submitSearch = () => {
    if (!searchValue) {
      go('/search');
      return;
    }
    updateSearch(searchValue);
  };

  return (
    <header className="sc-navbar sc-navbar--desktop">
      <div className="sc-navbar__shell">
        <div className="sc-navbar__top">
          <div className="sc-navbar__announcement">
            <Truck className="h-4.5 w-4.5 text-[#b88945]" strokeWidth={1.9} aria-hidden="true" />
            <span className="text-[13px] font-medium tracking-[0.01em]">Free Shipping Above ₹999</span>
          </div>

          <div className="sc-navbar__center-mark" aria-hidden="true">
            <Flower2 className="h-4.5 w-4.5" strokeWidth={1.8} />
          </div>

          <div className="sc-navbar__utility">
            <button type="button" className="sc-navbar__top-link" onClick={() => (onTrackOrderClick ? onTrackOrderClick() : go('/orders'))}>
              Track Order
            </button>
            <span className="sc-navbar__top-divider" aria-hidden="true">
              |
            </span>
            <button type="button" className="sc-navbar__top-link sc-navbar__top-link--help" onClick={() => (onHelpClick ? onHelpClick() : go('/contact'))}>
              <HelpCircle className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
              Help
            </button>
          </div>
        </div>

        <div className="sc-navbar__main">
          <div className="sc-navbar__brand">
            <button type="button" className="sc-navbar__brand-link" onClick={() => go('/')}>
              <img className="sc-navbar__logo" src={logoSrc} alt="Samaira Collection" />
            </button>
          </div>

          <nav className="sc-navbar__links" aria-label="Primary">
            {desktopLinks.map((link) => {
              const isActive =
                (routePath === '/' && link.path === '/') ||
                (routePath === '/products' && link.path === '/products' && searchValue === '');
              return (
                <button
                  key={link.label}
                  type="button"
                  className={`sc-navbar__link${link.isSale ? ' sc-navbar__link--sale' : ''}${isActive ? ' sc-navbar__link--active' : ''}`}
                  onClick={() => go(link.path)}
                >
                  <span>{link.label}</span>
                  {link.hasCaret ? <ChevronDown className="sc-navbar__shop-caret h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" /> : null}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            {showAdminPill ? (
              <button type="button" className="sc-navbar__admin-pill" onClick={() => switchMode('admin')}>
                <Shield className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden="true" />
                Admin
              </button>
            ) : null}

            <div className="sc-navbar__search">
              <input
                className="sc-navbar__search-input"
                type="search"
                value={searchValue}
                placeholder="Search for products, styles..."
                onFocus={() => {
                  if (!routePath.startsWith('/search')) go('/search');
                }}
                onChange={(event) => updateSearch(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submitSearch();
                  }
                }}
                aria-label="Search products"
              />
              <button type="button" className="sc-navbar__search-button" onClick={submitSearch} aria-label="Search">
                <Search className="h-4.5 w-4.5" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            <div className="sc-navbar__actions">
              <button
                type="button"
                className="sc-navbar__action"
                onClick={() => (onAccountClick ? onAccountClick() : go('/profile'))}
                aria-label="Account"
              >
                <span className="sc-navbar__action-icon">
                  <UserRound className="h-6 w-6" strokeWidth={1.85} aria-hidden="true" />
                </span>
                <span className="sc-navbar__action-label">Account</span>
              </button>

              <button
                type="button"
                className="sc-navbar__action"
                onClick={() => (onWishlistClick ? onWishlistClick() : go('/wishlist'))}
                aria-label="Wishlist"
              >
                <span className="sc-navbar__action-icon">
                  <Heart className="h-6 w-6" strokeWidth={1.85} aria-hidden="true" />
                  {wishlistCount > 0 ? <span className="sc-navbar__badge">{wishlistCount}</span> : null}
                </span>
                <span className="sc-navbar__action-label">Wishlist</span>
              </button>

              <button
                type="button"
                className="sc-navbar__action"
                onClick={() => (onCartClick ? onCartClick() : go('/cart'))}
                aria-label="Cart"
              >
                <span className="sc-navbar__action-icon">
                  <ShoppingBag className="h-6 w-6" strokeWidth={1.85} aria-hidden="true" />
                  {cartCount > 0 ? <span className="sc-navbar__badge">{cartCount}</span> : null}
                </span>
                <span className="sc-navbar__action-label">Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
