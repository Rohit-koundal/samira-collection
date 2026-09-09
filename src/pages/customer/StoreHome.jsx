import { useEffect, useState } from 'react';
import Home from './Home';
import PageState from '../../components/ui/PageState';
import { useStorefront } from '../../context/StorefrontContext';
import { trackEvent } from '../../utils/analytics';
import { storefrontPath } from '../../utils/routing';

export default function StoreHome(props) {
  const { store, storeSlug, loading, error, retry } = useStorefront();
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!storeSlug) return;
    trackEvent('STORE_VIEW', { path: `/store/${storeSlug}` });
  }, [storeSlug]);

  useEffect(() => {
    const end = store?.festivalCampaign?.countdownEndsAt;
    if (!end) { setRemaining(''); return undefined; }
    const update = () => setRemaining(formatRemaining(end));
    update();
    const timer = window.setInterval(update, 60000);
    return () => window.clearInterval(timer);
  }, [store?.festivalCampaign?.countdownEndsAt]);

  if (loading) return <PageState loading loadingLabel="Opening boutique..." />;
  if (error) return <PageState error={error} onRetry={retry} />;
  if (!store) return <PageState error="This boutique is not published yet." />;

  return (
    <div>
      {campaignIsLive(store.festivalCampaign) && <section className={`border-b border-[#e6c58a] bg-gradient-to-r ${campaignGradient(store.festivalCampaign.preset)} px-4 py-3 text-[#351a21]`}>
        <div className="container-page flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-65">{store.festivalCampaign.badgeText || 'Limited-time edit'}</p><h2 className="mt-0.5 text-base font-black sm:text-lg">{store.festivalCampaign.title}</h2></div>
          <div className="flex items-center gap-2 text-xs font-black">{store.festivalCampaign.couponCode && <span className="rounded-full border border-current/20 bg-white/60 px-3 py-1.5">Use {store.festivalCampaign.couponCode}</span>}{remaining && <span className="rounded-full bg-[#751d39] px-3 py-1.5 text-white">{remaining}</span>}</div>
        </div>
           </section>}
      <div className="bg-wine px-4 py-6 text-white">
        <div className="container-page">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Boutique</p>
          <h1 className="mt-2 font-display text-3xl font-black">{store.name}</h1>
          {store.bio && <p className="mt-2 max-w-2xl text-sm text-white/80">{store.bio}</p>}
        </div>
      </div>
      <Home
        {...props}
        storeSlug={storeSlug}
        industry={store.industry || 'fashion'}
        industrySections={store.catalog?.homepageSections || []}
        navigate={path => props.navigate(storefrontPath(path, storeSlug))}
      />
    </div>
  );
}

function formatRemaining(value) {
  const milliseconds = new Date(value).getTime() - Date.now();
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return 'Offer ended';
  const days = Math.floor(milliseconds / 86400000);
  const hours = Math.floor((milliseconds % 86400000) / 3600000);
  return days > 0 ? `${days}d ${hours}h left` : `${Math.max(1, hours)}h left`;
}

function campaignGradient(preset) {
  if (preset === 'diwali') return 'from-[#fff2c8] via-[#ffd9a8] to-[#f7b58f]';
  if (preset === 'eid') return 'from-[#dcfce7] via-[#ecfccb] to-[#fef3c7]';
  if (preset === 'christmas') return 'from-[#fee2e2] via-[#dcfce7] to-[#fef3c7]';
  if (preset === 'black-friday') return 'from-[#e5e7eb] via-[#f3f4f6] to-[#fecdd3]';
  return 'from-[#fde7ef] via-[#fff2e8] to-[#fce7c7]';
}

function campaignIsLive(campaign) {
  if (!campaign?.enabled) return false;
  const now = Date.now();
  const startsAt = campaign.startsAt ? new Date(campaign.startsAt).getTime() : null;
  const endsAt = campaign.countdownEndsAt ? new Date(campaign.countdownEndsAt).getTime() : null;
  return (!startsAt || startsAt <= now) && (!endsAt || endsAt > now);
}
