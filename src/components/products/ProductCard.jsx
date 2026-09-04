import { useMemo, useState } from 'react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { normalizeImageEntries, normalizeImageUrl } from '../../services/normalize';
import ProductImageCarousel from '../product/ProductImageCarousel';
import QuickViewModal from '../product/QuickViewModal';
import { useStorefront } from '../../context/StorefrontContext';
import { productHref } from '../../utils/routing';
import './ProductCard.css';

export default function ProductCard({
  product,
  navigate,
  onAddToCart,
  onWishlistToggle,
  isWishlisted: isWishlistedProp,
  badgeLabel,
}) {
  const cart = useCart();
  const wishlist = useWishlist();
  const { storeSlug } = useStorefront();
  const [busy, setBusy] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const productId = product?._id || product?.id || product?.slug || '';
  const cartItem = cart.getCartItem(product);
  const isWishlisted = typeof isWishlistedProp === 'boolean'
    ? isWishlistedProp
    : wishlist.items.some((item) => (item._id || item.id || item.slug) === productId);

  const images = useMemo(() => normalizeImageEntries(product?.images || []), [product?.images]);
  const image = images[0]?.url ? normalizeImageUrl(images[0].url) : '';
  const price = Number(product?.sellingPrice ?? product?.price ?? 0);
  const originalPrice = Number(product?.originalPrice ?? price);
  const discount = Number(product?.discountPercentage) || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
  const subtitle = [product?.category, product?.fabric].filter(Boolean).join(' | ') || 'Premium ethnic wear';
  const badge = badgeLabel || (product?.isNewArrival ? 'NEW' : '');

  const openProduct = () => navigate?.(productHref(product, storeSlug));

  const toggleWishlist = async (event) => {
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      if (onWishlistToggle) {
        await onWishlistToggle(product);
      } else {
        await wishlist.toggleWishlist(product);
      }
    } finally {
      setBusy(false);
    }
  };

  const addToCart = (event) => {
    event.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
      return;
    }
    cart.addToCart(product);
  };

  return (
    <article className="sc-product-card" data-theme-product-card>
      <div className="sc-product-card__media" data-theme-product-media>
        {badge ? <span className="sc-product-card__badge">{badge}</span> : null}
        <button
          type="button"
          className={`sc-product-card__wishlist ${isWishlisted ? 'is-active' : ''}`}
          onClick={toggleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          data-card-field="wishlist"
        >
          <Heart className="h-4.5 w-4.5" strokeWidth={1.9} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        <ProductImageCarousel
          product={product}
          className="sc-product-card__carousel rounded-[12px]"
          onOpen={openProduct}
        >
          {!image && (
            <div className="sc-product-card__placeholder">
              {product?.name || 'Samira Collection'}
            </div>
          )}
        </ProductImageCarousel>
        <button type="button" className="sc-product-card__quick" data-card-field="quick-view" onClick={(event) => { event.stopPropagation(); setQuickOpen(true); }}>Quick view</button>
      </div>

      <div className="sc-product-card__body">
        <button type="button" className="sc-product-card__details" onClick={openProduct}>
          <h3 className="sc-product-card__title" title={product?.name} data-card-field="title">
            {product?.name}
          </h3>
          <p className="sc-product-card__subtitle" title={subtitle}>
            {subtitle}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600" data-card-field="rating"><Star className="h-3 w-3" fill="currentColor" />{Number(product?.rating || 0).toFixed(1)} <span className="text-slate-400">({product?.numReviews || 0})</span></p>
        </button>

        <div className="sc-product-card__price-row">
          <div className="sc-product-card__price-copy" data-card-field="price">
            <span className="sc-product-card__price">Rs. {formatPrice(price)}</span>
            {originalPrice > price ? <span className="sc-product-card__original">Rs. {formatPrice(originalPrice)}</span> : null}
            {discount > 0 ? <span className="sc-product-card__discount" data-card-field="discount">({discount}% OFF)</span> : null}
          </div>

          <button
            type="button"
            className={`sc-product-card__cart ${cartItem ? 'is-active' : ''}`}
            onClick={addToCart}
            aria-label={cartItem ? `Add more ${product?.name || 'product'} to cart` : `Add ${product?.name || 'product'} to cart`}
            data-card-field="cart"
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
      {quickOpen && <QuickViewModal product={product} onClose={() => setQuickOpen(false)} onOpenFull={() => { setQuickOpen(false); openProduct(); }} />}
    </article>
  );
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString('en-IN');
}
