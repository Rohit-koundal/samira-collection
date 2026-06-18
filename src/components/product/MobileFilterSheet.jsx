import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Grid3X3, Palette, Percent, Ruler, SlidersHorizontal, Sparkles, Tag, X } from 'lucide-react';

const navItems = [
  { key: 'category', label: 'Category', icon: Grid3X3 },
  { key: 'size', label: 'Size', icon: Ruler },
  { key: 'price', label: 'Price', icon: SlidersHorizontal },
  { key: 'color', label: 'Color', icon: Palette },
  { key: 'fabric', label: 'Fabric', icon: Sparkles },
  { key: 'discount', label: 'Discount', icon: Percent },
  { key: 'sort', label: 'Sort By', icon: Tag },
];

const filterConfig = {
  size: ['XS', 'S', 'M', 'L', 'XL', 'Free Size'],
  color: ['Wine', 'Blush', 'Gold', 'Ivory', 'Black', 'Emerald', 'Navy', 'Rose'],
  fabric: ['Silk', 'Cotton', 'Georgette', 'Organza', 'Velvet', 'Rayon', 'Crepe', 'Net'],
  discount: [
    { value: '10', label: '10% and above' },
    { value: '20', label: '20% and above' },
    { value: '40', label: '40% and above' },
  ],
  sort: [
    { value: 'newest', label: 'Latest' },
    { value: '', label: 'All' },
    { value: 'priceLowHigh', label: 'Price Low to High' },
    { value: 'priceHighLow', label: 'Price High to Low' },
    { value: 'discount', label: 'Discount' },
    { value: 'rating', label: 'Rating' },
  ],
};

export default function MobileFilterSheet({ open, onClose, categories = [], params, updateParam, clearFilters }) {
  const [activeSection, setActiveSection] = useState('category');
  const [draft, setDraft] = useState(() => buildDraft(params));
  const [expanded, setExpanded] = useState({
    size: true,
    price: true,
    color: false,
    fabric: false,
    discount: false,
    sort: false,
  });

  useEffect(() => {
    if (!open) return;
    setDraft(buildDraft(params));
    setActiveSection('category');
  }, [open, params]);

  const selectedCount = useMemo(() => {
    return ['category', 'size', 'color', 'fabric', 'discount', 'sort', 'minPrice', 'maxPrice']
      .reduce((count, key) => count + (draft[key] ? 1 : 0), 0);
  }, [draft]);

  if (!open) return null;

  const applyFilters = () => {
    updateParam?.('category', draft.category);
    updateParam?.('size', draft.size);
    updateParam?.('color', draft.color);
    updateParam?.('fabric', draft.fabric);
    updateParam?.('discount', draft.discount);
    updateParam?.('sort', draft.sort);
    updateParam?.('minPrice', draft.minPrice);
    updateParam?.('maxPrice', draft.maxPrice);
    onClose?.();
  };

  const resetFilters = () => {
    clearFilters?.();
    setDraft(buildDraft(new URLSearchParams()));
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 lg:hidden">
      <div className="absolute inset-x-0 bottom-0 top-14 overflow-hidden rounded-t-[28px] bg-white shadow-2xl">
        <div className="flex justify-center pt-2">
          <div className="h-1 w-12 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-start justify-between border-b border-slate-100 px-4 pb-3 pt-3">
          <div>
            <h2 className="text-[22px] font-bold text-[#1f2a44]">Filters</h2>
            <p className="mt-1 text-[11px] text-slate-500">{selectedCount} styles available</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={resetFilters} className="text-[11px] font-bold text-[#ff4f7d]">
              Clear All
            </button>
            <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-500">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid h-[calc(100%-132px)] grid-cols-[92px_minmax(0,1fr)]">
          <aside className="border-r border-slate-100 bg-[#fbfbfc] px-2 py-3">
            <div className="space-y-1.5">
              {navItems.map((item) => {
                const active = activeSection === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveSection(item.key)}
                    className={`flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-left ${active ? 'bg-[#fff1f5] text-[#ff4f7d]' : 'text-[#1f2a44]'}`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="text-[11px] font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="overflow-y-auto px-4 py-3">
            {activeSection === 'category' && (
              <FilterSection title="Category">
                <div className="space-y-2">
                  {categories.map((category) => {
                    const value = category._id || category.id || category.slug || category.name;
                    const selected = draft.category === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setDraft((current) => ({ ...current, category: current.category === value ? '' : value }))}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-8 rounded-md bg-[#f5ede7]" />
                          <span className="text-[13px] font-medium text-[#1f2a44]">{category.name}</span>
                        </div>
                        <span className={`grid h-4 w-4 place-items-center rounded-[4px] border ${selected ? 'border-[#ff4f7d] bg-[#ff4f7d]' : 'border-slate-300 bg-white'}`}>
                          {selected ? <span className="h-1.5 w-1.5 rounded-[2px] bg-white" /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </FilterSection>
            )}

            {activeSection === 'size' && (
              <FilterSection>
                <Accordion title="Size" open={expanded.size} onToggle={() => toggleExpanded('size', setExpanded)}>
                  <SelectionCardList
                    items={filterConfig.size.map((item) => ({ value: item, label: item }))}
                    value={draft.size}
                    onChange={(value) => setDraft((current) => ({ ...current, size: current.size === value ? '' : value }))}
                  />
                </Accordion>
              </FilterSection>
            )}

            {activeSection === 'price' && (
              <FilterSection>
                <Accordion title="Price" open={expanded.price} onToggle={() => toggleExpanded('price', setExpanded)}>
                  <div className="grid grid-cols-2 gap-3">
                    <PriceInput label="Min Price" value={draft.minPrice} onChange={(value) => setDraft((current) => ({ ...current, minPrice: digitsOnly(value) }))} />
                    <PriceInput label="Max Price" value={draft.maxPrice} onChange={(value) => setDraft((current) => ({ ...current, maxPrice: digitsOnly(value) }))} />
                  </div>
                </Accordion>
              </FilterSection>
            )}

            {activeSection === 'color' && (
              <FilterSection>
                <Accordion title="Color" open={expanded.color} onToggle={() => toggleExpanded('color', setExpanded)}>
                  <ColorOptionList
                    items={filterConfig.color.map((item) => ({ value: item, label: item }))}
                    value={draft.color}
                    onChange={(value) => setDraft((current) => ({ ...current, color: current.color === value ? '' : value }))}
                  />
                </Accordion>
              </FilterSection>
            )}

            {activeSection === 'fabric' && (
              <FilterSection>
                <Accordion title="Fabric" open={expanded.fabric} onToggle={() => toggleExpanded('fabric', setExpanded)}>
                  <CheckboxList
                    items={filterConfig.fabric.map((item) => ({ value: item, label: item }))}
                    value={draft.fabric}
                    onChange={(value) => setDraft((current) => ({ ...current, fabric: current.fabric === value ? '' : value }))}
                  />
                </Accordion>
              </FilterSection>
            )}

            {activeSection === 'discount' && (
              <FilterSection>
                <Accordion title="Discount" open={expanded.discount} onToggle={() => toggleExpanded('discount', setExpanded)}>
                  <CheckboxList
                    items={filterConfig.discount}
                    value={draft.discount}
                    onChange={(value) => setDraft((current) => ({ ...current, discount: current.discount === value ? '' : value }))}
                  />
                </Accordion>
              </FilterSection>
            )}

            {activeSection === 'sort' && (
              <FilterSection>
                <Accordion title="Sort By" open={expanded.sort} onToggle={() => toggleExpanded('sort', setExpanded)}>
                  <CheckboxList
                    items={filterConfig.sort}
                    value={draft.sort}
                    onChange={(value) => setDraft((current) => ({ ...current, sort: current.sort === value ? '' : value }))}
                  />
                </Accordion>
              </FilterSection>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-white px-4 py-3">
          <button type="button" onClick={resetFilters} className="h-11 rounded-lg border border-slate-300 text-[14px] font-semibold text-[#1f2a44]">
            Reset
          </button>
          <button type="button" onClick={applyFilters} className="h-11 rounded-lg bg-wine text-[14px] font-semibold text-white">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }) {
  return (
    <section>
      {title ? <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#1f2a44]">{title}</h3> : null}
      {children}
    </section>
  );
}

function Accordion({ title, open, onToggle, children }) {
  return (
    <div className="border-b border-slate-100">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between py-3 text-left text-[13px] font-semibold text-[#1f2a44]">
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <div className="pb-3">{children}</div> : null}
    </div>
  );
}

function CheckboxList({ items, value, onChange }) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const selected = value === item.value;
        return (
          <button
            key={item.value || 'all'}
            type="button"
            onClick={() => onChange(item.value)}
            className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-left"
          >
            <span className="text-[13px] text-[#1f2a44]">{item.label}</span>
            <span className={`grid h-4 w-4 place-items-center rounded-[4px] border ${selected ? 'border-[#ff4f7d] bg-[#ff4f7d]' : 'border-slate-300 bg-white'}`}>
              {selected ? <span className="h-1.5 w-1.5 rounded-[2px] bg-white" /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SelectionCardList({ items, value, onChange }) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const selected = value === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#f0e7e2] bg-white px-4 py-3 text-left shadow-[0_2px_8px_rgba(15,23,42,0.03)]"
          >
            <span className="text-[13px] font-medium text-[#1f2a44]">{item.label}</span>
            <span className={`grid h-4 w-4 place-items-center rounded-[4px] border ${selected ? 'border-[#7a1f36] bg-[#7a1f36]' : 'border-slate-300 bg-white'}`}>
              {selected ? <span className="h-1.5 w-1.5 rounded-[2px] bg-white" /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ColorOptionList({ items, value, onChange }) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const selected = value === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-left"
          >
            <span className="flex items-center gap-3">
              <span
                className={`h-4 w-4 rounded-full border border-white shadow-sm ring-1 ${selected ? 'ring-[#7a1f36]' : 'ring-slate-300'}`}
                style={{ backgroundColor: filterColorSwatches[item.value] || '#e5e7eb' }}
              />
              <span className="text-[13px] text-[#1f2a44]">{item.label}</span>
            </span>
            <span className={`grid h-4 w-4 place-items-center rounded-[4px] border ${selected ? 'border-[#7a1f36] bg-[#7a1f36]' : 'border-slate-300 bg-white'}`}>
              {selected ? <span className="h-1.5 w-1.5 rounded-[2px] bg-white" /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PriceInput({ label, value, onChange }) {
  return (
    <label className="grid gap-1">
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-slate-200 px-3 text-[13px] text-[#1f2a44] outline-none"
        placeholder="0"
        inputMode="numeric"
      />
    </label>
  );
}

function buildDraft(params) {
  return {
    category: params?.get?.('category') || '',
    size: params?.get?.('size') || '',
    color: params?.get?.('color') || '',
    fabric: params?.get?.('fabric') || '',
    discount: params?.get?.('discount') || '',
    sort: params?.get?.('sort') || '',
    minPrice: params?.get?.('minPrice') || '',
    maxPrice: params?.get?.('maxPrice') || '',
  };
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function toggleExpanded(key, setExpanded) {
  setExpanded((current) => ({ ...current, [key]: !current[key] }));
}

const filterColorSwatches = {
  Wine: '#6d1f34',
  Blush: '#ffb4c5',
  Gold: '#b8914a',
  Ivory: '#f5efe4',
  Black: '#17161a',
  Emerald: '#0f6b52',
  Navy: '#172554',
  Rose: '#ff5f86',
};
