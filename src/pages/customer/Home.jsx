import {
  ChevronRight,
  Gem,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import Icon from '../../components/layout/Icon';
import Hero from '../../components/home/Hero';
import CategoryStrip from '../../components/home/CategoryStrip';
import OfferBanners from '../../components/home/OfferBanners';
import FeaturedProducts from '../../components/home/FeaturedProducts';
import TrendingNow from '../../components/home/TrendingNow';
import NewArrivals from '../../components/home/NewArrivals';
import BestSellers from '../../components/home/BestSellers';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { Button, Card, CardContent } from '../../components/ui';
import { getPrimaryImageUrl, normalizeImageUrl, normalizeProducts } from '../../services/normalize';
import { useGetBannersQuery, useGetCategoriesQuery, useGetProductsQuery } from '../../store/apiSlice';

const serviceHighlights = [
  { icon: Truck, title: 'Free Shipping', subtitle: 'On all orders' },
  { icon: Gem, title: 'Premium Quality', subtitle: 'Finest picks' },
  { icon: RotateCcw, title: 'Easy Returns', subtitle: 'Hassle free' },
  { icon: ShieldCheck, title: 'Secure Payment', subtitle: '100% safe' },
];

export default function Home({ navigate }) {
  const { data: productData = [] } = useGetProductsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: banners = [] } = useGetBannersQuery();
  const catalog = normalizeProducts(productData || []);

  const heroBanner = banners.find((banner) => banner.type === 'Hero');
  const offerBanners = banners.filter((banner) => ['Offer', 'Category', 'Sale'].includes(banner.type));
  const featuredProducts = catalog.filter((product) => product.isFeatured || product.showOnHomepage).slice(0, 4);
  const trendingProducts = catalog.filter((product) => product.showInTrending).slice(0, 4);
  const newArrivalProducts = catalog.filter((product) => product.isNewArrival).slice(0, 4);
  const bestSellerProducts = catalog.filter((product) => product.isBestSeller).slice(0, 4);

  return (
    <>
      <div className="bg-[#fcfaf7] md:hidden">
        <MobileHero banner={heroBanner} navigate={navigate} />
        <MobileServices />
        <MobileCategoryScroller categories={categories} navigate={navigate} />
        <MobileOfferStrip navigate={navigate} />
        <MobileEditorialBanners banners={offerBanners} navigate={navigate} />
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
        <MobileProductSection
          eyebrow="Best Sellers"
          title="Customer-loved picks"
          products={bestSellerProducts.length ? bestSellerProducts : featuredProducts}
          navigate={navigate}
          viewAllPath="/products?bestSeller=true&collection=best-sellers"
        />
      </div>

      <div className="hidden md:block">
        <Hero navigate={navigate} banner={heroBanner} />
        <CategoryStrip navigate={navigate} categories={categories} />
        <OfferBanners navigate={navigate} banners={offerBanners} />
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
      </div>
    </>
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
        {serviceHighlights.map(({ icon: Icon, title, subtitle }) => (
          <div key={title} className="flex flex-col items-center text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#fbf1ef] text-[#9d3154]">
              <Icon className="h-4.5 w-4.5" strokeWidth={1.9} />
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
