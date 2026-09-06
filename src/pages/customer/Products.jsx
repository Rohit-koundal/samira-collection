import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ProductGrid from '../../components/product/ProductGrid';
import MobileFilterSheet from '../../components/product/MobileFilterSheet';
import Icon from '../../components/layout/Icon';
import DesktopNewArrivalsLayout from './DesktopNewArrivalsLayout';
import { normalizeProducts } from '../../services/normalize';
import {
  clearCatalogFilters,
  createCatalogSearchParams,
  normalizeCatalogQuery,
  replaceCatalogFilters,
  selectCatalogFilters,
  selectVisibleProducts,
  splitFilterValues,
  toggleFilterValue,
} from '../../store/catalogSlice';
import { useGetCategoriesQuery, useGetProductsQuery } from '../../store/apiSlice';
import { trackEvent } from '../../utils/analytics';
import { useStorefront } from '../../context/StorefrontContext';
import { storefrontPath } from '../../utils/routing';

export default function Products({ navigate, route = '/products' }) {
  const dispatch = useDispatch();
  const { storeSlug } = useStorefront();
  const [openFilters, setOpenFilters] = useState(false);
  const routePath = route.split('?')[0];
  const basePath = storefrontPath(routePath.endsWith('/search') ? '/search' : '/products', storeSlug);
  const routeQuery = useMemo(() => new URLSearchParams(route.split('?')[1] || ''), [route]);
  const filters = useSelector(selectCatalogFilters);
  const params = useMemo(() => createCatalogSearchParams(filters), [filters]);
  const { data: categories = [] } = useGetCategoriesQuery({ store: storeSlug });
  const { data: productData = [], isLoading, isFetching, error, refetch } = useGetProductsQuery({ store: storeSlug });
  const loading = isLoading || isFetching;
  const catalog = useMemo(() => {
    return normalizeProducts(Array.isArray(productData) ? productData : productData?.items || []);
  }, [productData]);
  const visibleProducts = useSelector((state) => selectVisibleProducts(state, catalog, categories));
  const collectionLabel = useMemo(() => getCollectionLabel(routeQuery, filters), [routeQuery, filters]);

  useLayoutEffect(() => {
    dispatch(replaceCatalogFilters(normalizeCatalogQuery(routeQuery)));
  }, [dispatch, routeQuery]);

  useEffect(() => {
    if (filters.search) trackEvent('SEARCH', { searchQuery: filters.search });
  }, [filters.search]);

  const syncCatalogRoute = (nextFilters) => {
    const nextParams = createCatalogSearchParams(nextFilters);
    const collection = routeQuery.get('collection');
    if (collection) nextParams.set('collection', collection);
    navigate(`${basePath}${nextParams.toString() ? `?${nextParams}` : ''}`);
  };

  const updateParams = (values) => {
    const nextFilters = normalizeCatalogQuery({ ...filters, ...values });
    dispatch(replaceCatalogFilters(nextFilters));
    syncCatalogRoute(nextFilters);
    Object.entries(values).forEach(([key, value]) => {
      if (key !== 'search' && value) trackEvent('FILTER_USED', { metadata: { key, value: String(value).slice(0, 80) } });
    });
  };

  const updateParam = (key, value) => updateParams({ [key]: value });

  const clearFilterParams = () => {
    const nextFilters = {
      ...clearCatalogFilters(filters),
      ...getPinnedCollectionFilters(routeQuery),
    };
    dispatch(replaceCatalogFilters(nextFilters));
    syncCatalogRoute(nextFilters);
  };

  const applyDraftFilters = (draft) => {
    const nextFilters = normalizeCatalogQuery({
      ...filters,
      ...draft,
      ...getPinnedCollectionFilters(routeQuery),
    });
    dispatch(replaceCatalogFilters(nextFilters));
    syncCatalogRoute(nextFilters);
  };

  return (
    <section className="bg-white px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-3 md:p-0">
      {(
        <DesktopNewArrivalsLayout
          navigate={navigate}
          route={route}
          routeQuery={routeQuery}
          collectionLabel={collectionLabel}
          loading={loading}
          error={error}
          onRetry={refetch}
          visibleProducts={visibleProducts}
          categories={categories}
          filters={filters}
          updateParam={updateParam}
          updateParams={updateParams}
          clearFilterParams={clearFilterParams}
          allProducts={catalog}
        />
      )}
      <div className="mb-3 flex items-center justify-between gap-2 lg:hidden">
        <div>
          <p className="text-[13px] font-bold text-[#1f2a44]">{collectionLabel}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{loading ? '' : `${visibleProducts.length} styles available`}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex h-9 items-center gap-1 rounded-full border border-[#ebe7e2] bg-white px-3 text-[11px] font-medium text-slate-600 shadow-sm">
            <span>Sort</span>
            <select value={filters.sort} onChange={(event) => updateParam('sort', event.target.value)} className="appearance-none bg-transparent pr-1 text-[11px] font-semibold text-[#1f2a44] outline-none">
              <option value="newest">Latest</option>
              <option value="">All</option>
              <option value="priceLowHigh">Low-High</option>
              <option value="priceHighLow">High-Low</option>
              <option value="discount">Discount</option>
              <option value="rating">Rating</option>
            </select>
          </label>
          <button onClick={() => setOpenFilters(true)} className="flex h-9 items-center gap-1 rounded-full border border-[#ebe7e2] bg-white px-3 text-[11px] font-semibold text-[#1f2a44] shadow-sm">
            <Icon name="filter" className="h-3.5 w-3.5" /> Filter
          </button>
        </div>
      </div>
      <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto lg:hidden">
        <button
          type="button"
          onClick={() => {
            const preservedFilters = { ...filters, category: '' };
            dispatch(replaceCatalogFilters(preservedFilters));
            syncCatalogRoute(preservedFilters);
          }}
          className={`min-w-max rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm ${!filters.category ? 'bg-wine text-white' : 'bg-white text-[#1f2a44]'}`}
        >
          All
        </button>
        {categories.map((category) => {
          const categoryValue = category._id || category.id || category.slug || category.name;
          const active = splitFilterValues(filters.category).includes(String(categoryValue));
          return (
            <button
              key={categoryValue}
              onClick={() => updateParam('category', toggleFilterValue(filters.category, categoryValue))}
              className={`min-w-max rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm ${active ? 'bg-wine text-white' : 'bg-white text-[#1f2a44]'}`}
            >
              {category.name}
            </button>
          );
        })}
      </div>
      <div className="lg:hidden">
        {error ? <div className="rounded-2xl bg-white p-8 text-center font-bold text-rose"><p>Store data service is temporarily unavailable.</p><button type="button" className="mt-4 h-11 rounded-xl bg-wine px-5 text-sm font-black text-white" onClick={refetch}>Try again</button></div> : loading ? null : <ProductGrid products={visibleProducts} navigate={navigate} />}
      </div>
      <MobileFilterSheet
        open={openFilters}
        onClose={() => setOpenFilters(false)}
        categories={categories}
        params={params}
        updateParam={updateParam}
        clearFilters={clearFilterParams}
        applyDraftFilters={applyDraftFilters}
      />
    </section>
  );
}

function getCollectionLabel(routeQuery, filters) {
  const collection = String(routeQuery.get('collection') || '').toLowerCase();
  if (collection === 'best-sellers' || filters.bestSeller === 'true') return 'Best Sellers';
  if (collection === 'new-arrivals' || filters.newArrival === 'true') return 'New Arrivals';
  if (collection === 'trending-now' || filters.trending === 'true') return 'Trending Now';
  if (collection === 'featured' || filters.featured === 'true') return 'Featured Products';
  if (filters.search) return 'Search Results';
  return 'Products';
}

function getPinnedCollectionFilters(routeQuery) {
  const collection = String(routeQuery.get('collection') || '').toLowerCase();
  return {
    featured: collection === 'featured' ? 'true' : '',
    newArrival: collection === 'new-arrivals' ? 'true' : '',
    bestSeller: collection === 'best-sellers' ? 'true' : '',
    trending: collection === 'trending-now' ? 'true' : '',
  };
}
