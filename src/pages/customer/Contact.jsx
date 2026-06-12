import { useEffect, useState } from 'react';
import api from '../../services/api';

const pageCopy = {
  '/return-policy': {
    title: 'Return Policy',
    key: 'returnPolicy',
    fallback: 'Returns and exchanges are accepted within the eligible return window when products are unused, unworn, and returned with original tags and packaging. Final sale items and altered products may not be eligible.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy',
    key: 'privacyPolicy',
    fallback: 'We collect only the information needed to process orders, support customers, and improve the shopping experience. Customer information is handled carefully and is not sold to third parties.',
  },
  '/terms': {
    title: 'Terms and Conditions',
    key: 'termsConditions',
    fallback: 'By using Samira Collection, you agree to provide accurate account and order information, follow checkout terms, and use the website only for lawful shopping activity.',
  },
};

export default function Contact({ route = '/contact' }) {
  const [settings, setSettings] = useState({});
  const [sent, setSent] = useState(false);
  useEffect(() => {
    api.get('/settings').then(setSettings).catch(() => {});
  }, []);
  const routePath = route.split('?')[0];
  const policy = pageCopy[routePath];

  if (policy) {
    return (
      <section className="container-page py-10">
        <article className="mx-auto max-w-3xl rounded-3xl bg-white p-7 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-wine">Samira Collection</p>
          <h1 className="mt-3 text-3xl font-black">{policy.title}</h1>
          <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">
            {settings[policy.key] || policy.fallback}
          </p>
        </article>
      </section>
    );
  }

  const submit = (event) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <section className="container-page py-10">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-7 shadow-sm">
          <h1 className="text-3xl font-black">Contact Samira Collection</h1>
          <p className="mt-4 leading-7 text-slate-600">Email {settings.contactEmail || 'hello@samiracollection.com'} or WhatsApp {settings.whatsappNumber || settings.contactPhone || '+91 98765 43210'} for product inquiries, returns, and store support.</p>
          {settings.address && <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{settings.address}</p>}
        </div>
        <form onSubmit={submit} className="rounded-3xl bg-white p-7 shadow-sm">
          <input className="h-12 w-full rounded-xl border border-slate-200 px-4" placeholder="Name" />
          <input className="mt-3 h-12 w-full rounded-xl border border-slate-200 px-4" placeholder="Email" />
          <textarea className="mt-3 min-h-32 w-full rounded-xl border border-slate-200 p-4" placeholder="Message" />
          <button className="mt-3 h-12 w-full rounded-xl bg-wine text-sm font-black text-white">Send Message</button>
          {sent && <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">Message sent. We will contact you shortly.</p>}
        </form>
      </div>
    </section>
  );
}
