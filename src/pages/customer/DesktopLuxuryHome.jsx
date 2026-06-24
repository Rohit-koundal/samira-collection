import { useMemo, useRef, useState } from 'react';
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandPinterest,
  IconBrandYoutube,
  IconChevronLeft,
  IconChevronRight,
  IconCreditCard,
  IconHeart,
  IconPackage,
  IconRefresh,
  IconSearch,
  IconShieldCheck,
  IconShoppingBag,
  IconStarFilled,
  IconTruckDelivery,
  IconUser,
} from '@tabler/icons-react';
import logo from '../../assets/samira-collection-logo.png';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useGetSettingsQuery } from '../../store/apiSlice';
import { getPrimaryImageUrl, normalizeImageEntries, normalizeImageUrl } from '../../services/normalize';
import styles from './DesktopLuxuryHome.module.css';

const navigationLinks = [
  ['New Arrivals', '/products?newArrival=true'],
  ['Sarees', '/products?search=Saree'],
  ['Suits', '/products?search=Suit'],
  ['Kurtis', '/products?search=Kurti'],
  ['Lehengas', '/products?search=Lehenga'],
  ['Dresses', '/products?search=Dress'],
  ['Sale', '/products?discount=20'],
];

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
  const [searchTerm, setSearchTerm] = useState('');
  const cart = useCart();
  const wishlist = useWishlist();
  const { user, switchMode } = useAuth();
  const { data: settings = {} } = useGetSettingsQuery();

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

  const submitSearch = (event) => {
    event.preventDefault();
    const value = searchTerm.trim();
    navigate(value ? `/search?search=${encodeURIComponent(value)}` : '/search');
  };

  return (
    <div className={styles.desktopLuxuryHome}>
      <header>
        <div className={styles.announcementBar}>
          <p className={styles.announcementText}>FREE SHIPPING ON ORDERS ABOVE RS. 999 | FESTIVE COLLECTION LIVE NOW</p>
          <div className={styles.announcementLinks}>
            <button type="button" onClick={() => navigate('/orders')}>Track Order</button>
            <span>|</span>
            <button type="button" onClick={() => navigate('/contact')}>Help &amp; Support</button>
          </div>
        </div>

        <div className={styles.navbar}>
          <div className={styles.navbarInner}>
            <button type="button" className={styles.logoButton} onClick={() => navigate('/')} aria-label="Samira Collection home">
              <img src={logo} alt="Samira Collection" />
            </button>

            <nav className={styles.menu} aria-label="Main navigation">
              {navigationLinks.map(([label, path]) => (
                <button key={label} type="button" className={styles.menuLink} onClick={() => navigate(path)}>{label}</button>
              ))}
            </nav>

            <div className={styles.navActions}>
              <form className={styles.searchBox} onSubmit={submitSearch}>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search sarees, suits, kurtis..."
                  aria-label="Search products"
                />
                <button type="submit" aria-label="Submit search"><IconSearch size={17} /></button>
              </form>

              {user?.role === 'admin' && user?.availableModes?.includes('admin') && user?.activeMode !== 'admin' && (
                <button type="button" className={styles.adminButton} onClick={() => switchMode('admin')}>Admin Mode</button>
              )}

              <HeaderAction label="Account" onClick={() => navigate('/profile')} icon={IconUser} />
              <HeaderAction label="Wishlist" count={wishlist.items.length} onClick={() => navigate('/wishlist')} icon={IconHeart} />
              <HeaderAction label="Cart" count={cart.itemCount} onClick={() => navigate('/cart')} icon={IconShoppingBag} />
            </div>
          </div>
        </div>
      </header>

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
      <LuxuryFooter settings={settings} navigate={navigate} />
    </div>
  );
}

function HeaderAction({ label, count = 0, onClick, icon: IconComponent }) {
  return (
    <button type="button" className={styles.headerAction} onClick={onClick} aria-label={label}>
      <span className={styles.headerIconWrap}>
        <IconComponent size={21} stroke={1.7} />
        {count > 0 && <span className={styles.headerBadge}>{count > 99 ? '99+' : count}</span>}
      </span>
      <span className={styles.iconLabel}>{label}</span>
    </button>
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
  return (
    <section className={`${styles.luxuryContainer} ${styles.newsletterSection}`}>
      <div><span>Stay in style</span><h2>Join Samira Circle</h2><p>Get early access to new drops, offers, and styling updates.</p></div>
      <form onSubmit={(event) => event.preventDefault()}>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address" aria-label="Email address" />
        <button type="submit">Subscribe</button>
      </form>
    </section>
  );
}

function LuxuryFooter({ settings, navigate }) {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.luxuryContainer} ${styles.footerGrid}`}>
        <div className={styles.footerBrand}>
          <img src={logo} alt="Samira Collection" />
          <p>{settings.footerText || 'Premium ethnic fashion designed for celebrations, everyday elegance, and the moments that become memories.'}</p>
          <div className={styles.socialLinks}><IconBrandFacebook /><IconBrandInstagram /><IconBrandPinterest /><IconBrandYoutube /></div>
        </div>
        <FooterColumn title="Shop" items={navigationLinks.slice(0, 6)} navigate={navigate} />
        <FooterColumn title="Help & Support" items={[["Track Your Order", '/orders'], ["Returns & Refunds", '/return-policy'], ["Shipping Policy", '/contact'], ["Size Guide", '/contact'], ["Contact Us", '/contact']]} navigate={navigate} />
        <FooterColumn title="Company" items={[["About Us", '/contact'], ["Our Story", '/contact'], ["Privacy Policy", '/privacy-policy'], ["Terms & Conditions", '/terms'], ["Careers", '/contact']]} navigate={navigate} />
        <div className={styles.footerContact}>
          <h3>Contact</h3>
          <p>{settings.contactEmail || 'hello@samiracollection.com'}</p>
          <p>{settings.contactPhone || '+91 98765 43210'}</p>
          <div className={styles.paymentBadges}><span>VISA</span><span>MC</span><span>UPI</span><span>Paytm</span></div>
          <div className={styles.appButtons}><button type="button">Google Play</button><button type="button">App Store</button></div>
        </div>
      </div>
      <div className={`${styles.luxuryContainer} ${styles.footerBottom}`}><span>© 2025 Samira Stylists. All Rights Reserved.</span><span>Made with love in India.</span></div>
    </footer>
  );
}

function FooterColumn({ title, items, navigate }) {
  return <div className={styles.footerColumn}><h3>{title}</h3>{items.map(([label, path]) => <button key={label} type="button" onClick={() => navigate(path)}>{label}</button>)}</div>;
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
