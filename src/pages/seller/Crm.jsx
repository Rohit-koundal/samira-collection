import { useEffect, useMemo, useState } from 'react';
import { Check, Crown, Filter, MessageCircle, RefreshCw, Search, Send, Users } from 'lucide-react';
import api from '../../services/api';
import PageState from '../../components/ui/PageState';

const SEGMENTS = ['All customers', 'VIP', 'Repeat Customer', 'New Customer', 'Inactive', 'Instagram Customer', 'WhatsApp Customer', 'Frequent Return', 'High RTO'];
const EDITABLE_TAGS = ['VIP', 'Repeat Customer', 'New Customer', 'Inactive', 'At Risk', 'Wholesale', 'Instagram Customer', 'WhatsApp Customer', 'Frequent Return', 'High RTO'];

export default function SellerCrm() {
  const [items, setItems] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState('All customers');
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState('');
  const [offer, setOffer] = useState({ channel: 'IN_APP', title: 'A special offer for you', message: '', couponCode: '' });
  const [prepared, setPrepared] = useState([]);
  const [editing, setEditing] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const notify = (message, type = 'info', title = '') => setFeedback({ message, type, title });

  const load = async () => {
    setError('');
    try {
      const [customers, storeCoupons] = await Promise.all([api.get('/seller/crm'), api.get('/seller/coupons')]);
      setItems(Array.isArray(customers) ? customers : customers.items || []);
      setCoupons((Array.isArray(storeCoupons) ? storeCoupons : storeCoupons.items || []).filter((coupon) => coupon.isActive));
    } catch (requestError) { setError(requestError.message); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => (items || []).filter((row) => {
    const text = [row.name, row.phone, row.email, row.acquisition, ...(row.tags || [])].filter(Boolean).join(' ').toLowerCase();
    return (!query.trim() || text.includes(query.trim().toLowerCase())) && (segment === 'All customers' || row.tags?.includes(segment));
  }), [items, query, segment]);
  const stats = useMemo(() => ({
    total: items?.length || 0,
    repeat: (items || []).filter((row) => row.orders >= 2).length,
    vip: (items || []).filter((row) => row.tags?.includes('VIP')).length,
    spend: Math.max(0, ...(items || []).map((row) => Number(row.spend || 0))),
  }), [items]);

  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleVisible = () => {
    const visibleIds = filtered.map((row) => row.userId);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
    setSelected((current) => allSelected ? current.filter((id) => !visibleIds.includes(id)) : [...new Set([...current, ...visibleIds])]);
  };

  const sendOffer = async () => {
    if (!selected.length || busy) return;
    setBusy('offer'); setPrepared([]);
    try {
      const result = await api.post('/seller/business/customer-offers', { ...offer, customerIds: selected });
      if (result.channel === 'WHATSAPP_LINK') {
        setPrepared(result.items || []);
        notify(`${result.prepared} WhatsApp messages are ready for your review.`, 'success', 'Offer prepared');
      } else {
        notify(`${result.sent} customer${result.sent === 1 ? '' : 's'} received the offer${result.skipped ? `; ${result.skipped} recent duplicate${result.skipped === 1 ? ' was' : 's were'} skipped` : ''}.`, 'success', 'Offer sent');
        setSelected([]);
      }
    } catch (requestError) { notify(requestError.message, 'error', 'Customer offer'); }
    finally { setBusy(''); }
  };

  const saveCustomer = async () => {
    if (!editing || busy) return;
    setBusy('customer');
    try {
      const saved = await api.put(`/seller/crm/${editing.userId}`, {
        tags: editing.tags,
        notes: editing.notes || '',
        acquisition: editing.acquisition || '',
        marketingConsent: editing.marketingConsent === true,
      });
      setItems((current) => current.map((row) => row.userId === editing.userId ? { ...row, ...saved } : row));
      setEditing(null);
      notify('Customer profile saved.', 'success', 'CRM');
    } catch (requestError) { notify(requestError.message, 'error', 'CRM'); }
    finally { setBusy(''); }
  };

  if (!items && !error) return <PageState loading loadingLabel="Loading customer intelligence..." />;
  if (!items && error) return <PageState error={error} onRetry={load} />;

  return (
    <section className="mx-auto max-w-[1440px] space-y-5 text-slate-900">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#591229] via-[#7d1d3c] to-[#ad4c68] p-5 text-white shadow-xl sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-white/65">Customer intelligence</p><h1 className="mt-2 font-display text-3xl font-black">Smart CRM</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">Find valuable customer groups, keep useful notes and prepare respectful offers from one place.</p></div><button type="button" onClick={load} className="flex h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-black hover:bg-white/20"><RefreshCw size={16} /> Refresh</button></div>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Customers" value={stats.total} icon={Users} /><Metric label="Repeat buyers" value={stats.repeat} icon={RefreshCw} /><Metric label="VIP customers" value={stats.vip} icon={Crown} /><Metric label="Highest spend" value={`₹${money(stats.spend)}`} icon={Check} /></div>
      </header>

      {error && <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</p>}
      {feedback && <div role={feedback.type === 'error' ? 'alert' : 'status'} className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm ${feedback.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}><p><strong>{feedback.title ? `${feedback.title}: ` : ''}</strong>{feedback.message}</p><button type="button" onClick={() => setFeedback(null)} className="font-black" aria-label="Dismiss message">Close</button></div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="min-w-0 overflow-hidden rounded-3xl border border-[#eaded6] bg-white shadow-sm">
          <div className="grid gap-3 border-b p-4 sm:grid-cols-[1fr_220px]">
            <label className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input aria-label="Search customers" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone, email or tag" className="h-11 w-full rounded-xl border pl-10 pr-3 text-sm outline-none focus:border-[#751d39]" /></label>
            <label className="relative"><Filter className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><select aria-label="Customer segment" value={segment} onChange={(event) => setSegment(event.target.value)} className="h-11 w-full rounded-xl border bg-white pl-10 pr-3 text-sm font-bold">{SEGMENTS.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <div className="flex items-center justify-between gap-3 border-b bg-[#fffaf7] px-4 py-3 text-xs font-bold"><label className="flex items-center gap-2"><input type="checkbox" aria-label="Select visible customers" checked={filtered.length > 0 && filtered.every((row) => selected.includes(row.userId))} onChange={toggleVisible} /> Select visible</label><span>{filtered.length} shown · {selected.length} selected</span></div>
          {!filtered.length ? <PageState empty emptyTitle="No customers match this segment" /> : <div className="divide-y">
            {filtered.map((row) => <div key={row.userId} className="grid gap-4 p-4 hover:bg-[#fffcfa] md:grid-cols-[auto_minmax(180px,1fr)_repeat(4,minmax(70px,auto))_auto] md:items-center">
              <input type="checkbox" aria-label={`Select ${row.name || row.phone || 'customer'}`} checked={selected.includes(row.userId)} onChange={() => toggle(row.userId)} />
              <div className="min-w-0"><p className="truncate font-black">{row.name || 'Customer'}</p><p className="truncate text-xs text-slate-500">{row.phone || row.email || row.userId}</p><div className="mt-2 flex flex-wrap gap-1">{(row.tags || []).slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-[#f8e9ee] px-2 py-1 text-[10px] font-black text-[#751d39]">{tag}</span>)}</div></div>
              <Cell label="Orders" value={row.orders} /><Cell label="Spend" value={`₹${money(row.spend)}`} /><Cell label="AOV" value={`₹${money(row.aov)}`} /><Cell label="Last order" value={row.lastOrderAt ? new Date(row.lastOrderAt).toLocaleDateString('en-IN') : '—'} />
              <button type="button" onClick={() => setEditing({ ...row, tags: [...(row.tags || [])] })} className="h-9 rounded-xl border px-3 text-xs font-black text-[#751d39]">Manage</button>
            </div>)}
          </div>}
        </article>

        <aside className="h-fit rounded-3xl border border-[#eaded6] bg-white p-5 shadow-sm xl:sticky xl:top-5">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#751d39] text-white"><Send size={19} /></span><div><p className="text-xs font-black uppercase tracking-wider text-[#9a5269]">Selected audience</p><h2 className="text-lg font-black">Prepare an offer</h2></div></div>
          <p className="mt-4 rounded-xl bg-[#fbf6f2] p-3 text-xs leading-5 text-slate-600"><strong>{selected.length} selected.</strong> In-app duplicates are skipped for seven days. WhatsApp messages require recorded consent, open for your review and are never sent automatically.</p>
          <div className="mt-4 grid gap-3">
            <Field label="Channel"><select value={offer.channel} onChange={(event) => setOffer({ ...offer, channel: event.target.value })}><option value="IN_APP">In-app notification</option><option value="WHATSAPP_LINK">WhatsApp review</option></select></Field>
            <Field label="Offer title"><input value={offer.title} maxLength={100} onChange={(event) => setOffer({ ...offer, title: event.target.value })} /></Field>
            <Field label="Coupon"><select value={offer.couponCode} onChange={(event) => setOffer({ ...offer, couponCode: event.target.value })}><option value="">No coupon</option>{coupons.map((coupon) => <option key={coupon._id} value={coupon.code}>{coupon.code}</option>)}</select></Field>
            <Field label="Message"><textarea value={offer.message} maxLength={500} onChange={(event) => setOffer({ ...offer, message: event.target.value })} placeholder="Optional personal offer message" /></Field>
            <button type="button" disabled={!selected.length || busy === 'offer' || (offer.channel === 'WHATSAPP_LINK' && selected.length > 10)} onClick={sendOffer} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#751d39] px-4 text-sm font-black text-white disabled:opacity-50"><Send size={15} />{busy === 'offer' ? 'Preparing...' : offer.channel === 'IN_APP' ? 'Send selected offer' : 'Prepare WhatsApp messages'}</button>
            {offer.channel === 'WHATSAPP_LINK' && selected.length > 10 && <p className="text-xs font-bold text-amber-700">Choose at most 10 customers for WhatsApp review.</p>}
          </div>
          {prepared.length > 0 && <div className="mt-5 border-t pt-4"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Review messages</p><div className="mt-3 grid gap-2">{prepared.map((item) => item.available ? <a key={item.customerId} href={item.url} target="_blank" rel="noreferrer" className="flex h-10 items-center justify-between rounded-xl bg-emerald-600 px-3 text-xs font-black text-white"><span className="truncate">{item.name}</span><MessageCircle size={15} /></a> : <p key={item.customerId} className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">{item.name}: {item.reason || 'WhatsApp message unavailable'}</p>)}</div></div>}
        </aside>
      </div>

      {editing && <div className="fixed inset-0 z-[100] grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Manage customer"><div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-[#9a5269]">Customer profile</p><h2 className="mt-1 text-xl font-black">{editing.name || editing.phone || 'Customer'}</h2></div><button type="button" onClick={() => setEditing(null)} className="rounded-xl border px-3 py-2 text-xs font-black">Close</button></div><div className="mt-5"><p className="text-xs font-black">Tags</p><div className="mt-2 flex flex-wrap gap-2">{EDITABLE_TAGS.map((tag) => <button key={tag} type="button" onClick={() => setEditing((current) => ({ ...current, tags: current.tags.includes(tag) ? current.tags.filter((item) => item !== tag) : [...current.tags, tag] }))} className={`rounded-full border px-3 py-2 text-xs font-bold ${editing.tags.includes(tag) ? 'border-[#751d39] bg-[#751d39] text-white' : ''}`}>{tag}</button>)}</div></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Acquisition source"><input value={editing.acquisition || ''} maxLength={80} onChange={(event) => setEditing({ ...editing, acquisition: event.target.value })} /></Field><Field label="Internal notes"><textarea value={editing.notes || ''} maxLength={2000} onChange={(event) => setEditing({ ...editing, notes: event.target.value })} /></Field></div><label className="mt-4 flex items-start gap-3 rounded-2xl border border-[#eaded6] bg-[#fffaf7] p-4 text-sm"><input type="checkbox" checked={editing.marketingConsent === true} onChange={(event) => setEditing({ ...editing, marketingConsent: event.target.checked })} className="mt-1" /><span><strong className="block text-slate-900">Customer agreed to marketing messages</strong><span className="mt-1 block text-xs leading-5 text-slate-500">Enable only when the customer has clearly given permission. Removing consent immediately blocks new WhatsApp offers.</span></span></label><button type="button" disabled={busy === 'customer'} onClick={saveCustomer} className="mt-5 h-11 rounded-xl bg-[#751d39] px-6 text-sm font-black text-white">{busy === 'customer' ? 'Saving...' : 'Save customer profile'}</button></div></div>}
    </section>
  );
}

function Metric({ label, value, icon: Icon }) { return <div className="rounded-2xl border border-white/15 bg-white/10 p-4"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-white/65"><Icon size={14} />{label}</div><p className="mt-2 text-xl font-black">{value}</p></div>; }
function Cell({ label, value }) { return <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 md:hidden">{label}</p><p className="text-sm font-bold">{value}</p></div>; }
function Field({ label, children }) { return <label className="grid gap-2 text-xs font-black">{label}<span className="[&>input]:h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:px-3 [&>input]:text-sm [&>input]:font-normal [&>select]:h-11 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:bg-white [&>select]:px-3 [&>select]:text-sm [&>select]:font-normal [&>textarea]:min-h-24 [&>textarea]:w-full [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:p-3 [&>textarea]:text-sm [&>textarea]:font-normal">{children}</span></label>; }
function money(value) { return Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
