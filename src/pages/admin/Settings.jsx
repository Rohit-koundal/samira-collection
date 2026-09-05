import { useEffect, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import api from '../../services/api';

const fields = [
  ['storeName', 'Store Name'],
  ['legalBusinessName', 'Legal business name'],
  ['gstin', 'GSTIN'],
  ['invoicePrefix', 'Invoice prefix'],
  ['contactEmail', 'Contact Email'],
  ['contactPhone', 'Contact Phone'],
  ['whatsappNumber', 'WhatsApp Number'],
  ['address', 'Store Address'],
  ['billingAddress', 'Billing address on invoices'],
  ['freeShippingMinAmount', 'Free Shipping Minimum Amount', 'number'],
  ['deliveryCharge', 'Delivery Charge', 'number'],
  ['platformFee', 'Platform Fee', 'number'],
  ['gstRate', 'GST rate % (shown as inclusive)', 'number'],
  ['codCharge', 'COD Charge (added to COD orders)', 'number'],
  ['codMaxAmount', 'COD Max Order Amount (0 = no limit)', 'number'],
  ['codMinAmount', 'COD Min Order Amount (0 = no minimum)', 'number'],
  ['prepaidDiscountValue', 'Prepaid discount value', 'number'],
  ['rtoBlockMinOrders', 'RTO block min orders (0 = off)', 'number'],
  ['rtoBlockThreshold', 'RTO block rate 0-1 (0 = off)', 'number'],
  ['returnWindowDays', 'Return window (days)', 'number'],
  ['footerText', 'Footer Text'],
];

export default function Settings() {
  const [form, setForm] = useState({});
  const [paymentReadiness, setPaymentReadiness] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  useEffect(() => {
    Promise.all([
      api.get('/admin/settings'),
      api.get('/admin/settings/payment-readiness'),
    ]).then(([settings, readiness]) => {
      setForm(settings);
      setPaymentReadiness(readiness);
    }).catch((error) => setMessage(error.message));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      if (!form.storeName?.trim()) throw new Error('Store name is required.');
      if (form.contactEmail && !/^\S+@\S+\.\S+$/.test(form.contactEmail)) throw new Error('Enter a valid email.');
      const saved = await api.put('/admin/settings', {
        ...form,
        freeShippingMinAmount: Number(form.freeShippingMinAmount || 0),
        deliveryCharge: Number(form.deliveryCharge || 0),
        platformFee: Number(form.platformFee ?? 23),
        gstRate: Number(form.gstRate ?? 5),
        codCharge: Number(form.codCharge || 0),
        codMaxAmount: Number(form.codMaxAmount || 0),
        codMinAmount: Number(form.codMinAmount || 0),
        prepaidDiscountValue: Number(form.prepaidDiscountValue || 0),
        rtoBlockMinOrders: Number(form.rtoBlockMinOrders || 0),
        rtoBlockThreshold: Number(form.rtoBlockThreshold || 0),
        prepaidDiscountType: form.prepaidDiscountType || '',
        codPincodes: form.codPincodes,
        returnWindowDays: Number(form.returnWindowDays || 7),
      });
      setForm(saved);
      setPaymentReadiness(await api.get('/admin/settings/payment-readiness'));
      setMessage('Settings saved successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Website Settings" note="Control store details, policies and footer content." />
      <form onSubmit={submit} className="admin-card grid gap-4 p-5 md:grid-cols-2">
        {fields.map(([field, label, type = 'text']) => <Input key={field} type={type} label={label} value={form[field] ?? ''} onChange={(value) => update(field, value)} />)}
        <section className="rounded-2xl border border-[#eadfd5] bg-[#fbf8f4] p-4 md:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Online payment gateway</h2>
              <p className="mt-1 text-sm text-slate-600">UPI, cards, net banking and wallets are processed securely by Razorpay.</p>
            </div>
            <GatewayStatus readiness={paymentReadiness} />
          </div>

          {paymentReadiness && !paymentReadiness.configured ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend environment, then restart the server. Online methods stay unavailable until both keys are present.
            </p>
          ) : null}
          {paymentReadiness?.configured && !paymentReadiness.webhookConfigured ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              Add RAZORPAY_WEBHOOK_SECRET before going live so successful payments are recovered even if the customer closes the browser.
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              ['razorpayEnabled', 'Accept online payments'],
              ['upiEnabled', 'UPI'],
              ['cardPaymentEnabled', 'Credit / Debit Card'],
              ['netBankingEnabled', 'Net Banking'],
              ['walletEnabled', 'Wallet'],
            ].map(([field, label]) => (
              <label key={field} className="flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={!!form[field]}
                  disabled={field === 'razorpayEnabled' && !paymentReadiness?.configured}
                  onChange={(event) => update(field, event.target.checked)}
                  className="accent-rose disabled:cursor-not-allowed"
                />
                {label}
              </label>
            ))}
          </div>
        </section>

        <div className="grid gap-3 rounded-2xl bg-[#fbf8f4] p-4 md:col-span-2 md:grid-cols-3">
          {[
            ['codEnabled', 'COD Enabled'],
            ['codConfirmationRequired', 'COD confirmation required'],
            ['rtoBlockEnabled', 'RTO COD blocking (only with thresholds)'],
          ].map(([field, label]) => <label key={field} className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={!!form[field]} onChange={(event) => update(field, event.target.checked)} className="accent-rose" /> {label}</label>)}
        </div>
        <Input label="COD pincodes (comma separated, empty = all)" value={Array.isArray(form.codPincodes) ? form.codPincodes.join(', ') : (form.codPincodes || '')} onChange={(value) => update('codPincodes', value)} />
        <label className="text-sm font-bold">Prepaid discount type
          <select className="mt-1 h-11 w-full rounded-xl border px-3 font-semibold" value={form.prepaidDiscountType || ''} onChange={(event) => update('prepaidDiscountType', event.target.value)}>
            <option value="">None</option>
            <option value="Flat">Flat</option>
            <option value="Percentage">Percentage</option>
          </select>
        </label>
        <Textarea label="Return Policy" value={form.returnPolicy || ''} onChange={(value) => update('returnPolicy', value)} />
        <Textarea label="Shipping Policy" value={form.shippingPolicy || ''} onChange={(value) => update('shippingPolicy', value)} />
        <Textarea label="Cancellation Policy" value={form.cancellationPolicy || ''} onChange={(value) => update('cancellationPolicy', value)} />
        <Textarea label="Size Guide" value={form.sizeGuide || ''} onChange={(value) => update('sizeGuide', value)} />
        <Textarea label="FAQs" value={form.faqs || ''} onChange={(value) => update('faqs', value)} />
        <Textarea label="Our Story" value={form.ourStory || ''} onChange={(value) => update('ourStory', value)} />
        <Textarea label="Privacy Policy" value={form.privacyPolicy || ''} onChange={(value) => update('privacyPolicy', value)} />
        <Textarea label="Terms and Conditions" value={form.termsConditions || ''} onChange={(value) => update('termsConditions', value)} />
        <div className="grid gap-3 rounded-2xl bg-[#fbf8f4] p-4 md:col-span-2 md:grid-cols-3">
          <Input label="Instagram Link" value={form.socialLinks?.instagram || ''} onChange={(value) => update('socialLinks', { ...form.socialLinks, instagram: value })} />
          <Input label="Facebook Link" value={form.socialLinks?.facebook || ''} onChange={(value) => update('socialLinks', { ...form.socialLinks, facebook: value })} />
          <Input label="YouTube Link" value={form.socialLinks?.youtube || ''} onChange={(value) => update('socialLinks', { ...form.socialLinks, youtube: value })} />
        </div>
        {message && <p className="text-sm font-bold text-wine md:col-span-2">{message}</p>}
        <button disabled={saving} className="admin-btn md:col-span-2 disabled:opacity-60">{saving ? 'Saving...' : 'Save Settings'}</button>
      </form>
    </section>
  );
}

function GatewayStatus({ readiness }) {
  if (!readiness) return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Checking...</span>;
  if (readiness.ready) {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase text-emerald-800">
        Ready · {readiness.mode} mode
      </span>
    );
  }
  return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase text-amber-900">Setup required</span>;
}

function Input({ label, value, onChange, type = 'text' }) {
  return <label className="grid gap-2 text-sm font-semibold">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border border-[#eadfd5] px-4 text-sm" /></label>;
}

function Textarea({ label, value, onChange }) {
  return <label className="grid gap-2 text-sm font-semibold md:col-span-2">{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-28 rounded-xl border border-[#eadfd5] p-4 text-sm" /></label>;
}
