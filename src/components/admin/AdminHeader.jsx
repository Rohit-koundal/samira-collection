import { useAuth } from '../../context/AuthContext';

export default function AdminHeader() {
  const { logout, user } = useAuth();
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div>
        <p className="text-sm font-black text-charcoal">Admin Workspace</p>
        <p className="text-xs font-semibold text-slate-500">{user?.email}</p>
      </div>
      <button onClick={logout} className="rounded-full bg-wine px-5 py-2 text-sm font-black text-white">Logout</button>
    </header>
  );
}
