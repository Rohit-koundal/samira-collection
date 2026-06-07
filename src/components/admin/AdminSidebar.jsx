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

export default function AdminSidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-charcoal p-5 text-white lg:block">
      <div className="rounded-3xl bg-white/10 p-4">
        <p className="font-display text-2xl font-black">Samira</p>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">Admin Panel</p>
      </div>
      <nav className="mt-6 grid gap-1">
        {links.map(([label, path]) => (
          <a key={label} href={`#${path}`} className="rounded-xl px-4 py-3 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white">
            {label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
