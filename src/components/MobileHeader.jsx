import logo from '../assets/samiraLogo.png';

export default function MobileHeader({ activeNav, onAction }) {
  return (
    <header className="md:hidden sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Samira Collection" className="h-10 w-auto" />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onAction('wishlist')}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm transition ${
              activeNav === 'wishlist' ? 'bg-[#8a4a42] text-white' : 'bg-[#fff2ef] text-[#8a4a42] hover:bg-[#f7dcd7]'
            }`}
            aria-label="Wishlist"
          >
            ❤️
          </button>
          <button
            type="button"
            onClick={() => onAction('cart')}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm transition ${
              activeNav === 'cart' ? 'bg-[#8a4a42] text-white' : 'bg-[#8a4a42] text-white hover:bg-[#7a413d]'
            }`}
            aria-label="Cart"
          >
            🛍️
          </button>
        </div>
      </div>
      <div className="px-4 pb-4">
        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search fashion, sarees, suits..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#c69d72] focus:ring-2 focus:ring-[#f5e1d9]/80"
            onFocus={() => onAction('search')}
          />
        </label>
      </div>
    </header>
  );
}
