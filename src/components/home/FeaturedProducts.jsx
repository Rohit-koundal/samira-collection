import ProductGrid from '../product/ProductGrid';

export default function FeaturedProducts({ title = 'Featured Products', subtitle = 'Handpicked by Samira stylists', products, navigate }) {
  return (
    <section className="container-page py-8">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-wine">{subtitle}</p>
          <h2 className="mt-2 text-2xl font-black md:text-4xl">{title}</h2>
        </div>
        <button onClick={() => navigate('/products')} className="hidden rounded-full border border-slate-200 px-5 py-3 text-sm font-black md:block">View all</button>
      </div>
      <ProductGrid products={products} navigate={navigate} />
    </section>
  );
}
