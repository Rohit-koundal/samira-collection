import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';

const orderStatuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Exchange Requested', 'Returned', 'Refunded'];
const paymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/orders').then((items) => {
      setOrders(items);
      setMessage('');
    }).catch((error) => setMessage(error.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => orders.filter((order) => {
    const haystack = [order._id, order.user?.name, order.user?.email, order.user?.phone, order.shippingAddress?.fullName].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase()) && (!status || order.orderStatus === status) && (!payment || order.paymentStatus === payment);
  }), [orders, payment, query, status]);

  const updateOrder = async (order, orderStatus) => {
    try {
      await api.put(`/admin/orders/${order._id}/status`, { orderStatus });
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };
  const updatePayment = async (order, paymentStatus) => {
    try {
      await api.put(`/admin/orders/${order._id}/payment-status`, { paymentStatus });
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Orders" note="Search, filter and update order/payment statuses." />
      {message && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{message}</p>}
      <SearchFilterBar search={query} onSearch={setQuery} placeholder="Search order, customer, email or phone">
        <Select value={status} onChange={setStatus} options={['', ...orderStatuses]} label="All order status" />
        <Select value={payment} onChange={setPayment} options={['', ...paymentStatuses]} label="All payments" />
      </SearchFilterBar>
      <DataTable loading={loading} emptyTitle="No orders found" heads={['Order ID', 'Customer', 'Date', 'Amount', 'Payment', 'Provider', 'Order Status', 'Actions']} rows={filtered.map((order) => (
        <tr key={order._id} className="border-t border-slate-100">
          <td className="px-4 py-4 font-black">{order._id.slice(-8).toUpperCase()}</td>
          <td className="px-4 py-4"><p className="font-bold">{order.user?.name || order.shippingAddress?.fullName || 'Customer'}</p><p className="text-xs text-slate-500">{order.user?.email}</p></td>
          <td className="px-4 py-4">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
          <td className="px-4 py-4 font-black">Rs. {order.finalAmount}</td>
          <td className="px-4 py-4"><select value={order.paymentStatus} onChange={(event) => updatePayment(order, event.target.value)} className="h-10 rounded-lg border border-slate-200 px-2 font-bold">{paymentStatuses.map((item) => <option key={item}>{item}</option>)}</select></td>
          <td className="px-4 py-4">{order.paymentProvider || order.paymentMethod}</td>
          <td className="px-4 py-4"><StatusBadge value={order.orderStatus} /></td>
          <td className="px-4 py-4"><div className="flex items-center gap-3"><select value={order.orderStatus} onChange={(event) => updateOrder(order, event.target.value)} className="h-10 rounded-lg border border-slate-200 px-2 font-bold">{orderStatuses.map((item) => <option key={item}>{item}</option>)}</select><a href={`#/admin/orders/detail?id=${order._id}`} className="font-black text-wine">View</a></div></td>
        </tr>
      ))} />
    </section>
  );
}

function Select({ value, onChange, options, label }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold">{options.map((item) => <option key={item || label} value={item}>{item || label}</option>)}</select>;
}
