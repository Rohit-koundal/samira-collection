import { useLayoutEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ProductGrid from '../../components/product/ProductGrid';
import MobileFilterSheet from '../../components/product/MobileFilterSheet';
import ProductFilters from '../../components/product/ProductFilters';
import Icon from '../../components/layout/Icon';
import { normalizeProducts } from '../../services/normalize';
import {
  clearCatalogFilters,
  createCatalogSearchParams,
  normalizeCatalogQuery,
  replaceCatalogFilters,
  selectCatalogFilters,
  selectVisibleProducts,
  setCatalogFilterValue,
} from '../../store/catalogSlice';
import { useGetCategoriesQuery, useGetProductsQuery } from '../../store/apiSlice';

export default function Products({ navigate, route = '/products' }) {
  const dispatch = useDispatch();
  const [openFilters, setOpenFilters] = useState(false);
  const [openSort, setOpenSort] = useState(false);
  const basePath = route.split('?')[0] === '/search' ? '/search' : '/products';
  const routeQuery = useMemo(() => new URLSearchParams(route.split('?')[1] || ''), [route]);
  const filters = useSelector(selectCatalogFilters);
  const params = useMemo(() => createCatalogSearchParams(filters), [filters]);
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: productData = [], isLoading, isFetching, error } = useGetProductsQuery();
  const loading = isLoading || isFetching;
  const catalog = useMemo(() => {
    return normalizeProducts(Array.isArray(productData) ? productData : []);
  }, [productData]);
  const visibleProducts = useSelector((state) => selectVisibleProducts(state, catalog, categories));

  useLayoutEffect(() => {
    dispatch(replaceCatalogFilters(normalizeCatalogQuery(routeQuery)));
  }, [dispatch, routeQuery]);

  const syncCatalogRoute = (nextFilters) => {
    const nextParams = createCatalogSearchParams(nextFilters);
    navigate(`${basePath}${nextParams.toString() ? `?${nextParams}` : ''}`);
  };

  const updateParam = (key, value) => {
    const nextFilters = setCatalogFilterValue(filters, key, value);
    dispatch(replaceCatalogFilters(nextFilters));
    syncCatalogRoute(nextFilters);
  };

  const clearFilterParams = () => {
    const nextFilters = clearCatalogFilters(filters);
    dispatch(replaceCatalogFilters(nextFilters));
    syncCatalogRoute(nextFilters);
  };

  return (
    <section className="container-page bg-white pb-36 pt-3 md:bg-transparent md:py-10">
      <div className="mb-6">
        {/* <p className="small-text font-bold uppercase tracking-[0.14em] text-slate-500 md:text-xs md:tracking-[0.2em]">Home / Products</p> */}
        <div className="mt-2 md:mt-3">
          <div className="flex items-start justify-between gap-3 md:flex-wrap md:items-end md:gap-4">
            <div className="min-w-0">
              <h1 className="page-title sm:text-2xl md:max-w-none md:text-2xl">Products</h1>
              <p className="body-text mt-2 text-slate-500">{loading ? 'Loading styles...' : `${visibleProducts.length} styles available`}</p>
            </div>
        <div className="shrink-0">
              <select value={filters.sort} onChange={(event) => updateParam('sort', event.target.value)} className="label-text h-10 min-w-[134px] rounded-xl border border-slate-200 bg-white px-3 md:h-11 md:px-4 md:text-sm">
                <option value="newest">Newest</option>
                <option value="">All</option>
                <option value="priceLowHigh">Price Low-High</option>
                <option value="priceHighLow">Price High-Low</option>
                <option value="discount">Discount</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto md:hidden">
        {categories.map((category) => <button key={category._id || category.id} onClick={() => updateParam('category', category._id || category.id || category.slug || category.name)} className="label-text min-w-max rounded-full bg-white px-3 py-2 shadow-sm">{category.name}</button>)}
      </div>
      <div className="flex gap-6">
        <div className="hidden shrink-0 md:block">
          <ProductFilters categories={categories} params={params} updateParam={updateParam} clearFilters={clearFilterParams} />
        </div>
        <div className="min-w-0 flex-1">
          {error ? <div className="rounded-2xl bg-white p-8 text-center font-bold text-rose">Store data service is temporarily unavailable. Please try again in a few minutes.</div> : loading ? <div className="rounded-2xl bg-white p-8 text-center font-bold">Loading products...</div> : <ProductGrid products={visibleProducts} navigate={navigate} />}
        </div>
      </div>
      <div className="fixed bottom-16 left-0 right-0 z-40 grid grid-cols-2 border-t border-slate-200 bg-white md:hidden">
        <button onClick={() => setOpenSort(true)} className="h-12 border-r border-slate-200">Sort</button>
        <button onClick={() => setOpenFilters(true)} className="flex h-12 items-center justify-center gap-2"><Icon name="filter" className="h-4 w-4" /> Filter</button>
      </div>
      {openSort && (
        <div className="fixed inset-0 z-[70] bg-black/40 md:hidden">
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title text-lg">Sort By</h2>
              <button onClick={() => setOpenSort(false)} className="rounded-full bg-slate-100 px-4 py-2">Close</button>
            </div>
            <div className="grid gap-2">
              {[
                ['newest', 'Newest'],
                ['priceLowHigh', 'Price Low-High'],
                ['priceHighLow', 'Price High-Low'],
                ['discount', 'Discount'],
                ['rating', 'Rating'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    updateParam('sort', value);
                    setOpenSort(false);
                  }}
                  className={`rounded-xl px-4 py-3 text-left ${filters.sort === value ? 'bg-blush text-wine' : 'bg-slate-50 text-slate-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <MobileFilterSheet open={openFilters} onClose={() => setOpenFilters(false)} categories={categories} params={params} updateParam={updateParam} clearFilters={clearFilterParams} />
    </section>
  );
}
