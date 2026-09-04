import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, ChevronLeft, Package } from 'lucide-react';
import api from '../../services/api';
import PageState from '../../components/ui/PageState';

export default function Notifications({ navigate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const unread = useMemo(() => items.filter((item) => !item.readAt), [items]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/notifications?limit=50');
      setItems(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = async (item) => {
    let next = item;
    if (!item.readAt) {
      try {
        next = await api.patch(`/notifications/${item._id}/read`, {});
        setItems((current) => current.map((entry) => (entry._id === item._id ? next : entry)));
      } catch (requestError) {
        setError(requestError.message || 'Unable to update this notification.');
      }
    }
    if (next.metadata?.orderId) navigate(`/order-detail?id=${encodeURIComponent(next.metadata.orderId)}`);
    else if (next.metadata?.returnId) navigate('/returns');
  };

  const markAllRead = async () => {
    if (!unread.length) return;
    const results = await Promise.allSettled(unread.map((item) => api.patch(`/notifications/${item._id}/read`, {})));
    const updates = new Map();
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') updates.set(unread[index]._id, result.value);
    });
    setItems((current) => current.map((item) => updates.get(item._id) || item));
    if (updates.size !== unread.length) setError('Some notifications could not be marked as read.');
  };

  return (
    <section className="min-h-[70vh] bg-[#f7f7f8] px-3 py-4 md:bg-ivory md:px-6 md:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm md:mb-6 md:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/profile')} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200" aria-label="Back to profile">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-[#1f2a44] md:text-3xl">Notifications</h1>
              <p className="mt-1 text-xs text-slate-500">{unread.length} unread update{unread.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <button type="button" onClick={markAllRead} disabled={!unread.length} className="inline-flex h-10 items-center gap-2 rounded-xl border border-wine px-3 text-xs font-bold text-wine disabled:cursor-not-allowed disabled:opacity-40 md:px-4">
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Mark all read</span>
          </button>
        </div>

        {error ? <p className="mb-4 rounded-xl bg-rose/10 px-4 py-3 text-sm font-semibold text-wine">{error}</p> : null}
        {loading ? <PageState loading loadingLabel="Loading notifications..." /> : null}
        {!loading && !items.length ? <PageState empty emptyTitle="No notifications yet" emptyNote="Order and return updates will appear here." /> : null}
        {!loading && items.length ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {items.map((item) => (
              <button key={item._id} type="button" onClick={() => markRead(item)} className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-left last:border-b-0 md:px-6 ${item.readAt ? 'bg-white' : 'bg-[#fff5f8]'}`}>
                <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full ${item.readAt ? 'bg-slate-100 text-slate-500' : 'bg-rose/10 text-wine'}`}>
                  {item.metadata?.orderId ? <Package className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#1f2a44]">{item.title || 'Account update'}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">{item.message || item.event}</span>
                  <span className="mt-2 block text-[10px] font-medium text-slate-400">{formatNotificationDate(item.createdAt)}</span>
                </span>
                {!item.readAt ? <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-rose" aria-label="Unread" /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function formatNotificationDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}
