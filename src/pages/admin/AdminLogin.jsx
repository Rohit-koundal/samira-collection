import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/samira-collection-logo.svg';

export default function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@samiracollection.com');
  return (
    <section className="grid min-h-screen place-items-center bg-[#f7f2eb] p-4">
      <form onSubmit={(event) => { event.preventDefault(); login({ email }); }} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <img src={logo} alt="Samira Collection" className="mx-auto h-20" />
        <h1 className="mt-6 text-center text-3xl font-black">Admin Login</h1>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-6 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold" />
        <input type="password" defaultValue="Admin@123" className="mt-3 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold" />
        <button className="mt-5 h-12 w-full rounded-xl bg-wine text-sm font-black text-white">Login</button>
      </form>
    </section>
  );
}
