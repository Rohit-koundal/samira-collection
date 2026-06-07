import ProductCard from './ProductCard';
import products from '../data/products';

export default function FeaturedProducts() {
  return (
    <section id="featured-products" className="py-10 md:py-14">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a4a42]">Featured products</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Shop premium apparel.</h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-slate-600">
          Timeless silhouettes and modern details crafted for your wardrobe.
        </p>
      </div>

      <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
