import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user, logout, switchMode } = useAuth();
  return (
    <section className="container-page py-6 md:py-8">
      <div className="rounded-xl bg-white p-5 shadow-sm md:rounded-3xl md:p-7">
        <h1 className="text-2xl font-black md:text-3xl">My Profile</h1>
        <p className="mt-3 font-semibold text-slate-600">{user?.name} | {user?.phone || user?.email}</p>
        <p className="mt-2 inline-flex rounded-full bg-blush px-3 py-1 text-xs font-black text-wine">{user?.activeMode || 'customer'} Mode</p>
        <div className="mt-6 grid gap-3 md:grid-cols-3 md:gap-4">{['Addresses', 'Orders', 'Wishlist'].map((item) => <div key={item} className="rounded-xl bg-[#f8f2ec] p-4 font-black md:rounded-2xl md:p-5">{item}</div>)}</div>
        {user?.role === 'admin' && user?.activeMode !== 'admin' && <button onClick={() => switchMode('admin')} className="mt-6 mr-3 rounded-xl bg-wine px-5 py-3 text-sm font-black text-white">Switch to Admin</button>}
        <button onClick={logout} className="mt-6 rounded-xl bg-charcoal px-5 py-3 text-sm font-black text-white">Logout</button>
      </div>
    </section>
  );
}
