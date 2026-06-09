import logo from '../../assets/samira-collection-logo.svg';
import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Footer({ navigate }) {
  const [settings, setSettings] = useState({});
  useEffect(() => {
    api.get('/settings').then(setSettings).catch(() => {});
  }, []);
  return (
    <footer className="hidden bg-charcoal text-white md:block">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <img src={logo} alt="Samira Collection" className="h-16 rounded-xl bg-white p-1" />
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
            {settings.footerText || 'Premium women fashion store for sarees, suits, kurtis, dresses, lehengas, gowns, and festive wear.'}
          </p>
        </div>
        <FooterList title="Shop" items={['Sarees', 'Suits', 'Kurtis', 'Dresses', 'Sale']} navigate={navigate} />
        <FooterList title="Support" items={['Contact', 'Return Policy', 'Privacy Policy', 'Terms']} navigate={navigate} />
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.24em] text-slate-400">Contact</h3>
          <p className="mt-4 text-sm text-slate-300">{settings.contactEmail || 'hello@samiracollection.com'}</p>
          <p className="mt-2 text-sm text-slate-300">{settings.contactPhone || '+91 98765 43210'}</p>
          <p className="mt-2 text-sm text-slate-300">{settings.whatsappNumber || ''}</p>
          <p className="mt-2 text-sm text-slate-300">Mon - Sat, 10 AM - 7 PM</p>
        </div>
      </div>
    </footer>
  );
}

function FooterList({ title, items, navigate }) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-[0.24em] text-slate-400">{title}</h3>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <button key={item} onClick={() => navigate(item === 'Contact' ? '/contact' : '/products')} className="text-left text-sm text-slate-300 hover:text-white">
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
