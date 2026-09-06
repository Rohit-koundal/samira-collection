import { useAuth } from '../../context/AuthContext';
export default function MasterRoute({ children }) {
  const { user } = useAuth();
  if (user?.systemRole !== 'MASTER_OWNER' || user?.offlineSession || user?.role !== 'admin' || user?.activeMode !== 'admin') {
    return <section className="admin-card space-y-3 p-6" role="alert"><h1 className="text-xl font-bold">Access unavailable</h1><p className="text-sm text-slate-600">This account cannot open this workspace. Continue managing your store from the dashboard.</p><a href="/admin" className="admin-btn inline-flex">Back to dashboard</a></section>;
  }
  return children;
}
