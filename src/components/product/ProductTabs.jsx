import { useState } from 'react';
import { FileText, ListChecks, PackageCheck, Ruler, Shirt, Star } from 'lucide-react';
import './ProductTabs.css';

const tabs = [
  { key: 'description', label: 'Description', icon: FileText },
  { key: 'details', label: 'Details', icon: ListChecks },
  { key: 'fit', label: 'Size & Fit', icon: Ruler },
  { key: 'care', label: 'Material & Care', icon: Shirt },
  { key: 'shipping', label: 'Shipping & Returns', icon: PackageCheck },
  { key: 'reviews', label: 'Reviews', icon: Star },
];

export default function ProductTabs({ product, reviews = [], onWriteReview }) {
  const [activeTab, setActiveTab] = useState('description');

  const description =
    product?.description ||
    product?.shortDescription ||
    'Elevate your everyday style with this elegant white modern top from Samaira Collection. Featuring delicate embroidery and a flattering silhouette, it’s perfect for festive gatherings, workwear, or casual outings.';

  const highlights = product?.highlights?.length
    ? product.highlights
    : ['Elegant embroidered design', 'Comfortable all-day wear', 'Versatile & easy to style', 'Perfect for any occasion'];

  return (
    <section className="sc-tabs">
      <div className="sc-tabs__nav" role="tablist" aria-label="Product details tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`sc-tabs__tab${activeTab === tab.key ? ' sc-tabs__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon className="sc-tabs__icon" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="sc-tabs__panel">
        {activeTab === 'description' && (
          <>
            <p>{description}</p>
            <div className="sc-tabs__chips">
              {highlights.slice(0, 4).map((item) => (
                <span key={item} className="sc-tabs__chip">
                  {item}
                </span>
              ))}
            </div>
          </>
        )}

        {activeTab === 'details' && (
          <dl className="sc-tabs__details">
            <div>
              <dt>Category</dt>
              <dd>{product?.category || '-'}</dd>
            </div>
            <div>
              <dt>Fabric</dt>
              <dd>{product?.fabric || 'Premium fabric'}</dd>
            </div>
            <div>
              <dt>Occasion</dt>
              <dd>{product?.occasion || 'Everyday festive'}</dd>
            </div>
            <div>
              <dt>Pattern</dt>
              <dd>{product?.tags?.[0] || 'Designer'}</dd>
            </div>
          </dl>
        )}

        {activeTab === 'fit' && (
          <p>Available sizes: {(product?.sizes?.length ? product.sizes : ['S', 'M', 'L', 'XL']).join(', ')}</p>
        )}

        {activeTab === 'care' && (
          <p>{product?.careInstructions || `Fabric: ${product?.fabric || 'Premium fabric'}. Dry clean recommended.`}</p>
        )}

        {activeTab === 'shipping' && (
          <p>{product?.returnPolicy || 'Free shipping on eligible orders. Easy returns and exchanges are available within the return window when the item is unused and tags are intact.'}</p>
        )}

        {activeTab === 'reviews' && (
          <div>
            <p>{reviews.length ? `${reviews.length} customer review${reviews.length === 1 ? '' : 's'}.` : 'No reviews yet for this product.'}</p>
            {onWriteReview ? (
              <button type="button" className="sc-tabs__chip mt-3" onClick={onWriteReview}>Write a review</button>
            ) : null}
            {reviews.slice(0, 6).map((review) => (
              <article key={review._id} className="mt-4">
                <p className="font-black">{review.user?.name || 'Customer'} {review.verifiedPurchase ? '· Verified purchase' : ''} · {review.rating}/5</p>
                <p>{review.comment}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
