import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Check, Crown, CreditCard, Gauge, Infinity as InfinityIcon, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/admin/PageHeader';
import PageState from '../../components/ui/PageState';
import { useAuth } from '../../context/AuthContext';
import { openRazorpayCheckout } from '../../utils/razorpayCheckout';

const CYCLES = [
  { id: 'monthly', label: 'Monthly', note: '30-day access' },
  { id: 'yearly', label: 'Yearly', note: '365-day access' },
  { id: 'lifetime', label: 'Lifetime', note: 'One payment' },
];
const FEATURE_LABELS = {
  catalog: 'Product catalogue', orders: 'Order management', inventory: 'Inventory control', coupons: 'Coupons', whatsapp: 'WhatsApp selling',
  socialImport: 'Social product import', aiProduct: 'AI product assistant', crm: 'Customer CRM', abandonedCart: 'Abandoned cart recovery',
  analytics: 'Business analytics', festival: 'Festival campaigns', advancedCustomization: 'Advanced store designer', socialStudio: 'Social studio',
  businessAssistant: 'Business assistant', shippingAutomation: 'Courier automation', multiStaff: 'Multi-staff access',
};
const LIMIT_LABELS = { products: 'Active products', ordersPerMonth: 'Orders this month' };

export default function Subscription() {
  const { notify, refreshProfile, user } = useAuth();
  const [data, setData] = useState(null);
  const [cycle, setCycle] = useState('yearly');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const load = async () => {
    setError('');
    try { setData(await api.get('/seller/subscription')); } catch (requestError) { setError(requestError.message); }
  };
  useEffect(() => { load(); }, []);
  const current = data?.subscription;
  const currentPlanIndex = useMemo(() => (data?.plans || []).findIndex((plan) => plan.id === current?.id), [current?.id, data?.plans]);

  const purchase = async (plan) => {
    if (busy) return;
    setBusy(plan.id);
    try {
      const checkout = await api.post('/seller/subscription/checkout', { plan: plan.id, billingCycle: cycle.toUpperCase() });
      await openRazorpayCheckout({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        orderId: checkout.orderId,
        name: user?.name,
        contact: user?.phone,
        storeName: checkout.storeName,
        description: `${plan.name} · ${cycle} subscription`,
        onSuccess: (response) => api.post('/seller/subscription/verify', response),
      });
      await Promise.all([load(), refreshProfile?.()]);
      notify(`${plan.name} access is active.`, 'success', 'Subscription updated');
    } catch (requestError) {
      if (requestError.message !== 'Payment cancelled') notify(requestError.message, 'error', 'Subscription');
    } finally { setBusy(''); }
  };

  if (!data && error) return <PageState error={error} onRetry={load} />;
  if (!data) return <PageState loading loadingLabel="Loading subscription..." />;

  return <section className="min-w-0 space-y-5">
    <PageHeader title="Plan & billing" note="Control your store access, limits and payment history from one place.">
      <button type="button" className="admin-btn-ghost" onClick={load}><RefreshCw size={16} /> Refresh</button>
    </PageHeader>

    <div className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
      <article className="overflow-hidden rounded-[24px] bg-gradient-to-br from-[#5e142b] via-[#7c203f] to-[#a94f6b] p-5 text-white shadow-lg sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/65">Current access</p><h2 className="mt-2 text-3xl font-black">{current.name}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/75">{statusCopy(current)}</p></div><span className={`rounded-full px-4 py-2 text-xs font-black ${current.status === 'ACTIVE' || current.status === 'TRIAL' ? 'bg-emerald-300 text-emerald-950' : 'bg-amber-200 text-amber-950'}`}>{current.status}</span></div>
        <div className="mt-7 grid gap-3 sm:grid-cols-3"><HeroMetric icon={CalendarClock} label="Billing" value={formatCycle(current.billingCycle)} /><HeroMetric icon={Gauge} label="Time left" value={current.billingCycle === 'LIFETIME' ? 'Lifetime' : current.daysRemaining == null ? 'No expiry' : `${current.daysRemaining} days`} /><HeroMetric icon={ShieldCheck} label="Data" value="Always retained" /></div>
      </article>
      <article className="rounded-[24px] border border-[#eadfd5] bg-white p-5 shadow-sm sm:p-6"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9a5269]">Usage this period</p><div className="mt-4 space-y-4">{Object.entries(current.limits || {}).map(([key, limit]) => <Usage key={key} label={LIMIT_LABELS[key] || key} value={data.usage?.[key] || 0} limit={limit} />)}</div></article>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#eadfd5] bg-white p-3 shadow-sm"><div className="flex items-center gap-2 px-2"><Sparkles className="text-[#8f2748]" size={18} /><div><p className="text-sm font-black">Choose your access period</p><p className="text-xs text-slate-500">Monthly and yearly purchases are prepaid access periods and renew only after a new payment. {data.pricing?.taxMode === 'EXCLUSIVE' ? `${data.pricing.gstPercent}% GST is added at checkout.` : data.pricing ? `Displayed prices include ${data.pricing.gstPercent}% GST.` : 'The final tax treatment is confirmed at checkout.'}</p></div></div><div className="grid w-full grid-cols-3 gap-2 sm:w-auto">{CYCLES.map((item) => <button key={item.id} type="button" onClick={() => setCycle(item.id)} className={`rounded-xl px-4 py-2 text-left text-xs font-black transition ${cycle === item.id ? 'bg-[#751d39] text-white shadow' : 'bg-[#faf6f3] text-slate-700 hover:bg-[#f2e6e9]'}`}><span className="block">{item.label}</span><span className={`mt-0.5 block text-[9px] ${cycle === item.id ? 'text-white/65' : 'text-slate-400'}`}>{item.note}</span></button>)}</div></div>

    <div className="grid gap-4 lg:grid-cols-3">{data.plans.map((plan, index) => {
      const baseAmount = Number(plan.prices?.[cycle] || 0);
      const taxAmount = data.pricing?.taxMode === 'EXCLUSIVE' ? Math.round(baseAmount * Number(data.pricing.gstPercent || 0) / 100) : 0;
      const amount = baseAmount + taxAmount;
      const yearlySaving = cycle === 'yearly' ? Math.max(0, Number(plan.prices?.monthly || 0) * 12 - Number(plan.prices?.yearly || 0)) : 0;
      const isCurrent = plan.id === current.id && ['ACTIVE', 'TRIAL'].includes(current.status);
      const lowerPlanBlocked = current.status === 'ACTIVE' && index < currentPlanIndex;
      const lifetimeBlocked = current.status === 'ACTIVE' && current.billingCycle === 'LIFETIME' && (cycle !== 'lifetime' || plan.id === current.id);
      const purchaseBlocked = lowerPlanBlocked || lifetimeBlocked;
      return <article key={plan.id} className={`relative flex flex-col overflow-hidden rounded-[24px] border bg-white p-5 shadow-sm sm:p-6 ${plan.id === 'PROFESSIONAL' ? 'border-[#a44462] ring-2 ring-[#a44462]/10' : 'border-[#eadfd5]'}`}>
        {plan.id === 'PROFESSIONAL' && <span className="absolute right-4 top-4 rounded-full bg-[#f6e7ec] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#751d39]">Most popular</span>}
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f7e9ed] text-[#751d39]">{index === 2 ? <Crown size={20} /> : index === 1 ? <Sparkles size={20} /> : <CreditCard size={20} />}</span><div><h2 className="text-xl font-black">{plan.name}</h2><p className="text-xs text-slate-500">{plan.description}</p></div></div>
        <div className="mt-5 flex items-end gap-1"><strong className="text-3xl font-black">₹{Number(amount).toLocaleString('en-IN')}</strong><span className="pb-1 text-xs font-semibold text-slate-500">{cycle === 'lifetime' ? ' once' : cycle === 'yearly' ? ' / year' : ' / month'}</span></div>
        {taxAmount > 0 && <p className="mt-1 text-[10px] font-semibold text-slate-500">₹{baseAmount.toLocaleString('en-IN')} + ₹{taxAmount.toLocaleString('en-IN')} GST</p>}
        {yearlySaving > 0 && <p className="mt-2 w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">Save ₹{yearlySaving.toLocaleString('en-IN')} yearly</p>}
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#fbf7f4] p-3 text-xs"><span><strong className="block text-sm">{Number(plan.limits.products).toLocaleString('en-IN')}</strong>products</span><span><strong className="block text-sm">{Number(plan.limits.ordersPerMonth).toLocaleString('en-IN')}</strong>orders / month</span></div>
        <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-700">{plan.features.slice(0, 8).map((feature) => <li key={feature} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />{FEATURE_LABELS[feature] || feature}</li>)}</ul>
        <button type="button" disabled={Boolean(busy) || !data.checkout.configured || purchaseBlocked} onClick={() => purchase(plan)} className={`mt-6 flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 ${plan.id === 'PROFESSIONAL' ? 'bg-[#751d39] text-white' : 'border border-[#8f2748] text-[#751d39]'}`}>{cycle === 'lifetime' && <InfinityIcon size={17} />}{busy === plan.id ? 'Opening payment...' : lifetimeBlocked && plan.id === current.id ? 'Lifetime already active' : lowerPlanBlocked ? 'Available after current plan' : isCurrent && current.billingCycle === cycle.toUpperCase() ? 'Extend this plan' : currentPlanIndex < index && current.status === 'ACTIVE' ? 'Upgrade now' : 'Choose plan'}</button>
      </article>;
    })}</div>
    {!data.checkout.configured && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Online subscription payment is being configured.</strong><p className="mt-1 text-xs">Ask the platform owner to activate or extend your plan from Master Control.</p></div>}
    <PaymentHistory items={data.payments} />
  </section>;
}

function statusCopy(current) {
  if (current.status === 'TRIAL') return `Your ${current.trialDays}-day free trial includes this plan. Subscribe before it ends to keep creating and selling.`;
  if (current.status === 'EXPIRED') return 'Your data is safe and remains available to view. Renew to create products, accept orders and make changes.';
  if (current.status === 'SUSPENDED') return current.renewalMessage || 'Access has been paused by the platform owner. Contact support for help.';
  return current.billingCycle === 'LIFETIME' ? 'Lifetime access is active for this store.' : 'Your store tools and selling access are active.';
}
function formatCycle(value) { return String(value || 'manual').toLowerCase().replace(/^./, (letter) => letter.toUpperCase()); }
function HeroMetric({ icon: Icon, label, value }) { return <div className="rounded-2xl bg-white/10 p-3"><Icon size={17} className="text-white/70" /><p className="mt-2 text-[9px] font-black uppercase tracking-wider text-white/50">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>; }
function Usage({ label, value, limit }) { const percent = limit ? Math.min(100, Math.round((value / limit) * 100)) : value ? 100 : 0; return <div><div className="flex justify-between gap-3 text-xs"><span className="font-bold text-slate-600">{label}</span><strong>{Number(value).toLocaleString('en-IN')} / {Number(limit).toLocaleString('en-IN')}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eee6e1]"><span className={`block h-full rounded-full ${percent >= 90 ? 'bg-amber-500' : 'bg-[#8f2748]'}`} style={{ width: `${percent}%` }} /></div></div>; }
function PaymentHistory({ items = [] }) { return <article className="rounded-[24px] border border-[#eadfd5] bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black">Payment history</h2><p className="mt-1 text-xs text-slate-500">Subscription receipts and payment references for this store.</p>{items.length ? <div className="mt-4 divide-y">{items.map((item) => <div key={item.id} className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><strong>{item.plan} · {formatCycle(item.billingCycle)}</strong><p className="text-xs text-slate-500">{new Date(item.paidAt || item.createdAt).toLocaleString('en-IN')}{item.paymentId ? ` · ${item.paymentId}` : ''}</p></div><strong>₹{Number(item.amount).toLocaleString('en-IN')}</strong><span className={`w-fit rounded-full px-3 py-1 text-[10px] font-black ${item.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{item.status}</span></div>)}</div> : <p className="mt-5 rounded-xl bg-[#fbf7f4] p-4 text-sm text-slate-500">No subscription payments yet.</p>}</article>; }
