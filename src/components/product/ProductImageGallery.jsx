import { ProductVisual } from './ProductCard';

export default function ProductImageGallery({ product }) {
  return (
    <div className="grid gap-3 md:grid-cols-[80px_1fr]">
      <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:block md:space-y-3">
        {product.colors.map((color) => (
          <button key={color} className="h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-sm">
            <ProductVisual product={{ ...product, colors: [color] }} compact />
          </button>
        ))}
      </div>
      <div className="order-1 overflow-hidden rounded-3xl bg-white shadow-sm md:order-2">
        <ProductVisual product={product} />
      </div>
    </div>
  );
}
