import { useEffect } from 'react';
import Home from './Home';
import PageState from '../../components/ui/PageState';
import { useStorefront } from '../../context/StorefrontContext';
import { trackEvent } from '../../utils/analytics';

export default function StoreHome(props) {
  const { store, storeSlug, loading } = useStorefront();

  useEffect(() => {
    if (!storeSlug) return;
    trackEvent('STORE_VIEW', { path: `/store/${storeSlug}` });
  }, [storeSlug]);

  if (loading) return <PageState loading loadingLabel="Opening boutique..." />;
  if (!store) return <PageState error="This boutique is not published yet." />;

  return (
    <div>
      <div className="bg-wine px-4 py-6 text-white">
        <div className="container-page">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Boutique</p>
          <h1 className="mt-2 font-display text-3xl font-black">{store.name}</h1>
          {store.bio && <p className="mt-2 max-w-2xl text-sm text-white/80">{store.bio}</p>}
        </div>
      </div>
      <Home {...props} />
    </div>
  );
}
