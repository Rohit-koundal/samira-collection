export default function EmptyState({ title = 'No records found', note = 'Try changing filters or add a new record.' }) {
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
      <h2 className="text-xl font-black text-charcoal">{title}</h2>
      <p className="mt-2 text-sm font-semibold text-slate-500">{note}</p>
    </div>
  );
}
