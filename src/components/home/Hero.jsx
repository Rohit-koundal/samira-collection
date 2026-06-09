import { normalizeImageUrl } from '../../services/normalize';

export default function Hero({ navigate, banner }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-wine via-[#9d3154] to-rose text-white">
      {banner?.image && <img src={normalizeImageUrl(banner.image)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
      <div className="container-page grid min-h-[310px] items-center gap-6 py-8 md:min-h-[520px] md:grid-cols-[1fr_0.85fr] md:gap-10 md:py-14">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffd6df] md:text-sm md:tracking-[0.3em]">New festive collection</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-black leading-tight md:mt-5 md:text-7xl">{banner?.title || 'Premium fashion for every celebration.'}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 md:mt-5 md:text-base md:leading-8">{banner?.subtitle || 'Shop sarees, suits, kurtis, dresses, lehengas, gowns and curated daily wear with an app-like shopping experience.'}</p>
          <div className="mt-5 flex flex-wrap gap-2 md:mt-8 md:gap-3">
            <button onClick={() => navigate(banner?.link || '/products')} className="rounded-full bg-white px-5 py-3 text-xs font-black text-wine md:px-7 md:py-4 md:text-sm">{banner?.buttonText || 'Shop Collection'}</button>
            <button onClick={() => navigate('/category')} className="rounded-full border border-white/40 px-5 py-3 text-xs font-black text-white md:px-7 md:py-4 md:text-sm">Explore Categories</button>
          </div>
        </div>
        <div className="relative hidden h-[430px] md:block">
          <div className="absolute inset-x-8 bottom-0 h-[92%] rounded-t-[220px] bg-[#fff4dc]/20" />
          <div className="absolute left-1/2 top-16 h-28 w-24 -translate-x-1/2 rounded-t-full bg-[#f2c0aa]" />
          <div className="absolute bottom-0 left-1/2 h-[72%] w-[58%] -translate-x-1/2 rounded-t-[180px] bg-[#ffd3dc]/25 ring-[18px] ring-white/15" />
        </div>
      </div>
    </section>
  );
}
