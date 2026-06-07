import categories from '../../data/categories';

export default function CategoryStrip({ navigate }) {
  return (
    <section className="container-page py-8 md:py-12">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-wine">Shop by category</p>
          <h2 className="mt-2 text-2xl font-black md:text-4xl">Curated fashion edits</h2>
        </div>
        <button onClick={() => navigate('/category')} className="hidden text-sm font-black text-rose md:block">View all</button>
      </div>
      <div className="hide-scrollbar flex gap-3 overflow-x-auto md:grid md:grid-cols-4 lg:grid-cols-8">
        {categories.map((category, index) => (
          <button key={category.id} onClick={() => navigate('/category')} className="min-w-[136px] rounded-3xl bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="grid h-20 place-items-center rounded-2xl bg-gradient-to-br from-blush to-[#f7e4c7] text-3xl font-black text-wine">SC</div>
            <h3 className="mt-4 text-sm font-black">{category.name}</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">{index % 2 ? 'Under Rs. 999' : `${category.count} styles`}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
