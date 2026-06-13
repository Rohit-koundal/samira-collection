export default function DashboardCard({ title, value, note }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm md:rounded-3xl md:p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 md:text-xs md:tracking-[0.18em]">{title}</p>
      <p className="mt-2 text-2xl font-black text-charcoal md:mt-3 md:text-3xl">{value}</p>
      <p className="mt-2 text-xs font-semibold text-emerald-600">{note}</p>
    </div>
  );
}
