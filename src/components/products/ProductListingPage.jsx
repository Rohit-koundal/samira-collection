import ProductCard from './ProductCard';
import ProductFilterSidebar from './ProductFilterSidebar';
import './ProductListingPage.css';

export default function ProductListingPage({
  navigate,
  title,
  subtitle,
  breadcrumbs = [],
  products = [],
  categories = [],
  params,
  sortValue,
  onSortChange,
  onFilterChange,
  onClearFilters,
  allProducts = [],
}) {
  const productCounts = buildCounts(allProducts.length ? allProducts : products, categories);

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
                <option value="newest">Newest</option>
                <option value="">All</option>
                <option value="priceLowHigh">Price: Low to High</option>
                <option value="priceHighLow">Price: High to Low</option>
                <option value="bestSeller">Bestselling</option>
                <option value="discount">Discount</option>
              </select>
            </div>
          </div>

          <div className="sc-plp__divider" aria-hidden="true">
            <span className="sc-plp__divider-line" />
            <span className="sc-plp__divider-mark">✦</span>
            <span className="sc-plp__divider-line" />
          </div>

          <div className="sc-plp__content">
            <ProductFilterSidebar
              categories={categories}
              params={params}
              onFilterChange={onFilterChange}
              onClearAll={onClearFilters}
              productCounts={productCounts}
            />

            <div className="sc-plp__grid">
              {products.length ? products.map((product) => (
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

function buildCounts(products, categories = []) {
  const counts = { inStock: 0 };
  products.forEach((product) => {
    if (Number(product?.stock || 0) > 0) counts.inStock += 1;
    const keys = [product?.categoryId, product?.category, product?.subCategory]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());
    keys.forEach((key) => {
      counts[key] = (counts[key] || 0) + 1;
    });
  });

  categories.forEach((category) => {
    const key = String(category?._id || category?.id || category?.slug || category?.name || '').toLowerCase();
    if (key && counts[key] == null) counts[key] = category?.count || category?.productCount || 0;
  });

  return counts;
}
