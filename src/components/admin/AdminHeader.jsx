import { useAuth } from '../../context/AuthContext';
import Icon from '../layout/Icon';

export default function AdminHeader({ onOpenSidebar }) {
  const { logout, user } = useAuth();
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
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
      <button onClick={logout} className="rounded-full bg-wine px-5 py-2 text-sm font-black text-white">Logout</button>
    </header>
  );
}
