import AdminLayout from '../admin/AdminLayout';
import '../admin/AdminShell.css';
import { useAuth } from '../../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, switchMode } = useAuth();
  if (!user) {
    return (
      <AdminGate
        title="Admin access required"
        note="Login with an admin account to open the dashboard."
        action={<a href="/login" className="admin-btn">Login now</a>}
      />
    );
  }
  if (user.role === 'admin' && user.activeMode !== 'admin') {
    return (
      <AdminGate
        title="Switch to admin mode"
        note="Your account has admin access, but you are currently shopping in customer mode."
        action={<button type="button" onClick={() => switchMode('admin')} className="admin-btn">Switch to Admin</button>}
      />
    );
  }
  if (user.role !== 'admin') {
    return (
      <AdminGate
        title="You do not have permission"
        note="This section is only for Samira Collection admins."
        action={<a href="/" className="admin-btn">Go home</a>}
      />
    );
  }
  return <AdminLayout>{children}</AdminLayout>;
}

function AdminGate({ title, note, action }) {
  return (
    <section className="admin-shell grid min-h-screen place-items-center px-4">
      <div className="admin-card w-full max-w-md p-6 text-center sm:p-8">
        <p className="admin-kicker">Samira Collection</p>
        <h1 className="mt-2">{title}</h1>
        <p className="admin-note mx-auto">{note}</p>
        <div className="mt-6 flex justify-center">{action}</div>
      </div>
    </section>
  );
}
