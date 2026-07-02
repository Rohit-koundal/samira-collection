import { useMemo, useRef, useState } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconCreditCard,
  IconHeart,
  IconPackage,
  IconRefresh,
  IconShieldCheck,
  IconShoppingBag,
  IconStarFilled,
  IconTruckDelivery,
} from '@tabler/icons-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getPrimaryImageUrl, normalizeImageEntries, normalizeImageUrl } from '../../services/normalize';
import styles from './DesktopLuxuryHome.module.css';

const services = [
  { title: 'Secure Payments', text: '100% secure & trusted', icon: IconCreditCard },
  { title: 'COD Available', text: 'Cash on delivery nationwide', icon: IconPackage },
  { title: 'Easy Returns', text: 'Simple returns & refunds', icon: IconRefresh },
  { title: '24/7 Support', text: 'We are here to help you', icon: IconShieldCheck },
];

const reviews = [
  { name: 'Priya Sharma', text: 'The fabric quality is beautiful and the fit feels made for me. The finishing is genuinely premium.' },
  { name: 'Neha Verma', text: 'My order arrived quickly and looked exactly like the photos. I will happily shop here again.' },
  { name: 'Anjali Mehta', text: 'Elegant designs, thoughtful packaging, and a very smooth shopping experience from start to finish.' },
];

export default function DesktopLuxuryHome({
  navigate,
  categories = [],
  banners = [],
  catalog = [],
  featuredProducts = [],
  trendingProducts = [],
  newArrivalProducts = [],
}) {
  const [heroIndex, setHeroIndex] = useState(0);

  const productsWithImages = useMemo(
    () => uniqueProducts([...featuredProducts, ...trendingProducts, ...newArrivalProducts, ...catalog])
      .filter((product) => getProductImage(product)),
    [catalog, featuredProducts, newArrivalProducts, trendingProducts],
  );

  const heroSlides = useMemo(() => {
    const heroes = banners.filter((banner) => banner.type === 'Hero' && banner.image);
    if (heroes.length) return heroes;
    const closestBanner = banners.find((banner) => banner.image);
    return closestBanner ? [closestBanner] : [{}];
  }, [banners]);

  const activeHero = heroSlides[heroIndex % heroSlides.length] || {};
  const heroImage = activeHero.image
    ? normalizeImageUrl(activeHero.image)
    : getProductImage(productsWithImages[0]);
  const editorialProducts = productsWithImages.slice(0, 3);
  const arrivals = uniqueProducts([
    ...newArrivalProducts,
    ...featuredProducts,
    ...trendingProducts,
    ...catalog,
  ]).filter((product) => getProductImage(product));
  const bestSellers = uniqueProducts(
    catalog.filter((product) => product.isBestSeller),
  ).filter((product) => getProductImage(product)).slice(0, 12);
  const trendingNow = uniqueProducts(
    catalog.filter((product) => product.showInTrending),
  ).filter((product) => getProductImage(product)).slice(0, 12);
  const latestArrivals = arrivals.slice(0, 12);
  const saleBanner = banners.find((banner) => ['Sale', 'Offer'].includes(banner.type) && banner.image);

  const moveHero = (direction) => {
    setHeroIndex((current) => (current + direction + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className={styles.desktopLuxuryHome}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>New Festive Collection '24</p>
            <h1>Where Tradition<br />Meets <em>Modern Grace</em></h1>
            <p className={styles.heroDescription}>
              {activeHero.subtitle || 'Premium ethnic wear crafted for weddings, festive moments, and everyday elegance.'}
            </p>
            <div className={styles.heroButtons}>
              <button type="button" className={styles.primaryButton} onClick={() => navigate(activeHero.link || '/products?newArrival=true')}>Shop New Arrivals</button>
              <button type="button" className={styles.secondaryButton} onClick={() => navigate('/products')}>Explore Collections</button>
            </div>
            <div className={styles.trustPoints}>
              <TrustPoint icon={IconShieldCheck} title="Premium Fabric" text="Finest quality assured" />
              <TrustPoint icon={IconRefresh} title="Easy Exchange" text="Hassle-free exchange" />
              <TrustPoint icon={IconTruckDelivery} title="Fast Delivery" text="Across India in 2-5 days" />
            </div>
          </div>
          <div className={styles.heroVisual}>
            {heroImage ? <img src={heroImage} alt={activeHero.title || 'Samira festive collection'} /> : <div className={styles.imageFallback}>Samira Collection</div>}
          </div>
        </div>
        <button type="button" className={`${styles.heroArrow} ${styles.heroArrowLeft}`} onClick={() => moveHero(-1)} aria-label="Previous hero slide"><IconChevronLeft /></button>
        <button type="button" className={`${styles.heroArrow} ${styles.heroArrowRight}`} onClick={() => moveHero(1)} aria-label="Next hero slide"><IconChevronRight /></button>
        <div className={styles.heroDots}>
          {heroSlides.map((slide, index) => (
            <button
              key={slide._id || slide.id || index}
              type="button"
              className={index === heroIndex % heroSlides.length ? styles.heroDotActive : ''}
              onClick={() => setHeroIndex(index)}
              aria-label={`Show hero slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <CategorySection categories={categories.slice(0, 8)} products={productsWithImages} navigate={navigate} />

      <section className={`${styles.luxuryContainer} ${styles.editorialProductsGrid}`}>
        <EditorialGrid products={editorialProducts} navigate={navigate} />
        <ProductSection
          className={styles.newArrivalsBlock}
          eyebrow="Fresh Drops"
          title="New Arrivals"
          subtitle="Latest pieces added to the collection."
          products={arrivals.slice(0, 12)}
          navigate={navigate}
          viewAllPath="/products?newArrival=true"
          compact
        />
      </section>

      <SaleBanner banner={saleBanner} fallbackProduct={productsWithImages[0]} navigate={navigate} />
      <ServiceStrip />

      <section className={`${styles.luxuryContainer} ${styles.collectionSection}`}>
        <ProductSection
          eyebrow="Trending Now"
          title="Most-Loved Styles"
          subtitle="Discover the pieces everyone is reaching for right now."
          products={trendingNow}
          navigate={navigate}
          viewAllPath="/products?trending=true"
        />
      </section>

      <section className={`${styles.luxuryContainer} ${styles.collectionSection}`}>
        <ProductSection
          eyebrow="New Arrivals"
          title="Freshly Added"
          subtitle="The latest silhouettes, colors, and festive details from Samira."
          products={latestArrivals}
          navigate={navigate}
          viewAllPath="/products?newArrival=true"
        />
      </section>

      <section className={`${styles.luxuryContainer} ${styles.bestSellers}`}>
        <ProductSection
          eyebrow="Best Sellers"
          title="Customer Favorites"
          subtitle="Most-loved styles chosen by the Samira community."
          products={bestSellers}
          navigate={navigate}
          viewAllPath="/products?bestSeller=true"
        />
      </section>

      <TestimonialSection />
      <NewsletterSection />
    </div>
  );
}

function TrustPoint({ icon: IconComponent, title, text }) {
  return (
    <div className={styles.trustPoint}>
      <span><IconComponent size={18} stroke={1.7} /></span>
      <div><strong>{title}</strong><small>{text}</small></div>
    </div>
  );
}

function CategorySection({ categories, products, navigate }) {
  return (
    <section className={styles.categorySection}>
      <div className={styles.sectionTitleDecorated}><span /><h2>Shop by Category</h2><span /></div>
      <p>Curated styles for every occasion</p>
      <div className={styles.categoryGrid}>
        {categories.map((category) => {
          const categoryId = category._id || category.id || category.slug || category.name;
          const matchingProduct = products.find((product) => normalizeName(product.category).includes(normalizeName(category.name)));
          const image = category.image ? normalizeImageUrl(category.image) : getProductImage(matchingProduct || products[0]);
          return (
            <button key={categoryId} type="button" className={styles.categoryItem} onClick={() => navigate(`/products?category=${encodeURIComponent(categoryId)}`)}>
              <span className={styles.categoryImageWrap}>
                {image ? <img src={image} alt={category.name} /> : <span className={styles.imageFallback}>{String(category.name || 'SC').slice(0, 2)}</span>}
              </span>
              <strong>{category.name}</strong>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EditorialGrid({ products, navigate }) {
  return (
    <div className={styles.editorialGrid}>
      <EditorialCard
        className={styles.featureCardLarge}
        product={products[0]}
        eyebrow="Festive Edit"
        text="Graceful styles for celebration season"
        action="Explore Festive Wear"
        navigate={navigate}
      />
      <EditorialCard
        className={styles.featureCardSmall}
        product={products[1]}
        eyebrow="Wedding Collection"
        text="Timeless looks for your special day"
        action="Shop Now"
        navigate={navigate}
      />
      <EditorialCard
        className={styles.featureCardSmall}
        product={products[2]}
        eyebrow="Everyday Elegance"
        text="Comfort meets style for every day"
        action="Shop Now"
        navigate={navigate}
      />
    </div>
  );
}

function EditorialCard({ className, product, eyebrow, text, action, navigate }) {
  const productId = getProductId(product);
  const image = getProductImage(product);
  return (
    <article className={className}>
      {image ? <img src={image} alt={product?.name || eyebrow} /> : <div className={styles.imageFallback}>Samira Collection</div>}
      <div className={styles.editorialOverlay} />
      <div className={styles.editorialCopy}>
        <h3>{eyebrow}</h3>
        <p>{text}</p>
        <button type="button" onClick={() => productId ? navigate(`/product?id=${encodeURIComponent(productId)}`) : navigate('/products')}>{action} <span aria-hidden="true">&rarr;</span></button>
      </div>
    </article>
  );
}

function ProductSection({ eyebrow, title, subtitle, products, navigate, viewAllPath, compact = false, className = '' }) {
  const scrollerRef = useRef(null);
  const hasSlider = products.length > 4;

  const slideSection = (direction) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.92, behavior: 'smooth' });
  };

  return (
    <div className={`${styles.productSection} ${className}`}>
      <div className={styles.productSectionHeader}>
        <div><span>{eyebrow}</span><h2>{title}</h2><p>{subtitle}</p></div>
        <div className={styles.sectionControls}>
          {hasSlider && (
            <>
              <button type="button" className={styles.sectionArrow} onClick={() => slideSection(-1)} aria-label={`Slide ${title} left`}><IconChevronLeft /></button>
              <button type="button" className={styles.sectionArrow} onClick={() => slideSection(1)} aria-label={`Slide ${title} right`}><IconChevronRight /></button>
            </>
          )}
          <button type="button" className={styles.viewAllButton} onClick={() => navigate(viewAllPath)}>View All</button>
        </div>
      </div>
      <div ref={scrollerRef} className={`${styles.productGrid} ${compact ? styles.productGridCompact : ''}`}>
        {products.map((product) => <LuxuryProductCard key={getProductId(product)} product={product} navigate={navigate} large={!compact} />)}
      </div>
    </div>
  );
}

function LuxuryProductCard({ product, navigate, large }) {
  const [imageIndex, setImageIndex] = useState(0);
  const cart = useCart();
  const wishlist = useWishlist();
  const productId = getProductId(product);
  const productImages = getProductImages(product);
  const image = productImages[imageIndex] || getProductImage(product);
  const price = Number(product.sellingPrice ?? product.price ?? 0);
  const originalPrice = Number(product.originalPrice ?? price);
  const discount = Number(product.discountPercentage) || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
  const wishlisted = wishlist.items.some((item) => getProductId(item) === productId);

  const toggleWishlist = async (event) => {
    event.stopPropagation();
    await wishlist.toggleWishlist(product);
  };

  const addToCart = (event) => {
    event.stopPropagation();
    cart.addToCart(product);
  };

  const slideImage = (event, direction) => {
    event.stopPropagation();
    setImageIndex((current) => (current + direction + productImages.length) % productImages.length);
  };

  return (
    <article className={`${styles.productCard} ${large ? styles.productCardLarge : ''}`} onClick={() => navigate(`/product?id=${encodeURIComponent(productId)}`)}>
      <div className={styles.productImageWrap}>
        <img src={image} alt={product.name} />
        {(product.isNewArrival || product.isBestSeller) && <span className={styles.productBadge}>{product.isBestSeller ? 'Bestseller' : 'New'}</span>}
        <button type="button" className={styles.wishlistButton} onClick={toggleWishlist} aria-label="Toggle wishlist"><IconHeart fill={wishlisted ? '#7b1834' : 'none'} /></button>
        <button type="button" className={styles.cartButton} onClick={addToCart} aria-label="Add to cart"><IconShoppingBag /></button>
        {productImages.length > 1 && (
          <>
            <button type="button" className={`${styles.productImageArrow} ${styles.productImageArrowLeft}`} onClick={(event) => slideImage(event, -1)} aria-label="Previous product image"><IconChevronLeft /></button>
            <button type="button" className={`${styles.productImageArrow} ${styles.productImageArrowRight}`} onClick={(event) => slideImage(event, 1)} aria-label="Next product image"><IconChevronRight /></button>
            <div className={styles.productImageDots}>
              {productImages.slice(0, 6).map((productImage, index) => (
                <button
                  key={`${productImage}-${index}`}
                  type="button"
                  className={index === imageIndex ? styles.productImageDotActive : ''}
                  onClick={(event) => {
                    event.stopPropagation();
                    setImageIndex(index);
                  }}
                  aria-label={`Show product image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <h3>{product.name}</h3>
      <p className={styles.productCategory}>{formatCategory(product.category) || product.fabric || 'Samira Collection'}</p>
      <div className={styles.priceRow}>
        <strong>Rs. {formatPrice(price)}</strong>
        {originalPrice > price && <del>Rs. {formatPrice(originalPrice)}</del>}
        {discount > 0 && <span>{discount}% OFF</span>}
      </div>
      <div className={styles.ratingRow}>
        <span>{[0, 1, 2, 3, 4].map((star) => <IconStarFilled key={star} />)}</span>
        <small>({product.numReviews || product.rating || 0})</small>
      </div>
    </article>
  );
}

function SaleBanner({ banner, fallbackProduct, navigate }) {
  const image = banner?.image ? normalizeImageUrl(banner.image) : getProductImage(fallbackProduct);
  return (
    <section className={`${styles.luxuryContainer} ${styles.saleBanner}`}>
      <div className={styles.saleCopy}><span>Samira Festive Sale</span><h2>Flat 50% Off</h2><p>on selected styles</p></div>
      <button type="button" onClick={() => navigate(banner?.link || '/products?discount=20')}>Shop Sale</button>
      <div className={styles.saleVisual}>{image && <img src={image} alt={banner?.title || 'Festive sale'} />}</div>
    </section>
  );
}

function ServiceStrip() {
  return (
    <section className={`${styles.luxuryContainer} ${styles.serviceStrip}`}>
      {services.map(({ title, text, icon: IconComponent }) => (
        <div key={title} className={styles.serviceItem}>
          <span><IconComponent /></span>
          <div><strong>{title}</strong><small>{text}</small></div>
        </div>
      ))}
    </section>
  );
}

function TestimonialSection() {
  return (
    <section className={`${styles.luxuryContainer} ${styles.testimonialSection}`}>
      <div className={styles.testimonialIntro}>
        <span>Loved by 2500+ customers</span>
        <h2>Loved for Fit,<br />Fabric &amp; Finish</h2>
        <div className={styles.testimonialRating}>{[0, 1, 2, 3, 4].map((star) => <IconStarFilled key={star} />)} <strong>4.9/5</strong></div>
        <p>Trusted by women who value thoughtful design, comfort, and beautiful craftsmanship.</p>
      </div>
      <div className={styles.reviewGrid}>
        {reviews.map((review) => (
          <article key={review.name} className={styles.reviewCard}>
            <div>{[0, 1, 2, 3, 4].map((star) => <IconStarFilled key={star} />)}</div>
            <p>“{review.text}”</p>
            <strong>{review.name}</strong>
            <small>Verified Buyer</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setStatus('Please enter your email.');
      return;
    }
    setStatus('Thank you for subscribing.');
    setEmail('');
  };

  return (
    <section className={`${styles.luxuryContainer} ${styles.newsletterSection}`}>
      <div><span>Stay in style</span><h2>Join Samira Circle</h2><p>Get early access to new drops, offers, and styling updates.</p></div>
      <form onSubmit={submit}>
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status) setStatus('');
          }}
          placeholder="Enter your email address"
          aria-label="Email address"
        />
        <button type="submit">Subscribe</button>
        {status ? <small>{status}</small> : null}
      </form>
    </section>
  );
}

function uniqueProducts(products) {
  const seen = new Set();
  return products.filter((product) => {
    const id = getProductId(product);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function getProductId(product) {
  return String(product?._id || product?.id || product?.slug || '');
}

function getProductImage(product) {
  return normalizeImageUrl(getPrimaryImageUrl(product?.images));
}

function getProductImages(product) {
  const entries = normalizeImageEntries(product?.images || []);
  const primary = entries.find((image) => image.primary);
  const ordered = primary ? [primary, ...entries.filter((image) => image !== primary)] : entries;
  return ordered.map((image) => normalizeImageUrl(image.url)).filter(Boolean).slice(0, 6);
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function formatCategory(category) {
  return typeof category === 'string' ? category : category?.name || category?.title || '';
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString('en-IN');
}
