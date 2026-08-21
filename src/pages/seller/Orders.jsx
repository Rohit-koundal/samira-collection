import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageState from '../../components/ui/PageState';

export default function SellerOrders() {
  const [items, setItems] = useState([]);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState({});

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/seller/orders'),
      api.get('/seller/shipping/provider').catch(() => null),
    ]).then(([data, nextProvider]) => {
      setItems(Array.isArray(data) ? data : data.items || []);
      setProvider(nextProvider);
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateStatus = async (order, orderStatus) => {
    try {
      await api.put(`/seller/orders/${order._id}/status`, { orderStatus });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveTracking = async (order) => {
    try {
      const value = tracking[order._id] || '';
      await api.put(`/seller/orders/${order._id}/shipment`, { trackingNumber: value, awb: value });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <PageState loading loadingLabel="Loading orders..." />;
  if (error) return <PageState error={error} onRetry={load} />;

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-black">Orders</h1>
      {provider?.note && <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-600 shadow-sm">{provider.note}</p>}
      {!items.length ? <PageState empty emptyTitle="No orders yet" /> : items.map((order) => (
        <div key={order._id} className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-black">{order.invoiceNumber || order._id}</p>
              <p className="text-sm text-slate-500">{order.user?.name || order.user?.phone} · {order.paymentMethod} · {order.orderStatus}</p>
            </div>
            <p className="font-black">Rs. {order.finalAmount}</p>
          </div>
          <select className="mt-3 h-10 rounded-xl border px-3 text-sm font-bold" value={order.orderStatus} onChange={(event) => updateStatus(order, event.target.value)}>
            {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => <option key={status}>{status}</option>)}
          </select>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              className="h-10 min-w-[180px] flex-1 rounded-xl border px-3 text-sm font-semibold"
              placeholder="Real AWB / tracking number"
              value={tracking[order._id] ?? order.shipment?.trackingNumber ?? order.shipment?.awb ?? ''}
              onChange={(event) => setTracking((current) => ({ ...current, [order._id]: event.target.value }))}
            />
            <button type="button" className="h-10 rounded-xl border px-4 text-sm font-black" onClick={() => saveTracking(order)}>Save tracking</button>
          </div>
        </div>
      ))}
    </section>
  );
}
