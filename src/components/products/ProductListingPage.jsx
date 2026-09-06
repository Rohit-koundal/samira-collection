import { useMemo } from 'react';
import ProductCard from './ProductCard';
import ProductFilterSidebar from './ProductFilterSidebar';
import { buildCatalogFacets } from '../../utils/catalogFacets';
import './ProductListingPage.css';

export default function ProductListingPage({
  navigate,
  title,
  subtitle,
  breadcrumbs = [],
  products = [],
  categories = [],
  filters,
  sortValue,
  onSortChange,
  onFilterChange,
  onFiltersChange,
  onClearFilters,
  allProducts = [],
  loading = false,
  error,
  onRetry,
}) {
  const facetProducts = allProducts.length ? allProducts : products;
  const facets = useMemo(
    () => buildCatalogFacets(facetProducts, categories, filters),
    [facetProducts, categories, filters],
  );

  return (
    <section className="sc-plp">
      <div className="sc-plp__shell">
        <div className="sc-plp__panel">
          {/* <div className="sc-plp__breadcrumb">
            {breadcrumbs.map((item, index) => (
              <span key={item.label} className="flex items-center gap-2">
                <button type="button" className={item.active ? 'is-active' : ''} onClick={() => navigate(item.path)}>
                  {item.label}
                </button>
                {index < breadcrumbs.length - 1 ? <span className="text-[#cdb7a5]">/</span> : null}
              </span>
            ))}
          </div> */}

          <div className="sc-plp__header">
            <div className="min-w-0">
              <h1 className="sc-plp__title">{title}</h1>
              <p className="sc-plp__subtitle">{subtitle}</p>
            </div>
            <div className="sc-plp__sort">
              <label htmlFor="sc-plp-sort">Sort by</label>
              <select id="sc-plp-sort" value={sortValue} onChange={(event) => onSortChange?.(event.target.value)}>
                <option value="newest">Recommended</option>
                <option value="bestSeller">Popularity</option>
                <option value="priceLowHigh">Price: Low to High</option>
                <option value="priceHighLow">Price: High to Low</option>
                <option value="discount">Better Discount</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>
          </div>

          <div className="sc-plp__divider" aria-hidden="true" />

          <div className="sc-plp__content">
            <ProductFilterSidebar
              facets={facets}
              filters={filters}
              onFilterChange={onFilterChange}
              onFiltersChange={onFiltersChange}
              onClearAll={onClearFilters}
            />

            <div className="sc-plp__grid">
              {error ? <div className="col-span-full rounded-2xl bg-white p-8 text-center" role="alert"><p>Store data service is temporarily unavailable.</p><button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-wine px-5 py-3 text-sm font-bold text-white">Try again</button></div>
                : loading ? <p className="col-span-full p-8 text-center text-sm" role="status">Loading styles…</p>
                : products.length ? products.map((product) => (
                <ProductCard key={product.id} product={product} navigate={navigate} />
              )) : (
                <div className="col-span-full rounded-2xl border border-[#ead8cb] bg-white p-8 text-center text-sm font-semibold text-[#6f625c]">
                  No products found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
