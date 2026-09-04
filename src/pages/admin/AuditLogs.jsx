import { useEffect, useState } from 'react';
import api from '../../services/api';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';

export default function AuditLogs() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-logs?page=1&limit=50')
      .then((data) => setItems(Array.isArray(data) ? data : data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-5">
      <PageHeader title="Audit log" note="Price, stock, order, payment, coupon, settings and role changes." />
      {error && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{error}</p>}
      <DataTable
        loading={loading}
        title="Recent activity"
        emptyTitle="No audit events yet"
        emptyNote="Administrative changes will appear here as they happen."
        heads={['Action', 'Entity', 'Reference', 'Actor', 'Date']}
        rows={items.map((item) => (
          <tr key={item._id}>
            <td>{item.action}</td>
            <td>{item.entityType || '-'}</td>
            <td><span className="admin-catalog-sku" title={item.entityId || ''}>{item.entityId || '-'}</span></td>
            <td>{item.actor?.name || 'System'}</td>
            <td>{new Date(item.createdAt).toLocaleString('en-IN')}</td>
          </tr>
        ))}
      />
    </section>
  );
}
