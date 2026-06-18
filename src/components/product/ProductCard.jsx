import { useMemo, useState } from 'react';
import Icon from '../layout/Icon';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getPrimaryImageUrl, isUsableImageUrl, normalizeImageUrl } from '../../services/normalize';
import ProductImageCarousel from './ProductImageCarousel';

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

export function ProductVisual({ product, compact = false, showMeta = true }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = getPrimaryImageUrl(product.images) || product.images?.find((item) => isUsableImageUrl(item?.url))?.url;
  const frameClass = compact ? 'aspect-[4/5] w-full' : 'h-56 w-full md:h-64';
  if (image && !imageFailed) {
    return (
      <div className={`relative overflow-hidden bg-[#f6efe8] ${frameClass}`}>
        <img src={normalizeImageUrl(image)} alt={product.name} onError={() => setImageFailed(true)} className="h-full w-full object-cover object-center" />
      </div>
    );
  }
  const color = swatches[product.colors?.[0]] || '#6d1f34';
  return (
    <div className={`relative overflow-hidden bg-[#f6efe8] ${frameClass}`}>
      <div className="absolute inset-x-5 bottom-0 h-[86%] rounded-t-[90px]" style={{ background: `linear-gradient(145deg, ${color}, #f9d4dd)` }} />
      <div className="absolute left-1/2 top-8 h-24 w-20 -translate-x-1/2 rounded-t-full bg-[#f6d2bf]" />
      <div className="absolute bottom-0 left-1/2 h-[70%] w-[54%] -translate-x-1/2 rounded-t-[80px] bg-white/20 ring-8 ring-white/30" />
      {showMeta && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent p-2">
          <span className="badge-text rounded bg-white/95 px-2 py-1 font-bold text-slate-700">{product.rating} star | {product.numReviews}</span>
        </div>
      )}
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

  const cartItem = cart.getCartItem(product);

  const openProduct = () => navigate(`/product?id=${productId}`);

  const handleWishlist = (event) => {
    event.stopPropagation();
    wishlist.toggleWishlist(product);
  };

  const handleAddToBag = (event) => {
    event.stopPropagation();
    cart.addToCart(product);
  };

  const categoryLabel = [product.category, product.fabric].filter(Boolean).join(' | ');
  const badges = [
    product.isBestSeller ? { label: 'BESTSELLER', className: 'bg-[#f59e0b] text-white' } : null,
    product.isNewArrival ? { label: 'NEW', className: 'bg-[#22c55e] text-white' } : null,
    product.isFeatured && !product.isBestSeller && !product.isNewArrival ? { label: 'FEATURED', className: 'bg-[#7c3aed] text-white' } : null,
  ].filter(Boolean);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[12px] border border-[#ece8e3] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-xl md:rounded-2xl">
      <ProductImageCarousel product={product} onOpen={openProduct}>
        {badges.length > 0 && (
          <div className="absolute left-2 top-2 z-20 flex flex-col gap-1">
            {badges.map((badge) => (
              <span key={badge.label} className={`rounded-[4px] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.04em] shadow-sm ${badge.className}`}>
                {badge.label}
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={handleWishlist}
          className={`absolute right-2 top-2 z-20 grid h-6 w-6 place-items-center rounded-full bg-white/95 shadow-sm transition ${isWishlisted ? 'text-rose' : 'text-slate-500'}`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
        >
          <Icon name="heart" className="h-3.5 w-3.5" />
        </button>
      </ProductImageCarousel>
      <div className="px-2 pb-2 pt-1 md:px-2.5 md:pb-2.5 md:pt-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3
              className="truncate text-[11px] font-semibold leading-[1.25] text-[#1f2a44] md:text-[13px]"
              title={product.name}
            >
              {product.name}
            </h3>
            <p
              className="mt-0.5 truncate text-[10px] text-slate-500 md:text-xs"
              title={categoryLabel}
            >
              {categoryLabel}
            </p>
          </div>
        </div>
        <div className="mt-1 flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
              <span className="text-[12px] font-bold text-charcoal md:text-[13px]">Rs. {product.price}</span>
              <span className="text-[10px] text-slate-400 line-through md:text-xs">Rs. {product.originalPrice}</span>
            </div>
            <p className="mt-0.5 text-[10px] font-bold text-rose md:text-xs">
              ({product.discountPercentage}% OFF)
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddToBag}
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#e7e5e4] text-slate-600 transition md:hidden ${cartItem ? 'bg-emerald-50 text-emerald-700' : 'bg-white'}`}
            aria-label={cartItem ? 'Add more to cart' : 'Add to cart'}
          >
            <Icon name="bag" className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="hidden pt-1.5 md:block">
          <button
            type="button"
            onClick={handleAddToBag}
            className={`h-9 w-full rounded-lg text-xs font-black text-white transition md:rounded-xl ${cartItem ? 'bg-emerald-600' : 'bg-wine'}`}
          >
            {cartItem ? 'Add More' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
