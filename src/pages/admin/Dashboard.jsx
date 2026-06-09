import { useEffect, useState } from 'react';
import DashboardCard from '../../components/admin/DashboardCard';
import StatsChart from '../../components/admin/StatsChart';
import OrderTable from '../../components/admin/OrderTable';
import api from '../../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard/stats'),
      api.get('/admin/dashboard/recent-orders'),
      api.get('/admin/dashboard/low-stock'),
    ]).then(([statsData, orderData, lowStockData]) => {
      setStats(statsData);
      setOrders(orderData);
      setLowStock(lowStockData);
    }).catch((error) => setMessage(error.message));
  }, []);

  const cards = [
    ['Total Products', stats.products ?? '-', 'Live catalog count'],
    ['Total Orders', stats.orders ?? '-', 'All-time orders'],
    ['Total Revenue', stats.revenue ? `Rs. ${stats.revenue}` : '-', 'From paid orders'],
    ['Pending Returns', stats.returns ?? '-', 'Needs action'],
    ['Total Customers', stats.customers ?? '-', 'Customer accounts'],
    ['Active Coupons', stats.coupons ?? '-', 'Live coupons'],
    ['Low Stock Products', lowStock.length, 'Restock soon'],
    ['Admin Mode', 'Live', 'MongoDB connected'],
  ];

  return (
    <section className="space-y-6">
      <div><h1 className="text-3xl font-black">Dashboard</h1><p className="mt-1 text-sm font-semibold text-slate-500">Store overview, orders, revenue, and alerts from MongoDB.</p></div>
      {message && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-wine">{message}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(([title, value, note]) => <DashboardCard key={title} title={title} value={value} note={note} />)}</div>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]"><StatsChart /><StatsChart title="Orders by Status" /></div>
      <div><h2 className="mb-4 text-xl font-black">Recent Orders</h2><OrderTable orders={orders.slice(0, 5)} /></div>
    </section>
  );
}
