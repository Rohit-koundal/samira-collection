import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui';
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
      <h1 className="page-title mb-5 md:mb-6 md:text-3xl">My Orders</h1>
      {loading && <Card><CardContent className="section-title p-6 text-center md:p-8">Loading orders...</CardContent></Card>}
      {error && <Card><CardContent className="section-title p-6 text-center text-rose md:p-8">{error}</CardContent></Card>}
      {!loading && !orders.length && <Card><CardContent className="section-title p-6 text-center md:p-8">No orders yet.</CardContent></Card>}
      <div className="space-y-3 md:space-y-4">{orders.map((order) => <Card as="button" key={order._id} onClick={() => navigate(`/order-detail?id=${order._id}`)} className="w-full text-left"><CardContent className="flex items-center justify-between gap-3 p-4 md:p-5"><span className="min-w-0"><b>{order._id.slice(-8).toUpperCase()}</b><br /><span className="body-text text-slate-500">{order.orderStatus}</span></span><span className="price shrink-0">Rs. {order.finalAmount}</span></CardContent></Card>)}</div>
    </section>
  );
}
