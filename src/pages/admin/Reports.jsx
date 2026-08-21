import { useCallback, useEffect, useState } from 'react';
import DashboardCard from '../../components/admin/DashboardCard';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import StatsChart from '../../components/admin/StatsChart';
import PageState from '../../components/ui/PageState';
import api from '../../services/api';

const ranges = [
  ['today', 'Today'],
  ['7d', '7 days'],
  ['30d', '30 days'],
  ['90d', '90 days'],
];

export default function Reports() {
  const [range, setRange] = useState('30d');
  const [sales, setSales] = useState(null);
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get(`/admin/reports/sales?range=${range}`),
      api.get(`/admin/reports/products?range=${range}`),
    ]).then(([salesData, productData]) => {
      setSales(salesData);
      setProducts(productData);
      setMessage('');
    }).catch((error) => setMessage(error.message)).finally(() => setLoading(false));
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const series = sales?.series || [];
  const statusPoints = sales?.statusBreakdown || [];
  const couponPoints = sales?.couponUsage || [];
  const paymentPoints = sales?.paymentBreakdown || [];

  return (
    <section className="space-y-6">
      <PageHeader title="Reports" note="Sales, orders, product and inventory overview from live orders." />
      <div className="flex flex-wrap gap-2">
        {ranges.map(([value, label]) => (
          <button key={value} type="button" onClick={() => setRange(value)} className={`h-10 rounded-full px-4 text-sm font-semibold ${range === value ? 'bg-wine text-white' : 'admin-btn-ghost'}`}>
            {label}
          </button>
        ))}
      </div>
      {message && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{message}</p>}
      {loading ? <PageState loading loadingLabel="Loading reports..." /> : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardCard title="Paid revenue" value={`Rs. ${sales?.totals?.revenue || 0}`} note="In this range" />
            <DashboardCard title="Orders" value={sales?.totals?.orders || 0} note="Excluding cancelled" />
            <DashboardCard title="Paid orders" value={sales?.totals?.paidOrders || 0} note="Captured payments" />
            <DashboardCard title="New customers" value={sales?.totals?.customers || 0} note="Registered in range" />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <StatsChart title="Revenue" points={series.map((item) => item.revenue || item.value || 0)} labels={series.map((item) => item.label)} />
            <StatsChart title="Orders by Status" points={statusPoints.map((item) => item.value)} labels={statusPoints.map((item) => item.label)} />
            <StatsChart title="Coupon Usage" points={couponPoints.map((item) => item.value)} labels={couponPoints.map((item) => item.label)} />
            <StatsChart title="Payment methods" points={paymentPoints.map((item) => item.value)} labels={paymentPoints.map((item) => item.label)} />
          </div>
          <DataTable
            heads={['Product', 'SKU', 'Sold', 'Revenue']}
            rows={(products?.bestSellers || []).map((product) => (
              <tr key={product.id} className="border-t border-slate-100">
                <td className="px-4 py-4 font-black">{product.name}</td>
                <td className="px-4 py-4">{product.sku || '-'}</td>
                <td className="px-4 py-4">{product.sold}</td>
                <td className="px-4 py-4">Rs. {product.revenue}</td>
              </tr>
            ))}
            emptyTitle="No product sales in this range"
          />
          <DataTable
            heads={['Product', 'SKU', 'Stock']}
            rows={(products?.lowStock || []).map((product) => (
              <tr key={product._id} className="border-t border-slate-100">
                <td className="px-4 py-4 font-black">{product.name}</td>
                <td className="px-4 py-4">{product.sku || '-'}</td>
                <td className="px-4 py-4">{product.stock}</td>
              </tr>
            ))}
            emptyTitle="No low-stock products"
          />
        </>
      )}
    </section>
  );
}
