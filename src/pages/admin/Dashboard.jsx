import DashboardCard from '../../components/admin/DashboardCard';
import StatsChart from '../../components/admin/StatsChart';
import OrderTable from '../../components/admin/OrderTable';
import { orders, products, customers, coupons } from '../../data/seedAdmin';

export default function Dashboard() {
  const cards = [
    ['Total Products', products.length, '+8 this month'],
    ['Total Orders', orders.length, '+12% growth'],
    ['Total Revenue', 'Rs. 4.8L', '+18% monthly'],
    ['Pending Orders', orders.filter((o) => o.orderStatus === 'Pending').length, 'Needs action'],
    ['Delivered Orders', orders.filter((o) => o.orderStatus === 'Delivered').length, 'Healthy'],
    ['Total Customers', customers.length, '+3 demo users'],
    ['Low Stock Products', products.filter((p) => p.stock < 5).length, 'Restock soon'],
    ['Active Coupons', coupons.filter((c) => c.isActive).length, 'Live coupons'],
  ];
  return (
    <section className="space-y-6">
      <div><h1 className="text-3xl font-black">Dashboard</h1><p className="mt-1 text-sm font-semibold text-slate-500">Store overview, orders, revenue, and alerts.</p></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(([title, value, note]) => <DashboardCard key={title} title={title} value={value} note={note} />)}</div>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]"><StatsChart /><StatsChart title="Orders by Status" /></div>
      <div><h2 className="mb-4 text-xl font-black">Recent Orders</h2><OrderTable orders={orders.slice(0, 5)} /></div>
    </section>
  );
}
