import logo from '../../assets/samira-collection-logo.svg';
import Icon from './Icon';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function MobileHeader({ navigate }) {
  const cart = useCart();
  const wishlist = useWishlist();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white md:hidden">
      <div className="flex h-14 items-center justify-between px-3">
        <button className="grid h-10 w-10 place-items-center text-slate-600" aria-label="Open menu">
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
  );
}
