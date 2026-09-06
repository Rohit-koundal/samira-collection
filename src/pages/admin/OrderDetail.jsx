import { useCallback, useEffect, useRef, useState } from 'react';
import Receipt from '../../components/order/Receipt';
import ReceiptActions from '../../components/order/ReceiptActions';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';

const orderStatuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Exchange Requested', 'Returned', 'Refunded'];
const paymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];

export default function OrderDetail({ route = '' }) {
  const orderId = new URLSearchParams(route.split('?')[1] || '').get('id');
  const [order, setOrder] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [message, setMessage] = useState('');
  const [receiptError, setReceiptError] = useState('');
  const [saving, setSaving] = useState(false);
  const loadVersion = useRef(0);
  const mutationVersion = useRef(0);
  const mutationPending = useRef(false);
  const [shipmentForm, setShipmentForm] = useState({ courierName: '', trackingNumber: '', trackingUrl: '', awb: '' });

  const loadReceipt = useCallback(async (version = loadVersion.current) => {
    setReceiptError('');
    try {
      const data = await api.get(`/admin/orders/${orderId}/receipt`);
      if (version === loadVersion.current) setReceipt(data);
    } catch (error) { if (version === loadVersion.current) setReceiptError(error.message || 'Invoice could not load.'); }
  }, [orderId]);
  const load = useCallback(async () => {
    if (!orderId) { setMessage('Choose an order from the orders list.'); return; }
    const version = ++loadVersion.current;
    loadReceipt(version);
    try {
      const data = await api.get(`/admin/orders/${orderId}`);
      if (version !== loadVersion.current) return;
      setOrder(data);
      setMessage('');
      setShipmentForm({
        courierName: data.shipment?.courierName || '',
        trackingNumber: data.shipment?.trackingNumber || '',
        trackingUrl: data.shipment?.trackingUrl || '',
        awb: data.shipment?.awb || '',
      });
    } catch (error) { if (version === loadVersion.current) setMessage(error.message); }
  }, [orderId, loadReceipt]);
  useEffect(() => {
    setOrder(null); setReceipt(null); setMessage(''); setReceiptError(''); setSaving(false); mutationPending.current = false;
    load();
    return () => { loadVersion.current += 1; mutationVersion.current += 1; mutationPending.current = false; };
  }, [load]);

  const mutate = async (path, body) => {
    if (mutationPending.current || !order || order._id !== orderId) return;
    mutationPending.current = true;
    const version = ++mutationVersion.current;
    setSaving(true); setMessage('');
    try {
      await api.put(`/admin/orders/${orderId}/${path}`, body);
      if (version === mutationVersion.current) await load();
    } catch (error) { if (version === mutationVersion.current) setMessage(error.message); }
    finally { if (version === mutationVersion.current) { mutationPending.current = false; setSaving(false); } }
  };

  const updateStatus = async (orderStatus) => {
    await mutate('status', { orderStatus, note: 'Updated by admin' });
  };

  const saveShipment = async (event) => {
    event.preventDefault();
    await mutate('shipment', shipmentForm);
  };

  const updatePayment = async (paymentStatus) => {
    await mutate('payment-status', { paymentStatus });
  };

  if (message && !order) return <section className="space-y-5"><PageHeader title="Order Detail" /><p role="alert" className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{message}</p>{orderId && <button className="admin-btn" onClick={load}>Retry loading order</button>}<a className="admin-table-action-link" href="/admin/orders">Back to orders</a></section>;
  if (!order) return <section className="space-y-5"><PageHeader title="Order Detail" /><p className="rounded-xl bg-white p-6 font-bold shadow-sm">Loading order...</p></section>;

  return (
    <section className="space-y-5">
      <PageHeader title={`Order #${order._id.slice(-8).toUpperCase()}`} note="Payment, delivery, receipt and status timeline." />
      {message && <p role="alert" className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{message}</p>}
      {receiptError && <p role="alert" className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{receiptError} <button type="button" className="admin-btn-ghost" onClick={() => loadReceipt()}>Retry invoice</button></p>}
      {receipt && <ReceiptActions receipt={receipt} />}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <div className="admin-card p-5">
            <h2>Ordered items</h2>
            <div className="mt-4 space-y-3">{order.orderItems.map((item) => <div key={`${item.product}-${item.size}-${item.color}`} className="flex justify-between gap-3 rounded-xl border border-slate-100 p-3"><span><b>{item.name}</b><br /><span className="text-xs text-slate-500">{item.size} | {item.color} x {item.quantity}</span></span><b>Rs. {item.price * item.quantity}</b></div>)}</div>
          </div>
          <div className="admin-card p-5">
            <h2>Timeline</h2>
            <div className="mt-4 grid gap-3">{order.statusTimeline?.map((item, index) => <div key={`${item.status}-${index}`} className="flex gap-3"><span className="mt-1 h-3 w-3 rounded-full bg-wine" /><span><b>{item.status}</b><br /><span className="text-xs text-slate-500">{item.date ? new Date(item.date).toLocaleString('en-IN') : ''} {item.note}</span></span></div>)}</div>
          </div>
        </div>
        <aside className="space-y-5">
          <div className="admin-card p-5">
            <h2>Payment</h2>
            <div className="mt-4 space-y-2 text-sm font-semibold text-slate-600">
              <Row label="Method" value={order.paymentMethod} />
              <Row label="Provider" value={order.paymentProvider || '-'} />
              <Row label="Status" value={<StatusBadge value={order.paymentStatus} />} />
              <Row label="Razorpay Order" value={order.razorpayOrderId || '-'} />
              <Row label="Razorpay Payment" value={order.razorpayPaymentId || '-'} />
              <Row label="Failure" value={order.paymentFailureReason || '-'} />
              <Row label="Total" value={`Rs. ${order.finalAmount}`} />
            </div>
            <select aria-label="Payment status" disabled={saving} value={order.paymentStatus} onChange={(event) => updatePayment(event.target.value)} className="mt-4 h-11 w-full rounded-xl border border-slate-200 px-3 font-bold">{paymentStatuses.map((item) => <option key={item}>{item}</option>)}</select>
            <p className="admin-note mt-2">Mark a refund only after returning the money through your payment provider or directly to the customer. Updating the status does not transfer money.</p>
          </div>
          <div className="admin-card p-5">
            <h2>Order status</h2>
            <select aria-label="Order status" disabled={saving} value={order.orderStatus} onChange={(event) => updateStatus(event.target.value)} className="mt-4 h-11 w-full rounded-xl border border-slate-200 px-3 font-bold">{orderStatuses.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          <form onSubmit={saveShipment} className="admin-card p-5">
            <fieldset disabled={saving}>
            <h2>Shipment</h2>
            <input className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 font-semibold" placeholder="Courier name" value={shipmentForm.courierName} onChange={(event) => setShipmentForm((current) => ({ ...current, courierName: event.target.value }))} />
            <input className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 font-semibold" placeholder="AWB / tracking number" value={shipmentForm.trackingNumber} onChange={(event) => setShipmentForm((current) => ({ ...current, trackingNumber: event.target.value, awb: event.target.value }))} />
            <input className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 font-semibold" placeholder="Tracking URL (optional)" value={shipmentForm.trackingUrl} onChange={(event) => setShipmentForm((current) => ({ ...current, trackingUrl: event.target.value }))} />
            <button type="submit" className="admin-btn mt-3 w-full">{saving ? 'Saving…' : 'Save shipment'}</button>
            </fieldset>
          </form>
        </aside>
      </div>
      {receipt && <Receipt receipt={receipt} />}
    </section>
  );
}

function Row({ label, value }) {
  return <div className="flex items-center justify-between gap-3"><span>{label}</span><span className="text-right font-black text-charcoal">{value}</span></div>;
}
