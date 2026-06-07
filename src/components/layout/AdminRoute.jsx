import AdminLayout from '../admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return (
      <section className="grid min-h-screen place-items-center bg-[#f7f2eb] px-4">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black text-charcoal">Admin access required</h1>
          <p className="mt-3 text-sm text-slate-600">Login with admin@samiracollection.com to access the dashboard.</p>
          <a href="#/admin/login" className="mt-6 inline-flex rounded-full bg-wine px-6 py-3 text-sm font-black text-white">Admin login</a>
        </div>
      </section>
    );
  }
  return <AdminLayout>{children}</AdminLayout>;
}
