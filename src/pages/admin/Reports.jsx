import StatsChart from '../../components/admin/StatsChart';
export default function Reports() {
  return <section className="space-y-6"><h1 className="text-3xl font-black">Reports</h1><div className="grid gap-6 xl:grid-cols-2"><StatsChart title="Monthly Revenue" /><StatsChart title="Coupon Usage" /><StatsChart title="Best Selling Products" /><StatsChart title="Return / Exchange Count" /></div></section>;
}
