import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';

const statuses = ['Requested', 'Approved', 'Rejected', 'Pickup Scheduled', 'Received', 'Exchanged', 'Refunded', 'Closed'];

export default function Returns() {
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    api.get('/admin/returns').then(setRequests).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => requests.filter((request) => {
    const haystack = [request._id, request.user?.name, request.product?.name, request.reason, request.type].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase()) && (!status || request.status === status);
  }), [query, requests, status]);

  const update = async (request, nextStatus) => {
    await api.put(`/admin/returns/${request._id}/status`, { status: nextStatus });
    load();
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Returns / Exchange" note="Approve, reject and track customer return requests." />
      <SearchFilterBar search={query} onSearch={setQuery} placeholder="Search request, customer or product">
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold"><option value="">All Status</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
      </SearchFilterBar>
      <DataTable loading={loading} emptyTitle="No return requests" heads={['Request ID', 'Customer', 'Product', 'Type', 'Reason', 'Status', 'Update']} rows={filtered.map((request) => (
        <tr key={request._id} className="border-t border-slate-100">
          <td className="px-4 py-4 font-black">{request._id.slice(-8).toUpperCase()}</td>
          <td className="px-4 py-4">{request.user?.name || 'Customer'}</td>
          <td className="px-4 py-4">{request.product?.name || '-'}</td>
          <td className="px-4 py-4">{request.type || 'Return'}</td>
          <td className="px-4 py-4">{request.reason || '-'}</td>
          <td className="px-4 py-4"><StatusBadge value={request.status} /></td>
          <td className="px-4 py-4"><select value={request.status} onChange={(event) => update(request, event.target.value)} className="h-10 rounded-lg border border-slate-200 px-2 font-bold">{statuses.map((item) => <option key={item}>{item}</option>)}</select></td>
        </tr>
      ))} />
    </section>
  );
}
