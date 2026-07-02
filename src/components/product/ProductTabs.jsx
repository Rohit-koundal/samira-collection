import { useState } from 'react';
import './ProductTabs.css';

const tabs = [
  { key: 'description', label: 'Description' },
  { key: 'details', label: 'Product Details' },
  { key: 'fit', label: 'Size & Fit' },
  { key: 'care', label: 'Material & Care' },
];

export default function ProductTabs({ product }) {
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
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`sc-tabs__tab${activeTab === tab.key ? ' sc-tabs__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
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
      </div>
    </section>
  );
}
