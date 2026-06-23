export default function PageHeader({ title, note, actionLabel, actionHref, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-wine/70 md:text-[11px]">Admin / {title}</p>
        <h1 className="mt-1 text-[22px] font-black tracking-tight text-charcoal md:text-[28px]">{title}</h1>
        {note && <p className="mt-1 max-w-3xl text-[12px] font-semibold leading-5 text-slate-500 md:text-[13px]">{note}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {children}
        {actionLabel && <a href={actionHref} className="rounded-xl bg-wine px-3.5 py-2 text-[12px] font-black text-white md:px-4 md:py-2.5">{actionLabel}</a>}
      </div>
    </div>
  );
}
