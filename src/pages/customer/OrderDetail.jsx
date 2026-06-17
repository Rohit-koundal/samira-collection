import { useEffect, useState } from 'react';
import { Button, Card, CardContent } from '../../components/ui';
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

  if (error) return <section className="container-page py-8"><Card><CardContent className="section-title p-8 text-center text-rose">{error}</CardContent></Card></section>;
  if (!order) return <section className="container-page py-8"><Card><CardContent className="section-title p-8 text-center">Loading order...</CardContent></Card></section>;

  return (
    <section className="container-page py-8">
      {receipt && <div className="no-print mb-5"><ReceiptActions receipt={receipt} /></div>}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
        <div className="space-y-5">
          <Card><CardContent className="p-5 md:p-7"><h1 className="page-title md:text-3xl">Order #{order._id.slice(-8).toUpperCase()}</h1><p className="body-text mt-2 text-slate-500">Placed on {new Date(order.createdAt).toLocaleString('en-IN')}</p><div className="mt-6 grid gap-4">{(order.statusTimeline || []).map((item, index) => <div key={`${item.status}-${index}`} className="flex items-center gap-4"><span className="h-4 w-4 rounded-full bg-rose" /><span><b>{item.status}</b><br /><span className="small-text text-slate-500">{item.date ? new Date(item.date).toLocaleString('en-IN') : ''} {item.note || ''}</span></span></div>)}</div></CardContent></Card>
          <Card><CardContent className="p-4 md:p-5"><h2 className="header-title">Items</h2><div className="mt-4 space-y-3">{order.orderItems.map((item) => <div key={`${item.product}-${item.size}-${item.color}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3"><span><b>{item.name}</b><br /><span className="small-text text-slate-500">{item.size} | {item.color} x {item.quantity}</span></span><b>Rs. {item.price * item.quantity}</b></div>)}</div></CardContent></Card>
        </div>
        <Card as="aside">
          <CardContent className="p-4 md:p-5">
          <h2 className="header-title">Invoice</h2>
          <Row label="MRP" value={`Rs. ${order.totalMRP}`} />
          <Row label="Product Discount" value={`- Rs. ${order.productDiscount || 0}`} />
          <Row label="Coupon Discount" value={`- Rs. ${order.couponDiscount || 0}`} />
          <Row label="Delivery" value={order.deliveryCharge ? `Rs. ${order.deliveryCharge}` : 'FREE'} />
          <div className="mt-4 flex justify-between border-t border-slate-100 pt-4"><span className="label-text">Total</span><span className="price">Rs. {order.finalAmount}</span></div>
          <h3 className="small-text mt-6 font-bold uppercase tracking-[0.18em] text-slate-500">Ship To</h3>
          <p className="body-text mt-2 text-slate-600">{order.shippingAddress?.fullName}<br />{order.shippingAddress?.houseNo || order.shippingAddress?.houseNumber}, {order.shippingAddress?.area}<br />{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
          <Button className="no-print mt-5 w-full" variant="outline">Request Return / Exchange</Button>
          </CardContent>
        </Card>
      </div>
      {receipt && <div className="mt-6"><Receipt receipt={receipt} /></div>}
    </section>
  );
}

function Row({ label, value }) {
  return <div className="body-text mt-3 flex justify-between text-slate-600"><span>{label}</span><span>{value}</span></div>;
}
