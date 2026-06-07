const trendingItems = [
  {
    title: 'Handcrafted Textures',
    description: 'Woven details and luxe embroidery for festive styling.',
    accent: 'from-[#fce9e4] via-[#f5d6cd] to-[#e5c4bb]',
  },
  {
    title: 'Bridal Edit',
    description: 'Curated wedding ensembles with elegant silhouettes.',
    accent: 'from-[#f5ebdf] via-[#e8d2bf] to-[#d8b39a]',
  },
  {
    title: 'Everyday Luxe',
    description: 'Soft kurtis and dresses crafted for comfort and grace.',
    accent: 'from-[#f7f0eb] via-[#ead8c4] to-[#d8b7a0]',
  },
];

export default function TrendingSection() {
  return (
    <section className="py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a4a42]">Trending now</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Looks ready to shop.</h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-slate-600">
          Curated trend boards and styling cues to help you shop the season with confidence.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {trendingItems.map((item) => (
          <article
            key={item.title}
            className={`rounded-[32px] border border-slate-200 bg-gradient-to-br ${item.accent} p-6 text-slate-950 shadow-soft transition hover:-translate-y-1 hover:shadow-xl`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/80 text-2xl shadow-sm">❤</div>
            <h3 className="mt-6 text-2xl font-semibold">{item.title}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-700">{item.description}</p>
            <button className="mt-6 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100">
              Shop the trend
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
