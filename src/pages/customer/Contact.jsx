import { useEffect, useState } from 'react';
import { Button, Card, CardContent, TextInput } from '../../components/ui';
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
      <section className="container-page py-6 md:py-10">
        <Card as="article" className="mx-auto max-w-3xl">
          <CardContent className="p-5 md:p-7">
          <p className="small-text font-bold uppercase tracking-[0.14em] text-wine md:text-xs md:tracking-[0.22em]">Samira Collection</p>
          <h1 className="page-title mt-3 md:text-3xl">{policy.title}</h1>
          <p className="body-text mt-5 whitespace-pre-line text-slate-600 md:leading-7">
            {settings[policy.key] || policy.fallback}
          </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const submit = (event) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <section className="container-page py-6 md:py-10">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-5 md:p-7">
            <h1 className="page-title md:text-3xl">Contact Samira Collection</h1>
            <p className="body-text mt-4 text-slate-600">Email {settings.contactEmail || 'hello@samiracollection.com'} or WhatsApp {settings.whatsappNumber || settings.contactPhone || '+91 98765 43210'} for product inquiries, returns, and store support.</p>
            {settings.address && <p className="body-text mt-3 text-slate-500">{settings.address}</p>}
          </CardContent>
        </Card>
        <Card as="form" onSubmit={submit}>
          <CardContent className="p-5 md:p-7">
            <TextInput placeholder="Name" />
            <TextInput className="mt-3" placeholder="Email" />
            <textarea className="body-text mt-3 min-h-32 w-full rounded-xl border border-slate-200 p-4 outline-none transition focus:border-wine focus:ring-2 focus:ring-wine/10" placeholder="Message" />
            <Button className="mt-3 w-full">Send Message</Button>
            {sent && <p className="label-text mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700">Message sent. We will contact you shortly.</p>}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
