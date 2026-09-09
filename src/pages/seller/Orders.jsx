import { useEffect, useState } from 'react';
import { Eye, PackageCheck, Save, Truck } from 'lucide-react';
import api from '../../services/api';
import PageState from '../../components/ui/PageState';

const STATUSES = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Exchange Requested', 'Returned', 'Refunded'];

export default function SellerOrders() {
  const [items, setItems] = useState([]);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState({});
  const [saving, setSaving] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/seller/orders'),
      api.get('/seller/shipping/provider').catch(() => null),
    ]).then(([data, nextProvider]) => {
      const rows = Array.isArray(data) ? data : data?.items;
      if (!Array.isArray(rows)) throw new Error('Unable to read orders. Please try again.');
      setItems(rows);
      setProvider(nextProvider?.selected || nextProvider);
      setError('');
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (order, orderStatus) => {
    if (saving) return;
    setSaving(order._id);
    setError('');
    try {
      const saved = await api.put(`/seller/orders/${order._id}/status`, { orderStatus });
      setItems((current) => current.map((item) => item._id === order._id ? { ...item, ...saved } : item));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving('');
    }
  };

  const saveTracking = async (order) => {
    if (saving) return;
    setSaving(order._id);
    setError('');
    try {
      const value = (tracking[order._id] ?? order.shipment?.trackingNumber ?? order.shipment?.awb ?? '').trim();
      if (!value) throw new Error('Enter a tracking number before saving.');
      const shipment = await api.put(`/seller/orders/${order._id}/shipment`, { trackingNumber: value, awb: value });
      setItems((current) => current.map((item) => item._id === order._id ? { ...item, shipment: { ...item.shipment, ...shipment } } : item));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving('');
    }
  };

  if (loading) return <PageState loading loadingLabel="Loading orders..." />;
  if (error && !items.length) return <PageState error={error} onRetry={load} />;

  return (
    <section className="mx-auto max-w-[1280px] space-y-5">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#591229] via-[#7d1d3c] to-[#a94261] p-5 text-white shadow-xl sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/65">Fulfilment workspace</p>
        <h1 className="mt-2 font-display text-3xl font-black">Orders</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/75">Update fulfilment, save a manual AWB and open the complete shipment, label and invoice workspace.</p>
      </header>
      {error && <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</p>}
      {provider?.note && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900"><strong>{provider.label || 'Delivery'}:</strong> {provider.note}</p>}
      {!items.length ? <PageState empty emptyTitle="No orders yet" /> : <div className="grid gap-4">{items.map((order) => (
        <article key={order._id} className="rounded-3xl border border-[#eaded6] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f0e7e1] pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9a5269]">Order</p>
              <p className="mt-1 font-black">{order.invoiceNumber || order._id}</p>
              <p className="mt-1 text-sm text-slate-500">{order.user?.name || order.shippingAddress?.fullName || order.user?.phone || 'Customer'} · {order.paymentMethod}</p>
            </div>
            <div className="text-right">
              <p className="font-black">Rs. {Number(order.finalAmount || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-500">{order.paymentStatus || 'Pending'}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-end">
            <label className="grid gap-2 text-xs font-black">
              Order status
              <select disabled={Boolean(saving)} aria-label={`Status for ${order.invoiceNumber || order._id}`} className="h-10 rounded-xl border px-3 text-sm font-bold" value={order.orderStatus} onChange={(event) => updateStatus(order, event.target.value)}>
                {STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            {provider?.name && provider.name !== 'manual' ? <div className="grid gap-2 text-xs font-black">
              {provider.label || 'Courier'} shipment
              <p className="flex min-h-10 items-center rounded-xl border border-[#eaded6] bg-[#fffaf7] px-3 text-sm font-semibold text-slate-600">Create the AWB, label and pickup from order details.</p>
            </div> : <div className="grid gap-2 text-xs font-black">
              Tracking number
              <div className="flex flex-wrap gap-2">
                <input className="h-10 min-w-[180px] flex-1 rounded-xl border px-3 text-sm font-semibold" placeholder="Real AWB / tracking number" aria-label={`Tracking number for ${order.invoiceNumber || order._id}`} disabled={Boolean(saving)} value={tracking[order._id] ?? order.shipment?.trackingNumber ?? order.shipment?.awb ?? ''} onChange={(event) => setTracking((current) => ({ ...current, [order._id]: event.target.value }))} />
                <button type="button" disabled={Boolean(saving)} className="flex h-10 items-center gap-2 rounded-xl border border-[#751d39] px-4 text-sm font-black text-[#751d39]" onClick={() => saveTracking(order)}><Save size={15} /> Save tracking</button>
              </div>
            </div>}
            <a href={`/seller/orders/detail?id=${order._id}`} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#751d39] px-4 text-sm font-black text-white"><Eye size={15} /> View details</a>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1"><PackageCheck size={14} />{order.orderStatus}</span>
            <span className="flex items-center gap-1"><Truck size={14} />{order.shipment?.status ? order.shipment.status.replaceAll('_', ' ') : 'Waiting for shipment'}</span>
          </div>
        </article>
      ))}</div>}
    </section>
  );
}
