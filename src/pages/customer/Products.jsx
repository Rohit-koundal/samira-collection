import { useEffect, useMemo, useState } from 'react';
import products from '../../data/seedProducts';
import ProductGrid from '../../components/product/ProductGrid';
import MobileFilterSheet from '../../components/product/MobileFilterSheet';
import Icon from '../../components/layout/Icon';
import api from '../../services/api';
import { normalizeProducts } from '../../services/normalize';

const isDev = process.env.NODE_ENV === 'development';

export default function Products({ navigate, route = '/products' }) {
  const [openFilters, setOpenFilters] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const basePath = route.split('?')[0] === '/search' ? '/search' : '/products';
  const params = useMemo(() => new URLSearchParams(route.split('?')[1] || ''), [route]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    navigate(`${basePath}${next.toString() ? `?${next}` : ''}`);
  };

  useEffect(() => {
    api.get('/categories').then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get(`/products${params.toString() ? `?${params}` : ''}`)
      .then((items) => {
        setCatalog(normalizeProducts(items));
        setError('');
      })
      .catch((err) => {
        setError(err.message);
        setCatalog(isDev ? products : []);
      })
      .finally(() => setLoading(false));
  }, [params]);

  return (
    <section className="container-page bg-white pb-36 pt-3 md:bg-transparent md:py-10">
      <div className="sticky top-[104px] z-30 -mx-3.5 mb-4 bg-white px-3.5 py-2 md:static md:mx-0 md:bg-transparent md:px-0 md:py-0">
        <input value={params.get('search') || ''} onChange={(event) => updateParam('search', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold md:hidden" placeholder="Search Samira products" />
      </div>
      <div className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 md:text-xs md:tracking-[0.22em]">Home / Products</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3 md:mt-3 md:gap-4">
          <div>
            <h1 className="max-w-sm text-[22px] font-black leading-tight sm:text-3xl md:max-w-none md:text-5xl">Samira Collection Products</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">{loading ? 'Loading styles...' : `${catalog.length} styles available`}</p>
          </div>
          <select value={params.get('sort') || 'newest'} onChange={(event) => updateParam('sort', event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black md:h-11 md:px-4 md:text-sm">
            <option value="newest">Newest</option>
            <option value="priceLowHigh">Price Low-High</option>
            <option value="priceHighLow">Price High-Low</option>
            <option value="discount">Discount</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>
      <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto md:hidden">
        {categories.map((category) => <button key={category._id} onClick={() => updateParam('category', category._id)} className="min-w-max rounded-full bg-white px-4 py-2 text-xs font-black shadow-sm">{category.name}</button>)}
      </div>
      <div className="flex gap-6">
        <aside className="hidden w-64 shrink-0 space-y-3 rounded-2xl bg-white p-4 shadow-sm md:block">
          <FilterSelect label="Category" value={params.get('category') || ''} onChange={(value) => updateParam('category', value)} options={[['', 'All'], ...categories.map((category) => [category._id, category.name])]} />
          <FilterSelect label="Size" value={params.get('size') || ''} onChange={(value) => updateParam('size', value)} options={[['', 'All'], ['S', 'S'], ['M', 'M'], ['L', 'L'], ['XL', 'XL'], ['Free Size', 'Free Size']]} />
          <FilterSelect label="Fabric" value={params.get('fabric') || ''} onChange={(value) => updateParam('fabric', value)} options={[['', 'All'], ['Cotton', 'Cotton'], ['Silk', 'Silk'], ['Georgette', 'Georgette'], ['Rayon', 'Rayon']]} />
          <FilterSelect label="Stock" value={params.get('stock') || ''} onChange={(value) => updateParam('stock', value)} options={[['', 'All'], ['in', 'In Stock'], ['out', 'Out of Stock']]} />
        </aside>
        <div className="min-w-0 flex-1">
          {error && !isDev ? <div className="rounded-2xl bg-white p-8 text-center font-bold text-rose">{error}</div> : loading ? <div className="rounded-2xl bg-white p-8 text-center font-bold">Loading products...</div> : <ProductGrid products={catalog} navigate={navigate} />}
        </div>
      </div>
      <div className="fixed bottom-16 left-0 right-0 z-40 grid grid-cols-2 border-t border-slate-200 bg-white md:hidden">
        <button className="h-12 border-r border-slate-200 text-sm font-black">Sort</button>
        <button onClick={() => setOpenFilters(true)} className="flex h-12 items-center justify-center gap-2 text-sm font-black"><Icon name="filter" className="h-4 w-4" /> Filter</button>
      </div>
      <MobileFilterSheet open={openFilters} onClose={() => setOpenFilters(false)} />
    </section>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return <label className="grid gap-2 text-sm font-black">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold">{options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}</select></label>;
}
