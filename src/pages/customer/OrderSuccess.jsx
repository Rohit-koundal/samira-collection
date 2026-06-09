import { useEffect, useState } from 'react';
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
    <section className="container-page py-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-600">Order placed</p>
        <h1 className="mt-3 text-3xl font-black">Order Placed Successfully</h1>
        <p className="mt-3 text-sm font-semibold text-slate-500">Order ID: {orderId?.slice(-8).toUpperCase()}</p>
        {receipt && <p className="mt-2 text-lg font-black">Rs. {receipt.finalAmount} | {receipt.paymentStatus}</p>}
        <div className="no-print mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={() => navigate(`/order-detail?id=${orderId}`)} className="rounded-xl bg-wine px-5 py-3 text-sm font-black text-white">Track Order</button>
          <button onClick={() => navigate('/orders')} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black">My Orders</button>
          <button onClick={() => navigate('/products')} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black">Continue Shopping</button>
        </div>
      </div>
      {error && <p className="mt-5 rounded-xl bg-rose/10 p-3 text-center text-sm font-bold text-rose">{error}</p>}
      {receipt && <div className="mt-6 space-y-4"><ReceiptActions receipt={receipt} /><Receipt receipt={receipt} /></div>}
    </section>
  );
}
