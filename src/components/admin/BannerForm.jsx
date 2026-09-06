import { useEffect, useMemo, useState } from 'react';
import { Select, TextInput } from '../ui/Field';
import ImageUploader from './ImageUploader';

const bannerTypeOptions = ['Hero', 'Offer', 'Category', 'Sale'];
const bannerPositionOptions = ['Home - Top', 'Home - Middle', 'Home - Bottom', 'Cart - Bottom', 'Category - Featured', 'Offer Strip'];

const emptyBanner = {
  title: '',
  subtitle: '',
  buttonText: '',
  link: '',
  image: '',
  displayOrder: 1,
  type: 'Hero',
  position: 'Home - Top',
  isActive: true,
  views: 0,
};

export default function BannerForm({
  initialValues,
  saving = false,
  message = '',
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(() => ({ ...emptyBanner, ...(initialValues || {}) }));

  useEffect(() => {
    setForm({ ...emptyBanner, ...(initialValues || {}) });
  }, [initialValues]);

  const heading = useMemo(() => (initialValues?._id ? 'Edit Banner' : 'Add New Banner'), [initialValues?._id]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    await onSubmit?.({
      ...form,
      title: String(form.title || '').trim(),
      subtitle: String(form.subtitle || '').trim(),
      buttonText: String(form.buttonText || '').trim(),
      link: String(form.link || '').trim(),
      image: String(form.image || '').trim(),
      displayOrder: Number(form.displayOrder || 0),
      views: Number(form.views || 0),
    });
  };

  return (
    <form onSubmit={submit} className="admin-card p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="admin-kicker">{heading}</p>
          <h2 className="mt-1">{form.title || 'Create a storefront banner'}</h2>
          <p className="admin-note">Upload banner creative, set placement, and control storefront visibility.</p>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="admin-btn-ghost">
            Cancel
          </button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Banner Title" value={form.title} onChange={(value) => update('title', value)} placeholder="Summer Sale 50% Off" required />
            <Field label="CTA Label" value={form.buttonText} onChange={(value) => update('buttonText', value)} placeholder="Shop Now" />
            <Field label="Subtitle" value={form.subtitle} onChange={(value) => update('subtitle', value)} placeholder="Big summer sale is live now!" className="md:col-span-2" />
            <Field label="Redirect Link" value={form.link} onChange={(value) => update('link', value)} placeholder="/collections/sale" className="md:col-span-2" />
          </div>

          <div className="rounded-[20px] border border-[#f1e7df] bg-[#fcfaf7] p-4">
            <div className="mb-3">
              <h3 className="text-sm font-black text-charcoal">Banner Image</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Upload a polished JPG, JPEG, PNG, or WEBP banner. The saved URL is used on the storefront.</p>
            </div>
            <ImageUploader
              label="Choose Banner Image"
              helpText="Recommended: clean lifestyle banner creative."
              uploadContext="banners"
              value={form.image ? [{ url: form.image }] : []}
              onChange={(images) => update('image', images[0]?.url || '')}
              compressAboveMb={2}
              maxUploadMb={20}
              targetSizeMb={0.6}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Banner Type" value={form.type} onChange={(value) => update('type', value)} options={bannerTypeOptions} />
            <SelectField label="Position" value={form.position} onChange={(value) => update('position', value)} options={bannerPositionOptions} />
            <Field label="Display Order" type="number" value={form.displayOrder} onChange={(value) => update('displayOrder', value)} placeholder="1" />
            <Field label="Views" type="number" value={form.views} onChange={(value) => update('views', value)} placeholder="0" />
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} className="accent-wine" />
            <span className="text-sm font-black text-charcoal">Keep this banner active on the storefront</span>
          </label>

          <PreviewCard form={form} />
        </div>
      </div>

      {message && <p className="mt-4 rounded-2xl bg-[#fdf4f6] px-4 py-3 text-sm font-bold text-wine">{message}</p>}

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button type="submit" disabled={saving} className="admin-btn disabled:opacity-60">
          {saving ? 'Saving Banner...' : initialValues?._id ? 'Update Banner' : 'Add New Banner'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, className = '', onChange, ...props }) {
  return (
    <label className={className}>
      <span className="label-text text-slate-500">{label}</span>
      <TextInput className="mt-2" {...props} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, options, value, onChange }) {
  return (
    <label>
      <span className="label-text text-slate-500">{label}</span>
      <Select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </Select>
    </label>
  );
}

function PreviewCard({ form }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#efe5dc] bg-gradient-to-r from-[#fff9f5] via-white to-[#fff5f7] shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
      <div className="grid min-h-[200px] gap-4 p-5 md:grid-cols-[1.15fr_160px]">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-[#f7ebe4] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-wine">
            {form.position || 'Home - Top'}
          </span>
          <h3 className="mt-4 text-2xl font-black leading-tight text-charcoal">{form.title || 'Banner Title'}</h3>
          <p className="mt-2 max-w-[380px] text-sm font-semibold leading-6 text-slate-500">{form.subtitle || 'Banner subtitle appears here with a rich premium look.'}</p>
          <div className="mt-5 inline-flex rounded-xl bg-wine px-4 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-white">
            {form.buttonText || 'Shop Now'}
          </div>
        </div>
        <div className="overflow-hidden rounded-[24px] bg-[#f6ddd4]">
          {form.image ? (
            <img src={form.image} alt={form.title || 'Banner preview'} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[160px] items-center justify-center bg-gradient-to-b from-[#f8e6df] to-[#f6d7d2] px-6 text-center text-sm font-black text-wine">
              Banner Preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
