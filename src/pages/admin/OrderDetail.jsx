import { useCallback, useEffect, useState } from 'react';
import Receipt from '../../components/order/Receipt';
import ReceiptActions from '../../components/order/ReceiptActions';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';

const orderStatuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Returned', 'Refunded'];
const paymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];

export default function OrderDetail({ route = '' }) {
  const orderId = new URLSearchParams(route.split('?')[1] || '').get('id');
  const [order, setOrder] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [message, setMessage] = useState('');
  const [shipmentForm, setShipmentForm] = useState({ courierName: '', trackingNumber: '', trackingUrl: '', awb: '' });

  const load = useCallback(() => {
    if (!orderId) return;
    api.get(`/admin/orders/${orderId}`).then((data) => {
      setOrder(data);
      setShipmentForm({
        courierName: data.shipment?.courierName || '',
        trackingNumber: data.shipment?.trackingNumber || '',
        trackingUrl: data.shipment?.trackingUrl || '',
        awb: data.shipment?.awb || '',
      });
    }).catch((error) => setMessage(error.message));
    api.get(`/admin/orders/${orderId}/receipt`).then(setReceipt).catch(() => {});
  }, [orderId]);
  useEffect(() => { load(); }, [load]);

  const updateStatus = async (orderStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { orderStatus, note: 'Updated by admin' });
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const saveShipment = async (event) => {
    event.preventDefault();
    try {
      await api.put(`/admin/orders/${orderId}/shipment`, shipmentForm);
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updatePayment = async (paymentStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}/payment-status`, { paymentStatus });
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (message) return <section className="space-y-5"><PageHeader title="Order Detail" /><p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{message}</p></section>;
  if (!order) return <section className="space-y-5"><PageHeader title="Order Detail" /><p className="rounded-xl bg-white p-6 font-bold shadow-sm">Loading order...</p></section>;

  return (
    <section className="space-y-5">
      <PageHeader title={`Order #${order._id.slice(-8).toUpperCase()}`} note="Payment, delivery, receipt and status timeline." />
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
            <select value={order.paymentStatus} onChange={(event) => updatePayment(event.target.value)} className="mt-4 h-11 w-full rounded-xl border border-slate-200 px-3 font-bold">{paymentStatuses.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          <div className="admin-card p-5">
            <h2>Order status</h2>
            <select value={order.orderStatus} onChange={(event) => updateStatus(event.target.value)} className="mt-4 h-11 w-full rounded-xl border border-slate-200 px-3 font-bold">{orderStatuses.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          <form onSubmit={saveShipment} className="admin-card p-5">
            <h2>Shipment</h2>
            <input className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 font-semibold" placeholder="Courier name" value={shipmentForm.courierName} onChange={(event) => setShipmentForm((current) => ({ ...current, courierName: event.target.value }))} />
            <input className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 font-semibold" placeholder="AWB / tracking number" value={shipmentForm.trackingNumber} onChange={(event) => setShipmentForm((current) => ({ ...current, trackingNumber: event.target.value, awb: event.target.value }))} />
            <input className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 font-semibold" placeholder="Tracking URL (optional)" value={shipmentForm.trackingUrl} onChange={(event) => setShipmentForm((current) => ({ ...current, trackingUrl: event.target.value }))} />
            <button type="submit" className="admin-btn mt-3 w-full">Save shipment</button>
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
