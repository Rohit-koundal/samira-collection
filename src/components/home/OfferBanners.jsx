import { normalizeImageUrl } from '../../services/normalize';

const offers = [
  ['Festive Sale', 'Flat 20% off with FESTIVE20', 'from-wine to-rose'],
  ['New User Deal', 'Extra 15% off with NEWUSER15', 'from-charcoal to-wine'],
  ['Free Shipping', 'Orders above Rs. 999', 'from-[#ad7b2c] to-[#e7b75d]'],
];

export default function OfferBanners({ navigate, banners }) {
  const list = banners?.length ? banners.map((banner) => [banner.title, banner.subtitle, 'from-wine to-rose', banner.image, banner.link]) : offers;
  return (
    <section className="container-page pb-8">
      <div className="hide-scrollbar flex gap-4 overflow-x-auto">
        {list.map(([title, subtitle, gradient, image, link]) => (
          <button key={title} onClick={() => navigate(link || '/products')} className={`relative min-w-[280px] flex-1 overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 text-left text-white shadow-lg`}>
            {image && <img src={normalizeImageUrl(image)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
            <span className="relative block">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">Offer</p>
            <h3 className="mt-3 text-2xl font-black">{title}</h3>
            <p className="mt-2 text-sm font-semibold text-white/80">{subtitle}</p>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
