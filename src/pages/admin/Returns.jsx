import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import StatusBadge from '../../components/admin/StatusBadge';
import { Select } from '../../components/ui/Field';
import api from '../../services/api';

const statuses = ['Requested', 'Approved', 'Rejected', 'Pickup Scheduled', 'Received', 'Exchanged', 'Refunded', 'Closed'];

export default function Returns({ route = '' }) {
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState(() => new URLSearchParams(route.split('?')[1] || '').get('search') || '');
  const loadSequence = useRef(0);
  useEffect(() => setQuery(new URLSearchParams(route.split('?')[1] || '').get('search') || ''), [route]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const requestId = /^[a-f\d]{24}$/i.test(query.trim()) ? query.trim() : '';
  const load = useCallback(() => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    api.get(`/admin/returns${requestId ? `?id=${requestId}` : ''}`).then((items) => {
      if (sequence !== loadSequence.current) return;
      setRequests(items || []);
      setMessage('');
    }).catch((error) => { if (sequence === loadSequence.current) setMessage(error.message); }).finally(() => { if (sequence === loadSequence.current) setLoading(false); });
  }, [requestId]);
  useEffect(() => {
    load();
    return () => { loadSequence.current += 1; };
  }, [load]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return requests.filter((request) => {
      const haystack = [request._id, request.user?.name, request.product?.name, request.reason, request.type].filter(Boolean).join(' ').toLowerCase();
      return (!normalizedQuery || haystack.includes(normalizedQuery)) && (!status || request.status === status);
    });
  }, [query, requests, status]);

  const update = async (request, nextStatus) => {
    if (nextStatus === request.status) return;
    const previous = requests;
    setRequests((current) => current.map((item) => (item._id === request._id ? { ...item, status: nextStatus } : item)));
    setMessage('');
    try {
      await api.put(`/admin/returns/${request._id}/status`, { status: nextStatus });
    } catch (error) {
      setRequests(previous);
      setMessage(error.message);
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Returns / Exchange" note="Approve, reject and track customer return requests." />
      {message && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{message}</p>}
      <SearchFilterBar search={query} onSearch={setQuery} placeholder="Search request, customer or product">
        <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full px-3 sm:w-44">
          <option value="">All Status</option>
          {statuses.map((item) => <option key={item}>{item}</option>)}
        </Select>
      </SearchFilterBar>
      <DataTable loading={loading} emptyTitle="No return requests" heads={['Request ID', 'Customer', 'Product', 'Type', 'Reason', 'Status', 'Update']} rows={filtered.map((request) => (
        <tr key={request._id} className="border-t border-slate-100">
          <td className="px-4 py-4 font-black">{request._id.slice(-8).toUpperCase()}</td>
          <td className="px-4 py-4">{request.user?.name || 'Customer'}</td>
          <td className="px-4 py-4">{request.product?.name || '-'}</td>
          <td className="px-4 py-4">{request.type || 'Return'}</td>
          <td className="px-4 py-4">{request.reason || '-'}</td>
          <td className="px-4 py-4"><StatusBadge value={request.status} /></td>
          <td className="px-4 py-4">
            <Select value={request.status} onChange={(event) => update(request, event.target.value)} className="h-10 w-44 rounded-lg px-2">
              {statuses.map((item) => <option key={item}>{item}</option>)}
            </Select>
          </td>
        </tr>
      ))} />
    </section>
  );
}
