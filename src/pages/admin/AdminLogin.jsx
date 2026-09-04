import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/samira-collection-logo.png';
import useDesktopFeedback from '../../hooks/useDesktopFeedback';
import '../../components/admin/AdminShell.css';

export default function AdminLogin() {
  const { login } = useAuth();
  const { notify } = useDesktopFeedback();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const showFeedback = (text, type = 'error') => {
    if (!text) return;
    if (!notify(text, type, 'Admin Login')) {
      setError(text);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return showFeedback('Enter a valid email address.');
    if (password.length < 6) return showFeedback('Password must be at least 6 characters.');
    setLoading(true);
    const result = await login({ email, password, redirectTo: '/admin' });
    if (result?.ok === false) showFeedback(result.error || 'Invalid admin login.');
    setLoading(false);
  };

  return (
    <section className="admin-shell grid min-h-screen place-items-center p-4">
      <form onSubmit={submit} className="admin-card w-full max-w-md p-6 sm:p-8">
        <img src={logo} alt="Samira Collection" className="mx-auto h-16 md:h-20" />
        <p className="admin-kicker mt-5 text-center">Admin workspace</p>
        <h1 className="mt-2 text-center">Admin login</h1>
        <p className="admin-note mx-auto text-center">Sign in with your admin email to manage the catalog and orders.</p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="username"
          className="mt-6 h-11 w-full rounded-full border border-[#eadfd5] bg-white px-4 text-sm"
          placeholder="Email"
        />
        <div className="mt-3 flex overflow-hidden rounded-full border border-[#eadfd5] bg-white">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="h-11 min-w-0 flex-1 border-0 px-4 text-sm outline-none"
            placeholder="Password"
          />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="px-4 text-xs font-semibold text-wine">
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {error && <p className="mt-3 rounded-xl bg-rose/10 p-3 text-sm text-rose md:hidden">{error}</p>}
        <button disabled={loading} className="admin-btn mt-5 w-full disabled:opacity-60">{loading ? 'Checking...' : 'Login'}</button>
      </form>
    </section>
  );
}
