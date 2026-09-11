import { useEffect, useMemo, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { normalizeImageUrl } from '../../services/normalize';
import { getApiBaseUrl } from '../../store/apiBaseUrl';
import { getOrCreateSessionId, readStoreSlug } from '../../utils/attribution';

export function bannersForPosition(banners, position, fallbackTypes = []) {
  const positioned = (banners || []).filter((banner) => banner.position === position && banner.image);
  if (positioned.length || !fallbackTypes.length) return positioned;
  return (banners || []).filter((banner) => fallbackTypes.includes(banner.type) && banner.image);
}

export function useBannerEngagement(banner) {
  const ref = useRef(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !banner?._id || typeof IntersectionObserver === 'undefined') return undefined;
    const key = `samira_banner_impression_${banner._id}`;
    let alreadySeen = false;
    try { alreadySeen = sessionStorage.getItem(key) === '1'; } catch { /* storage is optional */ }
    if (alreadySeen) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5)) return;
      try { sessionStorage.setItem(key, '1'); } catch { /* storage is optional */ }
      trackBannerEvent(banner._id, 'impression');
      observer.disconnect();
    }, { threshold: [0.5] });
    observer.observe(element);
    return () => observer.disconnect();
  }, [banner?._id]);
  return ref;
}

export function openBanner(banner, navigate) {
  if (!banner) return;
  trackBannerEvent(banner._id, 'click');
  const target = withCampaign(banner.link || '/products', banner.campaignKey);
  if (/^https:\/\//i.test(target)) window.location.assign(target);
  else navigate?.(target);
}

function trackBannerEvent(bannerId, event) {
  if (!bannerId || typeof fetch !== 'function') return;
  const storeSlug = readStoreSlug();
  fetch(`${getApiBaseUrl()}/banners/${encodeURIComponent(bannerId)}/events`, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      ...(storeSlug ? { 'x-store-slug': storeSlug } : {}),
    },
    body: JSON.stringify({ event, sessionId: getOrCreateSessionId() }),
  }).catch(() => null);
}

export default function StorefrontBannerSlot({ banners = [], position, navigate, className = '', compact = false }) {
  const banner = useMemo(() => bannersForPosition(banners, position)[0], [banners, position]);
  const ref = useBannerEngagement(banner);
  if (!banner) return null;
  const focal = banner.focalPoint || 'center';
  return (
    <section ref={ref} className={`mx-auto w-full px-3 py-3 md:px-6 lg:px-8 ${className}`} data-banner-position={position}>
      <button
        type="button"
        onClick={() => openBanner(banner, navigate)}
        className={`group relative block w-full overflow-hidden rounded-2xl bg-[#f8eee9] text-left shadow-[0_12px_30px_rgba(76,24,42,0.10)] md:rounded-[26px] ${compact ? 'min-h-[112px] md:min-h-[150px]' : 'min-h-[150px] md:min-h-[230px]'}`}
      >
        <picture className="absolute inset-0 block h-full w-full">
          {banner.mobileImage ? <source media="(max-width: 639px)" srcSet={normalizeImageUrl(banner.mobileImage)} /> : null}
          {banner.tabletImage ? <source media="(max-width: 1023px)" srcSet={normalizeImageUrl(banner.tabletImage)} /> : null}
          <img src={normalizeImageUrl(banner.image)} alt={banner.altText || banner.title || ''} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" style={{ objectPosition: focal }} />
        </picture>
        <span className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <span className={`relative flex max-w-xl flex-col items-start justify-center text-white ${compact ? 'min-h-[112px] p-5 md:min-h-[150px] md:p-8' : 'min-h-[150px] p-5 md:min-h-[230px] md:p-10'}`}>
          <small className="text-[10px] font-black uppercase tracking-[0.22em] text-white/80">{position}</small>
          <strong className="mt-2 font-serif text-xl leading-tight md:text-4xl">{banner.title}</strong>
          {banner.subtitle ? <span className="mt-2 line-clamp-2 text-xs font-semibold text-white/90 md:text-base">{banner.subtitle}</span> : null}
          {banner.buttonText ? <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-wine shadow-sm">{banner.buttonText}<ArrowRight className="h-3.5 w-3.5" /></span> : null}
        </span>
      </button>
    </section>
  );
}

function withCampaign(link, campaign) {
  const value = String(link || '/products');
  if (!campaign) return value;
  try {
    const url = new URL(value, window.location.origin);
    url.searchParams.set('utm_source', 'banner');
    url.searchParams.set('utm_campaign', campaign);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : url.toString();
  } catch { return value; }
}
