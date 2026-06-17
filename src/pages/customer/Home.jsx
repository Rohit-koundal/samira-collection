import Hero from '../../components/home/Hero';
import CategoryStrip from '../../components/home/CategoryStrip';
import OfferBanners from '../../components/home/OfferBanners';
import FeaturedProducts from '../../components/home/FeaturedProducts';
import TrendingNow from '../../components/home/TrendingNow';
import NewArrivals from '../../components/home/NewArrivals';
import BestSellers from '../../components/home/BestSellers';
import { Button, Card, CardContent } from '../../components/ui';
import { normalizeProducts } from '../../services/normalize';
import { useGetBannersQuery, useGetCategoriesQuery, useGetProductsQuery } from '../../store/apiSlice';

export default function Home({ navigate }) {
  const { data: productData = [] } = useGetProductsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: banners = [] } = useGetBannersQuery();
  const catalog = normalizeProducts(productData || []);

  return (
    <>
      <Hero navigate={navigate} banner={banners.find((banner) => banner.type === 'Hero')} />
      <CategoryStrip navigate={navigate} categories={categories} />
      <OfferBanners navigate={navigate} banners={banners.filter((banner) => ['Offer', 'Category', 'Sale'].includes(banner.type))} />
      <FeaturedProducts products={catalog.filter((p) => p.isFeatured || p.showOnHomepage).slice(0, 8)} navigate={navigate} />
      <TrendingNow products={catalog.filter((p) => p.showInTrending).slice(0, 8)} navigate={navigate} />
      <NewArrivals products={catalog.filter((p) => p.isNewArrival).slice(0, 8)} navigate={navigate} />
      <BestSellers products={catalog.filter((p) => p.isBestSeller).slice(0, 8)} navigate={navigate} />
      <section className="container-page hidden py-10 md:block">
        <Card>
          <CardContent className="p-8 md:p-10">
          <p className="small-text font-bold uppercase tracking-[0.18em] text-wine">Customer reviews</p>
          <h2 className="section-title mt-2 md:text-3xl">Loved for fit, fabric, and finish.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {['Beautiful festive collection and fast delivery.', 'The saree quality feels premium.', 'Admin helped me exchange size quickly.'].map((review) => (
              <blockquote key={review} className="body-text rounded-2xl bg-[#f8f2ec] p-5 font-medium text-slate-600">{review}</blockquote>
            ))}
          </div>
          </CardContent>
        </Card>
      </section>
      <section className="container-page hidden pb-12 md:block">
        <div className="rounded-2xl bg-charcoal p-8 text-white md:flex md:items-center md:justify-between">
          <div>
            <p className="small-text font-bold uppercase tracking-[0.18em] text-white/50">Newsletter</p>
            <h2 className="section-title mt-2 text-white md:text-3xl">Get new drops and sale alerts.</h2>
          </div>
          <div className="mt-5 flex max-w-md flex-1 gap-2 md:ml-8 md:mt-0">
            <input className="body-text h-12 min-w-0 flex-1 rounded-full px-5 text-charcoal" placeholder="Email address" />
            <Button variant="accent" className="rounded-full px-6">Join</Button>
          </div>
        </div>
      </section>
    </>
  );
}
