import useSellerQuery from '../../hooks/useSellerQuery';
import PageState from '../../components/ui/PageState';

export default function SellerCrm() {
  const { data: items, error, loading, retry } = useSellerQuery('/seller/crm', { list: true });

  if (loading) return <PageState loading loadingLabel="Loading customers..." />;
  if (error) return <PageState error={error} onRetry={retry} />;

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-black">Customers</h1>
      <p className="text-sm font-semibold text-slate-500">Spend, AOV, last order, returns and tags are computed from orders in this boutique.</p>
      {!items.length ? <PageState empty emptyTitle="No customers yet" /> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#fbf8f4] text-xs font-black uppercase tracking-wider text-slate-500">
              <tr>
                {['Customer', 'Orders', 'Spend', 'AOV', 'Returns', 'Last order', 'Tags'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.userId} className="border-t">
                  <td className="px-4 py-3 font-bold">{row.name || row.phone || row.userId}</td>
                  <td className="px-4 py-3">{row.orders}</td>
                  <td className="px-4 py-3">Rs. {row.spend}</td>
                  <td className="px-4 py-3">Rs. {row.aov}</td>
                  <td className="px-4 py-3">{row.returns}</td>
                  <td className="px-4 py-3">{row.lastOrderAt ? new Date(row.lastOrderAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">{(row.tags || []).join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
