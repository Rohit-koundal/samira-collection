import { useMemo, useState } from 'react';
import Icon from '../layout/Icon';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getPrimaryImageUrl, isUsableImageUrl, normalizeImageUrl } from '../../services/normalize';

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

  const showRatingBadge = Number(product.numReviews || 0) > 0;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl md:rounded-2xl">
      <button type="button" onClick={openProduct} className="block w-full text-left" aria-label={`View ${product.name}`}>
        <ProductVisual product={product} compact={showRatingBadge} />
      </button>
      <div className="p-2 md:p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="product-brand line-clamp-2 min-h-[2.5rem] text-charcoal md:min-h-[2.75rem] md:text-sm">{product.name}</h3>
            <p className="product-name mt-0.5 truncate text-slate-500 md:text-xs">{product.category} | {product.fabric}</p>
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
        <div className="mt-2 min-h-[2.2rem]">
          <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 md:text-xs">
            <span className="price text-charcoal">Rs. {product.price}</span>
            <span className="old-price text-slate-400 line-through">Rs. {product.originalPrice}</span>
          </div>
          <p className="discount mt-0.5 font-bold text-rose md:text-xs">
            ({product.discountPercentage}% OFF)
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleAddToBag}
            className={`h-9 w-full rounded-lg text-xs font-black text-white transition md:h-10 md:rounded-xl ${cartItem ? 'bg-emerald-600' : 'bg-wine'}`}
          >
            {cartItem ? 'Add More' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
