import { useMemo, useState } from 'react';
import Icon from '../layout/Icon';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { isUsableImageUrl, normalizeImageUrl } from '../../services/normalize';

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
  const [imageFailed, setImageFailed] = useState(false);
  const image = product.images?.find((item) => isUsableImageUrl(item?.url))?.url;
  if (image && !imageFailed) {
    return (
      <div className={`relative overflow-hidden bg-[#f6efe8] ${compact ? 'h-36 sm:h-44' : 'h-64'}`}>
        <img src={normalizeImageUrl(image)} alt={product.name} onError={() => setImageFailed(true)} className="h-full w-full object-cover" />
      </div>
    );
  }
  const color = swatches[product.colors?.[0]] || '#6d1f34';
  return (
    <div className={`relative overflow-hidden bg-[#f6efe8] ${compact ? 'h-36 sm:h-44' : 'h-64'}`}>
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
  const productId = product._id || product.id || product.slug;
  const isWishlisted = useMemo(
    () => wishlist.items.some((item) => (item._id || item.id || item.slug) === productId),
    [wishlist.items, productId],
  );

  const isInCart = useMemo(
    () => cart.items.some((item) => (item.product._id || item.product.id || item.product.slug) === productId),
    [cart.items, productId],
  );

  const openProduct = () => navigate(`/product?id=${productId}`);

  const handleWishlist = (event) => {
    event.stopPropagation();
    wishlist.toggleWishlist(product);
  };

  const handleAddToBag = (event) => {
    event.stopPropagation();
    cart.addToCart(product);
  };

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl md:rounded-2xl">
      <button type="button" onClick={openProduct} className="block w-full text-left" aria-label={`View ${product.name}`}>
        <ProductVisual product={product} compact />
      </button>
      <div className="space-y-1.5 p-2.5 md:space-y-2 md:p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-black leading-5 text-charcoal md:text-sm">{product.name}</h3>
            <p className="truncate text-[11px] font-semibold text-slate-500 md:text-xs">{product.category} | {product.fabric}</p>
          </div>
          <button
            type="button"
            onClick={handleWishlist}
            className={`shrink-0 rounded-full p-1 transition ${isWishlisted ? 'bg-rose/10 text-rose' : 'text-slate-500'}`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={isWishlisted}
          >
            <Icon name="heart" className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1 text-[11px] md:text-xs">
          <span className="font-black text-charcoal">Rs. {product.price}</span>
          <span className="text-slate-400 line-through">Rs. {product.originalPrice}</span>
          <span className="font-black text-rose">({product.discountPercentage}% OFF)</span>
        </div>
        <button
          type="button"
          onClick={handleAddToBag}
          className={`h-9 w-full rounded-lg text-xs font-black text-white transition md:h-10 md:rounded-xl ${isInCart ? 'bg-emerald-600' : 'bg-wine'}`}
        >
          {isInCart ? 'Added to Bag' : 'Add to Bag'}
        </button>
      </div>
    </article>
  );
}
