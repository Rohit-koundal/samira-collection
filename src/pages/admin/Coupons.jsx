import { useEffect, useMemo, useState } from 'react';
import CouponForm from '../../components/admin/CouponForm';
import ConfirmModal from '../../components/admin/ConfirmModal';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/coupons?admin=true').then((items) => {
      setCoupons(items);
      setMessage('');
    }).catch((error) => setMessage(error.message)).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => coupons.filter((coupon) => coupon.code.toLowerCase().includes(query.toLowerCase())), [coupons, query]);
  const remove = async () => {
    try {
      await api.delete(`/admin/coupons/${deleteTarget._id}`);
      setDeleteTarget(null);
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Coupons" note="Create and manage promotional offers." />
      <CouponForm onSaved={load} />
      {message && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{message}</p>}
      <SearchFilterBar search={query} onSearch={setQuery} placeholder="Search coupon code" />
      <DataTable loading={loading} emptyTitle="No coupons found" heads={['Code', 'Type', 'Value', 'Min Order', 'Max Discount', 'Expiry', 'Status', 'Actions']} rows={filtered.map((coupon) => (
        <tr key={coupon._id} className="border-t border-slate-100">
          <td className="px-4 py-4 font-black">{coupon.code}</td>
          <td className="px-4 py-4">{coupon.type}</td>
          <td className="px-4 py-4">{coupon.discountValue}{coupon.type === 'Percentage' ? '%' : ''}</td>
          <td className="px-4 py-4">Rs. {coupon.minOrderAmount}</td>
          <td className="px-4 py-4">Rs. {coupon.maxDiscountAmount}</td>
          <td className="px-4 py-4">{coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString('en-IN') : '-'}</td>
          <td className="px-4 py-4"><StatusBadge value={coupon.isActive ? 'Active' : 'Inactive'} /></td>
          <td className="px-4 py-4"><button onClick={() => setDeleteTarget(coupon)} className="font-black text-rose">Delete</button></td>
        </tr>
      ))} />
      <ConfirmModal open={!!deleteTarget} title="Delete coupon?" message={`Delete ${deleteTarget?.code}?`} confirmLabel="Delete" onClose={() => setDeleteTarget(null)} onConfirm={remove} />
    </section>
  );
}
