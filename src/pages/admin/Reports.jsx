import { useEffect, useState } from 'react';
import DashboardCard from '../../components/admin/DashboardCard';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import StatsChart from '../../components/admin/StatsChart';
import api from '../../services/api';

export default function Reports() {
  const [stats, setStats] = useState({});
  const [lowStock, setLowStock] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([api.get('/admin/dashboard/stats'), api.get('/admin/dashboard/low-stock')]).then(([statsData, lowStockData]) => {
      setStats(statsData);
      setLowStock(lowStockData);
      setMessage('');
    }).catch((error) => setMessage(error.message));
  }, []);

  return (
    <section className="space-y-6">
      <PageHeader title="Reports" note="Sales, orders, product and inventory overview." />
      {message && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{message}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Total Sales" value={`Rs. ${stats.revenue || 0}`} note="Paid revenue" />
        <DashboardCard title="Total Orders" value={stats.orders || 0} note="All orders" />
        <DashboardCard title="Customers" value={stats.customers || 0} note="Registered customers" />
        <DashboardCard title="Returns" value={stats.returns || 0} note="Open requests" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2"><StatsChart title="Monthly Revenue" /><StatsChart title="Orders by Status" /><StatsChart title="Coupon Usage" /><StatsChart title="Customer Growth" /></div>
      <DataTable heads={['Product', 'SKU', 'Stock', 'Alert']} rows={lowStock.map((product) => <tr key={product._id} className="border-t border-slate-100"><td className="px-4 py-4 font-black">{product.name}</td><td className="px-4 py-4">{product.sku}</td><td className="px-4 py-4">{product.stock}</td><td className="px-4 py-4">Low Stock</td></tr>)} emptyTitle="No low-stock products" />
    </section>
  );
}
