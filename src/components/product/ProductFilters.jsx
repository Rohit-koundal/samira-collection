import categories from '../../data/categories';

const filters = {
  Size: ['XS', 'S', 'M', 'L', 'XL', 'Free Size'],
  Color: ['Wine', 'Blush', 'Gold', 'Ivory', 'Black', 'Emerald'],
  Fabric: ['Silk', 'Cotton', 'Georgette', 'Organza', 'Velvet'],
  Occasion: ['Wedding', 'Festive', 'Daily Wear', 'Party'],
  Discount: ['10% and above', '20% and above', '40% and above'],
  Rating: ['4 star and above', '3 star and above'],
};

export default function ProductFilters() {
  return (
    <aside className="hidden w-72 shrink-0 rounded-3xl bg-white p-5 shadow-sm lg:block">
      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-charcoal">Filters</h2>
      <div className="mt-5 space-y-6">
        <FilterGroup title="Category" items={categories.map((category) => category.name)} />
        {Object.entries(filters).map(([title, items]) => <FilterGroup key={title} title={title} items={items} />)}
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <input type="checkbox" className="accent-rose" /> In stock only
        </label>
      </div>
    </aside>
  );
}

function FilterGroup({ title, items }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{title}</h3>
      <div className="grid gap-2">
        {items.slice(0, 6).map((item) => (
          <label key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-600">
            <input type="checkbox" className="accent-rose" /> {item}
          </label>
        ))}
      </div>
    </div>
  );
}
