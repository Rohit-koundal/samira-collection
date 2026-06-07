import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  return (
    <section className="container-page py-8">
      <div className="rounded-3xl bg-white p-7 shadow-sm">
        <h1 className="text-3xl font-black">My Profile</h1>
        <p className="mt-3 font-semibold text-slate-600">{user?.name} | {user?.email}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">{['Addresses', 'Orders', 'Wishlist'].map((item) => <div key={item} className="rounded-2xl bg-[#f8f2ec] p-5 font-black">{item}</div>)}</div>
        <button onClick={logout} className="mt-6 rounded-xl bg-charcoal px-5 py-3 text-sm font-black text-white">Logout</button>
      </div>
    </section>
  );
}
