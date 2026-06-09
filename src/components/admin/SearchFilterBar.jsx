export default function SearchFilterBar({ search, onSearch, children, placeholder = 'Search records' }) {
  return (
    <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[minmax(220px,1fr)_auto]">
      <input value={search} onChange={(event) => onSearch(event.target.value)} className="h-11 min-w-0 rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder={placeholder} />
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
