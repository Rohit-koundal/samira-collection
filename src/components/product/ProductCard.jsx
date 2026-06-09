import Icon from '../layout/Icon';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { normalizeImageUrl } from '../../services/normalize';

const swatches = {
  Wine: '#6d1f34',
  Blush: '#ffb4c5',
  Gold: '#b8914a',
  Ivory: '#fff7e6',
  Black: '#17161a',
  Emerald: '#0f6b52',
  Navy: '#172554',
  Rose: '#ff5f86',
};

export function ProductVisual({ product, compact = false }) {
  const image = product.images?.[0]?.url;
  if (image) {
    return <div className={`relative overflow-hidden bg-[#f6efe8] ${compact ? 'h-44' : 'h-64'}`}><img src={normalizeImageUrl(image)} alt={product.name} className="h-full w-full object-cover" /></div>;
  }
  const color = swatches[product.colors?.[0]] || '#6d1f34';
  return (
    <div className={`relative overflow-hidden bg-[#f6efe8] ${compact ? 'h-44' : 'h-64'}`}>
      <div className="absolute inset-x-5 bottom-0 h-[86%] rounded-t-[90px]" style={{ background: `linear-gradient(145deg, ${color}, #f9d4dd)` }} />
      <div className="absolute left-1/2 top-8 h-24 w-20 -translate-x-1/2 rounded-t-full bg-[#f6d2bf]" />
      <div className="absolute bottom-0 left-1/2 h-[70%] w-[54%] -translate-x-1/2 rounded-t-[80px] bg-white/20 ring-8 ring-white/30" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent p-2">
        <span className="rounded bg-white/95 px-2 py-1 text-[10px] font-black text-slate-700">{product.rating} star | {product.numReviews}</span>
      </div>
    </div>
  );
}

export default function ProductCard({ product, navigate }) {
  const cart = useCart();
  const wishlist = useWishlist();

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <button onClick={() => navigate(`/product?id=${product._id || product.id || product.slug}`)} className="block w-full text-left">
        <ProductVisual product={product} compact />
      </button>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-charcoal">{product.name}</h3>
            <p className="truncate text-xs font-semibold text-slate-500">{product.category} | {product.fabric}</p>
          </div>
          <button onClick={() => wishlist.toggleWishlist(product)} className="shrink-0 text-slate-500" aria-label="Toggle wishlist">
            <Icon name="heart" className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="font-black text-charcoal">Rs. {product.price}</span>
          <span className="text-slate-400 line-through">Rs. {product.originalPrice}</span>
          <span className="font-black text-rose">({product.discountPercentage}% OFF)</span>
        </div>
        <button onClick={() => cart.addToCart(product)} className="h-10 w-full rounded-xl bg-wine text-xs font-black text-white">
          Add to Bag
        </button>
      </div>
    </article>
  );
}
