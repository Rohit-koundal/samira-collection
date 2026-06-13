export default function PageHeader({ title, note, actionLabel, actionHref, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-wine md:text-xs md:tracking-[0.18em]">Admin / {title}</p>
        <h1 className="mt-1 text-xl font-black text-charcoal md:text-3xl">{title}</h1>
        {note && <p className="mt-1 text-sm font-semibold text-slate-500">{note}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {children}
        {actionLabel && <a href={actionHref} className="rounded-xl bg-wine px-4 py-2.5 text-sm font-black text-white md:px-5 md:py-3">{actionLabel}</a>}
      </div>
    </div>
  );
}
