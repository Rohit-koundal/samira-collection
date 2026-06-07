import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('customer@test.com');
  return (
    <section className="grid min-h-[70vh] place-items-center px-4 py-10">
      <form onSubmit={(event) => { event.preventDefault(); login({ email }); }} className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-wine">Customer login</p>
        <h1 className="mt-2 text-3xl font-black">Login or Signup</h1>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-6 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder="Email" />
        <input type="password" defaultValue="Customer@123" className="mt-3 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder="Password" />
        <button className="mt-5 h-12 w-full rounded-xl bg-rose text-sm font-black text-white">Continue</button>
        <a href="#/register" className="mt-4 block text-center text-sm font-black text-wine">Create account</a>
      </form>
    </section>
  );
}
