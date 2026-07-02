import { Minus, Plus, Ruler, Share2, ShoppingBag, Store } from 'lucide-react';
import './ProductInfoPanel.css';

const defaultSwatches = {
  Wine: '#6d1f34',
  Pink: '#f2a9bc',
  Gold: '#b88945',
  Brown: '#b58a62',
  Ivory: '#f3ead7',
  Black: '#17161a',
};

export default function ProductInfoPanel({
  product,
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
  variantProducts = [],
}) {
  const sizes = product?.sizes?.length ? product.sizes : ['S', 'M', 'L', 'XL'];
  const colors = product?.colors?.length ? product.colors : ['Wine', 'Pink', 'Gold'];
  const productName = product?.name || 'White modern top';
  const currentPrice = Number(product?.price || 0);
  const originalPrice = Number(product?.originalPrice || currentPrice);
  const discount = Number(product?.discountPercentage || 0);

  return (
    <div className="sc-info">
      <div className="sc-info__panel">
        <p className="sc-info__brand">{product?.brand || 'Samaira Collection'}</p>
        <h1 className="sc-info__title">{productName}</h1>

        <div className="sc-info__rating-row">
          <div className="sc-info__stars" aria-label={`Rated ${Number(product?.rating || 0).toFixed(1)} out of 5`}>
            {'★★★★★'.split('').map((star, index) => (
              <span key={`${star}-${index}`}>★</span>
            ))}
          </div>
          <p>
            <strong>{Number(product?.rating || 0).toFixed(1)}</strong> ({product?.numReviews || 0} Reviews)
          </p>
          <span className="sc-info__divider">|</span>
          <p>{Math.max(0, product?.customersLove || 12000)}+ Customers love this</p>
        </div>

        <div className="sc-info__price-row">
          <span className="sc-info__price">₹{currentPrice.toLocaleString('en-IN')}</span>
          <span className="sc-info__original">₹{originalPrice.toLocaleString('en-IN')}</span>
          <span className="sc-info__discount">({discount}% OFF)</span>
        </div>
        <p className="sc-info__tax">Inclusive of all taxes</p>

        <div className="sc-info__offer">
          <div className="sc-info__offer-copy">
            <p>MEGA DEAL</p>
            <strong>Get at ₹{dealPrice || currentPrice}</strong>
            <span>With Coupon + Bank Offer</span>
            <small>Bank offers &amp; extra savings</small>
          </div>
          <div className="sc-info__offer-side">
            <span className="sc-info__offer-badge">Extra ₹200 OFF</span>
            <button type="button" className="sc-info__offer-link">View all offers</button>
          </div>
        </div>

        <div className="sc-info__section">
          <div className="sc-info__section-head">
            <h2>Size</h2>
            <button type="button" className="sc-info__link">
              <Ruler size={14} />
              Size Guide
            </button>
          </div>
          <div className="sc-info__sizes">
            {sizes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSize?.(item)}
                className={`sc-info__size${size === item ? ' sc-info__size--active' : ''}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="sc-info__section">
          <div className="sc-info__section-head">
            <h2>Color: {color || colors[0]}</h2>
          </div>
          <div className="sc-info__colors">
            {colors.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setColor?.(item)}
                className={`sc-info__swatch${color === item ? ' sc-info__swatch--active' : ''}`}
                style={{ backgroundColor: defaultSwatches[item] || defaultSwatches.Wine }}
                aria-label={`Select color ${item}`}
                title={item}
              />
            ))}
          </div>
        </div>

        {variantProducts.length > 0 ? (
          <div className="sc-info__section">
            <div className="sc-info__section-head">
              <h2>More variants</h2>
            </div>
            <div className="sc-info__variants">
              {variantProducts.slice(0, 4).map((variant) => {
                const variantId = variant._id || variant.id || variant.slug;
                const isActive = String(variantId) === String(product?._id || product?.id || product?.slug);
                return (
                  <button
                    key={variantId}
                    type="button"
                    className={`sc-info__variant${isActive ? ' sc-info__variant--active' : ''}`}
                  >
                    {variant.variantColor || variant.variantName || variant.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="sc-info__section">
          <div className="sc-info__section-head">
            <h2>Qty</h2>
          </div>
          <div className="sc-info__qty">
            <button type="button" onClick={() => setQuantity?.((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">
              <Minus size={14} />
            </button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity?.((value) => value + 1)} aria-label="Increase quantity">
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="sc-info__actions">
          <button type="button" disabled={isOutOfStock} onClick={onAddToCart} className={`sc-info__action sc-info__action--primary${cartItem ? ' sc-info__action--active' : ''}`}>
            <ShoppingBag size={16} />
            {cartItem ? 'Add More' : 'Add to Cart'}
          </button>
          <button type="button" disabled={isOutOfStock} onClick={onBuyNow} className="sc-info__action sc-info__action--dark">
            Buy Now
          </button>
          <button type="button" disabled={isOutOfStock} onClick={onOrderWhatsApp} className="sc-info__action sc-info__action--whatsapp">
            <Store size={16} />
            Order on WhatsApp
          </button>
        </div>

        {actionMessage ? <p className="sc-info__message">{actionMessage}</p> : null}

        <div className="sc-info__delivery">
          <div className="sc-info__section-head">
            <h2>Check Delivery</h2>
          </div>
          <div className="sc-info__delivery-row">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={deliveryPin}
              onChange={(event) => setDeliveryPin?.(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter PIN code"
            />
            <button type="button" onClick={() => onCheckDelivery?.(deliveryPin)}>Check</button>
          </div>
          <div className="sc-info__chips">
            <span>Express delivery</span>
            <span>Pay on delivery</span>
            <span>Hassle free returns</span>
          </div>
        </div>
      </div>

      <div className="sc-info__utility">
        <button type="button">
          <Share2 size={15} />
          Share
        </button>
      </div>
    </div>
  );
}
