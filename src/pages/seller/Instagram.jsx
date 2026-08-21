import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageState from '../../components/ui/PageState';

export default function SellerInstagram() {
  const [data, setData] = useState(null);
  const [connect, setConnect] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/seller/instagram'),
      api.get('/seller/instagram/connect-url').catch(() => null),
    ]).then(([status, nextConnect]) => {
      setData(status);
      setConnect(nextConnect);
    }).catch((err) => setError(err.message));
  }, []);

  if (!data && !error) return <PageState loading loadingLabel="Checking Instagram connection..." />;

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-black">Instagram</h1>
      {error && <p className="text-sm font-bold text-rose">{error}</p>}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-widest text-slate-400">{data?.status || 'DISCONNECTED'}</p>
        {data?.username && <p className="mt-2 text-sm font-bold">@{data.username}</p>}
        <p className="mt-3 text-sm font-semibold text-slate-600">{data?.note}</p>
        <p className="mt-2 text-sm text-slate-500">Direct Instagram messaging is not enabled. The store is marked connected only after a real Graph API token exchange.</p>
        {connect?.authUrl ? (
          <a href={connect.authUrl} className="mt-5 inline-flex h-11 items-center rounded-xl bg-wine px-5 text-sm font-black text-white">Connect Instagram</a>
        ) : (
          <p className="mt-5 text-sm font-bold text-slate-500">{connect?.note || data?.note}</p>
        )}
      </div>
    </section>
  );
}
