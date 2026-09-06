import { useMemo } from 'react';
import { ChevronRight, LayoutDashboard, Store, Package, ShoppingBag, Users, MessageCircle, Camera, ClipboardList, BarChart3 } from 'lucide-react';
import useAppPath from '../../hooks/useAppPath';

const links = [
  ['Dashboard', '/seller'],
  ['Onboarding', '/seller/onboarding'],
  ['Products', '/seller/products'],
  ['Orders', '/seller/orders'],
  ['Customers', '/seller/crm'],
  ['Inbox', '/seller/inbox'],
  ['Analytics', '/seller/analytics'],
  ['Social studio', '/seller/social'],
  ['Audit log', '/seller/audit'],
];

const icons = {
  Dashboard: LayoutDashboard,
  Onboarding: Store,
  Products: Package,
  Orders: ShoppingBag,
  Customers: Users,
  Inbox: MessageCircle,
  Analytics: BarChart3,
  'Social studio': Camera,
  'Audit log': ClipboardList,
};

export default function SellerLayout({ children }) {
  const path = useAppPath();

  const items = useMemo(() => links.map(([label, itemPath]) => ({
    label,
    path: itemPath,
    active: itemPath === '/seller' ? path === '/seller' || path === '/seller/' : path === itemPath || path.startsWith(`${itemPath}/`),
    Icon: icons[label] || Store,
  })), [path]);

  return (
    <div className="min-h-screen bg-[#f7f2eb] lg:pl-[260px]">
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] overflow-y-auto bg-[#171018] p-4 text-white lg:block">
        <p className="font-display text-2xl font-black">Boutique</p>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/50">Seller workspace</p>
        <nav className="mt-6 grid gap-1.5">
          {items.map((item) => (
            <a key={item.path} href={item.path} className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-bold ${item.active ? 'bg-[#8a3d59]' : 'text-white/75 hover:bg-white/10'}`}>
              <span className="flex items-center gap-3">
                <item.Icon className="h-4 w-4" />
                {item.label}
              </span>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            </a>
          ))}
        </nav>
      </aside>
      <nav className="flex gap-2 overflow-x-auto border-b border-[#e8dcd4] bg-white px-4 py-3 lg:hidden" aria-label="Seller workspace navigation">
        {items.map(item => <a key={item.path} href={item.path} aria-current={item.active ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${item.active ? 'bg-[#751d39] text-white' : 'text-[#75656f]'}`}><item.Icon size={15} />{item.label}</a>)}
      </nav>
      <div className="p-4 lg:p-8">{children}</div>
    </div>
  );
}
