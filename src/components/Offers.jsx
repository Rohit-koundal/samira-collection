const offers = [
  { title: 'Festive Collection', subtitle: 'Up to 40% Off', accent: 'from-[#fef3c7] to-[#f5dfc7]' },
  { title: 'New Arrivals Just Dropped', subtitle: 'Refresh your wardrobe now', accent: 'from-[#ede9fe] to-[#e9d5ff]' },
  { title: 'Premium Ethnic Wear', subtitle: 'Starting ₹799', accent: 'from-[#ffe4e6] to-[#fed7e2]' }
];

export default function Offers() {
  return (
    <section className="mt-16">
      <div className="grid gap-5 lg:grid-cols-3">
        {offers.map((offer) => (
          <article key={offer.title} className={`rounded-[1.75rem] bg-gradient-to-br ${offer.accent} p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-md`}>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-600">{offer.title}</p>
            <h3 className="mt-4 text-2xl font-semibold text-slate-900">{offer.subtitle}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">Discover limited-time offers on festive styling and curated outfit sets.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
