import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import Icon from '../../components/layout/Icon';
import { ProductVisual } from '../../components/product/ProductCard';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../services/api';
import { getPrimaryImageUrl, normalizeImageUrl, normalizeProducts } from '../../services/normalize';
import { startMobileLoader, stopMobileLoader } from '../../utils/mobileLoader';
import { couponApplyBody } from '../../utils/couponApply';
import { DEFAULT_GST_RATE, DEFAULT_PLATFORM_FEE, inclusiveTax, readPricingSettings } from '../../utils/priceBreakdown';
import CouponSelector from '../../components/coupon/CouponSelector';

export default function Cart({ navigate }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [recommended, setRecommended] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [bestCouponCode, setBestCouponCode] = useState('');
  const [couponBusyCode, setCouponBusyCode] = useState('');
  const [pricing, setPricing] = useState({ platformFee: DEFAULT_PLATFORM_FEE, gstRate: DEFAULT_GST_RATE });
  const cartSignature = useMemo(() => cart.items
    .map((item) => `${item.product._id || item.product.id}:${item.quantity}:${item.size || ''}:${item.color || ''}:${item.variantId || ''}`)
    .join('|'), [cart.items]);

  useEffect(() => {
    let active = true;
    startMobileLoader();

    Promise.allSettled([
      api.get('/products?sort=rating'),
      api.get('/settings'),
    ])
      .then(([productsResult, settingsResult]) => {
        if (!active) return;

        if (productsResult.status === 'fulfilled') {
          setRecommended(normalizeProducts(productsResult.value).slice(0, 8));
        } else {
          setRecommended([]);
        }

        if (settingsResult.status === 'fulfilled') {
          setPricing(readPricingSettings(settingsResult.value));
        }
      })
      .finally(() => {
        if (active) stopMobileLoader();
      });

    return () => {
      active = false;
      stopMobileLoader();
    };
  }, []);

  useEffect(() => {
    if (!cart.items.length) return undefined;
    let active = true;
    const body = couponApplyBody({ cart });
    api.post('/coupons/available', body)
      .then((data) => {
        if (!active) return;
        setCoupons(Array.isArray(data?.items) ? data.items : []);
        setBestCouponCode(data?.bestCouponCode || '');
      })
      .catch(() => {
        if (active) {
          setCoupons([]);
          setBestCouponCode('');
        }
      });

    if (cart.coupon?.code) {
      api.post('/coupons/apply', { ...body, code: cart.coupon.code })
        .then((data) => {
          if (!active) return;
          const nextDiscount = Number(data.discountAmount || 0);
          if (nextDiscount !== Number(cart.coupon?.discount || 0)) {
            cart.setCoupon({ code: data.couponCode, discount: nextDiscount });
          }
        })
        .catch((error) => {
          if (!active) return;
          const removedCode = cart.coupon?.code;
          cart.setCoupon(null);
          setCode('');
          setMessage(`${removedCode} was removed: ${error.message}`);
        });
    }
    return () => { active = false; };
  }, [cartSignature, cart.coupon?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedCount = cart.itemCount;
  const platformFee = cart.items.length ? pricing.platformFee : 0;
  const discountedSubtotal = Math.max(0, cart.sellingTotal - cart.couponDiscount);
  const deliveryCharge = cart.items.length && discountedSubtotal < pricing.freeShippingMinAmount
    ? pricing.deliveryCharge
    : 0;
  const taxAmount = inclusiveTax(discountedSubtotal, pricing.gstRate);
  const payable = discountedSubtotal + deliveryCharge + platformFee;
  const deliveryDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }, []);
  const applyCoupon = async (couponCode = code) => {
    const nextCode = String(couponCode || '').trim().toUpperCase();
    setMessage('');
    if (!nextCode) {
      setMessage('Select a coupon or enter a code.');
      return;
    }
    setCouponBusyCode(nextCode);
    startMobileLoader();
    try {
      const data = await api.post('/coupons/apply', couponApplyBody({ code: nextCode, cart }));
      cart.setCoupon({ code: data.couponCode || data.coupon?.code, discount: Number(data.discountAmount ?? data.discount ?? 0) });
      setCode(data.couponCode || data.coupon?.code || nextCode);
      setMessage(data.message || `${data.couponCode || data.coupon?.code || nextCode} applied`);
      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    } finally {
      setCouponBusyCode('');
      stopMobileLoader();
    }
  };

  const moveToWishlist = (item) => {
    wishlist.addToWishlist(item.product);
    setMessage('Added to wishlist. It will remain in your bag too.');
  };

  const removeCoupon = () => {
    cart.setCoupon(null);
    setCode('');
    setMessage('Coupon removed');
  };

  const shareCart = async () => {
    const text = `Samira Collection bag: ${selectedCount} item${selectedCount === 1 ? '' : 's'} worth Rs. ${payable}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Samira Collection Bag', text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text} - ${window.location.href}`);
        setMessage('Bag link copied');
      }
    } catch {
      setMessage('Sharing was cancelled');
    }
  };

  const addAllToWishlist = () => {
    cart.items.forEach((item) => wishlist.addToWishlist(item.product));
    setMessage('Bag items added to wishlist');
  };

  if (!cart.items.length) {
    return (
      <section className="bg-white pb-28 md:min-h-screen md:bg-white md:pb-0">
        <BagHeader navigate={navigate} />
        <div className="container-page py-10 md:flex md:min-h-[calc(100vh-72px)] md:items-center md:justify-center md:py-12">
          <div className="flex w-full flex-col items-center text-center md:hidden">
            <div className="relative mt-6 flex h-56 w-full max-w-[320px] items-center justify-center">
              <div className="absolute left-8 top-28 h-1 w-7 rounded-full bg-slate-600/80" />
              <div className="absolute left-11 top-24 h-1 w-14 rounded-full bg-slate-600/80" />
              <div className="absolute left-16 top-20 h-1 w-5 rounded-full bg-slate-600/80" />
              <div className="absolute left-[calc(50%-42px)] top-14 h-[150px] w-[108px] rounded-[20px] bg-[#ff557f] shadow-[0_20px_30px_rgba(255,85,127,0.18)]" />
              <div className="absolute left-[calc(50%-5px)] top-10 h-14 w-7 rounded-t-full border-4 border-b-0 border-slate-600/80" />
              <div className="absolute left-[calc(50%-13px)] top-[92px] text-white">
                <Icon name="bag" className="h-14 w-14" />
              </div>
              <div className="absolute bottom-8 h-3 w-24 rounded-full bg-slate-200/80 blur-[1px]" />
            </div>
            <h1 className="mt-2 text-[20px] font-extrabold leading-tight text-[#1f2a44]">Hey, it feels so light!</h1>
            <p className="mt-2 max-w-[290px] text-[14px] leading-6 text-slate-500">There is nothing in your bag. Let&apos;s add some items.</p>
            <Button onClick={() => navigate('/wishlist')} variant="outline" className="mt-8 h-12 rounded-sm border-rose px-5 text-[12px] font-bold uppercase tracking-[0.08em] text-rose hover:bg-rose/5">
              Add Items From Wishlist
            </Button>
          </div>

          <div className="hidden w-full max-w-2xl flex-col items-center text-center md:flex">
            <div className="relative flex h-52 w-52 items-center justify-center">
              <div className="absolute left-3 top-24 h-1 w-6 rounded-full bg-slate-500/80" />
              <div className="absolute left-6 top-20 h-1 w-12 rounded-full bg-slate-500/80" />
              <div className="absolute left-12 top-16 h-1 w-6 rounded-full bg-slate-500/80" />
              <div className="relative flex h-36 w-36 items-center justify-center rounded-[2rem] bg-rose text-white shadow-[0_16px_32px_rgba(255,66,120,0.25)]">
                <Icon name="bag" className="h-16 w-16" />
              </div>
            </div>
            <h1 className="mt-6 text-[28px] font-extrabold leading-tight text-charcoal">Hey, it feels so light!</h1>
            <p className="mt-2 text-[17px] leading-7 text-slate-500">There is nothing in your bag. Let&apos;s add some items.</p>
            <Button onClick={() => navigate('/wishlist')} variant="outline" className="mt-8 h-12 rounded-sm border-rose px-5 text-[15px] font-bold uppercase tracking-[0.08em] text-rose hover:bg-rose/5">
              Add Items From Wishlist
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white pb-36 md:bg-ivory md:pb-10">
      <BagHeader navigate={navigate} />

      <div className="mx-auto max-w-5xl md:grid md:grid-cols-[minmax(0,1fr)_340px] md:gap-6 md:px-6 md:pt-6">
        <div className="min-w-0">
          <section className="border-b border-slate-100 bg-white px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="body-text">Deliver to: <span className="label-text">{user?.name || 'Customer'}, {user?.pincode || 'Add PIN'}</span></p>
                <p className="body-text mt-1 truncate text-slate-500">{user?.address || 'Add delivery address during checkout'}</p>
              </div>
              <Button onClick={() => navigate('/checkout')} variant="ghost" size="sm" className="shrink-0 px-0 text-rose">Change</Button>
            </div>
          </section>

          <section className="bg-[#f4f4f5] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge variant="accent" className="grid h-6 w-6 place-items-center rounded px-0 py-0 text-[10px] text-white">OK</Badge>
                <p className="label-text sm:text-sm">{selectedCount}/{selectedCount} ITEMS SELECTED <span className="text-rose">(Rs. {cart.sellingTotal})</span></p>
              </div>
              <div className="flex shrink-0 gap-3 text-slate-800 sm:gap-4">
                <button type="button" onClick={shareCart} aria-label="Share bag"><Icon name="share" className="h-5 w-5" /></button>
                <button type="button" onClick={cart.clearCart} aria-label="Delete all bag items"><Icon name="trash" className="h-5 w-5" /></button>
                <button type="button" onClick={addAllToWishlist} aria-label="Add bag items to wishlist"><Icon name="heart" className="h-5 w-5" /></button>
              </div>
            </div>
          </section>

          <div className="bg-white">
            {cart.items.map((item) => (
              <BagItem
                key={`${item.product._id || item.product.id || item.product.slug}-${item.size}-${item.color}`}
                item={item}
                deliveryDate={deliveryDate}
                increaseQuantity={cart.increaseQuantity}
                decreaseQuantity={cart.decreaseQuantity}
                removeFromCart={cart.removeFromCart}
                updateItemOptions={cart.updateItemOptions}
                moveToWishlist={moveToWishlist}
              />
            ))}
          </div>

          <button onClick={() => navigate('/wishlist')} className="flex w-full items-center justify-between border-y border-slate-100 bg-white px-4 py-5 text-left">
            <span className="flex items-center gap-3 label-text text-base"><Icon name="bookmark" className="h-6 w-6" /> Add More From Wishlist</span>
            <span className="text-2xl">&gt;</span>
          </button>

          <section className="bg-[#f5f5f6] px-4 py-4">
            <CouponSelector
              coupons={coupons}
              bestCouponCode={bestCouponCode}
              appliedCoupon={cart.coupon}
              busyCode={couponBusyCode}
              feedback={message}
              onApply={applyCoupon}
              onRemove={removeCoupon}
            />
          </section>

          {recommended.length > 0 && <RecommendationRail title="You may also like:" products={recommended} cart={cart} navigate={navigate} />}
        </div>

        <aside className="hidden md:block">
          <PriceDetails cart={cart} platformFee={platformFee} deliveryCharge={deliveryCharge} taxAmount={taxAmount} taxRate={pricing.gstRate} payable={payable} />
          <Button onClick={() => navigate('/checkout')} variant="accent" className="mt-4 w-full">Place Order</Button>
        </aside>
      </div>

      <div className="md:hidden">
        <PriceDetails cart={cart} platformFee={platformFee} deliveryCharge={deliveryCharge} taxAmount={taxAmount} taxRate={pricing.gstRate} payable={payable} />
      </div>

      <TrustStrip />

      <div className="fixed bottom-16 left-0 right-0 z-40 bg-white shadow-[0_-8px_20px_rgba(15,23,42,0.08)] md:hidden">
        <p className="label-text border-t border-slate-200 bg-[#fff6f4] py-2 text-center">{selectedCount} Item selected for order</p>
        <div className="p-3">
          <Button onClick={() => navigate('/checkout')} variant="accent" className="h-14 w-full uppercase tracking-[0.12em]">Place Order</Button>
        </div>
      </div>
    </section>
  );
}

function BagHeader({ navigate }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white md:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/products')} className="text-3xl leading-none text-slate-600" aria-label="Back">←</button>
          <h1 className="text-[16px] font-semibold uppercase tracking-[0.02em] text-[#4b5563]">Shopping Bag</h1>
        </div>
        <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6b7280]">Step 1/3</span>
      </div>
    </header>
  );
}

function BagItem({ item, deliveryDate, increaseQuantity, decreaseQuantity, removeFromCart, updateItemOptions, moveToWishlist }) {
  const product = item.product;
  const image = getPrimaryImageUrl(product.images);
  const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : [item.size || 'Free Size'];
  const originalTotal = Number(product.originalPrice || product.price || 0) * item.quantity;
  const sellingTotal = Number(product.price || 0) * item.quantity;
  const discount = Math.max(0, originalTotal - sellingTotal);

  return (
    <article className="relative flex gap-3 border-b border-slate-100 bg-white px-4 py-4">
      <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded bg-[#f6efe8]">
        {image ? <img src={normalizeImageUrl(image)} alt={product.name} className="h-full w-full object-cover" /> : <ProductVisual product={product} compact />}
        <Badge variant="accent" className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded px-0 py-0 text-[10px] text-white">OK</Badge>
      </div>
      <div className="min-w-0 flex-1 pr-6">
        <h2 className="product-brand truncate text-charcoal">{product.brand || 'Samira Collection'}</h2>
        <p className="product-name mt-1 truncate text-slate-700">{product.name}</p>
        <p className="small-text mt-1 truncate text-slate-400">Sold by: Samira Collection</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="small-text flex h-8 items-center gap-1 rounded bg-slate-100 px-2 font-bold">
            Size:
            <select
              value={item.size}
              onChange={(event) => updateItemOptions(item.cartKey, { cartKey: item.cartKey, size: event.target.value })}
              className="bg-transparent font-black outline-none"
              aria-label="Select size"
            >
              {sizes.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <div className="small-text grid h-8 grid-cols-[2rem_3rem_2rem] overflow-hidden rounded bg-slate-100 font-bold" aria-label="Quantity controls">
            <button type="button" onClick={() => decreaseQuantity(item.cartKey, { cartKey: item.cartKey })} aria-label="Decrease quantity">-</button>
            <span className="grid place-items-center">Qty {item.quantity}</span>
            <button type="button" onClick={() => increaseQuantity(item.cartKey, { cartKey: item.cartKey })} aria-label="Increase quantity">+</button>
          </div>
        </div>
        <p className="mt-3 body-text">
          <span className="price">Rs. {sellingTotal}</span>
          <span className="old-price ml-2 text-slate-400 line-through">Rs. {originalTotal}</span>
          <span className="discount ml-2 text-rose">Rs. {discount} OFF</span>
        </p>
        <p className="label-text mt-2"><span className="text-emerald-600">OK</span> Delivery by <span className="text-charcoal">{deliveryDate}</span></p>
      </div>
      <div className="absolute right-3 top-3 flex gap-3">
        <button type="button" onClick={() => moveToWishlist(item)} className="text-slate-600" aria-label="Add to wishlist"><Icon name="heart" className="h-5 w-5" /></button>
        <button type="button" onClick={() => removeFromCart(item.cartKey, { cartKey: item.cartKey })} className="text-2xl leading-none" aria-label="Remove">x</button>
      </div>
    </article>
  );
}

function RecommendationRail({ title, products: items, cart, navigate }) {
  return (
    <section className="bg-[#fff7f9] px-4 py-5">
      <h2 className="section-title flex items-center gap-3 text-base"><Icon name="bag" className="h-6 w-6" /> {title}</h2>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {items.map((product) => {
          const image = getPrimaryImageUrl(product.images);
          const cartItem = cart.getCartItem(product);
          return (
            <Card key={product.id} className="w-40 shrink-0 rounded-2xl">
              <button onClick={() => navigate(`/product?id=${product._id || product.id || product.slug}`)} className="block h-44 w-full overflow-hidden bg-[#f6efe8]">
                {image ? <img src={normalizeImageUrl(image)} alt={product.name} className="h-full w-full object-cover" /> : <ProductVisual product={product} compact />}
              </button>
              <CardContent className="p-3">
                <h3 className="label-text truncate text-charcoal">{product.brand || 'Samira Collection'}</h3>
                <p className="product-name truncate text-slate-500">{product.name}</p>
                <p className="mt-1 small-text"><span className="price">Rs. {product.price}</span> <span className="old-price text-slate-400 line-through">Rs. {product.originalPrice}</span></p>
              </CardContent>
              <Button onClick={() => cart.addToCart(product)} variant={cartItem ? 'secondary' : 'ghost'} className={`w-full rounded-t-none border-t ${cartItem ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-slate-200 text-rose hover:bg-rose/5'}`}>
                {cartItem ? 'ADD MORE' : 'ADD TO CART'}
              </Button>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function PriceDetails({ cart, platformFee, deliveryCharge = 0, taxAmount = 0, taxRate = DEFAULT_GST_RATE, payable }) {
  return (
    <Card className="rounded-none md:rounded-2xl">
      <CardHeader>
        <CardTitle className="small-text uppercase tracking-[0.14em] text-charcoal">Price Details ({cart.itemCount} Item)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 border-t border-slate-100 pt-4 body-text">
        <Row label="Total MRP" value={`Rs. ${cart.totalMRP}`} />
        <Row label="Discount on MRP" value={`- Rs. ${cart.discount}`} good />
        <Row label="Coupon Discount" value={`- Rs. ${cart.couponDiscount}`} good />
        <Row label="Delivery Charges" value={deliveryCharge ? `Rs. ${deliveryCharge}` : 'FREE'} good={!deliveryCharge} />
        <Row label="Platform Fee" value={`Rs. ${platformFee}`} />
        {taxAmount > 0 && <Row label={`GST (${taxRate}% incl.)`} value={`Rs. ${taxAmount}`} />}
        <div className="flex justify-between border-t border-slate-100 pt-4">
          <span>Total Amount</span>
          <span className="price">Rs. {payable}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, good }) {
  return <div className="flex justify-between gap-4"><span>{label}</span><span className={good ? 'text-emerald-600' : ''}>{value}</span></div>;
}

function TrustStrip() {
  return (
    <section className="bg-white px-4 pb-28 pt-5 md:mx-auto md:mt-6 md:max-w-5xl md:rounded-2xl md:pb-5">
      <div className="grid grid-cols-3 gap-2 text-center small-text text-slate-500">
        <div><Icon name="star" className="mx-auto h-6 w-6" /><p className="mt-2">Genuine Products</p></div>
        <div><Icon name="box" className="mx-auto h-6 w-6" /><p className="mt-2">Contactless Delivery</p></div>
        <div><Icon name="bag" className="mx-auto h-6 w-6" /><p className="mt-2">Secure Payments</p></div>
      </div>
      <p className="body-text mt-5 text-slate-600">By placing the order, you agree to Samira Collection's <span className="font-bold text-rose">Terms of Use</span> and <span className="font-bold text-rose">Privacy Policy</span>.</p>
    </section>
  );
}
