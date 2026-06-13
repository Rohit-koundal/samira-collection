import AdminLayout from '../admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, switchMode } = useAuth();
  if (!user) {
    return (
      <section className="grid min-h-screen place-items-center bg-[#f7f2eb] px-4">
        <div className="max-w-md rounded-xl bg-white p-5 text-center shadow-xl md:rounded-3xl md:p-8">
          <h1 className="text-2xl font-black text-charcoal">Admin access required</h1>
          <p className="mt-3 text-sm text-slate-600">Login with an admin mobile number to access the dashboard.</p>
          <a href="#/login" className="mt-6 inline-flex rounded-full bg-wine px-6 py-3 text-sm font-black text-white">Login now</a>
        </div>
      </section>
    );
  }
  if (user.role === 'admin' && user.activeMode !== 'admin') {
    return (
      <section className="grid min-h-screen place-items-center bg-[#f7f2eb] px-4">
        <div className="max-w-md rounded-xl bg-white p-5 text-center shadow-xl md:rounded-3xl md:p-8">
          <h1 className="text-2xl font-black text-charcoal">Switch to Admin Mode</h1>
          <p className="mt-3 text-sm text-slate-600">Your account has admin access, but you are currently shopping in customer mode.</p>
          <button onClick={() => switchMode('admin')} className="mt-6 rounded-full bg-wine px-6 py-3 text-sm font-black text-white">Switch to Admin</button>
        </div>
      </section>
    );
  }
  if (user.role !== 'admin') {
    return (
      <section className="grid min-h-screen place-items-center bg-[#f7f2eb] px-4">
        <div className="max-w-md rounded-xl bg-white p-5 text-center shadow-xl md:rounded-3xl md:p-8">
          <h1 className="text-2xl font-black text-charcoal">You do not have permission</h1>
          <p className="mt-3 text-sm text-slate-600">This section is only for Samira Collection admins.</p>
          <a href="#/" className="mt-6 inline-flex rounded-full bg-wine px-6 py-3 text-sm font-black text-white">Go Home</a>
        </div>
      </section>
    );
  }
  return <AdminLayout>{children}</AdminLayout>;
}
