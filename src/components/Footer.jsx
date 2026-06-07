import logo from '../assets/samiraLogo.png';

const quickLinks = ['Home', 'New Arrivals', 'Sarees', 'Suits', 'Kurtis', 'Dresses', 'Contact'];
const categories = ['Sarees', 'Suits', 'Kurtis', 'Dresses', 'Lehengas', 'Dupatta'];

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Samira Collection" className="h-10 w-auto" />
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Samira Collection</p>
              <p className="text-xl font-semibold text-white">Premium Fashion</p>
            </div>
          </div>
          <p className="max-w-md text-sm leading-7 text-slate-400">
            Curated womenswear designed for festive moments, modern celebrations, and everyday elegance.
          </p>
          <p className="text-xs text-slate-500">Domain, hosting, and admin access will remain with the owner.</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Quick Links</h3>
          <ul className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-1">
            {quickLinks.map((link) => (
              <li key={link}>
                <a href={`#${link.toLowerCase().replace(/\s+/g, '-')}`} className="transition hover:text-white">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden lg:block">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Categories</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {categories.map((category) => (
              <li key={category}>
                <a href={`#${category.toLowerCase()}`} className="transition hover:text-white">
                  {category}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Contact</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>hello@samiracollection.com</p>
            <p>+91 98765 43210</p>
            <p>Mon - Sat, 10:00 AM - 7:00 PM</p>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-200 transition hover:bg-slate-700">F</span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-200 transition hover:bg-slate-700">I</span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-200 transition hover:bg-slate-700">P</span>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 px-4 py-5 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Samira Collection. All rights reserved.
      </div>
    </footer>
  );
}
