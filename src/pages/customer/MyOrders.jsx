import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function MyOrders({ navigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/orders/my-orders').then(setOrders).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  return (
    <section className="container-page py-6 md:py-8">
      <h1 className="mb-5 text-2xl font-black md:mb-6 md:text-3xl">My Orders</h1>
      {loading && <div className="rounded-xl bg-white p-6 text-center font-bold md:rounded-2xl md:p-8">Loading orders...</div>}
      {error && <div className="rounded-xl bg-white p-6 text-center font-bold text-rose md:rounded-2xl md:p-8">{error}</div>}
      {!loading && !orders.length && <div className="rounded-xl bg-white p-6 text-center font-bold md:rounded-2xl md:p-8">No orders yet.</div>}
      <div className="space-y-3 md:space-y-4">{orders.map((order) => <button key={order._id} onClick={() => navigate(`/order-detail?id=${order._id}`)} className="flex w-full items-center justify-between gap-3 rounded-xl bg-white p-4 text-left shadow-sm md:rounded-3xl md:p-5"><span className="min-w-0"><b>{order._id.slice(-8).toUpperCase()}</b><br /><span className="text-sm text-slate-500">{order.orderStatus}</span></span><span className="shrink-0 font-black">Rs. {order.finalAmount}</span></button>)}</div>
    </section>
  );
}
