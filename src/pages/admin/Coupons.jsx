import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BadgePercent, CheckCircle2, Clock3, PencilLine, Plus, ToggleLeft, Trash2, Users } from 'lucide-react';
import CouponForm from '../../components/admin/CouponForm';
import ConfirmModal from '../../components/admin/ConfirmModal';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';
import { asCatalogList, fetchCategories } from '../../utils/catalogOptions';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [actionId, setActionId] = useState('');
  const [message, setMessage] = useState(null);
  const [loadError, setLoadError] = useState('');
  const loadSequence = useRef(0);

  const load = useCallback(async ({ quiet = false } = {}) => {
    const sequence = ++loadSequence.current;
    setLoadError('');
    if (!quiet) setLoading(true);
    try {
      const [couponData, productData, categoryData] = await Promise.all([
        api.get('/admin/coupons?admin=true'),
        api.get('/admin/products?admin=true'),
        fetchCategories(api),
      ]);
      if (sequence !== loadSequence.current) return;
      setCoupons(asList(couponData));
      setProducts(asCatalogList(productData));
      setCategories(categoryData);
    } catch (error) {
      if (sequence === loadSequence.current) setLoadError(error.message || 'Unable to load coupons.');
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); return () => { loadSequence.current += 1; }; }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return coupons.filter((coupon) => {
      const matchesSearch = [coupon.code, coupon.title, coupon.description].filter(Boolean).join(' ').toLowerCase().includes(term);
      return matchesSearch && (!status || couponStatus(coupon).key === status);
    });
  }, [coupons, query, status]);

  const stats = useMemo(() => ({
    total: coupons.length,
    live: coupons.filter((coupon) => couponStatus(coupon).key === 'live').length,
    scheduled: coupons.filter((coupon) => couponStatus(coupon).key === 'scheduled').length,
    redemptions: coupons.reduce((sum, coupon) => sum + Number(coupon.usedCount || 0), 0),
  }), [coupons]);

  const openCreate = () => {
    setEditingCoupon(null);
    setShowEditor(true);
    setMessage(null);
    window.setTimeout(() => document.getElementById('coupon-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setShowEditor(true);
    setMessage(null);
    window.setTimeout(() => document.getElementById('coupon-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const handleSaved = async (saved, mode) => {
    setCoupons((current) => mode === 'updated'
      ? current.map((item) => item._id === saved._id ? saved : item)
      : [saved, ...current]);
    setEditingCoupon(null);
    setShowEditor(false);
    setMessage({ type: 'success', text: `Coupon ${saved.code} ${mode} successfully.` });
  };

  const toggleStatus = async (coupon) => {
    if (actionId) return;
    setActionId(coupon._id);
    setMessage(null);
    try {
      const updated = await api.put(`/admin/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      setCoupons((current) => current.map((item) => item._id === coupon._id ? updated : item));
      if (editingCoupon?._id === coupon._id) setEditingCoupon(updated);
      setMessage({ type: 'success', text: `${coupon.code} ${updated.isActive ? 'activated' : 'paused'} successfully.` });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to change coupon status.' });
    } finally {
      setActionId('');
    }
  };

  const remove = async () => {
    if (!deleteTarget?._id || actionId) return;
    const target = deleteTarget;
    setActionId(target._id);
    setMessage(null);
    try {
      const result = await api.delete(`/admin/coupons/${target._id}`);
      if (result?.archived && result.coupon) {
        setCoupons((current) => current.map((item) => item._id === target._id ? result.coupon : item));
      } else {
        setCoupons((current) => current.filter((item) => item._id !== target._id));
      }
      if (editingCoupon?._id === target._id) {
        setEditingCoupon(null);
        setShowEditor(false);
      }
      setDeleteTarget(null);
      setMessage({ type: 'success', text: result?.message || 'Coupon deleted successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to delete coupon.' });
    } finally {
      setActionId('');
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Coupons" note="Create targeted offers and manage their schedule, limits and visibility.">
        <button type="button" onClick={openCreate} className="admin-btn"><Plus className="h-4 w-4" /> Create Coupon</button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={BadgePercent} label="Total coupons" value={stats.total} tone="wine" />
        <Metric icon={CheckCircle2} label="Live now" value={stats.live} tone="green" />
        <Metric icon={Clock3} label="Scheduled" value={stats.scheduled} tone="amber" />
        <Metric icon={Users} label="Redemptions" value={stats.redemptions} tone="blue" />
      </div>

      {showEditor ? <div id="coupon-editor"><CouponForm coupon={editingCoupon} products={products} categories={categories} onSaved={handleSaved} onCancel={() => { setEditingCoupon(null); setShowEditor(false); }} /></div> : null}

      {message ? <p role="status" className={`rounded-xl p-3 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose/10 text-rose'}`}>{message.text}</p> : null}

      <SearchFilterBar search={query} onSearch={setQuery} placeholder="Search coupon code, title or description">
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold">
          <option value="">All Status</option>
          <option value="live">Live</option>
          <option value="scheduled">Scheduled</option>
          <option value="expired">Expired</option>
          <option value="inactive">Paused</option>
        </select>
      </SearchFilterBar>

      <DataTable
        error={loadError} onRetry={load}
        loading={loading}
        emptyTitle="No coupons found"
        emptyNote="Create a coupon or clear the current filters."
        minWidth={1050}
        heads={['Offer', 'Discount', 'Conditions', 'Usage', 'Schedule', 'Visibility', 'Status', 'Actions']}
        rows={filtered.map((coupon) => {
          const state = couponStatus(coupon);
          return (
            <tr key={coupon._id} className="border-t border-slate-100 align-top">
              <td className="px-4 py-4"><span className="inline-flex rounded-md border border-dashed border-wine px-2 py-1 text-xs font-black text-wine">{coupon.code}</span>{coupon.title ? <span className="mt-2 block max-w-[190px] font-bold text-charcoal">{coupon.title}</span> : null}{coupon.description ? <span className="mt-1 block max-w-[220px] text-xs leading-4 text-slate-500">{shorten(coupon.description, 75)}</span> : null}</td>
              <td className="px-4 py-4"><strong className="text-charcoal">{coupon.type === 'Percentage' ? `${coupon.discountValue}%` : `Rs. ${formatNumber(coupon.discountValue)}`}</strong>{coupon.maxDiscountAmount ? <span className="mt-1 block text-xs text-slate-500">Up to Rs. {formatNumber(coupon.maxDiscountAmount)}</span> : null}</td>
              <td className="px-4 py-4 text-xs leading-5 text-slate-600"><span className="block">Min. Rs. {formatNumber(coupon.minOrderAmount || 0)}</span>{coupon.firstOrderOnly ? <span className="block font-bold text-wine">First order only</span> : null}<span className="block">{restrictionLabel(coupon)}</span></td>
              <td className="px-4 py-4"><strong>{formatNumber(coupon.usedCount || 0)}</strong><span className="block text-xs text-slate-500">of {coupon.usageLimit ? formatNumber(coupon.usageLimit) : 'unlimited'}</span>{coupon.customerLimit ? <span className="mt-1 block text-xs text-slate-500">{coupon.customerLimit}/customer</span> : null}</td>
              <td className="whitespace-nowrap px-4 py-4 text-xs"><span className="block text-slate-500">Starts {coupon.validFrom ? formatDate(coupon.validFrom) : 'immediately'}</span><span className="mt-1 block font-bold text-charcoal">Ends {formatDate(coupon.expiryDate)}</span></td>
              <td className="px-4 py-4"><StatusBadge value={coupon.isPublic === false ? 'Private' : 'Public'} /></td>
              <td className="px-4 py-4"><button type="button" onClick={() => toggleStatus(coupon)} disabled={!!actionId || state.key === 'expired'} title={state.key === 'expired' ? 'Edit the expiry date to reactivate this coupon' : `Click to ${coupon.isActive ? 'pause' : 'activate'}`}><StatusBadge value={state.label} /></button></td>
              <td className="px-4 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => openEdit(coupon)} disabled={!!actionId} className="admin-table-action-link disabled:opacity-40"><PencilLine className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={() => toggleStatus(coupon)} disabled={!!actionId || state.key === 'expired'} className="admin-table-action-link disabled:opacity-40"><ToggleLeft className="h-3.5 w-3.5" /> {coupon.isActive ? 'Pause' : 'Activate'}</button><button type="button" onClick={() => setDeleteTarget(coupon)} disabled={!!actionId} className="admin-table-action-link is-danger disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /> Delete</button></div></td>
            </tr>
          );
        })}
      />

      <ConfirmModal open={!!deleteTarget} title={deleteTarget?.usedCount ? 'Archive coupon?' : 'Delete coupon?'} message={deleteTarget?.usedCount ? `${deleteTarget.code} has redemption history, so it will be archived and hidden instead of permanently deleted.` : `Permanently delete ${deleteTarget?.code}?`} confirmLabel={deleteTarget?.usedCount ? 'Archive' : 'Delete'} onClose={() => !actionId && setDeleteTarget(null)} onConfirm={remove} />
    </section>
  );
}

function Metric({ icon: Icon, label, value, tone }) {
  const tones = { wine: 'bg-[#fff0f4] text-wine', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', blue: 'bg-sky-50 text-sky-700' };
  return <div className="admin-card flex items-center gap-3 p-4"><span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></span><span><small className="block text-xs font-bold text-slate-500">{label}</small><strong className="mt-1 block text-xl font-black text-charcoal">{formatNumber(value)}</strong></span></div>;
}

function couponStatus(coupon) {
  const now = Date.now();
  if (!coupon.isActive) return { key: 'inactive', label: 'Paused' };
  if (coupon.expiryDate && new Date(coupon.expiryDate).getTime() < now) return { key: 'expired', label: 'Expired' };
  if (coupon.validFrom && new Date(coupon.validFrom).getTime() > now) return { key: 'scheduled', label: 'Scheduled' };
  if (coupon.usageLimit && Number(coupon.usedCount || 0) >= Number(coupon.usageLimit)) return { key: 'inactive', label: 'Exhausted' };
  return { key: 'live', label: 'Live' };
}

function restrictionLabel(coupon) {
  const rules = [];
  if (coupon.applicableCategories?.length) rules.push(`${coupon.applicableCategories.length} categories`);
  if (coupon.applicableProducts?.length) rules.push(`${coupon.applicableProducts.length} products`);
  if (coupon.applicablePaymentMethods?.length) rules.push(coupon.applicablePaymentMethods.join(', '));
  return rules.length ? rules.join(' · ') : 'All products & payments';
}

function asList(value) {
  const items = Array.isArray(value) ? value : value?.items;
  if (!Array.isArray(items) || items.some(item => !item?._id)) throw new Error('Unable to read coupons. Please try again.');
  return items;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN');
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function shorten(value, max) {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
