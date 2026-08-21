import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageState from '../../components/ui/PageState';

export default function SellerDashboard({ navigate }) {
  const [stats, setStats] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/seller/dashboard/stats'),
      api.get('/stores/me/current'),
    ]).then(([nextStats, mine]) => {
      setStats(nextStats);
      setOnboarding(mine);
    }).catch((err) => setError(err.message));
  }, []);

  if (error) return <PageState error={error} />;
  if (!stats) return <PageState loading loadingLabel="Loading boutique stats..." />;

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-black">{onboarding?.store?.name || 'Your boutique'}</h1>
        <p className="text-sm font-semibold text-slate-500">#{onboarding?.store?.slug} · {onboarding?.store?.status}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[['Products', stats.products], ['Orders', stats.orders], ['Revenue', `Rs. ${stats.revenue || 0}`], ['Returns', stats.returns]].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="h-11 rounded-xl bg-wine px-5 text-sm font-black text-white" onClick={() => navigate('/seller/onboarding')}>Onboarding</button>
        <button type="button" className="h-11 rounded-xl border px-5 text-sm font-black" onClick={() => navigate('/seller/products')}>Products</button>
        <button type="button" className="h-11 rounded-xl border px-5 text-sm font-black" onClick={() => navigate('/seller/orders')}>Orders</button>
        {onboarding?.store?.slug && <a className="grid h-11 place-items-center rounded-xl border px-5 text-sm font-black" href={`/store/${onboarding.store.slug}`}>View storefront</a>}
      </div>
    </section>
  );
}
