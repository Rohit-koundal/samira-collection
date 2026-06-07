const categories = [
  {
    title: 'Sarees',
    label: 'Silk & chiffon',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Suits',
    label: 'Embroidered sets',
    image:
      'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Kurtis',
    label: 'Everyday style',
    image:
      'https://images.unsplash.com/photo-1495121605193-b116b5b9c5d0?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Dresses',
    label: 'Party wear',
    image:
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Lehenga',
    label: 'Bridal ready',
    image:
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Dupatta Collection',
    label: 'Layer with grace',
    image:
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80'
  }
];

export default function Categories() {
  return (
    <section id="categories" className="mt-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Shop by category</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Find your signature look.</h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          Explore premium selections across sarees, suits, kurtis, dresses and festive ensemble pieces.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <article id={category.title.toLowerCase().replace(/\s+/g, '-')} key={category.title} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="overflow-hidden rounded-[1.75rem] bg-slate-100">
              <img src={category.image} alt={category.title} className="h-48 w-full object-cover" />
            </div>
            <div className="space-y-3 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{category.label}</p>
              <h3 className="text-2xl font-semibold text-slate-900">{category.title}</h3>
              <p className="text-sm text-slate-600">Discover the latest textures, patterns and handcrafted details.</p>
              <a href={`#${category.title.toLowerCase().replace(/\s+/g, '-')}`} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary transition group-hover:text-brand-primary/80">
                Shop Now
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
