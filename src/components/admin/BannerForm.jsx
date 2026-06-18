import { useState } from 'react';
import api from '../../services/api';
import ImageUploader from './ImageUploader';

const emptyBanner = { title: '', subtitle: '', buttonText: '', link: '', image: '', displayOrder: 0, type: 'Hero', isActive: true };

export default function BannerForm({ onSaved }) {
  const [form, setForm] = useState(emptyBanner);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.post('/admin/banners', { ...form, displayOrder: Number(form.displayOrder) });
      setForm(emptyBanner);
      setMessage('Banner saved.');
      onSaved?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-2">
      {['title', 'subtitle', 'buttonText', 'link'].map((field) => <Input key={field} value={form[field]} onChange={(value) => update(field, value)} placeholder={labels[field]} />)}
      <Input type="number" value={form.displayOrder} onChange={(value) => update('displayOrder', value)} placeholder="Display Order" />
      <select value={form.type} onChange={(event) => update('type', event.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold"><option>Hero</option><option>Offer</option><option>Category</option><option>Sale</option></select>
      <div className="md:col-span-2"><ImageUploader uploadContext="banners" value={form.image ? [{ url: form.image }] : []} onChange={(images) => update('image', images[0]?.url || '')} compressAboveMb={2} maxUploadMb={20} targetSizeMb={0.6} /></div>
      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} className="accent-rose" /> Active</label>
      {message && <p className="text-sm font-bold text-wine">{message}</p>}
      <button disabled={saving} className="h-12 rounded-xl bg-wine text-sm font-black text-white disabled:opacity-60 md:col-span-2">{saving ? 'Saving...' : 'Save Banner'}</button>
    </form>
  );
}

const labels = { title: 'Title', subtitle: 'Subtitle', buttonText: 'Button Text', link: 'Link' };

function Input({ value, onChange, placeholder, type = 'text' }) {
  return <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder={placeholder} />;
}
