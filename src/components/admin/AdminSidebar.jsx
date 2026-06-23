import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, LayoutDashboard, Package, PlusCircle, Tags, ShoppingBag, Users, Ticket, Image, Star, RefreshCcw, Boxes, BarChart3, Settings, FilePlus2, GitBranch } from 'lucide-react';

const links = [
  ['Dashboard', '/admin'],
  ['Products', '/admin/products'],
  ['Add Product', '/admin/products/add'],
  ['Product Drafts', '/admin/product-drafts'],
  ['Categories', '/admin/categories'],
  ['Variant Groups', '/admin/variant-groups'],
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
  const [currentHash, setCurrentHash] = useState(typeof window !== 'undefined' ? window.location.hash : '#/admin');

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash || '#/admin');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const items = useMemo(() => links.map(([label, path]) => ({
    label,
    path,
    active: path === '/admin'
      ? currentHash === '#/' || currentHash === '#/admin'
      : currentHash.startsWith(`#${path}`),
    icon: iconForLabel(label),
  })), [currentHash]);

  const sidebar = (
    <aside className="h-screen w-[274px] max-w-[86vw] shrink-0 overflow-y-auto bg-[#171018] px-4 py-4 text-white shadow-[0_20px_60px_rgba(17,10,14,0.22)]">
      <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
        <p className="font-display text-[24px] leading-none font-black">Samira</p>
        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.34em] text-white/55">Admin Panel</p>
        <div className="mt-4 rounded-[20px] border border-white/10 bg-white/7 px-3.5 py-3">
          <p className="text-[10px] font-semibold text-white/70">Welcome back</p>
          <p className="mt-1 text-[13px] font-black leading-5">Manage products, orders, banners and more.</p>
        </div>
      </div>
      <nav className="mt-4 grid gap-1.5">
        {items.map((item) => (
          <a
            key={item.label}
            href={`#${item.path}`}
            onClick={onClose}
            className={`flex items-center justify-between rounded-[16px] px-3.5 py-2.5 text-[13px] font-bold transition ${
              item.active ? 'bg-[#8a3d59] text-white shadow-[0_12px_30px_rgba(138,61,89,0.35)]' : 'text-white/76 hover:bg-white/8 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-3">
                <span className={`grid h-8 w-8 place-items-center rounded-xl ${item.active ? 'bg-white/14' : 'bg-white/7'}`}>
                  {item.icon}
                </span>
              <span>{item.label}</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          </a>
        ))}
      </nav>
      <div className="mt-5 rounded-[22px] border border-white/10 bg-gradient-to-b from-white/8 to-transparent p-3.5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white/80">
            <LayoutDashboard className="h-[18px] w-[18px]" />
          </div>
          <div>
            <p className="text-[13px] font-black">Samira Store</p>
            <p className="text-[11px] text-white/55">Powered by dynamic data</p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>
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

function iconForLabel(label) {
  const map = {
    Dashboard: <LayoutDashboard className="h-4 w-4" />,
    Products: <Package className="h-4 w-4" />,
    'Add Product': <PlusCircle className="h-4 w-4" />,
    'Product Drafts': <FilePlus2 className="h-4 w-4" />,
    Categories: <Tags className="h-4 w-4" />,
    'Variant Groups': <GitBranch className="h-4 w-4" />,
    Orders: <ShoppingBag className="h-4 w-4" />,
    Customers: <Users className="h-4 w-4" />,
    Coupons: <Ticket className="h-4 w-4" />,
    Banners: <Image className="h-4 w-4" />,
    Reviews: <Star className="h-4 w-4" />,
    'Returns / Exchange': <RefreshCcw className="h-4 w-4" />,
    Inventory: <Boxes className="h-4 w-4" />,
    Reports: <BarChart3 className="h-4 w-4" />,
    Settings: <Settings className="h-4 w-4" />,
  };
  return map[label] || <LayoutDashboard className="h-4 w-4" />;
}
