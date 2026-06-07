const offers = [
  ['Festive Sale', 'Flat 20% off with FESTIVE20', 'from-wine to-rose'],
  ['New User Deal', 'Extra 15% off with NEWUSER15', 'from-charcoal to-wine'],
  ['Free Shipping', 'Orders above Rs. 999', 'from-[#ad7b2c] to-[#e7b75d]'],
];

export default function OfferBanners({ navigate }) {
  return (
    <section className="container-page pb-8">
      <div className="hide-scrollbar flex gap-4 overflow-x-auto">
        {offers.map(([title, subtitle, gradient]) => (
          <button key={title} onClick={() => navigate('/products')} className={`min-w-[280px] flex-1 rounded-3xl bg-gradient-to-br ${gradient} p-6 text-left text-white shadow-lg`}>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">Offer</p>
            <h3 className="mt-3 text-2xl font-black">{title}</h3>
            <p className="mt-2 text-sm font-semibold text-white/80">{subtitle}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
