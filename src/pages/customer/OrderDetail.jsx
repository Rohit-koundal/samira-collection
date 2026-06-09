import { useEffect, useState } from 'react';
import api from '../../services/api';
import Receipt from '../../components/order/Receipt';
import ReceiptActions from '../../components/order/ReceiptActions';

export default function OrderDetail({ route = '' }) {
  const orderId = new URLSearchParams(route.split('?')[1] || '').get('id');
  const [order, setOrder] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return setError('Order not found.');
    api.get(`/orders/${orderId}`).then(setOrder).catch((err) => setError(err.message));
    api.get(`/orders/${orderId}/receipt`).then(setReceipt).catch(() => {});
  }, [orderId]);

  if (error) return <section className="container-page py-8"><div className="rounded-2xl bg-white p-8 text-center font-bold text-rose">{error}</div></section>;
  if (!order) return <section className="container-page py-8"><div className="rounded-2xl bg-white p-8 text-center font-bold">Loading order...</div></section>;

  return (
    <section className="container-page py-8">
      {receipt && <div className="no-print mb-5"><ReceiptActions receipt={receipt} /></div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <h1 className="text-3xl font-black">Order #{order._id.slice(-8).toUpperCase()}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">Placed on {new Date(order.createdAt).toLocaleString('en-IN')}</p>
            <div className="mt-6 grid gap-4">{(order.statusTimeline || []).map((item, index) => <div key={`${item.status}-${index}`} className="flex items-center gap-4"><span className="h-4 w-4 rounded-full bg-rose" /><span><b>{item.status}</b><br /><span className="text-xs text-slate-500">{item.date ? new Date(item.date).toLocaleString('en-IN') : ''} {item.note || ''}</span></span></div>)}</div>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Items</h2>
            <div className="mt-4 space-y-3">{order.orderItems.map((item) => <div key={`${item.product}-${item.size}-${item.color}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3"><span><b>{item.name}</b><br /><span className="text-xs text-slate-500">{item.size} | {item.color} x {item.quantity}</span></span><b>Rs. {item.price * item.quantity}</b></div>)}</div>
          </div>
        </div>
        <aside className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Invoice</h2>
          <Row label="MRP" value={`Rs. ${order.totalMRP}`} />
          <Row label="Product Discount" value={`- Rs. ${order.productDiscount || 0}`} />
          <Row label="Coupon Discount" value={`- Rs. ${order.couponDiscount || 0}`} />
          <Row label="Delivery" value={order.deliveryCharge ? `Rs. ${order.deliveryCharge}` : 'FREE'} />
          <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-lg font-black"><span>Total</span><span>Rs. {order.finalAmount}</span></div>
          <h3 className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Ship To</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{order.shippingAddress?.fullName}<br />{order.shippingAddress?.houseNo || order.shippingAddress?.houseNumber}, {order.shippingAddress?.area}<br />{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
          <button className="no-print mt-5 w-full rounded-xl border border-rose px-5 py-3 text-sm font-black text-rose">Request Return / Exchange</button>
        </aside>
      </div>
      {receipt && <div className="mt-6"><Receipt receipt={receipt} /></div>}
    </section>
  );
}

function Row({ label, value }) {
  return <div className="mt-3 flex justify-between text-sm font-semibold text-slate-600"><span>{label}</span><span>{value}</span></div>;
}
