import ProductListingPage from '../../components/products/ProductListingPage';

export default function DesktopNewArrivalsLayout({
  navigate,
  route,
  routeQuery,
  collectionLabel,
  loading,
  visibleProducts,
  categories,
  filters,
  updateParam,
  updateParams,
  clearFilterParams,
  allProducts,
}) {
  const breadcrumbs = buildBreadcrumbs(route, routeQuery, collectionLabel);
  const title = collectionLabel || 'Products';
  const subtitle = loading ? 'Loading styles...' : `${visibleProducts.length} styles available`;

  return (
    <ProductListingPage
      navigate={navigate}
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      products={visibleProducts}
      categories={categories}
      filters={filters}
      sortValue={filters.sort}
      onSortChange={(value) => updateParam('sort', value)}
      onFilterChange={updateParam}
      onFiltersChange={updateParams}
      onClearFilters={clearFilterParams}
      allProducts={allProducts}
    />
  );
}

function buildBreadcrumbs(route, routeQuery, collectionLabel) {
  const routePath = String(route || '').split('?')[0];
  const collection = String(routeQuery?.get('collection') || '').toLowerCase();
  if (routePath === '/search' || routeQuery?.get('search')) {
    return [
      { label: 'Home', path: '/' },
      { label: 'Search', path: '/search', active: false },
      { label: collectionLabel || 'Search Results', path: '/search', active: true },
    ];
  }

  if (collection === 'new-arrivals' || routeQuery?.get('newArrival') === 'true') {
    return [
      { label: 'Home', path: '/' },
      { label: 'New In', path: '/products?newArrival=true', active: false },
      { label: collectionLabel || 'New Arrivals', path: '/products?newArrival=true', active: true },
    ];
  }

  return [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products', active: false },
    { label: collectionLabel || 'Products', path: '/products', active: true },
  ];
}
