import ProductFilters from './ProductFilters';

export default function MobileFilterSheet({ open, onClose, categories, params, updateParam, clearFilters }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] bg-black/40 lg:hidden">
      <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-auto rounded-t-3xl bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">Filters</h2>
          <button onClick={onClose} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black">Close</button>
        </div>
        <div className="[&>aside]:w-full [&>aside]:shadow-none">
          <ProductFilters categories={categories} params={params} updateParam={updateParam} clearFilters={clearFilters} />
        </div>
      </div>
    </div>
  );
}
