import categories from '../../data/categories';

export default function ProductForm({ mode = 'Add' }) {
  return (
    <form className="grid gap-4 rounded-3xl bg-white p-5 shadow-sm lg:grid-cols-2">
      <Input label="Product name" placeholder="Royal Zari Silk Saree" />
      <Input label="Slug" placeholder="auto-generated-slug" />
      <Input label="Price" placeholder="1299" />
      <Input label="Original price" placeholder="2499" />
      <label className="grid gap-2 text-sm font-black">Category
        <select className="h-12 rounded-xl border border-slate-200 px-4 font-semibold">
          {categories.map((category) => <option key={category.id}>{category.name}</option>)}
        </select>
      </label>
      <Input label="Stock quantity" placeholder="20" />
      <Input label="Sizes" placeholder="S, M, L, XL" />
      <Input label="Colors" placeholder="Wine, Blush, Gold" />
      <Input label="Fabric" placeholder="Silk" />
      <Input label="Occasion" placeholder="Festive" />
      <label className="grid gap-2 text-sm font-black lg:col-span-2">Description
        <textarea className="min-h-28 rounded-xl border border-slate-200 p-4 font-semibold" placeholder="Product description" />
      </label>
      <div className="flex flex-wrap gap-4 lg:col-span-2">
        {['Featured', 'New Arrival', 'Best Seller', 'Active'].map((item) => <label key={item} className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="accent-rose" /> {item}</label>)}
      </div>
      <button className="h-12 rounded-xl bg-wine text-sm font-black text-white lg:col-span-2">{mode} Product</button>
    </form>
  );
}

function Input({ label, placeholder }) {
  return <label className="grid gap-2 text-sm font-black">{label}<input className="h-12 rounded-xl border border-slate-200 px-4 font-semibold" placeholder={placeholder} /></label>;
}
