import { useEffect, useMemo, useState } from 'react';
import ConfirmModal from '../../components/admin/ConfirmModal';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [query, setQuery] = useState('');
  const [rating, setRating] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState(null);
  const [actionId, setActionId] = useState('');
  const load = () => {
    setLoading(true);
    api.get('/admin/reviews').then((items) => {
      setReviews(Array.isArray(items) ? items : []);
    }).catch((error) => setMessage({ type: 'error', text: error.message })).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => reviews.filter((review) => {
    const haystack = [review.product?.name, review.user?.name, review.user?.mobile, review.title, review.comment].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase()) && (!rating || Number(review.rating) === Number(rating));
  }), [query, rating, reviews]);

  const toggle = async (review) => {
    if (actionId) return;
    setActionId(review._id);
    setMessage(null);
    try {
      const updated = await api.patch(`/admin/reviews/${review._id}/visibility`, { isVisible: !review.isVisible });
      setReviews((current) => current.map((item) => item._id === review._id
        ? { ...item, isVisible: updated.isVisible, helpfulCount: updated.helpfulCount }
        : item));
      setMessage({ type: 'success', text: `Review ${updated.isVisible ? 'published' : 'hidden'} successfully.` });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setActionId('');
    }
  };
  const remove = async () => {
    if (!deleteTarget?._id || actionId) return;
    const reviewId = deleteTarget._id;
    setActionId(reviewId);
    setMessage(null);
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      setReviews((current) => current.filter((review) => review._id !== reviewId));
      setDeleteTarget(null);
      setMessage({ type: 'success', text: 'Review deleted and the product rating was recalculated.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setActionId('');
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Reviews" note="Moderate customer reviews and visibility." />
      {message && <p role="status" className={`rounded-xl p-3 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose/10 text-rose'}`}>{message.text}</p>}
      <SearchFilterBar search={query} onSearch={setQuery} placeholder="Search product, customer, title or comment">
        <select value={rating} onChange={(event) => setRating(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold"><option value="">All Ratings</option>{[5, 4, 3, 2, 1].map((item) => <option key={item} value={item}>{item} star</option>)}</select>
      </SearchFilterBar>
      <DataTable loading={loading} emptyTitle="No reviews found" heads={['Product', 'Customer', 'Rating', 'Review', 'Signals', 'Status', 'Date', 'Actions']} rows={filtered.map((review) => (
        <tr key={review._id} className="border-t border-slate-100 align-top">
          <td className="px-4 py-4 font-black">{review.product?.name || 'Product'}</td>
          <td className="px-4 py-4"><span className="font-bold">{review.user?.name || 'Customer'}</span>{review.user?.mobile ? <span className="mt-1 block text-xs text-slate-500">{review.user.mobile}</span> : null}</td>
          <td className="px-4 py-4 font-black">{review.rating} ★</td>
          <td className="max-w-sm px-4 py-4">{review.title ? <span className="block font-bold text-slate-800">{review.title}</span> : null}<span className={`${review.title ? 'mt-1 block' : ''} text-slate-600`}>{review.comment || 'Rating only'}</span></td>
          <td className="px-4 py-4"><div className="flex min-w-max flex-col gap-1 text-xs"><span className={review.verifiedPurchase ? 'font-bold text-emerald-700' : 'text-slate-400'}>{review.verifiedPurchase ? 'Verified purchase' : 'Unverified'}</span><span className="text-slate-500">{Number(review.helpfulCount || 0)} helpful</span></div></td>
          <td className="px-4 py-4"><StatusBadge value={review.isVisible ? 'Visible' : 'Hidden'} /></td>
          <td className="px-4 py-4">{new Date(review.createdAt).toLocaleDateString('en-IN')}</td>
          <td className="px-4 py-4"><div className="flex flex-wrap gap-2"><button disabled={!!actionId} onClick={() => toggle(review)} className="admin-table-action-link disabled:opacity-40">{actionId === review._id ? 'Saving...' : review.isVisible ? 'Hide' : 'Show'}</button><button disabled={!!actionId} onClick={() => setDeleteTarget(review)} className="admin-table-action-link is-danger disabled:opacity-40">Delete</button></div></td>
        </tr>
      ))} />
      <ConfirmModal open={!!deleteTarget} title="Delete review?" message="This review will be permanently removed." confirmLabel="Delete" onClose={() => setDeleteTarget(null)} onConfirm={remove} />
    </section>
  );
}
