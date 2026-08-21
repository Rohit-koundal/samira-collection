import EmptyState from './EmptyState';
import Loader from './Loader';

export default function DataTable({ heads, rows, loading, emptyTitle }) {
  if (loading) return <Loader />;
  if (!rows.length) return <EmptyState title={emptyTitle} />;

  return (
    <div className="admin-table">
      <div className="overflow-x-auto">
        <table className="min-w-[720px] md:min-w-[860px]">
          <thead>
            <tr>{heads.map((head) => <th key={head}>{head}</th>)}</tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </div>
  );
}
