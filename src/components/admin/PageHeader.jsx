export default function PageHeader({ title, note, actionLabel, actionHref, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-wine">Admin / {title}</p>
        <h1 className="mt-1 text-2xl font-black text-charcoal md:text-3xl">{title}</h1>
        {note && <p className="mt-1 text-sm font-semibold text-slate-500">{note}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {children}
        {actionLabel && <a href={actionHref} className="rounded-xl bg-wine px-5 py-3 text-sm font-black text-white">{actionLabel}</a>}
      </div>
    </div>
  );
}
