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
    <section className="container-page py-8">
      <h1 className="mb-6 text-3xl font-black">My Orders</h1>
      {loading && <div className="rounded-2xl bg-white p-8 text-center font-bold">Loading orders...</div>}
      {error && <div className="rounded-2xl bg-white p-8 text-center font-bold text-rose">{error}</div>}
      {!loading && !orders.length && <div className="rounded-2xl bg-white p-8 text-center font-bold">No orders yet.</div>}
      <div className="space-y-4">{orders.map((order) => <button key={order._id} onClick={() => navigate(`/order-detail?id=${order._id}`)} className="flex w-full items-center justify-between rounded-3xl bg-white p-5 text-left shadow-sm"><span><b>{order._id.slice(-8).toUpperCase()}</b><br /><span className="text-sm text-slate-500">{order.orderStatus}</span></span><span className="font-black">Rs. {order.finalAmount}</span></button>)}</div>
    </section>
  );
}
