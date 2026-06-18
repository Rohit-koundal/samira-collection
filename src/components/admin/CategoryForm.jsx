import { useEffect, useState } from 'react';
import api from '../../services/api';
import ImageUploader from './ImageUploader';

const emptyCategory = { name: '', slug: '', description: '', image: '', displayOrder: 0, isActive: true };

export default function CategoryForm({ mode = 'Add', categoryId, onSaved }) {
  const [form, setForm] = useState(emptyCategory);
  const [loading, setLoading] = useState(Boolean(categoryId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!categoryId) {
      setForm(emptyCategory);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setMessage('');
    api.get(`/admin/categories/${categoryId}`)
      .then((category) => {
        if (cancelled) return;
        setForm({
          name: category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          image: category.image || '',
          displayOrder: Number(category.displayOrder || 0),
          isActive: Boolean(category.isActive),
        });
      })
      .catch((error) => {
        if (!cancelled) setMessage(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

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
      if (categoryId) await api.put(`/admin/categories/${categoryId}`, payload);
      else await api.post('/admin/categories', payload);
      if (!categoryId) setForm(emptyCategory);
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
      {loading && <p className="rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-500 md:col-span-2">Loading category...</p>}
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
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} className="accent-rose" /> Active
      </label>
      {message && <p className="text-sm font-bold text-wine md:col-span-2">{message}</p>}
      <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:justify-end">
        {categoryId && <a href="#/admin/categories" className="grid h-12 place-items-center rounded-xl border border-slate-200 px-5 text-sm font-black">Back</a>}
        {!categoryId && <button type="button" onClick={() => setForm(emptyCategory)} className="h-12 rounded-xl border border-slate-200 px-5 text-sm font-black">Reset</button>}
        <button disabled={saving} className="h-12 rounded-xl bg-wine px-5 text-sm font-black text-white disabled:opacity-60">{saving ? 'Saving...' : `${mode} Category`}</button>
      </div>
    </form>
  );
}

function Input({ label, value, onChange, placeholder = label, type = 'text', required = false }) {
  return (
    <label className="grid gap-2 text-sm font-black">
      {label}
      <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder={placeholder} />
    </label>
  );
}
