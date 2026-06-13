import ProductGrid from '../product/ProductGrid';

export default function FeaturedProducts({ title = 'Featured Products', subtitle = 'Handpicked by Samira stylists', products, navigate }) {
  return (
    <section className="container-page bg-white py-5 md:bg-transparent md:py-8">
      <div className="mb-4 flex items-end justify-between gap-3 md:mb-5">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-wine md:text-xs md:tracking-[0.2em]">{subtitle}</p>
          <h2 className="mt-1 text-xl font-black leading-tight md:mt-2 md:text-3xl">{title}</h2>
        </div>
        <button onClick={() => navigate('/products')} className="hidden rounded-full border border-slate-200 px-5 py-3 text-sm font-black md:block">View all</button>
      </div>
      <ProductGrid products={products} navigate={navigate} />
    </section>
  );
}
