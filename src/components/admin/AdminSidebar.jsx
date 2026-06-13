const links = [
  ['Dashboard', '/admin'],
  ['Products', '/admin/products'],
  ['Add Product', '/admin/products/add'],
  ['Categories', '/admin/categories'],
  ['Orders', '/admin/orders'],
  ['Customers', '/admin/customers'],
  ['Coupons', '/admin/coupons'],
  ['Banners', '/admin/banners'],
  ['Reviews', '/admin/reviews'],
  ['Returns / Exchange', '/admin/returns'],
  ['Inventory', '/admin/inventory'],
  ['Reports', '/admin/reports'],
  ['Settings', '/admin/settings'],
];

export default function AdminSidebar({ open = false, onClose = () => {} }) {
  const sidebar = (
    <aside className="h-full w-72 max-w-[86vw] shrink-0 overflow-y-auto border-r border-slate-200 bg-charcoal p-4 text-white">
      <div className="rounded-2xl bg-white/10 p-4">
        <p className="font-display text-2xl font-black">Samira</p>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">Admin Panel</p>
      </div>
      <nav className="mt-6 grid gap-1">
        {links.map(([label, path]) => (
          <a key={label} href={`#${path}`} onClick={onClose} className="rounded-xl px-4 py-3 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white">
            {label}
          </a>
        ))}
      </nav>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block">{sidebar}</div>
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white text-[10px] font-black text-slate-500 shadow-2xl sm:text-[11px] lg:hidden">
        {links.slice(0, 5).map(([label, path]) => (
          <a key={label} href={`#${path}`} className="grid h-[52px] place-items-center px-1 text-center leading-tight hover:text-wine">{label.replace('Add Product', 'Add')}</a>
        ))}
      </nav>
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label="Close admin sidebar" />
          <div className="absolute inset-y-0 left-0 shadow-2xl">{sidebar}</div>
        </div>
      )}
    </>
  );
}
