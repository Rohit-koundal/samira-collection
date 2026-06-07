import { useMemo, useState } from 'react';
import products from '../../data/seedProducts';
import ProductGrid from '../../components/product/ProductGrid';
import ProductFilters from '../../components/product/ProductFilters';
import SortDropdown from '../../components/product/SortDropdown';
import MobileFilterSheet from '../../components/product/MobileFilterSheet';
import Icon from '../../components/layout/Icon';

export default function Products({ navigate }) {
  const [openFilters, setOpenFilters] = useState(false);
  const filtered = useMemo(() => products, []);

  return (
    <section className="container-page py-6 md:py-10">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Home / Products</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black md:text-5xl">Samira Collection Products</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">{filtered.length} styles available</p>
          </div>
          <SortDropdown />
        </div>
      </div>
      <div className="flex gap-6">
        <ProductFilters />
        <div className="min-w-0 flex-1">
          <ProductGrid products={filtered} navigate={navigate} />
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
