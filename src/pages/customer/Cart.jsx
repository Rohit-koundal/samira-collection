import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/layout/Icon';
import { ProductVisual } from '../../components/product/ProductCard';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import products from '../../data/seedProducts';
import seedCoupons from '../../data/coupons';
import api from '../../services/api';
import { normalizeImageUrl, normalizeProducts } from '../../services/normalize';

const isDev = process.env.NODE_ENV === 'development';

export default function Cart({ navigate }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [recommended, setRecommended] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [donation, setDonation] = useState(0);

  useEffect(() => {
    api.get('/products?sort=rating')
      .then((items) => setRecommended(normalizeProducts(items).slice(0, 8)))
      .catch(() => setRecommended(isDev ? products.slice(0, 8) : []));
    api.get('/coupons').then((items) => setCoupons(items || [])).catch(() => setCoupons(seedCoupons));
  }, []);

  const selectedCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const platformFee = cart.items.length ? 23 : 0;
  const payable = cart.finalAmount + platformFee + donation;
  const deliveryDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }, []);
  const bestCoupon = coupons[0];

  const applyCoupon = async (couponCode = code) => {
    setMessage('');
    try {
      const data = await api.post('/coupons/apply', { code: couponCode, cartTotal: cart.sellingTotal });
      cart.setCoupon({ code: data.couponCode || data.coupon?.code, discount: data.discountAmount || data.discount });
      setCode(data.couponCode || data.coupon?.code || couponCode);
      setMessage(`${data.couponCode || data.coupon?.code || couponCode} applied`);
    } catch (error) {
      const localCoupon = applyLocalCoupon(couponCode, cart.sellingTotal);
      if (localCoupon) {
        cart.setCoupon({ code: localCoupon.code, discount: localCoupon.discountAmount });
        setCode(localCoupon.code);
        setMessage(`${localCoupon.code} applied`);
      } else {
        setMessage(error.message);
      }
    }
  };

  const moveToWishlist = (item) => {
    wishlist.toggleWishlist(item.product);
    cart.removeFromCart(item.product._id || item.product.id || item.product.slug);
  };

  if (!cart.items.length) {
    return (
      <section className="bg-white pb-28 md:bg-ivory md:py-10">
        <BagHeader navigate={navigate} />
        <div className="container-page py-10">
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black">Your shopping bag is empty</h1>
            <p className="mt-2 text-sm text-slate-500">Add products to continue checkout.</p>
            <button onClick={() => navigate('/products')} className="mt-5 rounded-xl bg-rose px-6 py-3 text-sm font-black text-white">Shop Now</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white pb-36 md:bg-ivory md:pb-10">
      <BagHeader navigate={navigate} />

      <div className="mx-auto max-w-5xl md:grid md:grid-cols-[1fr_360px] md:gap-6 md:px-6 md:pt-6">
        <div className="min-w-0">
          <section className="border-b border-slate-100 bg-white px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm">Deliver to: <span className="font-black">{user?.name || 'Customer'}, {user?.pincode || 'Add PIN'}</span></p>
                <p className="mt-1 truncate text-sm text-slate-500">{user?.address || 'Add delivery address during checkout'}</p>
              </div>
              <button onClick={() => navigate('/checkout')} className="shrink-0 text-sm font-black text-rose">Change</button>
            </div>
          </section>

          <section className="bg-[#f4f4f5] px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded bg-rose text-[10px] font-black text-white">OK</span>
                <p className="text-sm font-black">{selectedCount}/{selectedCount} ITEMS SELECTED <span className="text-rose">(Rs. {cart.sellingTotal})</span></p>
              </div>
              <div className="flex gap-4 text-slate-800">
                <Icon name="share" className="h-5 w-5" />
                <Icon name="trash" className="h-5 w-5" />
                <Icon name="heart" className="h-5 w-5" />
              </div>
            </div>
          </section>

          <div className="bg-white">
            {cart.items.map((item) => (
              <BagItem
                key={`${item.product._id || item.product.id || item.product.slug}-${item.size}-${item.color}`}
                item={item}
                deliveryDate={deliveryDate}
                updateQuantity={cart.updateQuantity}
                removeFromCart={cart.removeFromCart}
                moveToWishlist={moveToWishlist}
              />
            ))}
          </div>

          <button onClick={() => navigate('/wishlist')} className="flex w-full items-center justify-between border-y border-slate-100 bg-white px-4 py-5 text-left">
            <span className="flex items-center gap-3 text-base font-black"><Icon name="bookmark" className="h-6 w-6" /> Add More From Wishlist</span>
            <span className="text-2xl">&gt;</span>
          </button>

          <section className="bg-[#f5f5f6]">
            <p className="px-4 py-4 text-xs font-black uppercase tracking-wide text-slate-600">Support transformative social work in India</p>
            <div className="bg-white px-4 py-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 text-base font-black">
                  <input type="checkbox" checked={donation > 0} onChange={(event) => setDonation(event.target.checked ? 10 : 0)} className="h-5 w-5 accent-rose" />
                  Donate and make a difference
                </label>
                <button className="text-sm font-black text-rose">Know More</button>
              </div>
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {[10, 20, 50, 100].map((amount) => (
                  <button key={amount} onClick={() => setDonation(amount)} className={`min-w-24 rounded-full border px-5 py-2 text-sm font-black ${donation === amount ? 'border-rose text-rose' : 'border-slate-200'}`}>Rs. {amount}</button>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-[#f5f5f6]">
            <p className="px-4 py-4 text-xs font-black uppercase tracking-wide text-slate-600">Offers</p>
            <div className="bg-white px-4 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black">Coupon & Bank Offers</h2>
                <button className="text-sm font-black text-rose">All Offers &gt;</button>
              </div>
              <div className="mt-4 rounded-xl border border-emerald-200 p-4">
                <p className="text-base font-black">Extra Rs. {bestCoupon?.maxDiscountAmount || 136} OFF</p>
                <p className="mt-2 text-sm text-slate-600">{bestCoupon ? `${bestCoupon.discountValue}${bestCoupon.type === 'Percentage' ? '% off' : ' rupees off'} on minimum purchase of Rs. ${bestCoupon.minOrderAmount}` : '15% off upto Rs. 150 on minimum purchase of Rs. 300'}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="border border-dashed border-emerald-400 px-4 py-3 text-sm font-black">{bestCoupon?.code || 'FWDEORS15'}</span>
                  <button onClick={() => applyCoupon(bestCoupon?.code || code)} className="rounded border border-rose px-4 py-3 text-sm font-black text-rose">APPLY COUPON</button>
                </div>
                {message && <p className="mt-3 text-sm font-bold text-wine">{message}</p>}
              </div>
              <div className="mt-4 flex gap-2">
                <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder="Enter coupon code" />
                <button onClick={() => applyCoupon()} className="rounded-xl bg-wine px-4 text-sm font-black text-white">Apply</button>
              </div>
            </div>
          </section>

          {recommended.length > 0 && <RecommendationRail title="You may also like:" products={recommended} cart={cart} navigate={navigate} />}
        </div>

        <aside className="hidden md:block">
          <PriceDetails cart={cart} platformFee={platformFee} donation={donation} payable={payable} />
          <button onClick={() => navigate('/checkout')} className="mt-4 h-12 w-full rounded-xl bg-rose text-sm font-black text-white">Place Order</button>
        </aside>
      </div>

      <div className="md:hidden">
        <PriceDetails cart={cart} platformFee={platformFee} donation={donation} payable={payable} />
      </div>

      <TrustStrip />

      <div className="fixed bottom-16 left-0 right-0 z-40 bg-white shadow-[0_-8px_20px_rgba(15,23,42,0.08)] md:hidden">
        <p className="border-t border-slate-200 bg-[#fff6f4] py-2 text-center text-sm font-black">{selectedCount} Item selected for order</p>
        <div className="p-3">
          <button onClick={() => navigate('/checkout')} className="h-14 w-full rounded bg-rose text-base font-black uppercase tracking-[0.16em] text-white">Place Order</button>
        </div>
      </div>
    </section>
  );
}

function applyLocalCoupon(code, cartTotal) {
  const coupon = seedCoupons.find((item) => item.code === String(code || '').toUpperCase() && item.isActive);
  if (!coupon || new Date(coupon.expiryDate) < new Date()) return null;
  const amount = Number(cartTotal || 0);
  if (amount < Number(coupon.minOrderAmount || 0)) return null;
  const raw = coupon.type === 'Percentage' ? (amount * Number(coupon.discountValue || 0)) / 100 : Number(coupon.discountValue || 0);
  return {
    code: coupon.code,
    discountAmount: Math.min(raw, Number(coupon.maxDiscountAmount || raw), amount),
  };
}

function BagHeader({ navigate }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:static md:rounded-b-2xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/products')} className="text-2xl leading-none" aria-label="Back">&lt;</button>
        <h1 className="text-lg font-black uppercase tracking-wide text-slate-800">Shopping Bag</h1>
      </div>
      <span className="text-sm font-semibold text-slate-700">STEP 1/3</span>
    </header>
  );
}

function BagItem({ item, deliveryDate, updateQuantity, removeFromCart, moveToWishlist }) {
  const product = item.product;
  const productId = product._id || product.id || product.slug;
  const image = product.images?.[0]?.url;
  const originalTotal = Number(product.originalPrice || product.price || 0) * item.quantity;
  const sellingTotal = Number(product.price || 0) * item.quantity;
  const discount = Math.max(0, originalTotal - sellingTotal);

  return (
    <article className="relative flex gap-3 border-b border-slate-100 bg-white px-4 py-4">
      <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded bg-[#f6efe8]">
        {image ? <img src={normalizeImageUrl(image)} alt={product.name} className="h-full w-full object-cover" /> : <ProductVisual product={product} compact />}
        <span className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded bg-rose text-[10px] font-black text-white">OK</span>
      </div>
      <div className="min-w-0 flex-1 pr-6">
        <h2 className="truncate text-sm font-black">{product.brand || 'Samira Collection'}</h2>
        <p className="mt-1 truncate text-sm text-slate-700">{product.name}</p>
        <p className="mt-1 truncate text-xs text-slate-400">Sold by: Samira Collection</p>
        <div className="mt-3 flex gap-2">
          <button type="button" className="h-8 rounded bg-slate-100 px-2 text-xs font-black">Size: {item.size}</button>
          <select value={item.quantity} onChange={(event) => updateQuantity(productId, Number(event.target.value))} className="h-8 rounded bg-slate-100 px-2 text-xs font-black" aria-label="Quantity">
            {[1, 2, 3, 4, 5].map((qty) => <option key={qty} value={qty}>Qty: {qty}</option>)}
          </select>
        </div>
        <p className="mt-3 text-sm">
          <span className="font-black">Rs. {sellingTotal}</span>
          <span className="ml-2 text-slate-400 line-through">Rs. {originalTotal}</span>
          <span className="ml-2 text-rose">Rs. {discount} OFF</span>
        </p>
        <p className="mt-2 text-sm font-semibold"><span className="font-black text-emerald-600">OK</span> Delivery by <span className="font-black">{deliveryDate}</span></p>
      </div>
      <div className="absolute right-3 top-3 flex gap-3">
        <button onClick={() => moveToWishlist(item)} className="text-slate-600" aria-label="Move to wishlist"><Icon name="heart" className="h-5 w-5" /></button>
        <button onClick={() => removeFromCart(productId)} className="text-2xl leading-none" aria-label="Remove">x</button>
      </div>
    </article>
  );
}

function RecommendationRail({ title, products: items, cart, navigate }) {
  return (
    <section className="bg-[#fff7f9] px-4 py-5">
      <h2 className="flex items-center gap-3 text-base font-black"><Icon name="bag" className="h-6 w-6" /> {title}</h2>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {items.map((product) => {
          const image = product.images?.[0]?.url;
          return (
            <article key={product.id} className="w-40 shrink-0 border border-slate-200 bg-white">
              <button onClick={() => navigate(`/product?id=${product._id || product.id || product.slug}`)} className="block h-44 w-full overflow-hidden bg-[#f6efe8]">
                {image ? <img src={normalizeImageUrl(image)} alt={product.name} className="h-full w-full object-cover" /> : <ProductVisual product={product} compact />}
              </button>
              <div className="p-3">
                <h3 className="truncate text-sm font-semibold">{product.brand || 'Samira Collection'}</h3>
                <p className="truncate text-xs text-slate-500">{product.name}</p>
                <p className="mt-1 text-xs"><span className="font-black">Rs. {product.price}</span> <span className="text-slate-400 line-through">Rs. {product.originalPrice}</span></p>
              </div>
              <button onClick={() => cart.addToCart(product)} className="h-11 w-full border-t border-slate-200 text-sm font-black text-rose">ADD TO BAG</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PriceDetails({ cart, platformFee, donation, payable }) {
  return (
    <section className="bg-white px-4 py-6 md:rounded-2xl md:shadow-sm">
      <h2 className="text-sm font-black uppercase">Price Details ({cart.items.length} Item)</h2>
      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm">
        <Row label="Total MRP" value={`Rs. ${cart.totalMRP}`} />
        <Row label="Discount on MRP" value={`- Rs. ${cart.discount}`} good />
        <Row label="Coupon Discount" value={`- Rs. ${cart.couponDiscount}`} good />
        <Row label="Platform Fee" value={`Rs. ${platformFee}`} />
        {donation > 0 && <Row label="Donation" value={`Rs. ${donation}`} />}
        <div className="flex justify-between border-t border-slate-100 pt-4 text-base font-black">
          <span>Total Amount</span>
          <span>Rs. {payable}</span>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value, good }) {
  return <div className="flex justify-between gap-4"><span>{label}</span><span className={good ? 'text-emerald-600' : ''}>{value}</span></div>;
}

function TrustStrip() {
  return (
    <section className="bg-white px-4 pb-28 pt-5 md:mx-auto md:mt-6 md:max-w-5xl md:rounded-2xl md:pb-5">
      <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-500">
        <div><Icon name="star" className="mx-auto h-6 w-6" /><p className="mt-2">Genuine Products</p></div>
        <div><Icon name="box" className="mx-auto h-6 w-6" /><p className="mt-2">Contactless Delivery</p></div>
        <div><Icon name="bag" className="mx-auto h-6 w-6" /><p className="mt-2">Secure Payments</p></div>
      </div>
      <p className="mt-5 text-sm leading-6 text-slate-600">By placing the order, you agree to Samira Collection's <span className="font-black text-rose">Terms of Use</span> and <span className="font-black text-rose">Privacy Policy</span>.</p>
    </section>
  );
}
