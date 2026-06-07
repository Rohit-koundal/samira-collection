import products from '../data/products';
import ProductCard from './ProductCard';

export default function NewArrivals() {
  const arrivals = products.slice(0, 4);

  return (
    <section id="new-arrivals" className="py-10 md:py-14">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a4a42]">New arrivals</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Fresh styles for your wardrobe.</h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-slate-600">
          Discover the latest drops in sarees, gowns, and everyday silhouettes crafted for modern Indian dressing.
        </p>
      </div>
      <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {arrivals.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
