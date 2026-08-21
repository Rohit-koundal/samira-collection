import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/admin/PageHeader';
import PageState from '../../components/ui/PageState';

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
      {loading && <PageState loading />}
      {error && <PageState error={error} />}
      {!loading && !items.length && !error && <PageState empty emptyTitle="No audit events yet" />}
      {items.map((item) => (
        <div key={item._id} className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="font-black">{item.action}</p>
          <p className="text-sm text-slate-500">{item.entityType} · {item.entityId} · {item.actor?.name || 'system'} · {new Date(item.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </section>
  );
}
