const baseControl = 'h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-wine focus:ring-2 focus:ring-wine/10 disabled:bg-slate-50 disabled:text-slate-400';

export function TextInput({ className = '', ...props }) {
  return <input className={`${baseControl} ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${baseControl} pr-8 font-bold ${className}`} {...props}>
      {children}
    </select>
  );
}

export function FieldLabel({ className = '', ...props }) {
  return <label className={`text-xs font-black uppercase tracking-[0.14em] text-slate-500 ${className}`} {...props} />;
}
