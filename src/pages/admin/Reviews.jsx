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
  const load = () => {
    setLoading(true);
    api.get('/admin/reviews').then(setReviews).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => reviews.filter((review) => {
    const haystack = [review.product?.name, review.user?.name, review.comment].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase()) && (!rating || Number(review.rating) === Number(rating));
  }), [query, rating, reviews]);

  const toggle = async (review) => {
    await api.patch(`/admin/reviews/${review._id}/visibility`, { isVisible: !review.isVisible });
    load();
  };
  const remove = async () => {
    await api.delete(`/admin/reviews/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Reviews" note="Moderate customer reviews and visibility." />
      <SearchFilterBar search={query} onSearch={setQuery} placeholder="Search product, customer or comment">
        <select value={rating} onChange={(event) => setRating(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold"><option value="">All Ratings</option>{[5, 4, 3, 2, 1].map((item) => <option key={item} value={item}>{item} star</option>)}</select>
      </SearchFilterBar>
      <DataTable loading={loading} emptyTitle="No reviews found" heads={['Product', 'Customer', 'Rating', 'Comment', 'Status', 'Date', 'Actions']} rows={filtered.map((review) => (
        <tr key={review._id} className="border-t border-slate-100 align-top">
          <td className="px-4 py-4 font-black">{review.product?.name || 'Product'}</td>
          <td className="px-4 py-4">{review.user?.name || 'Customer'}</td>
          <td className="px-4 py-4 font-black">{review.rating} star</td>
          <td className="max-w-xs px-4 py-4">{review.comment}</td>
          <td className="px-4 py-4"><StatusBadge value={review.isVisible ? 'Visible' : 'Hidden'} /></td>
          <td className="px-4 py-4">{new Date(review.createdAt).toLocaleDateString('en-IN')}</td>
          <td className="px-4 py-4"><div className="flex gap-3"><button onClick={() => toggle(review)} className="font-black text-wine">{review.isVisible ? 'Hide' : 'Show'}</button><button onClick={() => setDeleteTarget(review)} className="font-black text-rose">Delete</button></div></td>
        </tr>
      ))} />
      <ConfirmModal open={!!deleteTarget} title="Delete review?" message="This review will be permanently removed." confirmLabel="Delete" onClose={() => setDeleteTarget(null)} onConfirm={remove} />
    </section>
  );
}
