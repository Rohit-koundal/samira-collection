import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageState from '../../components/ui/PageState';

export default function SellerAudit() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/seller/audit-logs?page=1&limit=50')
      .then((data) => setItems(Array.isArray(data) ? data : data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageState loading />;
  if (error) return <PageState error={error} />;

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-black">Audit log</h1>
      {!items.length ? <PageState empty emptyTitle="No audit events yet" /> : items.map((item) => (
        <div key={item._id} className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="font-black">{item.action}</p>
          <p className="text-sm text-slate-500">{item.entityType} · {item.entityId} · {item.actor?.name || 'system'}</p>
        </div>
      ))}
    </section>
  );
}
