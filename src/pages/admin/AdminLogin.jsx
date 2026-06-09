import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/samira-collection-logo.svg';

export default function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@samiracollection.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    const result = await login({ email, password });
    if (result?.ok === false) setError(result.error || 'Invalid admin login.');
    setLoading(false);
  };

  return (
    <section className="grid min-h-screen place-items-center bg-[#f7f2eb] p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <img src={logo} alt="Samira Collection" className="mx-auto h-20" />
        <h1 className="mt-6 text-center text-3xl font-black">Admin Login</h1>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-6 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder="Email" />
        <div className="mt-3 flex rounded-xl border border-slate-200">
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 min-w-0 flex-1 rounded-l-xl px-4 text-sm font-semibold outline-none" placeholder="Password" />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="px-4 text-xs font-black text-wine">{showPassword ? 'Hide' : 'Show'}</button>
        </div>
        {error && <p className="mt-3 rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{error}</p>}
        <button disabled={loading} className="mt-5 h-12 w-full rounded-xl bg-wine text-sm font-black text-white disabled:opacity-60">{loading ? 'Checking...' : 'Login'}</button>
      </form>
    </section>
  );
}
