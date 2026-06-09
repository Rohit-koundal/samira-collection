const styles = {
  Active: 'bg-emerald-100 text-emerald-700',
  Inactive: 'bg-slate-100 text-slate-600',
  Pending: 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-sky-100 text-sky-700',
  Packed: 'bg-indigo-100 text-indigo-700',
  Shipped: 'bg-blue-100 text-blue-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-rose-100 text-rose-700',
  Paid: 'bg-emerald-100 text-emerald-700',
  Visible: 'bg-emerald-100 text-emerald-700',
  Hidden: 'bg-slate-100 text-slate-600',
  Blocked: 'bg-rose-100 text-rose-700',
  Requested: 'bg-amber-100 text-amber-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-rose-100 text-rose-700',
};

export default function StatusBadge({ value }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${styles[value] || 'bg-blush text-wine'}`}>{value}</span>;
}
