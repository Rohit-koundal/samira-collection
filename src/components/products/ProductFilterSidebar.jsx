import { ChevronUp, Filter, X } from 'lucide-react';
import { splitFilterValues, toggleFilterValue } from '../../store/catalogSlice';
import './ProductFilterSidebar.css';

const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const colorOptions = [
  { label: 'Wine', value: 'Wine', color: '#6d1f34' },
  { label: 'Pink', value: 'Pink', color: '#f4a6bd' },
  { label: 'Sage', value: 'Sage', color: '#94a98d' },
  { label: 'Lavender', value: 'Lavender', color: '#b8a2e3' },
  { label: 'Beige', value: 'Beige', color: '#e7d6bf' },
  { label: 'Black', value: 'Black', color: '#17161a' },
];

export default function ProductFilterSidebar({
  categories = [],
  params = new URLSearchParams(),
  onFilterChange,
  onClearAll,
  productCounts = {},
}) {
  const activeColor = params.get('color') || '';
  const activeSize = params.get('size') || '';
  const activeCategory = params.get('category') || '';
  const activeCategories = new Set(splitFilterValues(activeCategory));
  const activeStock = params.get('stock') || '';
  const minPrice = params.get('minPrice') || '1499';
  const maxPrice = params.get('maxPrice') || '15999';

  const update = (key, value) => onFilterChange?.(key, value);

  return (
    <aside className="sc-filter">
      <div className="sc-filter__header">
        <div className="sc-filter__title">
          <Filter className="h-4 w-4 text-[#8a0f36]" />
          <span>Filters</span>
        </div>
        <button type="button" className="sc-filter__clear" onClick={onClearAll}>Clear all</button>
      </div>

      <details className="sc-filter__section" open>
        <summary className="sc-filter__summary">
          <span>Category</span>
          <ChevronUp className="h-3.5 w-3.5 text-[#8a7a70]" />
        </summary>
        <div className="sc-filter__panel">
          <div className="sc-filter__list">
            {(categories.length ? categories : defaultCategories).map((category) => {
              const value = category._id || category.id || category.slug || category.name;
              const count = productCounts[value] ?? productCounts[String(category.name || '').toLowerCase()] ?? category.count ?? category.productCount ?? 0;
              return (
                <label key={value} className="sc-filter__row">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={activeCategories.has(String(value))}
                      onChange={() => update('category', toggleFilterValue(activeCategory, value))}
                    />
                    <span>{category.name}</span>
                  </span>
                  <span className="sc-filter__count">({count})</span>
                </label>
              );
            })}
          </div>
        </div>
      </details>

      <details className="sc-filter__section" open>
        <summary className="sc-filter__summary">
          <span>Size</span>
          <ChevronUp className="h-3.5 w-3.5 text-[#8a7a70]" />
        </summary>
        <div className="sc-filter__panel">
          <div className="sc-filter__sizes">
            {sizeOptions.map((size) => (
              <label key={size} className="sc-filter__size">
                <input type="checkbox" checked={activeSize === size} onChange={(event) => update('size', event.target.checked ? size : '')} />
                <span>{size}</span>
              </label>
            ))}
          </div>
        </div>
      </details>

      <details className="sc-filter__section" open>
        <summary className="sc-filter__summary">
          <span>Color</span>
          <ChevronUp className="h-3.5 w-3.5 text-[#8a7a70]" />
        </summary>
        <div className="sc-filter__panel">
          <div className="sc-filter__swatches">
            {colorOptions.map((swatch) => (
              <label
                key={swatch.value}
                className="sc-filter__swatch"
                style={{ backgroundColor: swatch.color }}
                title={swatch.label}
                aria-label={swatch.label}
              >
                <input type="checkbox" checked={activeColor === swatch.value} onChange={(event) => update('color', event.target.checked ? swatch.value : '')} />
              </label>
            ))}
            <button type="button" className="sc-filter__swatch" aria-label="Clear color filter" title="Clear color filter" onClick={() => update('color', '')} style={{ background: '#fff' }}>
              <X className="m-auto h-3.5 w-3.5 text-[#8a0f36]" />
            </button>
          </div>
        </div>
      </details>

      <details className="sc-filter__section" open>
        <summary className="sc-filter__summary">
          <span>Price</span>
          <ChevronUp className="h-3.5 w-3.5 text-[#8a7a70]" />
        </summary>
        <div className="sc-filter__panel">
          <div className="sc-filter__price">
            <div className="sc-filter__price-meta">
              <span>₹{formatIndian(minPrice)}</span>
              <span>₹{formatIndian(maxPrice)}</span>
            </div>
            <input type="range" min="1499" max="15999" value={minPrice} onChange={(event) => update('minPrice', event.target.value)} className="sc-filter__range" />
            <input type="range" min="1499" max="15999" value={maxPrice} onChange={(event) => update('maxPrice', event.target.value)} className="sc-filter__range" />
          </div>
        </div>
      </details>

      <details className="sc-filter__section" open>
        <summary className="sc-filter__summary">
          <span>Availability</span>
          <ChevronUp className="h-3.5 w-3.5 text-[#8a7a70]" />
        </summary>
        <div className="sc-filter__panel">
          <label className="sc-filter__row">
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={activeStock === 'in'} onChange={(event) => update('stock', event.target.checked ? 'in' : '')} />
              <span>In Stock</span>
            </span>
            <span className="sc-filter__count">({productCounts.inStock ?? 0})</span>
          </label>
        </div>
      </details>
    </aside>
  );
}

const defaultCategories = [
  { name: 'Lehengas' },
  { name: 'Sarees' },
  { name: 'Gowns' },
  { name: 'Kurtis' },
  { name: 'Ethnic Sets' },
];

function formatIndian(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num.toLocaleString('en-IN') : value;
}
