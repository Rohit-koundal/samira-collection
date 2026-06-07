import suitImage from '../assets/product-suit.svg';
import sareeImage from '../assets/product-saree.svg';
import kurtiImage from '../assets/product-kurti.svg';
import gownImage from '../assets/product-gown.svg';
import lehengaImage from '../assets/product-lehenga.svg';
import dressImage from '../assets/product-dress.svg';

const productImages = {
  'product-suit.svg': suitImage,
  'product-saree.svg': sareeImage,
  'product-kurti.svg': kurtiImage,
  'product-gown.svg': gownImage,
  'product-lehenga.svg': lehengaImage,
  'product-dress.svg': dressImage,
};

export default function ProductCard({ product }) {
  const image = productImages[product.image];

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-slate-100 p-4">
        <img src={image} alt={product.name} className="h-36 w-full object-contain" />
        <div className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm">
          {product.discount}% off
        </div>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.24em] text-[#8a4a42]">
          <span>Samira Collection</span>
          <button className="rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:border-[#d4b397] hover:text-[#8a4a42]">
            ❤️
          </button>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-950 md:text-base">{product.name}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-600 md:text-sm">{product.category} crafted for festive and daily occasions.</p>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-slate-600 md:text-sm">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-950">₹{product.price}</p>
            <p className="text-[11px] text-slate-400 line-through">₹{product.original}</p>
          </div>
          <span className="rounded-full bg-[#f8e7df] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a4a42]">
            {product.discount}% off
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>★ {product.rating}</span>
          <span className="rounded-full bg-[#f7f0eb] px-2 py-1 text-[#8a4a42]">{product.badge}</span>
        </div>
        <button className="w-full rounded-full bg-[#8a4a42] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7a413d]">
          Add to Cart
        </button>
      </div>
    </article>
  );
}
