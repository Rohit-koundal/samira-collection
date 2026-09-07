import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ConfirmModal from '../../components/admin/ConfirmModal';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';

const orderStatuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Exchange Requested', 'Returned', 'Refunded'];
const paymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];
const taskLabels = { pending: 'New orders', packing: 'To pack', dispatch: 'To dispatch', transit: 'In transit', cod: 'COD confirmation pending', collection: 'Delivered COD awaiting collection' };
function readFilters(route) {
  const params = new URLSearchParams(route.split('?')[1] || '');
  const extra = new URLSearchParams();
  ['range', 'from', 'to', 'attention', 'deliveryStatus'].forEach(key => { if (params.get(key)) extra.set(key, params.get(key)); });
  return { search: params.get('search') || '', status: params.get('status') || '', payment: params.get('payment') || '', extra: extra.toString() };
}

export default function Orders({ route = '' }) {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState(() => readFilters(route).search);
  const [search, setSearch] = useState(() => readFilters(route).search);
  const [status, setStatus] = useState(() => readFilters(route).status);
  const [payment, setPayment] = useState(() => readFilters(route).payment);
  const [extra, setExtra] = useState(() => readFilters(route).extra);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const loadSequence = useRef(0);
  const latestLoad = useRef(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  useEffect(() => {
    const filters = readFilters(route);
    setQuery(filters.search); setSearch(filters.search); setStatus(filters.status); setPayment(filters.payment); setExtra(filters.extra); setPage(1);
  }, [route]);
  useEffect(() => {
    if (query === search) return undefined;
    const timer = setTimeout(() => { setSearch(query); setPage(1); }, 250);
    return () => clearTimeout(timer);
  }, [query, search]);
  const requestParams = new URLSearchParams(extra);
  requestParams.set('page', page); requestParams.set('limit', limit);
  if (search.trim()) requestParams.set('search', search.trim());
  if (status) requestParams.set('status', status);
  if (payment) requestParams.set('payment', payment);
  const requestPath = `/admin/orders?${requestParams}`;

  const load = useCallback(() => {
    const sequence = ++loadSequence.current;
    setLoading(true); setLoadError('');
    api.get(requestPath)
      .then((data) => {
        if (sequence !== loadSequence.current) return;
        const items = Array.isArray(data) ? data : data?.items;
        if (!Array.isArray(items) || items.some(item => !item?._id)) throw new Error('Unable to read orders. Please try again.');
        if (!Array.isArray(data) && page > data.totalPages) { setPage(Math.max(1, data.totalPages)); return; }
        setOrders(items);
        setPagination(Array.isArray(data) ? null : data);
        setMessage('');
      })
      .catch((error) => { if (sequence === loadSequence.current) setLoadError(error.message); })
      .finally(() => { if (sequence === loadSequence.current) setLoading(false); });
  }, [requestPath, page]);
  latestLoad.current = load;

  useEffect(() => { load(); return () => { loadSequence.current += 1; }; }, [load]);

  const filtered = useMemo(() => pagination ? orders : orders.filter((order) => {
    const haystack = [order._id, order.user?.name, order.user?.email, order.user?.phone, order.shippingAddress?.fullName].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase()) && (!status || order.orderStatus === status) && (!payment || order.paymentStatus === payment);
  }), [orders, payment, query, status, pagination]);

  const updateOrder = async (order, orderStatus) => {
    try {
      await api.put(`/admin/orders/${order._id}/status`, { orderStatus });
      latestLoad.current();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updatePayment = async (order, paymentStatus) => {
    try {
      await api.put(`/admin/orders/${order._id}/payment-status`, { paymentStatus });
      latestLoad.current();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteOrder = async () => {
    if (!deleteTarget) return;
    try {
      const response = await api.delete(`/admin/orders/${deleteTarget._id}`);
      setOrders((current) => current.map((order) => order._id === deleteTarget._id
        ? { ...order, ...response.order, orderStatus: response.order?.orderStatus || 'Cancelled' } : order));
      setMessage('');
      setDeleteTarget(null);
      if (pagination) latestLoad.current();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Orders" note="Search, filter and update order/payment statuses." />
      {(extra || status || payment || query) && <div className="admin-card flex flex-wrap items-center justify-between gap-3 p-4 text-sm"><span>{new URLSearchParams(extra).get('attention') ? taskLabels[new URLSearchParams(extra).get('attention')] || 'Order task' : 'Filtered orders'}{new URLSearchParams(extra).get('range') ? ` · Period: ${new URLSearchParams(extra).get('range')}` : ''}{new URLSearchParams(extra).get('from') ? ` · ${new URLSearchParams(extra).get('from')} to ${new URLSearchParams(extra).get('to')}` : ''}</span><button type="button" className="admin-table-action-link" onClick={() => { setExtra(''); setQuery(''); setSearch(''); setStatus(''); setPayment(''); setPage(1); }}>Clear all filters</button></div>}
      {message && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{message}</p>}
      <SearchFilterBar search={query} onSearch={setQuery} placeholder="Search order, customer, email or phone">
        <Select value={status} onChange={value => { setStatus(value); setPage(1); }} options={['', ...orderStatuses]} label="All order status" />
        <Select value={payment} onChange={value => { setPayment(value); setPage(1); }} options={['', ...paymentStatuses]} label="All payments" /><label className="text-sm">Delivery status<select aria-label="Delivery status filter" className="admin-field__control" value={new URLSearchParams(extra).get('deliveryStatus') || ''} onChange={e => { const params = new URLSearchParams(extra); if (e.target.value) params.set('deliveryStatus', e.target.value); else params.delete('deliveryStatus'); setExtra(params.toString()); setPage(1); }}><option value="">All deliveries</option>{['WAITING', 'READY_TO_SHIP', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION', 'RTO_IN_TRANSIT', 'RETURNED', 'CANCELLED'].map(s => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}</select></label>
      </SearchFilterBar>
      <DataTable
        loading={loading}
        error={loadError} onRetry={load}
        emptyTitle="No orders found"
        heads={['Order ID', 'Customer', 'Date', 'Amount', 'Payment', 'Provider', 'Order Status', 'Delivery', 'Actions']}
        rows={filtered.map((order) => (
          <tr key={order._id} className="border-t border-slate-100">
            <td className="px-4 py-4 font-black">{order._id.slice(-8).toUpperCase()}</td>
            <td className="px-4 py-4">
              <p className="font-bold">{order.user?.name || order.shippingAddress?.fullName || 'Customer'}</p>
              <p className="text-xs text-slate-500">{order.user?.email}</p>
            </td>
            <td className="px-4 py-4">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
            <td className="px-4 py-4 font-black">Rs. {order.finalAmount}</td>
            <td className="px-4 py-4">
              <select value={order.paymentStatus} onChange={(event) => updatePayment(order, event.target.value)} className="h-10 rounded-lg border border-slate-200 px-2 font-bold">
                {paymentStatuses.map((item) => <option key={item}>{item}</option>)}
              </select>
            </td>
            <td className="px-4 py-4">{order.paymentProvider || order.paymentMethod}</td>
            <td className="px-4 py-4"><StatusBadge value={order.orderStatus} /></td><td className="px-4 py-4"><span className="text-sm">{order.shipment?.status ? order.shipment.status.replaceAll('_', ' ') : ['Pending', 'Confirmed', 'Packed'].includes(order.orderStatus) ? 'Waiting for shipment' : '?'}</span>{order.shipment?.awb && <p className="admin-note">AWB {order.shipment.awb}</p>}</td>
            <td className="px-4 py-4">
              <div className="flex items-center gap-3">
                <select value={order.orderStatus} onChange={(event) => updateOrder(order, event.target.value)} className="h-10 rounded-lg border border-slate-200 px-2 font-bold">
                  {orderStatuses.map((item) => <option key={item}>{item}</option>)}
                </select>
                <a href={`/admin/orders/detail?id=${order._id}`} className="admin-table-action-link">View</a>
                {!['Delivered', 'Cancelled', 'Returned', 'Refunded'].includes(order.orderStatus) && <button type="button" onClick={() => setDeleteTarget(order)} className="admin-table-action-link is-danger">Cancel</button>}
              </div>
            </td>
          </tr>
        ))}
      />
      {pagination && !loadError && <div className="admin-card flex flex-wrap items-center justify-between gap-3 p-4 text-sm"><span>{pagination.total} matching orders · Page {pagination.page} of {pagination.totalPages}</span><label>Per page <select aria-label="Orders per page" value={limit} onChange={event => { setLimit(Number(event.target.value)); setPage(1); }} className="ml-2 rounded-lg border p-2">{[25, 50, 100].map(value => <option key={value}>{value}</option>)}</select></label><div className="flex gap-2"><button type="button" className="admin-btn-ghost" disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><button type="button" className="admin-btn-ghost" disabled={loading || page >= pagination.totalPages} onClick={() => setPage(value => value + 1)}>Next</button></div></div>}
      <ConfirmModal
        open={!!deleteTarget}
        title="Cancel order?"
        message={`Order ${deleteTarget?._id?.slice(-8)?.toUpperCase() || ''} will be cancelled and retained in order history.`}
        confirmLabel="Cancel order"
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteOrder}
      />
    </section>
  );
}

function Select({ value, onChange, options, label }) {
  return (
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold">
      {options.map((item) => <option key={item || label} value={item}>{item || label}</option>)}
    </select>
  );
}
