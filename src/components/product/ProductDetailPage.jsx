import { useMemo } from 'react';
import { ChevronRight, Flame, Star } from 'lucide-react';
import ProductGallery from './ProductGallery';
import ProductInfoPanel from './ProductInfoPanel';
import ProductTrustPanel from './ProductTrustPanel';
import ProductTabs from './ProductTabs';
import RelatedProductCarousel from './RelatedProductCarousel';
import './ProductDetailPage.css';

export default function ProductDetailPage({
  product,
  navigate,
  route = '',
  mediaItems = [],
  activeMediaIndex = 0,
  onSelectMedia,
  onPrevMedia,
  onNextMedia,
  onOpenFullscreen,
  onToggleWishlist,
  isWishlisted = false,
  wishlistBusy = false,
  size,
  setSize,
  color,
  setColor,
  quantity,
  setQuantity,
  deliveryPin,
  setDeliveryPin,
  actionMessage,
  dealPrice,
  cartItem,
  isOutOfStock,
  onAddToCart,
  onBuyNow,
  onOrderWhatsApp,
  onCheckDelivery,
  relatedProducts = [],
  reviews = [],
  variantProducts = [],
  selectedMedia,
  storeWhatsappNumber,
}) {
  const breadcrumb = useMemo(
    () => ['Home', product?.category || 'Kurtis', product?.name || 'Product'],
    [product?.category, product?.name],
  );

  const rating = Number(product?.rating || 0).toFixed(1);
  const reviewCount = product?.numReviews || reviews.length || 0;

  return (
    <section className="sc-pdp">
      <div className="sc-pdp__container">

        <div className="sc-pdp__main">
          <ProductGallery
            product={product}
            mediaItems={mediaItems}
            activeIndex={activeMediaIndex}
            onSelect={onSelectMedia}
            onPrev={onPrevMedia}
            onNext={onNextMedia}
            onOpenFullscreen={onOpenFullscreen}
            onToggleWishlist={onToggleWishlist}
            isWishlisted={isWishlisted}
            wishlistBusy={wishlistBusy}
            onViewSimilar={() => navigate(`/products?category=${encodeURIComponent(product?.categoryId || '')}`)}
            selectedMedia={selectedMedia}
            ratingLabel={`${rating} • ${reviewCount}`}
          />

          <ProductInfoPanel
            product={product}
            size={size}
            setSize={setSize}
            color={color}
            setColor={setColor}
            quantity={quantity}
            setQuantity={setQuantity}
            deliveryPin={deliveryPin}
            setDeliveryPin={setDeliveryPin}
            actionMessage={actionMessage}
            dealPrice={dealPrice}
            cartItem={cartItem}
            isOutOfStock={isOutOfStock}
            onAddToCart={onAddToCart}
            onBuyNow={onBuyNow}
            onOrderWhatsApp={onOrderWhatsApp}
            onCheckDelivery={onCheckDelivery}
            variantProducts={variantProducts}
            storeWhatsappNumber={storeWhatsappNumber}
          />

          <ProductTrustPanel />
        </div>

        <div className="sc-pdp__below">
          <ProductTabs product={product} />

          <section className="sc-pdp__feature-card">
            <div className="sc-pdp__section-head">
              <h2>Why you&apos;ll love it</h2>
              <Flame className="sc-pdp__head-icon" aria-hidden="true" />
            </div>
            <div className="sc-pdp__feature-grid">
              {[
                ['Timeless Design', 'Clean silhouettes that never go out of style'],
                ['Premium Comfort', 'Soft, breathable fabrics for all-day wear'],
                ['Versatile Styling', 'Dress it up or down with ease'],
                ['Perfect Fit', 'Balanced structure for a flattering fall'],
                ['Everyday Elegance', 'Minimal yet refined for any occasion'],
              ].map(([title, copy]) => (
                <div key={title} className="sc-pdp__feature">
                  <span className="sc-pdp__feature-icon" aria-hidden="true">
                    <Star />
                  </span>
                  <strong>{title}</strong>
                  <p>{copy}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="sc-pdp__reviews-card">
            <div className="sc-pdp__section-head">
              <h2>Ratings &amp; Reviews</h2>
            </div>
            <div className="sc-pdp__reviews-top">
              <div className="sc-pdp__rating">
                <span className="sc-pdp__rating-value">{rating}</span>
                <div className="sc-pdp__stars" aria-label={`Rated ${rating} out of 5`}>
                  {'★★★★★'.split('').map((star, index) => (
                    <Star key={`${star}-${index}`} className="sc-pdp__star" aria-hidden="true" />
                  ))}
                </div>
                <p>{reviewCount} Reviews</p>
              </div>
              <div className="sc-pdp__rating-bars" aria-hidden="true">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="sc-pdp__rating-row">
                    <span>{star}★</span>
                    <div className="sc-pdp__rating-track"><div className="sc-pdp__rating-fill" style={{ width: `${Math.max(20, 90 - (5 - star) * 16)}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <button type="button" className="sc-pdp__review-btn">Write a Review</button>
            {reviews.length > 0 ? (
              <div className="sc-pdp__review-list">
                {reviews.slice(0, 2).map((review) => (
                  <article key={review._id} className="sc-pdp__review">
                    <div className="sc-pdp__review-meta">
                      <strong>{review.user?.name || 'Verified customer'}</strong>
                      <span>{review.rating}★</span>
                    </div>
                    <p>{review.comment}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="sc-pdp__review-empty">Be the first to share your thoughts on this piece.</p>
            )}
          </section>
        </div>

        <RelatedProductCarousel products={relatedProducts} navigate={navigate} />
      </div>
    </section>
  );
}
