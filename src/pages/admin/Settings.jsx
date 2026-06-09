import { useEffect, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import api from '../../services/api';

const fields = [
  ['storeName', 'Store Name'],
  ['contactEmail', 'Contact Email'],
  ['contactPhone', 'Contact Phone'],
  ['whatsappNumber', 'WhatsApp Number'],
  ['address', 'Store Address'],
  ['freeShippingMinAmount', 'Free Shipping Minimum Amount', 'number'],
  ['deliveryCharge', 'Delivery Charge', 'number'],
  ['codCharge', 'COD Charge', 'number'],
  ['codMaxAmount', 'COD Max Order Amount', 'number'],
  ['footerText', 'Footer Text'],
];

export default function Settings() {
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  useEffect(() => {
    api.get('/admin/settings').then(setForm).catch((error) => setMessage(error.message));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      if (!form.storeName?.trim()) throw new Error('Store name is required.');
      if (form.contactEmail && !/^\S+@\S+\.\S+$/.test(form.contactEmail)) throw new Error('Enter a valid email.');
      await api.put('/admin/settings', {
        ...form,
        freeShippingMinAmount: Number(form.freeShippingMinAmount || 0),
        deliveryCharge: Number(form.deliveryCharge || 0),
        codCharge: Number(form.codCharge || 0),
        codMaxAmount: Number(form.codMaxAmount || 0),
      });
      setMessage('Settings saved successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Website Settings" note="Control store details, policies and footer content." />
      <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-2">
        {fields.map(([field, label, type = 'text']) => <Input key={field} type={type} label={label} value={form[field] || ''} onChange={(value) => update(field, value)} />)}
        <div className="grid gap-3 rounded-2xl bg-[#fbf8f4] p-4 md:col-span-2 md:grid-cols-3">
          {[
            ['razorpayEnabled', 'Razorpay Enabled'],
            ['codEnabled', 'COD Enabled'],
            ['upiEnabled', 'UPI Enabled'],
            ['cardPaymentEnabled', 'Card Payment Enabled'],
            ['netBankingEnabled', 'Net Banking Enabled'],
            ['walletEnabled', 'Wallet Enabled'],
          ].map(([field, label]) => <label key={field} className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={!!form[field]} onChange={(event) => update(field, event.target.checked)} className="accent-rose" /> {label}</label>)}
        </div>
        <Textarea label="Return Policy" value={form.returnPolicy || ''} onChange={(value) => update('returnPolicy', value)} />
        <Textarea label="Privacy Policy" value={form.privacyPolicy || ''} onChange={(value) => update('privacyPolicy', value)} />
        <Textarea label="Terms and Conditions" value={form.termsConditions || ''} onChange={(value) => update('termsConditions', value)} />
        <div className="grid gap-3 rounded-2xl bg-[#fbf8f4] p-4 md:col-span-2 md:grid-cols-3">
          <Input label="Instagram Link" value={form.socialLinks?.instagram || ''} onChange={(value) => update('socialLinks', { ...form.socialLinks, instagram: value })} />
          <Input label="Facebook Link" value={form.socialLinks?.facebook || ''} onChange={(value) => update('socialLinks', { ...form.socialLinks, facebook: value })} />
          <Input label="YouTube Link" value={form.socialLinks?.youtube || ''} onChange={(value) => update('socialLinks', { ...form.socialLinks, youtube: value })} />
        </div>
        {message && <p className="text-sm font-bold text-wine md:col-span-2">{message}</p>}
        <button className="h-12 rounded-xl bg-wine text-sm font-black text-white md:col-span-2">Save Settings</button>
      </form>
    </section>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return <label className="grid gap-2 text-sm font-black">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold" /></label>;
}

function Textarea({ label, value, onChange }) {
  return <label className="grid gap-2 text-sm font-black md:col-span-2">{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-28 rounded-xl border border-slate-200 p-4 text-sm font-semibold" /></label>;
}
