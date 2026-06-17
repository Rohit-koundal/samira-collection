import logo from '../../assets/samira-collection-logo.png';
import { Button } from '../ui';
import { useGetSettingsQuery } from '../../store/apiSlice';

export default function Footer({ navigate }) {
  const { data: settings = {} } = useGetSettingsQuery();
  return (
    <footer className="hidden bg-charcoal text-white md:block">
      <div className="container-page grid gap-8 py-10 md:gap-10 md:py-14 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <img src={logo} alt="Samira Collection" className="h-16 rounded-xl bg-white p-1" />
          <p className="body-text mt-4 max-w-md text-slate-300 md:text-sm md:leading-7">
            {settings.footerText || 'Premium women fashion store for sarees, suits, kurtis, dresses, lehengas, gowns, and festive wear.'}
          </p>
        </div>
        <FooterList title="Shop" items={['Sarees', 'Suits', 'Kurtis', 'Dresses', 'Sale']} navigate={navigate} />
        <FooterList title="Support" items={['Contact', 'Return Policy', 'Privacy Policy', 'Terms']} navigate={navigate} />
        <div>
          <h3 className="small-text font-bold uppercase tracking-[0.16em] text-slate-400 md:text-sm md:tracking-[0.24em]">Contact</h3>
          <p className="body-text mt-4 text-slate-300 md:text-sm">{settings.contactEmail || 'hello@samiracollection.com'}</p>
          <p className="body-text mt-2 text-slate-300 md:text-sm">{settings.contactPhone || '+91 98765 43210'}</p>
          <p className="body-text mt-2 text-slate-300 md:text-sm">{settings.whatsappNumber || ''}</p>
          <p className="body-text mt-2 text-slate-300 md:text-sm">Mon - Sat, 10 AM - 7 PM</p>
        </div>
      </div>
    </footer>
  );
}

const supportRoutes = {
  Contact: '/contact',
  'Return Policy': '/return-policy',
  'Privacy Policy': '/privacy-policy',
  Terms: '/terms',
};

function FooterList({ title, items, navigate }) {
  return (
    <div>
      <h3 className="small-text font-bold uppercase tracking-[0.16em] text-slate-400 md:text-sm md:tracking-[0.24em]">{title}</h3>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <Button key={item} onClick={() => navigate(supportRoutes[item] || `/products?category=${item.toLowerCase()}`)} variant="ghost" className="h-auto justify-start px-0 py-0 body-text text-left text-slate-300 hover:bg-transparent hover:text-white md:text-sm">
            {item}
          </Button>
        ))}
      </div>
    </div>
  );
}
