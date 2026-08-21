import { ChevronLeft, ChevronRight, Gem, RotateCcw, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { useRef } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import Icon from '../../components/layout/Icon';
import Hero from '../../components/home/Hero';
import CategoryStrip from '../../components/home/CategoryStrip';
import DesktopLuxuryHome from './DesktopLuxuryHome';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { Button } from '../../components/ui';
import PageState from '../../components/ui/PageState';
import { getPrimaryImageUrl, normalizeImageUrl, normalizeProducts } from '../../services/normalize';
import ProductCard from '../../components/product/ProductCard';
import { useGetBannersQuery, useGetCategoriesQuery, useGetProductsQuery } from '../../store/apiSlice';

const serviceHighlights = [
  { icon: Truck, title: 'Free Shipping', subtitle: 'On all orders' },
  { icon: Gem, title: 'Premium Quality', subtitle: 'Finest picks' },
  { icon: RotateCcw, title: 'Easy Returns', subtitle: 'Hassle free' },
  { icon: ShieldCheck, title: 'Secure Payment', subtitle: '100% safe' },
];

export default function Home({ navigate }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { data: productData = [], isLoading, isError, refetch } = useGetProductsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: banners = [] } = useGetBannersQuery();
  const catalog = normalizeProducts(productData || []);
  const heroBanners = banners.filter((banner) => banner.type === 'Hero');
  const promoBanner = banners.find((banner) => ['Offer', 'Category', 'Sale', 'Hero'].includes(banner.type));

  const featuredProducts = catalog.filter((product) => product.isFeatured || product.showOnHomepage).slice(0, 12);
  const trendingProducts = catalog.filter((product) => product.showInTrending).slice(0, 12);
  const newArrivalProducts = catalog.filter((product) => product.isNewArrival).slice(0, 12);
  const instagramProducts = catalog.filter((product) => getPrimaryImageUrl(product.images)).slice(0, 12);

  if (isLoading && !catalog.length) {
    return <section className="container-page py-10"><PageState loading loadingLabel="Loading the collection..." /></section>;
  }

  if (isError && !catalog.length) {
    return <section className="container-page py-10"><PageState error="Unable to load the store right now." onRetry={refetch} /></section>;
  }

  return (
    <>
      <div className="bg-[#fcfaf7] lg:hidden">
        <MobileHero banner={heroBanners[0] || promoBanner} navigate={navigate} />
        <MobileServices />
        <MobileCategoryScroller categories={categories} navigate={navigate} />
        <MobileOfferStrip navigate={navigate} />
        <MobileEditorialBanners banners={banners.filter((banner) => ['Offer', 'Category', 'Sale'].includes(banner.type))} navigate={navigate} />
        <MobileProductSection
          eyebrow="Trending Now"
          title="Fast-moving styles"
          products={trendingProducts.length ? trendingProducts : featuredProducts}
          navigate={navigate}
          viewAllPath="/products?trending=true&collection=trending-now"
        />
        <MobileProductSection
          eyebrow="New Arrivals"
          title="Fresh drops this week"
          products={newArrivalProducts.length ? newArrivalProducts : featuredProducts}
          navigate={navigate}
          viewAllPath="/products?newArrival=true&collection=new-arrivals"
        />
      </div>

      {isDesktop && (
        <DesktopLuxuryHome
          navigate={navigate}
          categories={categories}
          banners={banners}
          catalog={catalog}
          featuredProducts={featuredProducts}
          trendingProducts={trendingProducts}
          newArrivalProducts={newArrivalProducts}
          instagramProducts={instagramProducts}
        />
      )}
    </>
  );
}

function SectionPanel({ eyebrow, title, path, navigate, products }) {
  const scrollerRef = useRef(null);

  const scrollRow = (direction) => {
    scrollerRef.current?.scrollBy({
      left: direction * 432,
      behavior: 'smooth',
    });
  };

  return (
    <section className="overflow-hidden bg-white/80 p-3 md:p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="small-text font-bold uppercase tracking-[0.18em] text-wine">{eyebrow}</p>
          <h2 className="section-title mt-1 text-[23px] md:text-[26px]">{title}</h2>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => navigate(path)}
            className="text-[12px] font-bold uppercase tracking-[0.12em] text-wine"
          >
            View all
          </button>
          <button
            type="button"
            onClick={() => scrollRow(-1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#eadfd5] bg-white text-slate-600 transition hover:border-[#cfa8b7] hover:text-wine"
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollRow(1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#eadfd5] bg-white text-slate-600 transition hover:border-[#cfa8b7] hover:text-wine"
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="hide-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 scroll-smooth"
      >
        {products.map((product) => (
          <div key={product.id} className="min-w-[190px] max-w-[190px] flex-none snap-start lg:min-w-[198px] lg:max-w-[198px]">
            <ProductCard product={product} navigate={navigate} />
          </div>
        ))}
      </div>
    </section>
  );
}

function PromoCard({ banner, navigate }) {
  const image = banner?.image ? normalizeImageUrl(banner.image) : '';

  return (
    <button
      type="button"
      onClick={() => navigate(banner?.link || '/products')}
      className="relative overflow-hidden rounded-[26px] border border-[#eadfd5] bg-gradient-to-br from-[#4c0d23] via-[#7a1f36] to-[#a73d5c] text-left text-white shadow-[0_14px_28px_rgba(87,43,34,0.14)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,220,190,0.14),transparent_32%)]" />
      <div className="relative flex min-h-[100%] flex-col justify-between gap-4 p-6 lg:p-8">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/65">Festive collection</p>
          <h3 className="mt-3 max-w-[12ch] text-[28px] font-semibold leading-[1.05] lg:text-[38px]">Celebrate in Style</h3>
          <p className="mt-3 max-w-[28ch] text-[14px] leading-6 text-white/82">
            {banner?.subtitle || 'Elegant festive pieces with rich textures, ornate detailing and premium finishing.'}
          </p>
        </div>
        <div className="overflow-hidden rounded-[24px] border border-white/12 bg-white/10">
          {image ? (
            <img src={image} alt={banner?.title || 'Festive collection'} className="h-[220px] w-full object-cover object-top" />
          ) : (
            <div className="flex h-[220px] items-center justify-center bg-white/5 text-sm font-bold uppercase tracking-[0.2em] text-white/75">
              Samira Collection
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function CustomerLoveCard({ products }) {
  const cover = products.slice(0, 4);
  const highlights = [
    'Beautiful fabric quality',
    'Perfect fit and elegant designs',
    'Loved the packaging',
    'Fast delivery & great service',
  ];

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#eadfd5] bg-white p-4 shadow-[0_10px_26px_rgba(23,22,26,0.04)]">
      <p className="small-text font-bold uppercase tracking-[0.18em] text-wine">Loved by 2500+ customers</p>
      <h3 className="mt-2 text-[26px] font-semibold text-charcoal">Loved for Fit, Fabric & Finish</h3>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex text-amber-500">★★★★★</div>
        <span className="text-[12px] text-slate-500">4.9/5 from 2,500+ happy customers</span>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_120px]">
        <ul className="space-y-2 text-[13px] text-slate-600">
          {highlights.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="text-wine">✓</span>
              {item}
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-2">
          {cover.map((product) => {
            const image = getPrimaryImageUrl(product.images);
            return (
              <div key={product.id} className="overflow-hidden rounded-[16px] border border-[#efe2da] bg-[#f7efe8]">
                {image ? <img src={image} alt={product.name} className="h-full w-full object-cover" /> : <div className="aspect-square" />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ quote, name }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-[#eadfd5] bg-white p-4 shadow-[0_10px_26px_rgba(23,22,26,0.04)]">
      <div className="text-[14px] leading-6 text-slate-600">
        <div className="mb-3 text-amber-500">★★★★★</div>
        “{quote}”
      </div>
      <div className="mt-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#7a1f36] text-[12px] font-black text-white">
          {name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-charcoal">{name}</p>
          <p className="text-[11px] text-slate-500">Verified buyer</p>
        </div>
      </div>
    </section>
  );
}

function NewsletterCard() {
  return (
    <section className="overflow-hidden rounded-[24px] border border-[#eadfd5] bg-[#fff8f2] p-4 shadow-[0_10px_26px_rgba(23,22,26,0.03)]">
      <p className="small-text font-bold uppercase tracking-[0.18em] text-wine">Stay in style</p>
      <h3 className="mt-2 text-[26px] font-semibold text-charcoal">Get style updates & exclusive offers</h3>
      <div className="mt-5 flex gap-2">
        <input className="h-12 min-w-0 flex-1 rounded-full border border-[#e7d7ce] bg-white px-4 text-[14px] outline-none" placeholder="Enter your email address" />
        <Button className="rounded-full px-5">Subscribe</Button>
      </div>
      <p className="mt-3 text-[12px] text-slate-500">No spam, unsubscribe anytime.</p>
    </section>
  );
}

function ServiceStrip() {
  const items = [
    { title: 'Secure Payments', subtitle: '100% safe & trusted', icon: ShieldCheck },
    { title: 'COD Available', subtitle: 'Hassle-free cash on delivery', icon: Truck },
    { title: 'Worldwide Shipping', subtitle: 'Delivering happiness worldwide', icon: Gem },
    { title: '24/7 Support', subtitle: 'We’re here to help you anytime', icon: RotateCcw },
  ];

  return (
    <section className="overflow-hidden rounded-[22px] border border-[#eadfd5] bg-white px-4 py-4 shadow-[0_10px_22px_rgba(23,22,26,0.03)]">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const IconComp = item.icon;
          return (
            <div key={item.title} className="flex items-center gap-3 rounded-[18px] border border-[#f0e4dc] bg-[#fcf7f2] px-4 py-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-wine shadow-[0_8px_16px_rgba(122,31,54,0.08)]">
                <IconComp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-charcoal">{item.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{item.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function InstagramStrip({ products, navigate }) {
  const scrollerRef = useRef(null);

  const scrollGallery = (direction) => {
    scrollerRef.current?.scrollBy({
      left: direction * 360,
      behavior: 'smooth',
    });
  };

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#eadfd5] bg-white p-4 shadow-[0_10px_26px_rgba(23,22,26,0.04)] lg:p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="small-text font-bold uppercase tracking-[0.18em] text-wine">Follow us on Instagram</p>
          <h3 className="mt-2 text-[24px] font-semibold text-charcoal">Shop the look</h3>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <button type="button" className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-500">
            @samirastylists
          </button>
          <button
            type="button"
            onClick={() => scrollGallery(-1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#eadfd5] bg-white text-slate-600 transition hover:border-[#cfa8b7] hover:text-wine"
            aria-label="Scroll gallery left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollGallery(1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#eadfd5] bg-white text-slate-600 transition hover:border-[#cfa8b7] hover:text-wine"
            aria-label="Scroll gallery right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="hide-scrollbar mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scroll-smooth"
      >
        {products.map((product) => {
          const image = getPrimaryImageUrl(product.images);
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => navigate(`/product?id=${product.id}`)}
              className="min-w-[150px] max-w-[150px] flex-none overflow-hidden rounded-[18px] border border-[#efe2da] bg-[#f6e8df] text-left snap-start md:min-w-[160px] md:max-w-[160px] lg:min-w-[170px] lg:max-w-[170px]"
            >
              <div className="aspect-[0.82]">
                {image ? (
                  <img src={normalizeImageUrl(image)} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f4dfd1] to-[#edd4c4] text-[12px] font-semibold text-[#7a1f36]">
                    Samira
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MobileHero({ banner, navigate }) {
  return (
    <section className="px-3 pb-4 pt-3">
      <button
        type="button"
        onClick={() => navigate(banner?.link || '/products')}
        className="relative block w-full overflow-hidden rounded-[16px] bg-gradient-to-r from-[#fbf1ef] via-[#fff8f5] to-[#f6ddcf] text-left shadow-[0_8px_20px_rgba(122,31,54,0.08)]"
      >
        {banner?.image && (
          <img
            src={normalizeImageUrl(banner.image)}
            alt={banner.title || 'Hero banner'}
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
        )}
        <div className="relative grid min-h-[178px] grid-cols-[1.2fr_124px] items-center gap-3 px-4 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9d3154]">New festive collection</p>
            <h1 className="mt-2 text-[20px] font-semibold leading-[1.12] text-[#6d1f34]">
              {banner?.title || 'Celebrate in Style'}
            </h1>
            <p className="mt-1.5 max-w-[190px] text-[12px] leading-[1.35] text-[#6a5761]">
              {banner?.subtitle || 'Elegant sarees, suits & kurtis for every occasion.'}
            </p>
            <div className="mt-3 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6d1f34]">
              Up to 50% off
            </div>
            <div className="mt-3">
              <span className="inline-flex h-9 items-center rounded-[8px] bg-[#7a1f36] px-4 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                Shop Now
              </span>
            </div>
          </div>
          <div className="relative flex h-[148px] items-end justify-center">
            <div className="absolute inset-0 rounded-[18px] bg-white/60 blur-[2px]" />
            <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-white/80">
              {banner?.image ? (
                <img src={normalizeImageUrl(banner.image)} alt={banner.title || 'Collection'} className="h-full w-full object-cover object-top" />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-b from-[#f8e2d7] to-[#f6cfd2] text-[11px] font-semibold text-[#7a1f36]">
                  Samira Collection
                </div>
              )}
            </div>
          </div>
        </div>
      </button>
    </section>
  );
}

function MobileServices() {
  return (
    <section className="px-3 pb-4">
      <div className="grid grid-cols-4 gap-2 rounded-[16px] bg-white px-2.5 py-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
        {serviceHighlights.map(({ icon: IconComp, title, subtitle }) => (
          <div key={title} className="flex flex-col items-center text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#fbf1ef] text-[#9d3154]">
              <IconComp className="h-4.5 w-4.5" strokeWidth={1.9} />
            </div>
            <p className="mt-2 text-[11px] font-semibold leading-3 text-[#1f2a44]">{title}</p>
            <p className="mt-1 text-[9px] leading-3 text-slate-400">{subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MobileCategoryScroller({ categories, navigate }) {
  const visibleCategories = (categories || []).slice(0, 8);

  return (
    <section className="px-3 pb-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#9d3154]">Shop by category</p>
        </div>
        <button type="button" onClick={() => navigate('/category')} className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="hide-scrollbar flex gap-3.5 overflow-x-auto pb-1">
        {visibleCategories.map((category) => {
          const categoryId = category._id || category.id || category.slug || '';
          return (
            <button
              key={categoryId || category.name}
              type="button"
              onClick={() => navigate(`/products?category=${categoryId}`)}
              className="min-w-[68px] max-w-[68px] text-center"
            >
              <div className="mx-auto flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full bg-[#f6e8df] ring-1 ring-[#f0dfd3]">
                {category.image ? (
                  <img src={normalizeImageUrl(category.image)} alt={category.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#7a1f36]">{category.name?.slice(0, 2)}</span>
                )}
              </div>
              <p className="mt-2 truncate text-[11px] font-medium text-[#1f2a44]">{category.name}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MobileOfferStrip({ navigate }) {
  return (
    <section className="px-3 pb-4">
      <button
        type="button"
        onClick={() => navigate('/products?discount=20')}
        className="flex w-full items-center justify-between rounded-[14px] bg-gradient-to-r from-[#fff0f4] via-[#fff8fb] to-[#fdf2e8] px-4 py-3.5 text-left shadow-[0_6px_18px_rgba(122,31,54,0.05)]"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#9d3154] shadow-sm">
            <Sparkles className="h-4.5 w-4.5" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-[#1f2a44]">Festive sale is live</p>
            <p className="mt-0.5 text-[10px] text-[#6b7280]">Get up to 50% off on your festive picks</p>
          </div>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7a1f36]">Shop now</span>
      </button>
    </section>
  );
}

function MobileEditorialBanners({ banners, navigate }) {
  const cards = (banners || []).slice(0, 3);
  if (!cards.length) return null;

  return (
    <section className="px-3 pb-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9d3154]">Featured collections</p>
        </div>
        <button type="button" onClick={() => navigate('/products')} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((banner, index) => (
          <button
            key={banner._id || banner.title || index}
            type="button"
            onClick={() => navigate(banner.link || '/products')}
            className="relative overflow-hidden rounded-[12px] bg-[#f4e9e0] text-left shadow-[0_6px_16px_rgba(15,23,42,0.05)]"
          >
            <div className="aspect-[0.92]">
              {banner.image ? (
                <img src={normalizeImageUrl(banner.image)} alt={banner.title || 'Collection'} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-end bg-gradient-to-br from-[#f7e8de] to-[#ecd2c4] p-3">
                  <span className="text-[11px] font-semibold text-[#6d1f34]">{banner.title || 'Samira edit'}</span>
                </div>
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3f2731]/85 via-[#3f2731]/25 to-transparent px-2.5 py-2">
              <p className="line-clamp-2 text-[10px] font-semibold leading-3 text-white">{banner.title || 'Featured collection'}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function MobileProductSection({ eyebrow, title, products, navigate, viewAllPath }) {
  if (!products?.length) return null;

  return (
    <section className="px-3 pb-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9d3154]">{eyebrow}</p>
        </div>
        <button type="button" onClick={() => navigate(viewAllPath || '/products')} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <MobileCompactProductGrid products={products} navigate={navigate} title={title} />
    </section>
  );
}

function MobileCompactProductGrid({ products, navigate, title }) {
  return (
    <div className="hide-scrollbar -mx-0.5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
      {products.map((product) => (
        <MobileCompactProductCard key={product.id} product={product} navigate={navigate} sectionTitle={title} />
      ))}
    </div>
  );
}

function MobileCompactProductCard({ product, navigate, sectionTitle }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const productId = product._id || product.id || product.slug;
  const isWishlisted = wishlist.items.some((item) => (item._id || item.id || item.slug) === productId);
  const image = getPrimaryImageUrl(product.images);
  const cartItem = cart.getCartItem(product);

  const badge = product.isBestSeller
    ? { label: 'BESTSELLER', className: 'bg-[#f59e0b] text-white' }
    : product.isNewArrival
      ? { label: 'NEW', className: 'bg-[#22c55e] text-white' }
      : product.showInTrending || sectionTitle === 'Fast-moving styles'
        ? { label: 'TREND', className: 'bg-[#10b981] text-white' }
        : null;

  return (
    <article className="min-w-0 shrink-0 snap-start basis-[calc(50%-6px)]">
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/product?id=${productId}`)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navigate(`/product?id=${productId}`);
          }
        }}
        className="block w-full cursor-pointer text-left"
      >
        <div className="relative overflow-hidden rounded-[14px] bg-[#f6e8df] shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
          <div className="aspect-[0.92]">
            {image ? (
              <img src={normalizeImageUrl(image)} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f8e2d7] to-[#f5d0d5] text-[12px] font-semibold text-[#7a1f36]">
                Samira
              </div>
            )}
          </div>
          {badge && (
            <span className={`absolute left-2 top-2 rounded-[4px] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.05em] ${badge.className}`}>
              {badge.label}
            </span>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              wishlist.toggleWishlist(product);
            }}
            className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 shadow-sm ${isWishlisted ? 'text-rose' : 'text-slate-500'}`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Icon name="heart" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="px-1 pt-2">
        <button type="button" onClick={() => navigate(`/product?id=${productId}`)} className="block w-full text-left">
          <p className="truncate text-[11px] font-semibold leading-[1.3] text-[#1f2a44]" title={product.name}>{product.name}</p>
          <p className="mt-0.5 truncate text-[10px] text-slate-500" title={product.category}>{product.category}</p>
        </button>
        <div className="mt-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-bold text-charcoal">Rs. {product.price}</span>
              <span className="truncate text-[9px] text-slate-400 line-through">Rs. {product.originalPrice}</span>
            </div>
            <p className="mt-0.5 text-[9px] font-bold text-rose">({product.discountPercentage}% OFF)</p>
          </div>
          <button
            type="button"
            onClick={() => cart.addToCart(product)}
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#e7e5e4] ${cartItem ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-slate-600'}`}
            aria-label={cartItem ? 'Add more to cart' : 'Add to cart'}
          >
            <Icon name="bag" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
