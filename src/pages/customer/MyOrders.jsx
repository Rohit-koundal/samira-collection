import { orders } from '../../data/seedAdmin';

export default function MyOrders({ navigate }) {
  return (
    <section className="container-page py-8">
      <h1 className="mb-6 text-3xl font-black">My Orders</h1>
      <div className="space-y-4">{orders.slice(0, 4).map((order) => <button key={order.id} onClick={() => navigate('/order-detail')} className="flex w-full items-center justify-between rounded-3xl bg-white p-5 text-left shadow-sm"><span><b>{order.id}</b><br /><span className="text-sm text-slate-500">{order.orderStatus}</span></span><span className="font-black">Rs. {order.amount}</span></button>)}</div>
    </section>
  );
}
