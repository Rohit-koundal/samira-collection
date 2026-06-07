const banners = [
  { title: 'Festive Sale', subtitle: 'Up to 40% Off', description: 'Celebrate with premium ethnicwear.', accent: 'bg-[#fbe3dc]' },
  { title: 'New Arrivals', subtitle: 'Starting ₹799', description: 'Fresh styles for the season.', accent: 'bg-[#f7efe8]' },
  { title: 'Wedding Collection', subtitle: 'Live now', description: 'Bridal-ready lehengas and silk sarees.', accent: 'bg-[#f5e7de]' },
  { title: 'Daily Wear Kurtis', subtitle: 'From ₹499', description: 'Everyday comfort with elegant prints.', accent: 'bg-[#f6eee8]' },
];

export default function OfferBanners() {
  return (
    <section className="py-10 md:py-14">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a4a42]">Limited time offers</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Seasonal highlights.</h2>
        </div>
        <p className="hidden md:block max-w-xl text-sm leading-7 text-slate-600">
          Enjoy premium styling offers across new arrivals, wedding edits, and daily essentials.
        </p>
      </div>

      <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-4 md:overflow-visible md:gap-4">
        {banners.map((banner) => (
          <article
            key={banner.title}
            className={`${banner.accent} min-w-[260px] snap-start rounded-[28px] border border-slate-200 p-6 shadow-soft transition hover:-translate-y-1 hover:border-[#c69d72] md:min-w-0`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a4a42]">{banner.title}</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">{banner.subtitle}</h3>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-[#8a4a42] shadow-sm text-3xl">
                ✨
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">{banner.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
