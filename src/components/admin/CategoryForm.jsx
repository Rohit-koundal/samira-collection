import { useState } from 'react';
import api from '../../services/api';
import ImageUploader from './ImageUploader';

const emptyCategory = { name: '', slug: '', description: '', image: '', displayOrder: 0, isActive: true };

export default function CategoryForm({ onSaved }) {
  const [form, setForm] = useState(emptyCategory);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        image: form.image || '',
        displayOrder: Number(form.displayOrder || 0),
      };
      if (!payload.slug) delete payload.slug;
      await api.post('/admin/categories', payload);
      setForm(emptyCategory);
      setMessage('Category saved.');
      onSaved?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-2">
      <Input label="Name" value={form.name} onChange={(value) => update('name', value)} required />
      <Input label="Slug" value={form.slug} onChange={(value) => update('slug', value)} placeholder="auto if empty" />
      <Input label="Description" value={form.description} onChange={(value) => update('description', value)} />
      <Input label="Display Order" type="number" value={form.displayOrder} onChange={(value) => update('displayOrder', value)} />
      <div className="md:col-span-2">
        <div className="mb-3 rounded-xl bg-[#fbf8f4] p-4">
          <h3 className="text-sm font-black text-charcoal">Category Image</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Optional. Upload JPG, JPEG, PNG or WEBP image under 2MB.</p>
        </div>
        <ImageUploader
          label="Choose Category Image"
          helpText="This image will be used on category cards. Only the uploaded image URL is saved."
          value={form.image ? [{ url: form.image }] : []}
          onChange={(images) => update('image', images[0]?.url || '')}
          maxSizeMb={2}
        />
      </div>
      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} className="accent-rose" /> Active</label>
      {message && <p className="text-sm font-bold text-wine">{message}</p>}
      <button disabled={saving} className="h-12 rounded-xl bg-wine text-sm font-black text-white disabled:opacity-60 md:col-span-2">{saving ? 'Saving...' : 'Save Category'}</button>
    </form>
  );
}

function Input({ label, value, onChange, placeholder = label, type = 'text', required = false }) {
  return <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder={placeholder} />;
}
