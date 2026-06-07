export default function DashboardCard({ title, value, note }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-black text-charcoal">{value}</p>
      <p className="mt-2 text-xs font-semibold text-emerald-600">{note}</p>
    </div>
  );
}
