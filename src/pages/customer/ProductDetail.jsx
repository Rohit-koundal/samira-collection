import { useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import SizeChartModal from '../../components/product/SizeChartModal';
import { ProductVisual } from '../../components/product/ProductCard';
import Icon from '../../components/layout/Icon';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getPrimaryImageIndex, getPrimaryImageUrl, normalizeImageUrl, normalizeProduct, normalizeProducts } from '../../services/normalize';
import { useGetProductQuery, useGetProductsQuery, useGetReviewsQuery } from '../../store/apiSlice';

export default function ProductDetail({ navigate, route = '' }) {
  const productKey = new URLSearchParams(route.split('?')[1] || '').get('id');
  const cart = useCart();
  const wishlist = useWishlist();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [openGallery, setOpenGallery] = useState(false);
  const [openSizeChart, setOpenSizeChart] = useState(false);
  const [deliveryPin, setDeliveryPin] = useState('');
  const [touchStartX, setTouchStartX] = useState(0);
  const { data: productData, isLoading, error } = useGetProductQuery(productKey || skipToken);
  const product = productData ? normalizeProduct(productData) : null;
  const productId = product?._id || product?.id || product?.slug;
  const relatedQuery = product?.categoryId ? { category: product.categoryId } : { sort: 'rating' };
  const { data: relatedData = [] } = useGetProductsQuery(product ? relatedQuery : skipToken);
  const { data: reviewsData = [] } = useGetReviewsQuery(productId || skipToken);
  const related = normalizeProducts(relatedData)
    .filter((entry) => (entry._id || entry.id || entry.slug) !== productId)
    .slice(0, 10);
  const reviews = Array.isArray(reviewsData) ? reviewsData : [];

  useEffect(() => {
    if (!productData) return;
    const item = normalizeProduct(productData);
    setSize(item.sizes?.[0] || 'Free Size');
    setColor(item.colors?.[0] || 'Wine');
    setActiveImage(getPrimaryImageIndex(item.images));
    setOpenGallery(false);
  }, [productData]);

  const isWishlisted = useMemo(
    () => Boolean(productId) && wishlist.items.some((item) => (item._id || item.id || item.slug) === productId),
    [wishlist.items, productId],
  );
  const images = product?.images?.length ? product.images.map((image) => normalizeImageUrl(image.url)) : [];
  const selectedImage = images[activeImage];
  const discountPrice = Math.max(0, Number(product?.originalPrice || 0) - Number(product?.price || 0));
  const dealPrice = Math.max(0, Number(product?.price || 0) - Math.round(discountPrice * 0.2));

  const cartItem = product ? cart.getCartItem(product, { size, color }) : null;
  const similarPath = product?.categoryId
    ? `/products?category=${product.categoryId}`
    : product?.category
      ? `/products?search=${encodeURIComponent(product.category)}`
      : '/products';

  if (!productKey || error) {
    return <section className="container-page py-10"><div className="rounded-2xl bg-white p-8 text-center font-bold text-rose">Product not found.</div></section>;
  }

  if (isLoading || !product) {
    return <section className="container-page py-10"><div className="rounded-2xl bg-white p-8 text-center font-bold">Loading product...</div></section>;
  }

  const add = () => {
    cart.addToCart(product, size, color);
  };

  const buyNow = () => {
    add();
    navigate('/checkout');
  };

  const goToImage = (index) => {
    if (!images.length) return;
    const total = images.length;
    setActiveImage((index + total) % total);
  };

  const handleTouchStart = (event) => {
    setTouchStartX(event.changedTouches[0]?.clientX || 0);
  };

  const handleTouchEnd = (event) => {
    const endX = event.changedTouches[0]?.clientX || 0;
    const deltaX = endX - touchStartX;
    if (Math.abs(deltaX) < 40) return;
    goToImage(activeImage + (deltaX < 0 ? 1 : -1));
  };

  return (
    <section className="bg-white pb-36 md:bg-ivory md:pb-10 md:pt-8">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => navigate('/products')} className="grid h-10 w-8 place-items-center text-2xl" aria-label="Back">&lt;</button>
          <span className="header-title truncate text-[15px]">{product.brand || 'Samira Collection'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-800">
          <button type="button" onClick={() => navigate('/search')} className="grid h-10 w-10 place-items-center" aria-label="Search"><Icon name="search" className="h-6 w-6" /></button>
          <button type="button" onClick={() => wishlist.toggleWishlist(product)} className={`grid h-10 w-10 place-items-center ${isWishlisted ? 'text-rose' : ''}`} aria-label="Wishlist"><Icon name="heart" className="h-6 w-6" /></button>
          <button type="button" onClick={() => navigate('/cart')} className="grid h-10 w-10 place-items-center" aria-label="Cart"><Icon name="bag" className="h-6 w-6" /></button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl md:grid md:grid-cols-[0.95fr_1fr] md:gap-8 md:px-6">
        <div className="md:sticky md:top-24 md:self-start">
          <div
            className="relative overflow-hidden bg-[#f6efe8] md:rounded-2xl"
            onTouchStart={images.length > 1 ? handleTouchStart : undefined}
            onTouchEnd={images.length > 1 ? handleTouchEnd : undefined}
          >
            {selectedImage ? (
              <button type="button" onClick={() => setOpenGallery(true)} className="block w-full bg-[#f6efe8]">
                <img src={selectedImage} alt={product.name} className="h-[340px] w-full object-contain bg-[#f6efe8] sm:h-[430px] md:h-[620px] md:object-cover" />
              </button>
            ) : (
              <ProductVisual product={product} showMeta={false} />
            )}
            <button
              type="button"
              onClick={() => navigate(similarPath)}
              className="absolute bottom-4 left-4 min-w-[106px] rounded-xl bg-white px-3 py-2 text-center text-xs font-black shadow"
            >
              View Similar
            </button>
            <div className="absolute bottom-4 right-4 min-w-[106px] rounded-xl bg-white px-3 py-2 text-center text-xs font-black shadow">
              {Number(product.rating || 0).toFixed(1)} star <span className="mx-2 text-slate-300">|</span> {product.numReviews || reviews.length || 0}
            </div>
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex justify-center gap-2">
              {images.slice(0, 8).map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => goToImage(index)}
                  className={`h-2 w-2 rounded-full ${activeImage === index ? 'bg-slate-700' : 'bg-slate-300'}`}
                  aria-label={`Show image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5 px-3 pt-4 md:space-y-7 md:px-0 md:pt-0">
          <div className="relative pr-16">
            <p className="small-text font-bold uppercase tracking-[0.08em] text-slate-500 md:text-base md:tracking-[0.12em]">{product.brand || 'Samira Collection'}</p>
            <h1 className="product-name mt-1 text-slate-900 md:text-[22px]">
              {product.name}
            </h1>
            <button
              type="button"
              onClick={() => wishlist.toggleWishlist(product)}
              className={`absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-xl border transition ${isWishlisted ? 'border-rose bg-rose/10 text-rose' : 'border-slate-200 text-slate-700'}`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isWishlisted}
            >
              <Icon name="heart" className="h-5 w-5" />
            </button>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="old-price text-slate-400 line-through">MRP Rs. {product.originalPrice}</span>
              <span className="price text-charcoal md:text-2xl">Rs. {product.price}</span>
              <span className="discount font-bold text-amber-600">({product.discountPercentage}% OFF)</span>
            </div>
            <p className="small-text mt-1 font-bold text-amber-600">Crazy Deal</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-[#f8f5ff] p-4 md:rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="small-text font-bold uppercase text-rose">Mega Deal</p>
                <p className="section-title mt-1 text-xl md:text-xl">Get at Rs. {dealPrice || product.price}</p>
              </div>
              <span className="badge-text rounded-xl bg-emerald-500 px-3 py-2 font-bold text-white md:text-sm">Extra Rs. {Math.max(0, product.price - dealPrice)} Off</span>
            </div>
            <div className="small-text mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
              <span>With Coupon + Bank Offer</span>
              <button type="button" className="text-rose">Details</button>
            </div>
          </div>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="label-text md:text-xl">Size: {size || 'Free Size'}</h2>
              <button type="button" onClick={() => setOpenSizeChart(true)} className="label-text text-rose">Size Chart</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-3">
              {(product.sizes?.length ? product.sizes : ['Free Size']).map((item) => (
                <button key={item} type="button" onClick={() => setSize(item)} className={`label-text min-w-10 rounded-xl border px-2 py-1 md:min-w-24 md:rounded-2xl md:px-5 md:py-4 ${size === item ? 'border-charcoal bg-charcoal text-white' : 'border-slate-200 bg-white'}`}>{item}</button>
              ))}
            </div>
            {product.colors?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((item) => (
                  <button key={item} type="button" onClick={() => setColor(item)} className={`label-text rounded-xl border px-4 py-2 ${color === item ? 'border-wine bg-wine text-white' : 'border-slate-200'}`}>{item}</button>
                ))}
              </div>
            )}
            <p className="body-text mt-2">
              <span className="old-price text-slate-400 line-through">Rs. {product.originalPrice}</span>{' '}
              <span className="price">Rs. {product.price}</span>{' '}
              <span className="discount font-bold text-amber-600">({product.discountPercentage}% OFF)</span>
            </p>
            <p className="small-text mt-2">Seller: <span className="font-bold text-rose">Samira Collection</span></p>
          </section>

          <div className="hidden gap-3 md:flex">
            <button disabled={product.stock <= 0} onClick={add} className={`h-14 flex-1 rounded-xl px-5 py-4 text-sm font-black text-white disabled:opacity-50 ${cartItem ? 'bg-emerald-600' : 'bg-rose'}`}>
              {cartItem ? 'Add More' : 'Add to Cart'}
            </button>
            <button disabled={product.stock <= 0} onClick={buyNow} className="h-14 flex-1 rounded-xl bg-charcoal px-5 py-4 text-sm font-black text-white disabled:opacity-50">Buy Now</button>
          </div>

          <section className="space-y-2 border-t border-slate-100 pt-2">
            <h2 className="section-title text-xl md:text-xl">Check Delivery</h2>
            <input value={deliveryPin} onChange={(event) => setDeliveryPin(event.target.value.replace(/\D/g, '').slice(0, 6))} className="body-text h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-rose" placeholder="Enter PIN Code" />
            <div className="body-text space-y-3">
              <Feature icon="box" title="Express delivery" text="might be available" />
              <Feature icon="bag" title="Pay on delivery" text="might be available" />
              <Feature icon="heart" title="Hassle free returns" text={product.returnPolicy || '7, 15 and 30 days return & exchange might be available'} />
            </div>
          </section>

          <DetailsCard product={product} />

          <section className="grid grid-cols-2 gap-2 text-center">
            <TrustBadge title="Genuine Product" />
            <TrustBadge title="Quality Checked" />
          </section>

          <section>
            <h2 className="section-title text-xl">Easy returns and exchanges</h2>
            <p className="body-text text-slate-600">{product.returnPolicy || 'Choose to return or exchange for a different size, if available, within the allowed return window.'}</p>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mx-auto mt-4 max-w-6xl space-y-9 px-4 md:px-6">
          <ProductRail title="Fastest Selling Similar Products" subtitle="Don't miss out on these in-demand products" products={related.slice(0, 6)} navigate={navigate} />
          <ProductRail title="Similar Products" products={related.slice(2, 8)} navigate={navigate} />
          <ProductRail title="Customers Also Liked" products={related.slice(4, 10)} navigate={navigate} />
        </div>
      )}

      <ReviewsSection product={product} reviews={reviews} />

      <div className="mx-auto mt-9 max-w-6xl px-4 md:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 md:rounded-3xl md:p-5">
          {[
            `More ${product.category} by ${product.brand || 'Samira Collection'}`,
            `More ${product.colors?.[0] || ''} ${product.category}`,
            `More ${product.category}`,
          ].map((label) => (
            <button key={label} type="button" onClick={() => navigate(`/products?category=${product.categoryId || ''}`)} className="flex w-full items-center justify-between gap-3 border-b border-slate-100 py-4 text-left text-base font-black last:border-b-0 md:text-lg">
              {label.trim()}
              <span className="text-rose">&gt;</span>
            </button>
          ))}
        </div>
        <p className="small-text mt-8 text-slate-500">Product Code: {product.sku || productId}</p>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-40 bg-white p-2 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] md:hidden">
        <button disabled={product.stock <= 0} onClick={add} className={`h-10 w-full rounded-xl px-3 py-2 text-base font-black text-white disabled:opacity-50 ${cartItem ? 'bg-emerald-600' : 'bg-rose'}`}>
          {product.stock <= 0 ? 'Out of Stock' : cartItem ? 'Add More' : 'Add to Cart'}
        </button>
      </div>

      <SizeChartModal open={openSizeChart} onClose={() => setOpenSizeChart(false)} />
      {openGallery && images.length > 0 && (
        <div className="fixed inset-0 z-[90] bg-black md:bg-black/95" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-4 pb-3 pt-6 text-white">
              <button type="button" onClick={() => setOpenGallery(false)} className="grid h-10 w-10 place-items-center text-3xl leading-none" aria-label="Close gallery">
                &times;
              </button>
              <p className="text-sm font-black">{activeImage + 1} / {images.length}</p>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center px-3">
              <img src={images[activeImage]} alt={`${product.name} ${activeImage + 1}`} className="max-h-full w-full object-contain" />
            </div>
            {images.length > 1 && (
              <div className="pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
                <div className="hide-scrollbar flex gap-3 overflow-x-auto px-4">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => goToImage(index)}
                      className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 ${activeImage === index ? 'border-rose' : 'border-white/20'}`}
                    >
                      <img src={image} alt={`${product.name} thumbnail ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function DetailsCard({ product }) {
  const highlights = product.highlights?.length ? product.highlights : [
    product.shortDescription || product.description,
    product.fabric ? `${product.fabric} fabric` : '',
    product.occasion ? `Best for ${product.occasion}` : '',
  ].filter(Boolean);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 md:rounded-3xl md:p-5">
      <div className="grid grid-cols-2 gap-5">
        <Spec label="Category" value={product.category} />
        <Spec label="Fabric" value={product.fabric || 'Premium fabric'} />
        <Spec label="Occasion" value={product.occasion || 'Everyday festive'} />
        <Spec label="Pattern" value={product.tags?.[0] || 'Designer'} />
      </div>
      <div className="mt-7 space-y-4">
        <h2 className="section-title text-xl">Product Details</h2>
        {highlights.length > 0 && (
          <div>
            <p className="label-text">Design Details</p>
            <ul className="body-text mt-2 list-disc space-y-1 pl-6 text-slate-700">
              {highlights.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        )}
        <div>
          <p className="label-text">Size & Fit</p>
          <p className="body-text mt-2 text-slate-700">Available sizes: {(product.sizes?.length ? product.sizes : ['Free Size']).join(', ')}</p>
        </div>
        <div>
          <p className="label-text">Material & Care</p>
          <p className="body-text mt-2 text-slate-700">{product.careInstructions || `Fabric: ${product.fabric || 'Premium fabric'}. Dry clean recommended.`}</p>
        </div>
      </div>
    </section>
  );
}

function Spec({ label, value }) {
  return <div><p className="label-text text-charcoal">{label}</p><p className="body-text mt-1 text-slate-600">{value || '-'}</p></div>;
}

function Feature({ icon, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <Icon name={icon} className="mt-0.5 h-6 w-6 text-charcoal" />
      <p><span className="font-black">{title}</span> <span className="text-slate-600">{text}</span></p>
    </div>
  );
}

function TrustBadge({ title }) {
  return (
    <div className="rounded-2xl bg-rose/5 p-4">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-rose text-rose">
        <Icon name="star" />
      </div>
      <p className="label-text mt-2 text-rose">{title}</p>
    </div>
  );
}

function ProductRail({ title, subtitle, products, navigate }) {
  if (!products.length) return null;
  return (
    <section>
      <h2 className="section-title text-xl md:text-xl">{title}</h2>
      {subtitle && <p className="small-text mt-1 font-bold text-amber-600">{subtitle}</p>}
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {products.map((product) => <RailProduct key={product.id} product={product} navigate={navigate} />)}
      </div>
    </section>
  );
}

function RailProduct({ product, navigate }) {
  const cart = useCart();
  const image = getPrimaryImageUrl(product.images);
  const cartItem = cart.getCartItem(product);
  return (
    <article className="w-40 shrink-0 md:w-52">
      <button type="button" onClick={() => navigate(`/product?id=${product._id || product.id || product.slug}`)} className="block w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#f6efe8]">
        {image ? <img src={normalizeImageUrl(image)} alt={product.name} className="h-48 w-full object-cover md:h-64" /> : <ProductVisual product={product} compact />}
      </button>
      <h3 className="product-brand mt-2 truncate">{product.brand || 'Samira Collection'}</h3>
      <p className="product-name truncate text-slate-500">{product.name}</p>
      <p className="mt-1"><span className="old-price text-slate-400 line-through">Rs. {product.originalPrice}</span> <span className="price">Rs. {product.price}</span></p>
      <button type="button" onClick={() => cart.addToCart(product)} className={`mt-3 h-10 w-full rounded-xl border ${cartItem ? 'border-emerald-600 text-emerald-700' : 'border-rose text-rose'}`}>
        {cartItem ? 'Add More' : 'Add to Cart'}
      </button>
    </article>
  );
}

function ReviewsSection({ product, reviews }) {
  return (
    <section className="mx-auto mt-4 max-w-2xl px-4 md:px-6">
      <h2 className="section-title text-xl md:text-xl">Ratings & Reviews</h2>
      <div className="mt-2 flex items-center gap-3">
        <span className="rating-text rounded-xl bg-amber-400 px-4 py-3 font-bold text-white">{Number(product.rating || 0).toFixed(1)} star</span>
        <span className="small-text rounded-xl bg-slate-100 px-4 py-3 text-slate-600">{product.numReviews || reviews.length || 0} ratings</span>
      </div>
      {reviews.length > 0 && (
        <>
          <div className="mt-5 flex items-center justify-between">
            <h3 className="section-title text-xl">Customer Reviews ({reviews.length})</h3>
            <button type="button" className="label-text underline">View All</button>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {reviews.slice(0, 6).map((review) => (
              <article key={review._id} className="w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="small-text flex items-center gap-3">
                  <span className="rounded-lg bg-rose px-2 py-1 font-bold text-white">{review.rating} star</span>
                  <span className="text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="body-text mt-4 text-slate-700">{review.comment}</p>
                <p className="label-text mt-4 text-emerald-700">{review.user?.name || 'Verified customer'}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
