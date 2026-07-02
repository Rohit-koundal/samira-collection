import { useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { ChevronRight } from 'lucide-react';
import SizeChartModal from '../../components/product/SizeChartModal';
import { ProductVisual } from '../../components/product/ProductCard';
import ProductDetailPage from '../../components/product/ProductDetailPage';
import Icon from '../../components/layout/Icon';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getPrimaryImageIndex, getPrimaryImageUrl, normalizeImageUrl, normalizeProduct, normalizeProducts } from '../../services/normalize';
import { useGetProductQuery, useGetProductsQuery, useGetReviewsQuery, useGetSettingsQuery, useGetVariantGroupQuery } from '../../store/apiSlice';

export default function ProductDetail({ navigate, route = '' }) {
  const productKey = new URLSearchParams(route.split('?')[1] || '').get('id');
  const cart = useCart();
  const wishlist = useWishlist();
  const { user } = useAuth();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [openGallery, setOpenGallery] = useState(false);
  const [openSizeChart, setOpenSizeChart] = useState(false);
  const [deliveryPin, setDeliveryPin] = useState('');
  const [touchStartX, setTouchStartX] = useState(0);
  const [actionMessage, setActionMessage] = useState('');
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const { data: productData, isLoading, error } = useGetProductQuery(productKey || skipToken);
  const { data: settingsData } = useGetSettingsQuery();
  const product = productData ? normalizeProduct(productData) : null;
  const productId = product?._id || product?.id || product?.slug;
  const relatedQuery = product?.categoryId ? { category: product.categoryId } : { sort: 'rating' };
  const { data: relatedData = [] } = useGetProductsQuery(product ? relatedQuery : skipToken);
  const { data: fallbackRelatedData = [] } = useGetProductsQuery(product ? { sort: 'rating' } : skipToken);
  const { data: reviewsData = [] } = useGetReviewsQuery(productId || skipToken);
  const { data: variantGroupData } = useGetVariantGroupQuery(product?.variantGroupId || skipToken);
  const variantProducts = useMemo(
    () => (Array.isArray(variantGroupData?.data?.products) ? variantGroupData.data.products : []),
    [variantGroupData?.data?.products],
  );
  const related = useMemo(() => {
    const byId = new Map();
    const pushProduct = (entry) => {
      if (!entry) return;
      const normalized = normalizeProduct(entry);
      const key = normalized._id || normalized.id || normalized.slug;
      if (!key || key === productId || byId.has(key)) return;
      byId.set(key, normalized);
    };

    [...normalizeProducts(relatedData), ...normalizeProducts(fallbackRelatedData), ...normalizeProducts(variantProducts)].forEach(pushProduct);
    return Array.from(byId.values()).slice(0, 12);
  }, [fallbackRelatedData, productId, relatedData, variantProducts]);
  const reviews = Array.isArray(reviewsData) ? reviewsData : [];
  const storeWhatsappNumber = formatWhatsappNumber(settingsData?.whatsappNumber || '');

  useEffect(() => {
    if (!productData) return;
    const item = normalizeProduct(productData);
    setSize(item.sizes?.[0] || 'Free Size');
    setColor(item.colors?.[0] || 'Wine');
    setActiveImage(Math.max(0, getPrimaryImageIndex(item.images)));
    setOpenGallery(false);
    setActionMessage('');
    setQuantity(1);
  }, [productData]);

  const isWishlisted = useMemo(
    () => Boolean(productId) && wishlist.items.some((item) => (item._id || item.id || item.slug) === productId),
    [wishlist.items, productId],
  );
  const mediaItems = useMemo(() => {
    const imageItems = product?.images?.length
      ? product.images.map((image) => ({ type: 'image', url: normalizeImageUrl(image.url), thumbnail: normalizeImageUrl(image.url) }))
      : [];
    const videoItems = product?.videos?.length
      ? product.videos.map((video) => ({ type: 'video', url: normalizeImageUrl(video.url), thumbnail: normalizeImageUrl(video.thumbnail || video.url) }))
      : [];
    return [...imageItems, ...videoItems].filter((item) => item.url);
  }, [product?.images, product?.videos]);
  const selectedMedia = mediaItems[activeImage];
  const discountPrice = Math.max(0, Number(product?.originalPrice || 0) - Number(product?.price || 0));
  const dealPrice = Math.max(0, Number(product?.price || 0) - Math.round(discountPrice * 0.2));
  const isOutOfStock = hasExplicitStock(product) && Number(product.stock) <= 0;

  const cartItem = product ? cart.getCartItem(product, { size, color }) : null;
  const similarPath = product?.categoryId
    ? `/products?category=${product.categoryId}`
    : product?.category
      ? `/products?search=${encodeURIComponent(product.category)}`
      : '/products';
  const handleCheckDelivery = () => {
    if (!deliveryPin || deliveryPin.length < 6) {
      setActionMessage('Please enter a valid 6-digit PIN code.');
      return;
    }
    setActionMessage(`Delivery check requested for ${deliveryPin}.`);
  };

  if (!productKey || error) {
    return <section className="container-page py-10"><div className="rounded-2xl bg-white p-8 text-center font-bold text-rose">Product not found.</div></section>;
  }

  if (isLoading || !product) {
    return null;
  }

  const add = () => {
    if (product?.sizes?.length && !size) {
      setActionMessage('Please select a size first.');
      return { ok: false, reason: 'missing-size' };
    }
    if (product?.colors?.length && !color) {
      setActionMessage('Please select a color first.');
      return { ok: false, reason: 'missing-color' };
    }
    if (!Number(quantity) || Number(quantity) < 1) {
      setActionMessage('Please choose a valid quantity.');
      return { ok: false, reason: 'invalid-quantity' };
    }
    const result = cart.addToCart(product, size, color, product.variantId || product.selectedVariantId || '', quantity);
    if (result?.ok) {
      setActionMessage(`${quantity} item${Number(quantity) === 1 ? '' : 's'} added to cart.`);
    } else if (result?.reason === 'out-of-stock') {
      setActionMessage('This product is out of stock.');
    } else if (result?.reason === 'stock-limit') {
      setActionMessage(`Only ${result.quantity || 0} item${Number(result.quantity) === 1 ? '' : 's'} already available in your cart.`);
    } else {
      setActionMessage('Unable to add this product right now.');
    }
    return result;
  };

  const handleWishlist = async () => {
    if (!product || wishlist.loading || wishlistBusy) return;
    setWishlistBusy(true);
    try {
      await wishlist.toggleWishlist(product);
    } finally {
      setWishlistBusy(false);
    }
  };

  const buyNow = () => {
    const result = add();
    if (result?.ok) navigate('/checkout');
  };

  const orderOnWhatsApp = () => {
    if (!storeWhatsappNumber) {
      setActionMessage('Store WhatsApp number is not configured.');
      return;
    }
    if (product?.sizes?.length && !size) {
      setActionMessage('Please select a size first.');
      return;
    }
    if (product?.colors?.length && !color) {
      setActionMessage('Please select a color first.');
      return;
    }
    if (!Number(quantity) || Number(quantity) < 1) {
      setActionMessage('Please choose a valid quantity.');
      return;
    }

    const currentUrl = window.location.href;
    const lines = [
      'Hello Samira Collection,',
      'I want to order this product:',
      '',
      `Product: ${product.name}`,
      `Size: ${size || 'N/A'}`,
      `Color: ${color || 'N/A'}`,
      `Quantity: ${quantity}`,
      `Price: ₹${product.price}`,
      `Link: ${currentUrl}`,
    ];
    if (user?.name) lines.push(`Customer Name: ${user.name}`);
    if (user?.phone) lines.push(`Customer Phone: ${user.phone}`);
    const message = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/91${storeWhatsappNumber}?text=${message}`, '_blank', 'noopener,noreferrer');
    setActionMessage('');
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} at Samaira Collection`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setActionMessage('Product link copied.');
      } else {
        setActionMessage('Sharing is not available in this browser.');
      }
    } catch {
      setActionMessage('Unable to share right now.');
    }
  };

  const goToImage = (index) => {
    if (!mediaItems.length) return;
    const total = mediaItems.length;
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
    <>
      <div className="hidden lg:block">
        <ProductDetailPage
          product={product}
          navigate={navigate}
          route={route}
          mediaItems={mediaItems}
          activeMediaIndex={activeImage}
          onSelectMedia={setActiveImage}
          onPrevMedia={() => goToImage(activeImage - 1)}
          onNextMedia={() => goToImage(activeImage + 1)}
          onOpenFullscreen={() => setOpenGallery(true)}
          onToggleWishlist={handleWishlist}
          isWishlisted={isWishlisted}
          wishlistBusy={wishlistBusy}
          size={size}
          setSize={setSize}
          color={color}
          setColor={setColor}
          quantity={quantity}
          setQuantity={setQuantity}
          deliveryPin={deliveryPin}
          setDeliveryPin={setDeliveryPin}
          actionMessage={actionMessage}
          dealPrice={dealPrice}
          cartItem={cartItem}
          isOutOfStock={isOutOfStock}
          onAddToCart={add}
          onBuyNow={buyNow}
          onOrderWhatsApp={orderOnWhatsApp}
          onCheckDelivery={handleCheckDelivery}
          relatedProducts={related}
          reviews={reviews}
          variantProducts={variantProducts}
          selectedMedia={selectedMedia}
          storeWhatsappNumber={storeWhatsappNumber}
          onOpenSizeGuide={() => setOpenSizeChart(true)}
          onViewOffers={() => navigate('/products?discount=20')}
          onSelectVariant={(variant) => {
            const variantId = variant?._id || variant?.id || variant?.slug;
            if (variantId) navigate(`/product?id=${variantId}`);
          }}
          onShare={handleShare}
          onWriteReview={() => navigate(user ? '/orders' : '/login')}
        />
      </div>
      <div className="lg:hidden">
        <section className="bg-[#f5f5f6] pb-36 md:bg-ivory md:pb-10 md:pt-8">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={() => navigate('/products')} className="grid h-9 w-8 place-items-center text-[22px] text-slate-700" aria-label="Back">&lt;</button>
          <span className="truncate text-[12px] font-medium text-[#1f2a44]">{product.brand || 'Samira Collection'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-800">
          <button type="button" onClick={() => navigate('/search')} className="grid h-9 w-9 place-items-center" aria-label="Search"><Icon name="search" className="h-5 w-5" /></button>
          <button type="button" onClick={handleWishlist} disabled={wishlist.loading || wishlistBusy} className={`grid h-9 w-9 place-items-center disabled:opacity-60 ${isWishlisted ? 'text-rose' : ''}`} aria-label="Wishlist"><Icon name="heart" className="h-5 w-5" /></button>
          <button type="button" onClick={() => navigate('/cart')} className="grid h-9 w-9 place-items-center" aria-label="Cart"><Icon name="bag" className="h-5 w-5" /></button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl md:grid md:grid-cols-[0.95fr_1fr] md:gap-8 md:px-6">
        <div className="md:sticky md:top-24 md:self-start">
          <div
            className="relative overflow-hidden bg-[#f6efe8] md:rounded-2xl"
            onTouchStart={mediaItems.length > 1 ? handleTouchStart : undefined}
            onTouchEnd={mediaItems.length > 1 ? handleTouchEnd : undefined}
          >
            {selectedMedia ? (
              <button type="button" onClick={() => setOpenGallery(true)} className="block w-full bg-[#f6efe8]">
                {selectedMedia.type === 'video' ? (
                  <video
                    src={selectedMedia.url}
                    poster={selectedMedia.thumbnail}
                    controls
                    playsInline
                    className="h-[360px] w-full bg-black object-cover sm:h-[430px] md:h-[620px]"
                  />
                ) : (
                  <img src={selectedMedia.url} alt={product.name} className="h-[360px] w-full object-contain bg-[#f6efe8] sm:h-[430px] md:h-[620px] md:object-cover" />
                )}
              </button>
            ) : (
              <ProductVisual product={product} showMeta={false} />
            )}
            <button
              type="button"
              onClick={() => navigate(similarPath)}
              className="absolute bottom-3 left-3 hidden min-w-[106px] rounded-xl bg-white px-3 py-2 text-center text-xs font-black shadow md:block"
            >
              View Similar
            </button>
            <div className="absolute bottom-3 right-3 min-w-[108px] rounded-xl bg-white px-3 py-2 text-center text-[11px] font-black shadow md:bottom-4 md:right-4 md:min-w-[106px] md:text-xs">
              {Number(product.rating || 0).toFixed(1)} star <span className="mx-2 text-slate-300">|</span> {product.numReviews || reviews.length || 0}
            </div>
          </div>
          {mediaItems.length > 1 && (
            <div className="mt-3 flex justify-center gap-2.5">
              {mediaItems.slice(0, 8).map((item, index) => (
                <button
                  key={`${item.type}-${item.url}`}
                  type="button"
                  onClick={() => goToImage(index)}
                  className={`rounded-full ${activeImage === index ? 'h-2.5 w-2.5 bg-slate-700' : 'h-2.5 w-2.5 bg-slate-300'}`}
                  aria-label={`Show media ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 px-3 pt-3 md:space-y-7 md:px-0 md:pt-0">
          <div className="rounded-[14px] bg-white px-4 py-3.5 md:rounded-none md:bg-transparent md:px-0 md:py-0">
            <div className="relative pr-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 md:text-base md:tracking-[0.12em]">{product.brand || 'Samira Collection'}</p>
            <h1 className="mt-1.5 text-[16px] font-semibold leading-[1.35] text-slate-900 md:text-[22px]">
              {product.name}
            </h1>
            <button
              type="button"
              onClick={handleWishlist}
              disabled={wishlist.loading || wishlistBusy}
              className={`absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-full border transition disabled:opacity-60 md:h-8 md:w-8 md:rounded-xl ${isWishlisted ? 'border-rose bg-rose/10 text-rose' : 'border-slate-200 text-slate-700'}`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isWishlisted}
            >
              <Icon name="heart" className="h-4.5 w-4.5 md:h-5 md:w-5" />
            </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[18px] font-bold text-charcoal md:text-2xl">Rs. {product.price}</span>
              <span className="text-[12px] text-slate-400 line-through">Rs. {product.originalPrice}</span>
              <span className="text-[12px] font-bold text-rose">({product.discountPercentage}% OFF)</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="rounded-full bg-[#fff0f4] px-2.5 py-1 text-[10px] font-bold text-rose">{Number(product.rating || 0).toFixed(1)}</span>
              <span className="text-[10px] font-medium text-slate-500">{product.numReviews || reviews.length || 0} Ratings</span>
            </div>
          </div>

          <div className="rounded-[14px] bg-white p-4 md:rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-rose">Mega Deal</p>
                <p className="mt-1 text-[18px] font-bold text-charcoal md:text-xl">Get at Rs. {dealPrice || product.price}</p>
                <p className="mt-1 text-[10px] text-slate-500">With Coupon + Bank Offer</p>
              </div>
              <span className="rounded-full bg-emerald-500 px-3 py-1.5 text-[10px] font-bold text-white md:text-sm">Extra Rs. {Math.max(0, product.price - dealPrice)} Off</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
              <span className="text-slate-500">Bank offers &amp; extra savings</span>
              <button type="button" className="font-semibold text-rose">Details</button>
            </div>
          </div>

          <section className="rounded-[14px] bg-white p-4 md:rounded-none md:bg-transparent md:p-0">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-charcoal md:text-xl">Size</h2>
              <button type="button" onClick={() => setOpenSizeChart(true)} className="text-[11px] font-semibold text-rose">Size Chart</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(product.sizes?.length ? product.sizes : ['Free Size']).map((item) => (
                <button key={item} type="button" onClick={() => setSize(item)} className={`grid h-9 min-w-9 place-items-center rounded-full border px-3 text-[11px] font-semibold md:min-w-24 md:rounded-2xl md:px-5 md:py-4 ${size === item ? 'border-[#7a1f36] bg-[#7a1f36] text-white' : 'border-slate-200 bg-white text-charcoal'}`}>{item}</button>
              ))}
            </div>
            {product.colors?.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-semibold text-charcoal">Color: {color}</span>
                {product.colors.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setColor(item)}
                    className={`h-6 w-6 rounded-full ring-1 ring-offset-1 ${color === item ? 'ring-[#7a1f36]' : 'ring-slate-200'}`}
                    style={{ backgroundColor: colorSwatches[item] || '#d8b4c0' }}
                    aria-label={`Select color ${item}`}
                    title={item}
                  />
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[12px] font-semibold text-charcoal">Qty</span>
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-9 w-9 text-lg font-black text-slate-600">-</button>
                <span className="min-w-10 px-3 text-center text-[12px] font-black text-charcoal">{quantity}</span>
                <button type="button" onClick={() => setQuantity((value) => value + 1)} className="h-9 w-9 text-lg font-black text-slate-600">+</button>
              </div>
            </div>
          </section>

          {variantGroupData?.data?.products?.length ? (
            <section className="rounded-[14px] bg-white p-4 md:rounded-2xl">
              <h2 className="text-[13px] font-semibold text-charcoal md:text-xl">More variants</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(variantGroupData.data.products || []).map((variantProduct) => {
                  const variantId = variantProduct._id || variantProduct.id;
                  const isCurrent = String(variantId) === String(productId);
                  return (
                    <button
                      key={variantId}
                      type="button"
                      onClick={() => navigate(`/product?id=${variantId}`)}
                      className={`rounded-full border px-3 py-2 text-[11px] font-semibold ${isCurrent ? 'border-[#7a1f36] bg-[#7a1f36] text-white' : 'border-slate-200 bg-white text-charcoal'}`}
                    >
                      {variantProduct.variantColor || variantProduct.variantName || variantProduct.name}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <div className="hidden gap-3 md:flex">
            <button disabled={isOutOfStock} onClick={add} className={`h-14 flex-1 rounded-xl px-5 py-4 text-sm font-black text-white disabled:opacity-50 ${cartItem ? 'bg-emerald-600' : 'bg-rose'}`}>
              {cartItem ? 'Add More' : 'Add to Cart'}
            </button>
            <button disabled={isOutOfStock} onClick={buyNow} className="h-14 flex-1 rounded-xl bg-charcoal px-5 py-4 text-sm font-black text-white disabled:opacity-50">Buy Now</button>
            <button disabled={isOutOfStock} onClick={orderOnWhatsApp} className="h-14 flex-1 rounded-xl border border-emerald-600 px-5 py-4 text-sm font-black text-emerald-700 disabled:opacity-50">
              Order on WhatsApp
            </button>
          </div>

          {actionMessage && <p className="rounded-[14px] bg-[#fff4f7] px-4 py-3 text-sm font-semibold text-rose md:rounded-2xl">{actionMessage}</p>}

          <section className="rounded-[14px] bg-white p-4 md:space-y-2 md:rounded-none md:bg-transparent md:p-0 md:pt-2">
            <h2 className="text-[13px] font-semibold text-charcoal md:text-xl">Check Delivery</h2>
            <div className="mt-2 flex gap-2">
              <input value={deliveryPin} onChange={(event) => setDeliveryPin(event.target.value.replace(/\D/g, '').slice(0, 6))} className="h-11 flex-1 rounded-[10px] border border-slate-300 px-3 text-[12px] outline-none focus:border-rose md:h-12 md:rounded-xl md:px-4 md:text-base" placeholder="Enter PIN Code" />
              <button type="button" className="h-11 rounded-[10px] bg-[#7a1f36] px-5 text-[12px] font-bold text-white md:h-12 md:rounded-xl">Check</button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <MiniFeature icon="box" title="Express delivery" />
              <MiniFeature icon="bag" title="Pay on delivery" />
              <MiniFeature icon="heart" title="Hassle free returns" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Tag text="Genuine Product" />
              <Tag text="Quality Checked" />
              <Tag text="Easy returns" />
            </div>
          </section>

          <DetailsCard product={product} />

          <section className="hidden grid-cols-2 gap-2 text-center md:grid">
            <TrustBadge title="Genuine Product" />
            <TrustBadge title="Quality Checked" />
          </section>

          <section className="hidden md:block">
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
        <div className="rounded-[14px] border border-slate-200 bg-white p-4 md:rounded-3xl md:p-5">
          {[
            `More ${product.category} by ${product.brand || 'Samira Collection'}`,
            `More ${product.colors?.[0] || ''} ${product.category}`,
            `More ${product.category}`,
          ].map((label) => (
            <button key={label} type="button" onClick={() => navigate(`/products?category=${product.categoryId || ''}`)} className="flex w-full items-center justify-between gap-3 border-b border-slate-100 py-3.5 text-left text-[12px] font-semibold text-[#1f2a44] last:border-b-0 md:text-lg md:font-black">
              {label.trim()}
              <ChevronRight className="h-4 w-4 text-rose" />
            </button>
          ))}
        </div>
        <p className="small-text mt-8 text-slate-500">Product Code: {product.sku || productId}</p>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-40 bg-white px-3 py-2.5 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] md:hidden">
        <div className="grid grid-cols-3 gap-2">
          <button disabled={isOutOfStock} onClick={buyNow} className="h-11 rounded-[10px] border border-[#7a1f36] bg-white px-3 text-[13px] font-bold text-[#7a1f36] disabled:opacity-50">
            Buy Now
          </button>
          <button disabled={isOutOfStock} onClick={add} className={`flex h-11 items-center justify-center gap-2 rounded-[10px] px-3 text-[13px] font-bold text-white disabled:opacity-50 ${cartItem ? 'bg-emerald-600' : 'bg-[#7a1f36]'}`}>
            <Icon name="bag" className="h-4 w-4" />
            {isOutOfStock ? 'Out of Stock' : cartItem ? 'Add More' : 'Add to Cart'}
          </button>
          <button disabled={isOutOfStock} onClick={orderOnWhatsApp} className="h-11 rounded-[10px] border border-emerald-600 px-3 text-[13px] font-bold text-emerald-700 disabled:opacity-50">
            WhatsApp
          </button>
        </div>
      </div>

        </section>
      </div>

      <SizeChartModal open={openSizeChart} onClose={() => setOpenSizeChart(false)} />
      {openGallery && mediaItems.length > 0 && (
        <div className="fixed inset-0 z-[90] bg-black md:bg-black/95" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-4 pb-3 pt-6 text-white">
              <button type="button" onClick={() => setOpenGallery(false)} className="grid h-10 w-10 place-items-center text-3xl leading-none" aria-label="Close gallery">
                &times;
              </button>
              <p className="text-sm font-black">{activeImage + 1} / {mediaItems.length}</p>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center px-3">
              {mediaItems[activeImage]?.type === 'video' ? (
                <video
                  src={mediaItems[activeImage]?.url}
                  poster={mediaItems[activeImage]?.thumbnail}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-full w-full object-contain"
                />
              ) : (
                <img src={mediaItems[activeImage]?.url} alt={`${product.name} ${activeImage + 1}`} className="max-h-full w-full object-contain" />
              )}
            </div>
            {mediaItems.length > 1 && (
              <div className="pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
                <div className="hide-scrollbar flex gap-3 overflow-x-auto px-4">
                  {mediaItems.map((item, index) => (
                    <button
                      key={`${item.type}-${item.url}-${index}`}
                      type="button"
                      onClick={() => goToImage(index)}
                      className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 ${activeImage === index ? 'border-rose' : 'border-white/20'}`}
                    >
                      {item.type === 'video' ? (
                        <video src={item.thumbnail || item.url} className="h-full w-full object-cover" muted />
                      ) : (
                        <img src={item.url} alt={`${product.name} thumbnail ${index + 1}`} className="h-full w-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DetailsCard({ product }) {
  const highlights = product.highlights?.length ? product.highlights : [
    product.shortDescription || product.description,
    product.fabric ? `${product.fabric} fabric` : '',
    product.occasion ? `Best for ${product.occasion}` : '',
  ].filter(Boolean);

  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-4 md:rounded-3xl md:p-5">
      <h2 className="mb-3 text-[11px] font-semibold text-charcoal md:text-xl">Product Details</h2>
      <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4 md:gap-5">
        <Spec label="Category" value={product.category} />
        <Spec label="Fabric" value={product.fabric || 'Premium fabric'} />
        <Spec label="Occasion" value={product.occasion || 'Everyday festive'} />
        <Spec label="Pattern" value={product.tags?.[0] || 'Designer'} />
      </div>
      <div className="mt-4 space-y-3">
        {highlights.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-charcoal">Design Details</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[9px] text-slate-700 md:text-sm">
              {highlights.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        )}
        <div>
          <p className="text-[10px] font-semibold text-charcoal">Size & Fit</p>
          <p className="mt-1.5 text-[9px] text-slate-700 md:text-sm">Available sizes: {(product.sizes?.length ? product.sizes : ['Free Size']).join(', ')}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-charcoal">Material & Care</p>
          <p className="mt-1.5 text-[9px] text-slate-700 md:text-sm">{product.careInstructions || `Fabric: ${product.fabric || 'Premium fabric'}. Dry clean recommended.`}</p>
        </div>
      </div>
    </section>
  );
}

function Spec({ label, value }) {
  return <div><p className="text-[9px] font-medium text-slate-500">{label}</p><p className="mt-1 text-[10px] font-semibold text-charcoal md:text-sm">{value || '-'}</p></div>;
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
      <div className="rounded-[14px] border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold text-charcoal md:text-xl">Ratings & Reviews</h2>
          <button type="button" className="text-[9px] font-semibold text-rose">Rate this product</button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="rounded-xl bg-amber-400 px-3 py-2 text-[10px] font-bold text-white">{Number(product.rating || 0).toFixed(1)} ★</span>
          <span className="rounded-xl bg-slate-100 px-3 py-2 text-[9px] text-slate-600">{product.numReviews || reviews.length || 0} Ratings</span>
        </div>
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

function MiniFeature({ icon, title }) {
  return (
    <div className="rounded-[10px] border border-slate-100 bg-[#fafafa] px-2 py-2 text-center">
      <Icon name={icon} className="mx-auto h-4 w-4 text-charcoal" />
      <p className="mt-1 text-[8px] leading-3 text-slate-600">{title}</p>
    </div>
  );
}

function Tag({ text }) {
  return <span className="rounded-full border border-[#f0d6dd] bg-[#fff7fa] px-2.5 py-1 text-[8px] font-medium text-[#7a1f36]">{text}</span>;
}

const colorSwatches = {
  Wine: '#6d1f34',
  Blush: '#f8b7c8',
  Gold: '#b8914a',
  Ivory: '#f3ead7',
  Black: '#17161a',
  Emerald: '#0f6b52',
  Navy: '#1e3a8a',
  Rose: '#ff5f86',
  Blue: '#9ec5ff',
  Pink: '#f3a4be',
};

function formatWhatsappNumber(value = '') {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length >= 12) return digits.slice(-10);
  return digits.slice(-10);
}

function hasExplicitStock(product) {
  return Boolean(product) && product.stock !== undefined && product.stock !== null && product.stock !== '';
}
