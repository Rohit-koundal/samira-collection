import { useAuth } from '../../context/AuthContext';
import Icon from '../layout/Icon';

export default function AdminHeader({ onOpenSidebar }) {
  const { logout, user } = useAuth();
  return (
    <header className="sticky top-0 z-40 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur lg:px-6">
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
          <p className="truncate text-xs font-semibold text-slate-500">{user?.email}</p>
        </div>
      </div>
      <div className="hidden min-w-[240px] max-w-md flex-1 lg:block">
        <input className="h-10 w-full rounded-xl border border-slate-200 bg-[#fbf8f4] px-4 text-sm font-semibold" placeholder="Search admin panel" />
      </div>
      <div className="flex items-center gap-2">
        <button className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-charcoal" aria-label="Notifications">!</button>
        <button onClick={logout} className="rounded-xl bg-wine px-4 py-2 text-sm font-black text-white">Logout</button>
      </div>
    </header>
  );
}
