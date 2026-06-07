import categories from '../data/categories';

const iconMap = {
  'category-saree.svg': require('../assets/category-saree.svg').default,
  'category-suit.svg': require('../assets/category-suit.svg').default,
  'category-kurti.svg': require('../assets/category-kurti.svg').default,
  'category-dress.svg': require('../assets/category-dress.svg').default,
  'category-lehenga.svg': require('../assets/category-lehenga.svg').default,
  'category-dupatta.svg': require('../assets/category-dupatta.svg').default,
};

export default function CategorySection() {
  return (
    <section id="categories" className="py-10 md:py-14">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a4a42]">Shop by category</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Discover curated collections.</h2>
        </div>
        <p className="hidden md:block max-w-xl text-sm leading-7 text-slate-600">
          Explore premium sarees, suits, kurtis, dresses, and festive essentials designed for every celebration.
        </p>
      </div>

      <div className="mt-8 space-y-4 md:hidden">
        <div className="flex gap-4 overflow-x-auto pb-2 pl-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="min-w-[140px] rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5"
            >
              <img src={iconMap[category.icon]} alt={category.title} className="h-14 w-14" />
              <h3 className="mt-4 text-base font-semibold text-slate-900">{category.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{category.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-8 gap-4">
        {categories.map((category) => (
          <a
            key={category.id}
            href="#featured-products"
            className="group rounded-[28px] border border-slate-200 bg-white p-6 text-center transition hover:-translate-y-1 hover:border-[#c69d72] hover:shadow-soft"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#fff3f0]">
              <img src={iconMap[category.icon]} alt={category.title} className="h-12 w-12" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-slate-900">{category.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{category.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
