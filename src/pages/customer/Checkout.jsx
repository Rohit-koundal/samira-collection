import OrderSummary from '../../components/checkout/OrderSummary';
import PriceSummary from '../../components/cart/PriceSummary';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import { AddressForm } from './AddressManagement';

const emptyAddress = { fullName: '', mobile: '', pincode: '', state: 'Rajasthan', city: 'Jaipur', houseNo: '', area: '', landmark: '', addressType: 'Home', isDefault: false };

export default function Checkout({ navigate }) {
  const cart = useCart();
  const { setToast, user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ ...emptyAddress, fullName: user?.name || '', mobile: user?.phone || '' });
  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [paymentApp, setPaymentApp] = useState('Google Pay');
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  const loadAddresses = () => api.get('/user/addresses').then((items) => {
    setAddresses(items);
    const selected = items.find((item) => item.isDefault) || items[0];
    if (selected) setSelectedAddressId(selected._id);
  }).catch(() => {});

  useEffect(() => { loadAddresses(); }, []);

  const selectedAddress = addresses.find((item) => item._id === selectedAddressId);

  const saveAddress = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await api.post('/user/addresses', addressForm);
      setShowAddressForm(false);
      setAddressForm(emptyAddress);
      loadAddresses();
    } catch (err) {
      setError(err.message);
    }
  };

  const applyCoupon = async () => {
    setError('');
    try {
      const data = await api.post('/coupons/apply', { code: couponCode, cartTotal: cart.sellingTotal });
      cart.setCoupon({ code: data.couponCode, discount: data.discountAmount });
      setToast(data.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const orderPayload = () => ({
    orderItems: cart.items.map((item) => ({
      product: item.product._id || item.product.id,
      name: item.product.name,
      image: item.product.images?.[0]?.url,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: item.product.price,
      originalPrice: item.product.originalPrice || item.product.price,
    })),
    shippingAddress: selectedAddress,
    paymentMethod,
    paymentProvider: paymentMethod === 'COD' ? 'COD' : 'Razorpay',
    coupon: cart.coupon,
  });

  const placeOrder = async () => {
    setError('');
    if (!user) return navigate('/login');
    if (!cart.items.length) return setError('Your cart is empty.');
    if (!selectedAddress) return setError('Please select or add a delivery address.');
    setPlacing(true);
    try {
      if (paymentMethod === 'COD') {
        const order = await api.post('/orders/cod', orderPayload());
        cart.clearCart();
        setToast('COD order placed successfully');
        navigate(`/order-success?id=${order._id}`);
      } else {
        const payment = await api.post('/payments/create-order', orderPayload());
        setError(`Razorpay-ready order created (${payment.razorpayOrderId}). Add Razorpay checkout script/keys to complete live payment.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <section className="container-page pb-24 pt-6 md:py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-wine">Bag / Address / Payment</p><h1 className="mt-1 text-3xl font-black">Checkout</h1></div>
        <button onClick={() => navigate('/profile/addresses')} className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-black md:block">Manage Addresses</button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {!user && <section className="rounded-3xl bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Login Required</h2><button onClick={() => navigate('/login')} className="mt-4 rounded-xl bg-wine px-5 py-3 text-sm font-black text-white">Login to continue</button></section>}
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="text-lg font-black">1. Delivery Address</h2><button onClick={() => setShowAddressForm((value) => !value)} className="text-sm font-black text-wine">Add New</button></div>
            <div className="mt-4 grid gap-3">
              {addresses.map((address) => <button key={address._id} onClick={() => setSelectedAddressId(address._id)} className={`rounded-2xl border p-4 text-left ${selectedAddressId === address._id ? 'border-wine bg-blush' : 'border-slate-200'}`}><p className="font-black">{address.fullName} {address.isDefault && <span className="rounded-full bg-wine px-2 py-1 text-[10px] text-white">Default</span>}</p><p className="mt-1 text-sm font-semibold text-slate-600">{address.mobile || address.phone}</p><p className="mt-2 text-sm leading-6 text-slate-600">{address.houseNo || address.houseNumber}, {address.area}, {address.city}, {address.state} - {address.pincode}</p></button>)}
              {!addresses.length && <p className="rounded-2xl bg-[#fbf8f4] p-4 text-sm font-bold text-slate-500">No saved addresses. Add one below.</p>}
            </div>
            {showAddressForm || !addresses.length ? <div className="mt-4"><AddressForm form={addressForm} setForm={setAddressForm} onSubmit={saveAddress} message={error} /></div> : null}
          </section>
          <section className="rounded-3xl bg-white p-5 shadow-sm"><h2 className="text-lg font-black">2. Order Summary</h2><OrderSummary items={cart.items} /></section>
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">3. Apply Coupon</h2>
            <div className="mt-4 flex gap-2"><input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder="Coupon code" /><button onClick={applyCoupon} className="rounded-xl bg-wine px-4 text-sm font-black text-white">Apply</button></div>
            {cart.coupon && <p className="mt-2 text-sm font-black text-emerald-600">{cart.coupon.code} applied: Rs. {cart.coupon.discount}</p>}
          </section>
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">4. Payment Method</h2>
            <div className="mt-4 grid gap-3">
              {[
                ['UPI', 'Pay using UPI', 'Google Pay, PhonePe, Paytm and other UPI apps'],
                ['CARD', 'Credit / Debit Card', 'Secure card payment through Razorpay checkout'],
                ['NETBANKING', 'Net Banking', 'Bank selection through gateway'],
                ['WALLET', 'Wallet', 'Paytm Wallet and other wallets ready'],
                ['COD', 'Cash on Delivery', 'Pay when the product is delivered'],
              ].map(([key, title, note]) => <button key={key} onClick={() => setPaymentMethod(key)} className={`rounded-2xl border p-4 text-left ${paymentMethod === key ? 'border-wine bg-blush' : 'border-slate-200'}`}><p className="font-black">{title}</p><p className="mt-1 text-sm font-semibold text-slate-500">{note}</p></button>)}
            </div>
            {paymentMethod === 'UPI' && <div className="mt-4 rounded-2xl bg-[#fbf8f4] p-4"><div className="flex flex-wrap gap-2">{['Google Pay', 'PhonePe', 'Paytm', 'Other UPI Apps'].map((app) => <button key={app} onClick={() => setPaymentApp(app)} className={`rounded-xl px-4 py-2 text-sm font-black ${paymentApp === app ? 'bg-wine text-white' : 'bg-white'}`}>{app}</button>)}</div><input value={upiId} onChange={(event) => setUpiId(event.target.value)} className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder="yourname@upi" /><div className="mt-3 grid h-28 place-items-center rounded-xl border border-dashed border-slate-300 text-sm font-bold text-slate-500">QR payment placeholder</div></div>}
            {paymentMethod === 'COD' && <p className="mt-4 rounded-2xl bg-[#fbf8f4] p-4 text-sm font-bold text-slate-600">Please keep exact amount ready at delivery.</p>}
          </section>
          {error && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{error}</p>}
        </div>
        <PriceSummary cart={cart} cta={placing ? 'Placing...' : 'Place Order'} onAction={placeOrder} />
      </div>
      <div className="fixed bottom-16 left-0 right-0 z-40 flex items-center justify-between border-t border-slate-200 bg-white p-3 md:hidden"><span className="font-black">Rs. {cart.finalAmount}</span><button onClick={placeOrder} className="rounded-xl bg-rose px-5 py-3 text-sm font-black text-white">{placing ? 'Placing...' : 'Place Order'}</button></div>
    </section>
  );
}
