import { useEffect, useState } from 'react';
import { Button, Card, CardContent } from '../../components/ui';
import api from '../../services/api';
import Receipt from '../../components/order/Receipt';
import ReceiptActions from '../../components/order/ReceiptActions';

export default function OrderSuccess({ navigate, route = '' }) {
  const orderId = new URLSearchParams(route.split('?')[1] || '').get('id');
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    api.get(`/orders/${orderId}/receipt`).then(setReceipt).catch((err) => setError(err.message));
  }, [orderId]);

  return (
    <section className="container-page py-6 md:py-10">
      <Card className="mx-auto max-w-3xl text-center">
        <CardContent className="p-5 md:p-8">
        <p className="small-text font-bold uppercase tracking-[0.14em] text-emerald-600 md:text-sm md:tracking-[0.22em]">Order placed</p>
        <h1 className="page-title mt-3 md:text-3xl">Order Placed Successfully</h1>
        <p className="body-text mt-3 text-slate-500">Order ID: {orderId?.slice(-8).toUpperCase()}</p>
        {receipt && <p className="price mt-2 text-lg">Rs. {receipt.finalAmount} | {receipt.paymentStatus}</p>}
        <div className="no-print mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate(`/order-detail?id=${orderId}`)}>Track Order</Button>
          <Button onClick={() => navigate('/orders')} variant="outline">My Orders</Button>
          <Button onClick={() => navigate('/products')} variant="outline">Continue Shopping</Button>
        </div>
        </CardContent>
      </Card>
      {error && <p className="label-text mt-5 rounded-xl bg-rose/10 p-3 text-center text-rose">{error}</p>}
      {receipt && <div className="mt-6 space-y-4"><ReceiptActions receipt={receipt} /><Receipt receipt={receipt} /></div>}
    </section>
  );
}
