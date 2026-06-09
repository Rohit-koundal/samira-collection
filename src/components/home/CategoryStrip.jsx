import seedCategories from '../../data/categories';
import { normalizeImageUrl } from '../../services/normalize';

export default function CategoryStrip({ navigate, categories = seedCategories }) {
  return (
    <section className="container-page bg-white py-5 md:bg-transparent md:py-12">
      <div className="mb-4 flex items-end justify-between md:mb-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-wine md:text-xs md:tracking-[0.24em]">Shop by category</p>
          <h2 className="mt-1 text-xl font-black md:mt-2 md:text-4xl">Curated fashion edits</h2>
        </div>
        <button onClick={() => navigate('/category')} className="hidden text-sm font-black text-rose md:block">View all</button>
      </div>
      <div className="hide-scrollbar flex gap-3 overflow-x-auto md:grid md:grid-cols-4 lg:grid-cols-8">
        {categories.map((category, index) => (
          <button key={category._id || category.id} onClick={() => navigate(`/products?category=${category._id || ''}`)} className="min-w-[112px] rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl md:min-w-[136px] md:rounded-3xl md:p-4">
            {category.image ? <img src={normalizeImageUrl(category.image)} alt="" className="h-16 w-full rounded-xl object-cover md:h-20 md:rounded-2xl" /> : <div className="grid h-16 place-items-center rounded-xl bg-gradient-to-br from-blush to-[#f7e4c7] text-2xl font-black text-wine md:h-20 md:rounded-2xl md:text-3xl">SC</div>}
            <h3 className="mt-3 truncate text-xs font-black md:mt-4 md:text-sm">{category.name}</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">{index % 2 ? 'Under Rs. 999' : `${category.count} styles`}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
