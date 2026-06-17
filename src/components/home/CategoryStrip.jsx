import { Button, Card, CardContent } from '../ui';
import { normalizeImageUrl } from '../../services/normalize';

export default function CategoryStrip({ navigate, categories = [] }) {
  const visibleCategories = categories || [];

  return (
    <section className="container-page bg-white py-5 md:bg-transparent md:py-12">
      <div className="mb-4 flex items-end justify-between gap-3 md:mb-5">
        <div>
          <p className="small-text font-bold uppercase tracking-[0.14em] text-wine md:text-xs md:tracking-[0.2em]">Shop by category</p>
          <h2 className="section-title mt-1 md:mt-2 md:text-3xl">Curated fashion edits</h2>
        </div>
        <Button onClick={() => navigate('/category')} variant="ghost" className="hidden text-rose md:inline-flex">View all</Button>
      </div>
      <div className="hide-scrollbar flex gap-3 overflow-x-auto md:grid md:grid-cols-4 lg:grid-cols-8">
        {visibleCategories.map((category, index) => {
          const categoryId = category._id || category.id || category.slug || '';
          const subtitle = category.count ? `${category.count} styles` : category.description || (index % 2 ? 'Under Rs. 999' : 'Fresh styles');
          const canRenderImage = isRealImagePath(category.image);
          return (
            <Card
              as="button"
              key={categoryId || category.name}
              onClick={() => navigate(`/products?category=${categoryId}`)}
              className="min-w-[104px] text-left transition hover:-translate-y-1 hover:shadow-xl md:min-w-[132px]"
            >
              <CardContent className="p-3 md:p-4">
                {canRenderImage ? <img src={normalizeImageUrl(category.image)} alt="" className="h-16 w-full rounded-lg object-cover md:h-20 md:rounded-xl" /> : <div className="grid h-16 place-items-center rounded-lg bg-gradient-to-br from-blush to-[#f7e4c7] text-xl font-bold text-wine md:h-20 md:rounded-xl md:text-2xl">SC</div>}
                <h3 className="label-text mt-3 truncate text-charcoal md:mt-4">{category.name}</h3>
                <p className="small-text mt-1 text-slate-500 md:text-xs">{subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function isRealImagePath(value) {
  if (!value) return false;
  return value.startsWith('http') || value.startsWith('data:') || value.startsWith('/uploads/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(value);
}
