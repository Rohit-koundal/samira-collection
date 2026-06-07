import ProductCard from './ProductCard';

export default function ProductGrid({ products, navigate }) {
  if (!products.length) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
        <h2 className="text-xl font-black">No products found</h2>
        <p className="mt-2 text-sm text-slate-500">Try changing filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
      {products.map((product) => <ProductCard key={product.id} product={product} navigate={navigate} />)}
    </div>
  );
}
