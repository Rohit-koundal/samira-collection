import { useAuth } from '../../context/AuthContext';
import Icon from '../layout/Icon';

export default function AdminHeader({ onOpenSidebar }) {
  const { logout, user, switchMode } = useAuth();
  return (
    <header className="sticky top-0 z-40 flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur lg:min-h-16 lg:gap-3 lg:px-6 lg:py-3">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-charcoal lg:hidden"
          aria-label="Open admin sidebar"
        >
          <Icon name="menu" />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-black text-charcoal">Admin Workspace</p>
          <p className="truncate text-xs font-semibold text-slate-500">{user?.phone || user?.email} | Admin Mode</p>
        </div>
      </div>
      <div className="hidden min-w-[240px] max-w-md flex-1 lg:block">
        <input className="h-10 w-full rounded-xl border border-slate-200 bg-[#fbf8f4] px-4 text-sm font-semibold" placeholder="Search admin panel" />
      </div>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-charcoal" aria-label="Notifications">!</button>
        <button onClick={() => switchMode('customer')} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black sm:text-sm">Customer Mode</button>
        <button onClick={logout} className="rounded-xl bg-wine px-3 py-2 text-xs font-black text-white sm:text-sm">Logout</button>
      </div>
    </header>
  );
}
