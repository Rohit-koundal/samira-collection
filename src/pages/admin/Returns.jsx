import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import StatusBadge from '../../components/admin/StatusBadge';
import { Select } from '../../components/ui/Field';
import api from '../../services/api';
import ShipmentPanel from '../../components/admin/ShipmentPanel';

const statuses = ['Requested', 'Approved', 'Rejected', 'Pickup Scheduled', 'Received', 'Exchanged', 'Refunded', 'Closed'];
const periodParams = route => {
  const incoming = new URLSearchParams(route.split('?')[1] || '');
  const result = new URLSearchParams();
  ['range', 'from', 'to'].forEach(key => { if (incoming.get(key)) result.set(key, incoming.get(key)); });
  return result.toString();
};

export default function Returns({ route = '' }) {
  const [requests, setRequests] = useState([]);
  const [deliveryRequest, setDeliveryRequest] = useState(null);
  const [query, setQuery] = useState(() => new URLSearchParams(route.split('?')[1] || '').get('search') || '');
  const [search, setSearch] = useState(() => new URLSearchParams(route.split('?')[1] || '').get('search') || '');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [period, setPeriod] = useState(() => periodParams(route));
  const loadSequence = useRef(0);
  const latestLoad = useRef(null);
  useEffect(() => { const params = new URLSearchParams(route.split('?')[1] || ''); setQuery(params.get('search') || ''); setSearch(params.get('search') || ''); setStatus(params.get('status') || ''); setPeriod(periodParams(route)); setPage(1); }, [route]);
  const [status, setStatus] = useState(() => new URLSearchParams(route.split('?')[1] || '').get('status') || '');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [updating, setUpdating] = useState({});
  const activeUpdates = useRef(new Set());
  const requestId = /^[a-f\d]{24}$/i.test(search.trim()) ? search.trim() : '';
  useEffect(() => { if (query === search) return undefined; const timer = setTimeout(() => { setSearch(query); setPage(1); }, 250); return () => clearTimeout(timer); }, [query, search]);
  const load = useCallback(() => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError('');
    const params = new URLSearchParams(period);
    params.set('page', page); params.set('limit', 25);
    if (status) params.set('status', status);
    if (requestId) params.set('id', requestId); else if (search.trim()) params.set('search', search.trim());
    api.get(`/admin/returns?${params}`).then((data) => {
      if (sequence !== loadSequence.current) return;
      const items = Array.isArray(data) ? data : data?.items;
      if (!Array.isArray(items) || items.some(item => !item?._id)) throw new Error('Unable to read return requests. Please try again.');
      if (!Array.isArray(data) && page > data.totalPages) { setPage(Math.max(1, data.totalPages)); return; }
      setRequests(items);
      setPagination(Array.isArray(data) ? null : data);
      setMessage('');
    }).catch((error) => { if (sequence === loadSequence.current) setLoadError(error.message); }).finally(() => { if (sequence === loadSequence.current) setLoading(false); });
  }, [requestId, page, status, search, period]);
  latestLoad.current = load;
  useEffect(() => {
    load();
    return () => { loadSequence.current += 1; };
  }, [load]);

  const filtered = useMemo(() => {
    if (pagination) return requests;
    const normalizedQuery = query.trim().toLowerCase();
    return requests.filter((request) => {
      const haystack = [request._id, request.user?.name, request.product?.name, request.reason, request.type].filter(Boolean).join(' ').toLowerCase();
      return (!normalizedQuery || haystack.includes(normalizedQuery)) && (!status || request.status === status);
    });
  }, [query, requests, status, pagination]);

  const update = async (request, nextStatus) => {
    if (nextStatus === request.status || activeUpdates.current.has(request._id)) return;
    activeUpdates.current.add(request._id);
    setUpdating(current => ({ ...current, [request._id]: true }));
    setMessage('');
    try {
      const saved = await api.put(`/admin/returns/${request._id}/status`, { status: nextStatus });
      setRequests((current) => current.map((item) => item._id === request._id ? { ...item, status: saved.status || nextStatus } : item));
      if (pagination) latestLoad.current();
    } catch (error) {
      setMessage(error.message);
    } finally { activeUpdates.current.delete(request._id); setUpdating(current => ({ ...current, [request._id]: false })); }
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Returns / Exchange" note="Approve, reject and track customer return requests." />
      {period && <div className="admin-card flex flex-wrap items-center justify-between gap-3 p-4 text-sm"><span>Request dates: {new URLSearchParams(period).get('range') || `${new URLSearchParams(period).get('from')} to ${new URLSearchParams(period).get('to')}`}</span><button type="button" className="admin-table-action-link" onClick={() => { setPeriod(''); setPage(1); }}>Show all dates</button></div>}
      <p className="admin-note">Mark a refund only after returning the money through your payment provider or directly to the customer. Updating the status does not transfer money.</p>
      {deliveryRequest && <div><div className="mb-3 flex justify-between gap-3"><strong>Return #{deliveryRequest._id.slice(-8).toUpperCase()}</strong><button type="button" className="admin-table-action-link" onClick={() => setDeliveryRequest(null)}>Close delivery details</button></div><ShipmentPanel key={deliveryRequest._id} returnId={deliveryRequest._id} onChanged={load} /></div>}
      {message && <p role="alert" className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{message}</p>}
      <SearchFilterBar search={query} onSearch={setQuery} placeholder="Search request, customer or product">
        <Select aria-label="Return status filter" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="w-full px-3 sm:w-44">
          <option value="">All Status</option>
          {statuses.map((item) => <option key={item}>{item}</option>)}
        </Select>
      </SearchFilterBar>
      <DataTable loading={loading} error={loadError} onRetry={load} emptyTitle="No return requests" heads={['Request ID', 'Customer', 'Product', 'Type', 'Reason', 'Status', 'Update']} rows={filtered.map((request) => (
        <tr key={request._id} className="border-t border-slate-100">
          <td className="px-4 py-4 font-black">{request._id.slice(-8).toUpperCase()}</td>
          <td className="px-4 py-4">{request.user?.name || 'Customer'}</td>
          <td className="px-4 py-4">{request.product?.name || '-'}</td>
          <td className="px-4 py-4">{request.type || 'Return'}</td>
          <td className="px-4 py-4">{request.reason || '-'}</td>
          <td className="px-4 py-4"><StatusBadge value={request.status} /></td>
          <td className="px-4 py-4">
            <Select aria-label={`Status for ${request._id}`} disabled={updating[request._id]} value={request.status} onChange={(event) => update(request, event.target.value)} className="h-10 w-44 rounded-lg px-2">
              {statuses.map((item) => <option key={item}>{item}</option>)}
            </Select>
            {['Approved', 'Pickup Scheduled'].includes(request.status) && <button type="button" className="admin-table-action-link mt-2 block" onClick={() => setDeliveryRequest(request)}>Manage reverse pickup</button>}
          </td>
        </tr>
      ))} />
      {pagination && !loadError && <div className="admin-card flex flex-wrap items-center justify-between gap-3 p-4 text-sm"><span>{pagination.total} matching requests · Page {pagination.page} of {pagination.totalPages}</span><div className="flex gap-2"><button type="button" className="admin-btn-ghost" disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><button type="button" className="admin-btn-ghost" disabled={loading || page >= pagination.totalPages} onClick={() => setPage(value => value + 1)}>Next</button></div></div>}
    </section>
  );
}
