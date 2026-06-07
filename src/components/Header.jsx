import { useState } from 'react';
import logo from '../assets/samiraLogo.png';

const navItems = ['Home', 'New Arrivals', 'Sarees', 'Suits', 'Kurtis', 'Dresses', 'Contact'];

function Icon({ children }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900">
      {children}
    </span>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm shadow-slate-100">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-center text-sm text-slate-700 sm:px-6">
        Free Shipping on Orders Above ₹999
      </div>

      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <a href="#home" className="flex items-center gap-3 text-slate-900">
          <img src={logo} alt="Samira Collection" className="h-10 w-10" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Samira</p>
            <p className="text-xl font-semibold leading-none">Collection</p>
          </div>
        </a>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="ml-auto inline-flex items-center rounded-full border border-slate-200 bg-white p-3 text-slate-700 transition hover:border-slate-300 hover:text-slate-900 md:hidden"
          aria-label="Toggle menu"
        >
          <span className="sr-only">Toggle menu</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="w-full max-w-2xl rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm transition focus-within:border-slate-300">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="flex items-center gap-3 text-slate-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                id="search"
                type="search"
                placeholder="Search for sarees, suits, kurtis, dresses…"
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <nav className="hidden items-center gap-3 md:flex">
          {navItems.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              {item}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Icon>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61c-.45-.4-1.05-.61-1.66-.61-1.26 0-2.33.76-2.82 1.88-.5-1.12-1.56-1.88-2.82-1.88-1.21 0-2.32.7-2.78 1.76-.46-1.06-1.58-1.76-2.78-1.76-1.26 0-2.32.76-2.82 1.88C2.6 6.04 2 7.08 2 8.26c0 1.09.4 2.15 1.13 2.96l8.7 8.95 8.7-8.95c.74-.81 1.14-1.87 1.14-2.96 0-1.18-.6-2.22-1.59-2.95z" />
            </svg>
          </Icon>
          <Icon>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61l1.38-7.59H6" />
            </svg>
          </Icon>
          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            Login
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="space-y-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
              <label htmlFor="mobile-search" className="sr-only">Search</label>
              <div className="flex items-center gap-2 text-slate-500">
                <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input id="mobile-search" type="search" placeholder="Search for sarees, suits, kurtis, dresses…" className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none" />
              </div>
            </div>

            <div className="grid gap-3">
              {navItems.map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="block rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                  {item}
                </a>
              ))}
            </div>

            <div className="grid gap-3">
              <button className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                Wishlist
              </button>
              <button className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                Cart
              </button>
              <button className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
