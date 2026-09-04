import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Save, Tag, X } from 'lucide-react';
import api from '../../services/api';

const PAYMENT_METHODS = [
  ['COD', 'Cash on Delivery'],
  ['UPI', 'UPI'],
  ['CARD', 'Card'],
  ['NETBANKING', 'Net Banking'],
  ['WALLET', 'Wallet'],
];

const emptyCoupon = {
  code: '', title: '', description: '', terms: '', type: 'Percentage', discountValue: '',
  minOrderAmount: '0', maxDiscountAmount: '', validFrom: '', expiryDate: '', usageLimit: '',
  customerLimit: '', applicablePaymentMethods: [], applicableProducts: [], applicableCategories: [],
  firstOrderOnly: false, isPublic: true, isActive: true,
};

export default function CouponForm({ coupon, products = [], categories = [], onSaved, onCancel }) {
  const editing = Boolean(coupon?._id);
  const [form, setForm] = useState(emptyCoupon);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(coupon ? couponToForm(coupon) : { ...emptyCoupon });
    setMessage(null);
  }, [coupon]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleListValue = (field, value) => setForm((current) => ({
    ...current,
    [field]: current[field].includes(value)
      ? current[field].filter((item) => item !== value)
      : [...current[field], value],
  }));

  const estimatedLabel = useMemo(() => {
    const value = Number(form.discountValue || 0);
    if (!value) return 'Set the customer saving';
    if (form.type === 'Percentage') {
      return `${value}% off${Number(form.maxDiscountAmount || 0) ? `, up to Rs. ${Number(form.maxDiscountAmount).toLocaleString('en-IN')}` : ''}`;
    }
    return `Rs. ${value.toLocaleString('en-IN')} off`;
  }, [form.discountValue, form.maxDiscountAmount, form.type]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      validateForm(form);
      const saved = editing
        ? await api.put(`/admin/coupons/${coupon._id}`, toPayload(form))
        : await api.post('/admin/coupons', toPayload(form));
      setMessage({ type: 'success', text: editing ? 'Coupon updated successfully.' : 'Coupon created successfully.' });
      if (!editing) setForm({ ...emptyCoupon });
      onSaved?.(saved, editing ? 'updated' : 'created');
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to save coupon.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="admin-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eadfd5] bg-gradient-to-r from-[#fffaf7] to-white px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0f4] text-wine"><Tag className="h-5 w-5" /></span>
          <div>
            <h2 className="text-base font-black text-charcoal">{editing ? `Edit ${coupon.code}` : 'Create a coupon'}</h2>
            <p className="mt-1 text-xs text-slate-500">Configure the offer, eligibility, usage and storefront visibility.</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">{estimatedLabel}</span>
      </div>

      <div className="grid gap-6 p-5 xl:grid-cols-2">
        <FormSection title="Offer details" note="Shown to customers in the coupon picker.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Coupon code" required><input value={form.code} onChange={(event) => update('code', sanitizeCode(event.target.value))} maxLength={32} className="admin-coupon-input uppercase" placeholder="SAMIRA20" /></Field>
            <Field label="Discount type" required><select value={form.type} onChange={(event) => update('type', event.target.value)} className="admin-coupon-input"><option value="Percentage">Percentage</option><option value="Flat">Flat amount</option></select></Field>
            <Field label="Customer-facing title" className="sm:col-span-2"><input value={form.title} onChange={(event) => update('title', event.target.value)} maxLength={120} className="admin-coupon-input" placeholder="Extra savings on your order" /></Field>
            <Field label="Short description" className="sm:col-span-2"><textarea value={form.description} onChange={(event) => update('description', event.target.value)} maxLength={500} rows={2} className="admin-coupon-input min-h-[76px] py-3" placeholder="A short explanation customers can understand." /></Field>
            <Field label={form.type === 'Percentage' ? 'Discount percentage' : 'Flat discount (Rs.)'} required><NumberInput value={form.discountValue} onChange={(value) => update('discountValue', value)} min="0.01" max={form.type === 'Percentage' ? '100' : undefined} step="0.01" placeholder={form.type === 'Percentage' ? '20' : '500'} /></Field>
            <Field label="Minimum bag value (Rs.)"><NumberInput value={form.minOrderAmount} onChange={(value) => update('minOrderAmount', value)} min="0" step="0.01" placeholder="0" /></Field>
            <Field label="Maximum saving (Rs.)" hint="Useful for percentage coupons"><NumberInput value={form.maxDiscountAmount} onChange={(value) => update('maxDiscountAmount', value)} min="0" step="0.01" placeholder="No cap" /></Field>
          </div>
        </FormSection>

        <FormSection title="Schedule & limits" note="Control when and how often the coupon can be used.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts at" hint="Leave blank to start immediately"><DateTimeInput value={form.validFrom} onChange={(value) => update('validFrom', value)} /></Field>
            <Field label="Expires at" required><DateTimeInput value={form.expiryDate} onChange={(value) => update('expiryDate', value)} /></Field>
            <Field label="Total usage limit" hint="Blank means unlimited"><NumberInput value={form.usageLimit} onChange={(value) => update('usageLimit', value)} min="0" step="1" placeholder="Unlimited" /></Field>
            <Field label="Limit per customer" hint="Requires a signed-in customer"><NumberInput value={form.customerLimit} onChange={(value) => update('customerLimit', value)} min="0" step="1" placeholder="Unlimited" /></Field>
            {editing ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2"><span className="text-xs font-bold text-slate-500">Redemptions</span><p className="mt-1 text-sm font-black text-charcoal">{Number(coupon.usedCount || 0).toLocaleString('en-IN')} used{coupon.usageLimit ? ` of ${Number(coupon.usageLimit).toLocaleString('en-IN')}` : ''}</p></div> : null}
          </div>
        </FormSection>

        <FormSection title="Eligibility" note="Empty selections mean the coupon applies to all options.">
          <ChoiceGrid label="Payment methods" items={PAYMENT_METHODS} selected={form.applicablePaymentMethods} onToggle={(value) => toggleListValue('applicablePaymentMethods', value)} />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <MultiSelect label="Categories" options={categories.map((item) => [item._id, item.name])} selected={form.applicableCategories} onChange={(value) => update('applicableCategories', value)} emptyLabel="All categories" />
            <MultiSelect label="Products" options={products.map((item) => [item._id, item.name])} selected={form.applicableProducts} onChange={(value) => update('applicableProducts', value)} emptyLabel="All products" />
          </div>
          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-bold text-charcoal"><input type="checkbox" checked={form.firstOrderOnly} onChange={(event) => update('firstOrderOnly', event.target.checked)} className="h-4 w-4 accent-rose" />First order only</label>
        </FormSection>

        <FormSection title="Visibility & terms" note="Private coupons work by code but are not advertised.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle checked={form.isActive} onChange={(value) => update('isActive', value)} label="Coupon active" note="Can be validated and used" />
            <Toggle checked={form.isPublic} onChange={(value) => update('isPublic', value)} label="Show to customers" note="Visible in available offers" />
          </div>
          <Field label="Terms and conditions" className="mt-4" hint="One clear line or a short paragraph"><textarea value={form.terms} onChange={(event) => update('terms', event.target.value)} maxLength={1200} rows={4} className="admin-coupon-input min-h-[104px] py-3" placeholder="Cannot be combined with other offers." /></Field>
        </FormSection>
      </div>

      {message ? <p role="status" className={`mx-5 mb-4 rounded-xl px-4 py-3 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose/10 text-rose'}`}>{message.text}</p> : null}
      <div className="flex flex-wrap justify-end gap-3 border-t border-[#eadfd5] bg-[#fffdfb] px-5 py-4">
        {editing ? <button type="button" onClick={onCancel} disabled={saving} className="admin-btn-ghost"><X className="h-4 w-4" /> Cancel edit</button> : null}
        <button disabled={saving} className="admin-btn disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? 'Saving...' : editing ? 'Update Coupon' : 'Create Coupon'}</button>
      </div>
    </form>
  );
}

function FormSection({ title, note, children }) {
  return <fieldset className="rounded-2xl border border-[#eadfd5] p-4"><legend className="px-2 text-sm font-black text-charcoal">{title}</legend><p className="mb-4 text-xs text-slate-500">{note}</p>{children}</fieldset>;
}

function Field({ label, hint, required, className = '', children }) {
  return <label className={`block ${className}`}><span className="mb-1.5 flex items-center gap-1 text-xs font-bold text-slate-700">{label}{required ? <em className="not-italic text-rose">*</em> : null}</span>{children}{hint ? <span className="mt-1 block text-[10px] text-slate-400">{hint}</span> : null}</label>;
}

function NumberInput({ onChange, ...props }) {
  return <input type="number" {...props} onChange={(event) => onChange(event.target.value)} className="admin-coupon-input" />;
}

function DateTimeInput({ value, onChange }) {
  return <span className="relative block"><CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input type="datetime-local" value={value} onChange={(event) => onChange(event.target.value)} className="admin-coupon-input pl-10" /></span>;
}

function ChoiceGrid({ label, items, selected, onToggle }) {
  return <div><p className="mb-2 text-xs font-bold text-slate-700">{label}</p><div className="flex flex-wrap gap-2">{items.map(([value, text]) => { const active = selected.includes(value); return <button key={value} type="button" onClick={() => onToggle(value)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold ${active ? 'border-wine bg-wine text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{active ? <Check className="h-3 w-3" /> : null}{text}</button>; })}</div></div>;
}

function MultiSelect({ label, options, selected, onChange, emptyLabel }) {
  return <Field label={label} hint={selected.length ? `${selected.length} selected` : emptyLabel}><select multiple value={selected} onChange={(event) => onChange(Array.from(event.target.selectedOptions, (option) => option.value))} className="admin-coupon-input h-28 py-2">{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></Field>;
}

function Toggle({ checked, onChange, label, note }) {
  return <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"><span><strong className="block text-xs text-charcoal">{label}</strong><small className="mt-1 block text-[10px] text-slate-500">{note}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-rose" /></label>;
}

function sanitizeCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32);
}

function toLocalDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function couponToForm(coupon) {
  return {
    ...emptyCoupon, ...coupon, code: coupon.code || '', discountValue: coupon.discountValue ?? '',
    minOrderAmount: coupon.minOrderAmount ?? '0', maxDiscountAmount: coupon.maxDiscountAmount ?? '',
    validFrom: toLocalDateTime(coupon.validFrom), expiryDate: toLocalDateTime(coupon.expiryDate),
    usageLimit: coupon.usageLimit ?? '', customerLimit: coupon.customerLimit ?? '',
    applicablePaymentMethods: coupon.applicablePaymentMethods || [],
    applicableProducts: (coupon.applicableProducts || []).map((item) => String(item?._id || item)),
    applicableCategories: (coupon.applicableCategories || []).map((item) => String(item?._id || item)),
    firstOrderOnly: Boolean(coupon.firstOrderOnly), isPublic: coupon.isPublic !== false, isActive: coupon.isActive !== false,
  };
}

function validateForm(form) {
  if (!form.code.trim()) throw new Error('Coupon code is required.');
  if (Number(form.discountValue) <= 0) throw new Error('Discount value must be positive.');
  if (form.type === 'Percentage' && Number(form.discountValue) > 100) throw new Error('Percentage discount cannot exceed 100.');
  if (Number(form.minOrderAmount || 0) < 0 || Number(form.maxDiscountAmount || 0) < 0) throw new Error('Coupon amounts cannot be negative.');
  if (!form.expiryDate) throw new Error('Expiry date is required.');
  if (form.validFrom && new Date(form.expiryDate) <= new Date(form.validFrom)) throw new Error('Expiry date must be after the start date.');
  ['usageLimit', 'customerLimit'].forEach((field) => {
    if (form[field] !== '' && (!Number.isInteger(Number(form[field])) || Number(form[field]) < 0)) throw new Error('Usage limits must be whole numbers of 0 or more.');
  });
}

function toPayload(form) {
  return {
    code: sanitizeCode(form.code), title: form.title, description: form.description, terms: form.terms,
    type: form.type, discountValue: Number(form.discountValue),
    minOrderAmount: Number(form.minOrderAmount || 0), maxDiscountAmount: form.maxDiscountAmount === '' ? 0 : Number(form.maxDiscountAmount),
    usageLimit: form.usageLimit === '' ? 0 : Number(form.usageLimit), customerLimit: form.customerLimit === '' ? 0 : Number(form.customerLimit),
    validFrom: form.validFrom || null, expiryDate: form.expiryDate,
    applicablePaymentMethods: form.applicablePaymentMethods,
    applicableProducts: form.applicableProducts,
    applicableCategories: form.applicableCategories,
    firstOrderOnly: Boolean(form.firstOrderOnly),
    isPublic: Boolean(form.isPublic),
    isActive: Boolean(form.isActive),
  };
}
