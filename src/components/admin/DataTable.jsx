import EmptyState from './EmptyState';
import Loader from './Loader';

export default function DataTable({ heads, rows, loading, emptyTitle }) {
  if (loading) return <Loader />;
  if (!rows.length) return <EmptyState title={emptyTitle} />;

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm md:rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm md:min-w-[860px]">
          <thead className="bg-[#f7f2eb] text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>{heads.map((head) => <th key={head} className="px-4 py-4">{head}</th>)}</tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </div>
  );
}
