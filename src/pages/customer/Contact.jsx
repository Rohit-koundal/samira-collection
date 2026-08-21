import { useEffect, useState } from 'react';
import { Button, Card, CardContent, TextInput } from '../../components/ui';
import PageState from '../../components/ui/PageState';
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
  '/shipping-policy': {
    title: 'Shipping Policy',
    key: 'shippingPolicy',
    fallback: 'Orders are packed and handed to the courier after confirmation. Delivery timelines depend on your pincode and usually take 5-7 working days after dispatch. You will receive tracking details once the shipment is created.',
  },
  '/cancellation-policy': {
    title: 'Cancellation Policy',
    key: 'cancellationPolicy',
    fallback: 'Orders can be cancelled before they are shipped. Once packed or dispatched, cancellation is no longer available and a return can be requested after delivery.',
  },
  '/size-guide': {
    title: 'Size Guide',
    key: 'sizeGuide',
    fallback: 'Measure bust, waist and hip, then choose the closest size on the product page. If you are between sizes, we recommend the larger size for ethnic wear with lining or heavy work.',
  },
  '/faqs': {
    title: 'FAQs',
    key: 'faqs',
    fallback: 'Orders, shipping, returns and payments are handled from your account. Contact us if an order is delayed or a product arrives damaged. COD and online payments follow the methods enabled in store settings.',
  },
  '/our-story': {
    title: 'Our Story',
    key: 'ourStory',
    fallback: 'Samira Collection offers festive and everyday ethnic wear chosen for fabric, finish and occasion-ready styling.',
  },
};

export default function Contact({ route = '/contact' }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  useEffect(() => {
    api.get('/settings')
      .then(setSettings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const routePath = route.split('?')[0];
  const policy = pageCopy[routePath];

  if (loading) {
    return (
      <section className="container-page py-6 md:py-10">
        <PageState loading loadingLabel="Loading page..." />
      </section>
    );
  }

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

  const submit = async (event) => {
    event.preventDefault();
    setSent('');
    setError('');
    setSubmitting(true);
    try {
      const data = await api.post('/contact', form);
      setSent(data.message || 'Message received. We will contact you shortly.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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
            <TextInput placeholder="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            <TextInput className="mt-3" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            <TextInput className="mt-3" placeholder="Phone (optional)" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            <TextInput className="mt-3" placeholder="Subject" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />
            <textarea className="body-text mt-3 min-h-32 w-full rounded-xl border border-slate-200 p-4 outline-none transition focus:border-wine focus:ring-2 focus:ring-wine/10" placeholder="Message" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} required />
            <Button className="mt-3 w-full" disabled={submitting}>{submitting ? 'Sending...' : 'Send Message'}</Button>
            {sent && <p className="label-text mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700">{sent}</p>}
            {error && <p className="label-text mt-3 rounded-xl bg-rose/10 px-4 py-3 text-rose">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
