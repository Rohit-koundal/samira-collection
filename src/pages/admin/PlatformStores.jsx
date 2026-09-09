import { useEffect, useState } from 'react';
import { AlertTriangle, Building2, CalendarClock, CheckCircle2, Crown, ExternalLink, Infinity as InfinityIcon, KeyRound, Plus, RefreshCw, Save, Store, X } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/admin/PageHeader';
import PageState from '../../components/ui/PageState';
import { useAuth } from '../../context/AuthContext';

const EMPTY = { name: '', slug: '', ownerName: '', ownerPhone: '', industry: 'fashion', plan: 'PROFESSIONAL', licenseStatus: 'TRIAL', licenseEndsAt: '' };

export default function PlatformStores() {
  const { notify } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [create, setCreate] = useState(EMPTY);
  const [edit, setEdit] = useState({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [industryPreview, setIndustryPreview] = useState(null);

  const load = async () => {
    setError('');
    try { setWorkspace(await api.get('/master')); } catch (requestError) { setError(requestError.message); }
  };
  useEffect(() => { load(); }, []);
  const industries = workspace?.industryOptions || workspace?.builtins || [];
  const plans = workspace?.plans || [];
  const planNames = new Map(plans.map((plan) => [plan.id, plan.name]));

  const run = async (key, task) => {
    if (busy) return;
    setBusy(key);
    try { await task(); } catch (requestError) { notify(requestError.message, 'error', 'Store portfolio'); }
    finally { setBusy(''); }
  };

  const createStore = () => run('create', async () => {
    const result = await api.post('/stores', create);
    setCreate(EMPTY);
    await load();
    notify(`${result.store.name} was created and assigned.`, 'success', 'Store created');
  });

  const save = (store, confirmed = false) => run(store.id, async () => {
    const values = edit[store.id] || toEdit(store);
    if (values.industry !== store.industry && !confirmed) {
      const preview = await api.get(`/master/stores/${store.id}/industry-impact?industry=${encodeURIComponent(values.industry)}`);
      setIndustryPreview({ store, values, preview });
      return;
    }
    const result = await api.patch(`/master/stores/${store.id}/platform`, { ...values, confirmIndustryChange: values.industry !== store.industry });
    setWorkspace((current) => ({ ...current, stores: current.stores.map((item) => item.id === store.id ? result.store : item) }));
    setEdit((current) => ({ ...current, [store.id]: toEdit(result.store) }));
    setIndustryPreview(null);
    notify(result.converted ? `${result.reviewProducts} existing products remain intact and should be reviewed against the new fields.` : 'Plan and licence saved.', result.converted ? 'warning' : 'success', result.converted ? 'Industry converted' : 'Store updated');
  });

  const grant = (store, cycle) => run(`grant-${store.id}`, async () => {
    const values = edit[store.id] || toEdit(store);
    const result = await api.patch(`/master/stores/${store.id}/platform`, { ...values, grantCycle: cycle });
    setWorkspace((current) => ({ ...current, stores: current.stores.map((item) => item.id === store.id ? result.store : item) }));
    setEdit((current) => ({ ...current, [store.id]: toEdit(result.store) }));
    notify(cycle === 'TRIAL' ? 'A fresh 30-day trial is active.' : `${cycle.toLowerCase()} access was granted.`, 'success', 'Subscription updated');
  });

  if (!workspace && error) return <PageState error={error} onRetry={load} />;
  if (!workspace) return <PageState loading loadingLabel="Loading store portfolio..." />;

  return (
    <section className="min-w-0 space-y-5">
      <PageHeader title="Store portfolio" note="Create, assign and control each business from one master workspace.">
        <button type="button" className="admin-btn-ghost" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</button>
      </PageHeader>

      <article className="admin-card overflow-hidden">
        <div className="bg-gradient-to-r from-[#68152f] to-[#9d3f5d] p-5 text-white sm:p-6"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15"><Plus /></span><div><p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">New client business</p><h2 className="text-xl font-black">Create an isolated seller store</h2></div></div><p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">Choose the industry before products are added. The owner receives seller access and only sees stores where they have an active membership.</p></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Store name"><input value={create.name} onChange={(event) => setCreate({ ...create, name: event.target.value })} placeholder="Client business name" /></Field>
          <Field label="Preferred URL slug"><input value={create.slug} onChange={(event) => setCreate({ ...create, slug: event.target.value })} placeholder="Generated if blank" /></Field>
          <Field label="Owner name"><input value={create.ownerName} onChange={(event) => setCreate({ ...create, ownerName: event.target.value })} placeholder="Required for a new number" /></Field>
          <Field label="Owner mobile"><input inputMode="numeric" value={create.ownerPhone} onChange={(event) => setCreate({ ...create, ownerPhone: event.target.value })} placeholder="Leave blank to own it" /></Field>
          <Field label="Business type"><select value={create.industry} onChange={(event) => setCreate({ ...create, industry: event.target.value })}>{industries.map((item) => <option key={item.industry} value={item.industry}>{item.name}</option>)}</select></Field>
          <Field label="Plan"><select value={create.plan} onChange={(event) => setCreate({ ...create, plan: event.target.value })}>{plans.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
          <Field label="Licence"><select value={create.licenseStatus} onChange={(event) => setCreate({ ...create, licenseStatus: event.target.value })}><option>TRIAL</option><option>ACTIVE</option><option>SUSPENDED</option><option>EXPIRED</option></select></Field>
          <Field label="Licence ends (optional)"><input type="date" value={create.licenseEndsAt} onChange={(event) => setCreate({ ...create, licenseEndsAt: event.target.value })} /></Field>
          {create.licenseStatus === 'TRIAL' && <p className="self-end rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 sm:col-span-2 xl:col-span-4">A 30-day trial expiry is set automatically when this field is blank.</p>}
          <div className="sm:col-span-2 xl:col-span-4"><button type="button" disabled={busy || create.name.trim().length < 2} onClick={createStore} className="admin-btn"><Plus className="h-4 w-4" />{busy === 'create' ? 'Creating...' : 'Create and assign store'}</button></div>
        </div>
      </article>

      <div className="grid gap-4 xl:grid-cols-2">
        {workspace.stores.map((store) => {
          const values = edit[store.id] || toEdit(store);
          return <article key={store.id} className="admin-card overflow-hidden">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b bg-[#fffaf7] p-5"><div className="flex min-w-0 gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f3e4e8] text-[#751d39]"><Store size={20} /></span><div className="min-w-0"><h2 className="truncate text-lg font-black">{store.name}</h2><p className="truncate text-xs font-semibold text-slate-500">/{store.slug} · {store.status}{store.isDefault ? ' · Default store' : ''}</p></div></div><a href={store.isDefault ? '/' : `/store/${store.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-black text-[#751d39]">Storefront <ExternalLink size={13} /></a></header>
            <div className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-4"><SmallMetric icon={Building2} label="Industry" value={industries.find((item) => item.industry === store.industry)?.name || store.industry} /><SmallMetric icon={KeyRound} label="Licence" value={store.platform.status} /><SmallMetric icon={CheckCircle2} label="Plan" value={planNames.get(store.platform.id) || store.platform.name} /><SmallMetric icon={CalendarClock} label="Access" value={store.platform.billingCycle === 'LIFETIME' ? 'Lifetime' : store.platform.daysRemaining == null ? store.platform.billingCycle : `${store.platform.daysRemaining} days left`} /></div>
              <div className="rounded-2xl border p-4 text-xs"><strong>{store.owner?.name || 'Platform owner'}</strong><p className="mt-1 text-slate-500">{store.owner?.phone || 'Owner assignment inherited'}{store.owner?.email ? ` · ${store.owner.email}` : ''}</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Industry preset"><select value={values.industry} onChange={(event) => setEdit({ ...edit, [store.id]: { ...values, industry: event.target.value } })}>{industries.map((item) => <option key={item.industry} value={item.industry}>{item.name}</option>)}</select></Field>
                <Field label="Plan"><select value={values.plan} onChange={(event) => setEdit({ ...edit, [store.id]: { ...values, plan: event.target.value } })}>{plans.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
                <Field label="Licence status"><select value={values.licenseStatus} onChange={(event) => setEdit({ ...edit, [store.id]: { ...values, licenseStatus: event.target.value } })}><option>TRIAL</option><option>ACTIVE</option><option>SUSPENDED</option><option>EXPIRED</option></select></Field>
                <Field label="Licence ends"><input type="date" value={values.licenseEndsAt} onChange={(event) => setEdit({ ...edit, [store.id]: { ...values, licenseEndsAt: event.target.value } })} /></Field>
              </div>
              <section className="rounded-2xl border border-[#eadfd5] bg-[#fffaf7] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-black">Access period</h3><p className="mt-1 text-xs text-slate-500">Grant access immediately without collecting an online payment.</p></div><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-[#751d39]">Master override</span></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><GrantButton icon={CalendarClock} label="30-day trial" onClick={() => grant(store, 'TRIAL')} disabled={Boolean(busy)} /><GrantButton icon={KeyRound} label="1 month" onClick={() => grant(store, 'MONTHLY')} disabled={Boolean(busy)} /><GrantButton icon={Crown} label="1 year" onClick={() => grant(store, 'YEARLY')} disabled={Boolean(busy)} /><GrantButton icon={InfinityIcon} label="Lifetime" onClick={() => grant(store, 'LIFETIME')} disabled={Boolean(busy)} /></div></section>
              <section className="rounded-2xl border p-4"><h3 className="text-sm font-black">Custom usage limits</h3><p className="mt-1 text-xs text-slate-500">Leave blank to use the selected plan default. These limits are enforced by the backend.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><LimitField label="Active products" value={values.limitOverrides.products} placeholder={planLimit(plans, values.plan, 'products')} onChange={(value) => changeLimit(setEdit, edit, store.id, values, 'products', value)} /><LimitField label="Orders per month" value={values.limitOverrides.ordersPerMonth} placeholder={planLimit(plans, values.plan, 'ordersPerMonth')} onChange={(value) => changeLimit(setEdit, edit, store.id, values, 'ordersPerMonth', value)} /></div></section>
              <Field label="Renewal / suspension message"><input value={values.renewalMessage} maxLength={300} onChange={(event) => setEdit({ ...edit, [store.id]: { ...values, renewalMessage: event.target.value } })} placeholder="Shown to this store owner when access needs attention" /></Field>
              {values.industry !== store.industry && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Saving will add the new industry fields and starter categories. Existing products and orders remain unchanged and must be reviewed.</p>}
              {store.migration?.status === 'REVIEW_REQUIRED' && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><div className="flex items-center gap-2 font-black"><AlertTriangle size={16} />Industry migration review</div><div className="mt-3 grid grid-cols-3 gap-2 text-center"><MigrationStat value={store.migration.totalProducts} label="Products" /><MigrationStat value={store.migration.missingRequired} label="Missing" /><MigrationStat value={store.migration.legacyAttributes} label="Legacy" /></div><a href="/admin/products" className="mt-3 inline-flex text-xs font-black text-wine underline">Review affected products</a></div>}
              <button type="button" disabled={Boolean(busy)} onClick={() => save(store)} className="admin-btn"><Save className="h-4 w-4" />{busy === store.id ? 'Saving...' : 'Save platform access'}</button>
            </div>
          </article>;
        })}
      </div>
      {!workspace.stores.length && <PageState empty emptyTitle="No stores created" />}
      {industryPreview && <IndustryPreviewModal data={industryPreview} busy={busy} onClose={() => setIndustryPreview(null)} onApply={() => save(industryPreview.store, true)} />}
    </section>
  );
}

function toEdit(store) { return { industry: store.industry, plan: store.platform.id, licenseStatus: store.platform.status, billingCycle: store.platform.billingCycle, licenseEndsAt: dateValue(store.platform.endsAt), renewalMessage: store.platform.renewalMessage || '', limitOverrides: { products: store.platform.limitOverrides?.products ?? '', ordersPerMonth: store.platform.limitOverrides?.ordersPerMonth ?? '' } }; }
function dateValue(value) { if (!value) return ''; const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : ''; }
function Field({ label, children }) { return <label className="grid min-w-0 gap-2 text-xs font-black">{label}<span className="[&>input]:h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:px-3 [&>input]:text-sm [&>input]:font-normal [&>select]:h-11 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:bg-white [&>select]:px-3 [&>select]:text-sm [&>select]:font-normal">{children}</span></label>; }
function SmallMetric({ icon: Icon, label, value }) { return <div className="rounded-2xl bg-[#fbf7f4] p-3"><Icon className="h-4 w-4 text-[#9a5269]" /><p className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-black">{value}</p></div>; }
function MigrationStat({ value, label }) { return <div className="rounded-xl bg-white p-2"><strong className="block text-base">{Number(value || 0)}</strong><span className="text-[10px] font-bold uppercase text-slate-500">{label}</span></div>; }
function GrantButton({ icon: Icon, label, onClick, disabled }) { return <button type="button" disabled={disabled} onClick={onClick} className="flex h-11 items-center justify-center gap-2 rounded-xl border bg-white text-xs font-black text-[#751d39] transition hover:border-[#9a5269] hover:bg-[#f8edf0] disabled:opacity-50"><Icon size={14} />{label}</button>; }
function LimitField({ label, value, placeholder, onChange }) { return <label className="grid gap-1.5 text-xs font-bold text-slate-700">{label}<input type="number" min="0" step="1" value={value} placeholder={`Plan default: ${Number(placeholder || 0).toLocaleString('en-IN')}`} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border bg-white px-3 text-sm font-normal" /></label>; }
function planLimit(plans, planId, key) { return plans.find((plan) => plan.id === planId)?.limits?.[key] || 0; }
function changeLimit(setEdit, edit, storeId, values, key, value) { setEdit({ ...edit, [storeId]: { ...values, limitOverrides: { ...values.limitOverrides, [key]: value } } }); }

function IndustryPreviewModal({ data, busy, onClose, onApply }) {
  const impact = data.preview.impact || {};
  return <div className="fixed inset-0 z-[120] flex items-end bg-black/55 sm:items-center sm:justify-center sm:p-5" role="dialog" aria-modal="true" aria-label="Review industry change">
    <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-white shadow-2xl sm:max-w-3xl sm:rounded-[28px]">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white p-5 sm:p-6"><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9a5269]">Safe industry migration</p><h2 className="mt-1 text-xl font-black sm:text-2xl">{data.preview.from.name} → {data.preview.to.name}</h2><p className="mt-2 text-sm text-slate-500">Existing product, order, customer and historical attribute data will remain stored.</p></div><button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border" aria-label="Close"><X size={18} /></button></header>
      <div className="space-y-4 p-5 sm:p-6"><div className="grid grid-cols-3 gap-3"><MigrationStat value={impact.totalProducts} label="Need review" /><MigrationStat value={impact.missingRequired} label="Missing fields" /><MigrationStat value={impact.legacyAttributes} label="Legacy data" /></div>
        <div className="grid gap-4 sm:grid-cols-2"><Impact title="This will add" items={[...(impact.addedCategories || []).map((item) => `${item} category`), ...(impact.addedAttributes || []), ...(impact.variantAttributes?.length ? [`${impact.variantAttributes.join(' × ')} variants`] : [])]} tone="green" /><Impact title="These fields become inactive" items={impact.inactiveAttributes} tone="amber" /></div>
        <Impact title="Product page sections" items={impact.productSections} tone="neutral" />
        <div className="rounded-2xl bg-[#f8f3ef] p-4 text-xs leading-5 text-slate-600"><strong className="text-slate-900">Reversible:</strong> the current configuration is saved before switching. Switching back restores its previous definition and values.</div>
      </div>
      <footer className="sticky bottom-0 grid grid-cols-2 gap-3 border-t bg-white p-4 sm:flex sm:justify-end sm:p-5"><button type="button" onClick={onClose} className="h-12 rounded-xl border px-5 text-sm font-black">Cancel</button><button type="button" disabled={Boolean(busy)} onClick={onApply} className="h-12 rounded-xl bg-wine px-5 text-sm font-black text-white">{busy ? 'Applying...' : 'Apply industry'}</button></footer>
    </div>
  </div>;
}

function Impact({ title, items = [], tone }) {
  const colors = tone === 'green' ? 'border-emerald-200 bg-emerald-50' : tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50';
  return <section className={`rounded-2xl border p-4 ${colors}`}><h3 className="text-sm font-black">{title}</h3>{items.length ? <ul className="mt-3 space-y-2 text-xs text-slate-700">{items.slice(0, 12).map((item) => <li key={item}>• {String(item).replace(/-/g, ' ')}</li>)}</ul> : <p className="mt-2 text-xs text-slate-500">No structural changes in this section.</p>}</section>;
}
