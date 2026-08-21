import { useState } from 'react';
import api from '../../services/api';

const emptyCoupon = {
  code: '',
  type: 'Percentage',
  discountValue: '',
  minOrderAmount: 0,
  maxDiscountAmount: '',
  expiryDate: '',
  usageLimit: '',
  customerLimit: '',
  firstOrderOnly: false,
  isActive: true,
};

export default function CouponForm({ onSaved }) {
  const [form, setForm] = useState(emptyCoupon);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      if (!form.code.trim()) throw new Error('Coupon code is required.');
      if (Number(form.discountValue) <= 0) throw new Error('Discount value must be positive.');
      if (form.type === 'Percentage' && Number(form.discountValue) > 100) throw new Error('Percentage discount cannot exceed 100.');
      if (!form.expiryDate) throw new Error('Expiry date is required.');
      await api.post('/admin/coupons', {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount || 0),
        maxDiscountAmount: Number(form.maxDiscountAmount || 0),
        usageLimit: Number(form.usageLimit || 0),
        customerLimit: Number(form.customerLimit || 0),
        firstOrderOnly: Boolean(form.firstOrderOnly),
        expiryDate: form.expiryDate,
        isActive: form.isActive,
      });
      setForm(emptyCoupon);
      setMessage('Coupon saved.');
      onSaved?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="admin-card grid gap-4 p-5 md:grid-cols-3">
      <Input placeholder="Coupon Code" value={form.code} onChange={(value) => update('code', value)} />
      <select value={form.type} onChange={(event) => update('type', event.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold"><option>Percentage</option><option>Flat</option></select>
      <Input type="number" placeholder="Discount Value %" value={form.discountValue} onChange={(value) => update('discountValue', value)} />
      <Input type="number" placeholder="Minimum Order Amount" value={form.minOrderAmount} onChange={(value) => update('minOrderAmount', value)} />
      <Input type="number" placeholder="Maximum Discount" value={form.maxDiscountAmount} onChange={(value) => update('maxDiscountAmount', value)} />
      <Input type="date" placeholder="Expiry Date" value={form.expiryDate} onChange={(value) => update('expiryDate', value)} />
      <Input type="number" placeholder="Usage Limit" value={form.usageLimit} onChange={(value) => update('usageLimit', value)} />
      <Input type="number" placeholder="Per-customer limit (0 = none)" value={form.customerLimit} onChange={(value) => update('customerLimit', value)} />
      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.firstOrderOnly} onChange={(event) => update('firstOrderOnly', event.target.checked)} className="accent-rose" /> First order only</label>
      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} className="accent-rose" /> Active</label>
      {message && <p className="text-sm font-bold text-wine">{message}</p>}
      <button disabled={saving} className="admin-btn disabled:opacity-60 md:col-span-3">{saving ? 'Saving...' : 'Save Coupon'}</button>
    </form>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder={placeholder} />;
}
