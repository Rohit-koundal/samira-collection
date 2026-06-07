import logo from '../assets/samiraLogo.png';

const navLinks = [
  'Home',
  'New Arrivals',
  'Sarees',
  'Suits',
  'Kurtis',
  'Dresses',
  'Sale',
  'Contact',
];

export default function DesktopHeader() {
  return (
    <header className="hidden md:block">
      <div className="sticky top-0 z-50">
        <div className="bg-[#f7ede9] border-b border-[#f1d3cd]">
          <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-2 px-6 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#7c524d]">
            <span>Free Shipping on Orders Above ₹999</span>
            <span className="text-[#c69d72]">|</span>
            <span>New Festive Collection Live Now</span>
          </div>
        </div>
        <div className="bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-6 py-4">
            <a href="#hero" className="flex items-center gap-3">
              <img src={logo} alt="Samira Collection" className="h-12 w-auto" />
            </a>
            <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-700">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                  className="transition hover:text-[#8a4a42]"
                >
                  {link}
                </a>
              ))}
            </nav>
            <div className="hidden lg:flex flex-1 justify-center px-4">
              <label className="relative w-full max-w-2xl">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </span>
                <input
                  type="search"
                  placeholder="Search for sarees, suits, kurtis, dresses..."
                  className="w-full rounded-full border border-slate-200 bg-slate-50/90 py-3 pl-12 pr-5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#c69d72] focus:ring-2 focus:ring-[#f5e1d9]/80"
                />
              </label>
            </div>
            <div className="hidden xl:flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#c69d72] hover:text-[#8a4a42]">
                <span className="text-lg">👤</span>
                Profile
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#c69d72] hover:text-[#8a4a42]">
                <span className="text-lg">🤍</span>
                Wishlist
              </button>
              <button className="inline-flex items-center gap-2 rounded-full bg-[#8a4a42] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#7a413d]">
                <span className="text-lg">🛍️</span>
                Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
