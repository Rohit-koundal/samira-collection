import OrderSummary from '../../components/checkout/OrderSummary';
import PriceSummary from '../../components/cart/PriceSummary';
import { Button, Card, CardContent, CardHeader, CardTitle, TextInput } from '../../components/ui';
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
    if (!user.isPhoneVerified) return setError('Please verify your mobile number to continue checkout.');
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
      <div className="mb-5 flex items-center justify-between gap-4 md:mb-6">
        <div><p className="small-text font-bold uppercase tracking-[0.14em] text-wine md:text-xs md:tracking-[0.2em]">Bag / Address / Payment</p><h1 className="page-title mt-1 md:text-3xl">Checkout</h1></div>
        <Button onClick={() => navigate('/profile/addresses')} variant="outline" className="hidden md:inline-flex">Manage Addresses</Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
        <div className="space-y-5">
          {!user && <Card as="section"><CardHeader><CardTitle className="text-xl">Login Required</CardTitle></CardHeader><CardContent><Button onClick={() => navigate('/login')}>Login to continue</Button></CardContent></Card>}
          {user && !user.isPhoneVerified && <Card as="section"><CardHeader><CardTitle className="text-xl">Mobile verification required</CardTitle></CardHeader><CardContent className="space-y-4"><p className="body-text text-slate-600">Please verify your mobile number to continue checkout.</p><Button onClick={() => navigate('/login')}>Verify Mobile</Button></CardContent></Card>}
          <Card as="section">
            <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-xl">1. Delivery Address</CardTitle><Button onClick={() => setShowAddressForm((value) => !value)} variant="ghost" size="sm" className="text-wine">Add New</Button></CardHeader>
            <CardContent>
            <div className="mt-4 grid gap-3">
              {addresses.map((address) => <button key={address._id} onClick={() => setSelectedAddressId(address._id)} className={`rounded-2xl border p-4 text-left ${selectedAddressId === address._id ? 'border-wine bg-blush' : 'border-slate-200'}`}><p className="label-text">{address.fullName} {address.isDefault && <span className="badge-text rounded-full bg-wine px-2 py-1 text-white">Default</span>}</p><p className="body-text mt-1 text-slate-600">{address.mobile || address.phone}</p><p className="body-text mt-2 text-slate-600">{address.houseNo || address.houseNumber}, {address.area}, {address.city}, {address.state} - {address.pincode}</p></button>)}
              {!addresses.length && <p className="body-text rounded-2xl bg-[#fbf8f4] p-4 text-slate-500">No saved addresses. Add one below.</p>}
            </div>
            {showAddressForm || !addresses.length ? <div className="mt-4"><AddressForm form={addressForm} setForm={setAddressForm} onSubmit={saveAddress} message={error} /></div> : null}
            </CardContent>
          </Card>
          <section><OrderSummary items={cart.items} /></section>
          <Card as="section">
            <CardHeader><CardTitle className="text-xl">3. Apply Coupon</CardTitle></CardHeader>
            <CardContent>
            <div className="mt-4 flex gap-2"><TextInput value={couponCode} onChange={(event) => setCouponCode(event.target.value)} className="flex-1" placeholder="Coupon code" /><Button onClick={applyCoupon}>Apply</Button></div>
            {cart.coupon && <p className="label-text mt-2 text-emerald-600">{cart.coupon.code} applied: Rs. {cart.coupon.discount}</p>}
            </CardContent>
          </Card>
          <Card as="section">
            <CardHeader><CardTitle className="text-xl">4. Payment Method</CardTitle></CardHeader>
            <CardContent>
            <div className="mt-4 grid gap-3">
              {[
                ['UPI', 'Pay using UPI', 'Google Pay, PhonePe, Paytm and other UPI apps'],
                ['CARD', 'Credit / Debit Card', 'Secure card payment through Razorpay checkout'],
                ['NETBANKING', 'Net Banking', 'Bank selection through gateway'],
                ['WALLET', 'Wallet', 'Paytm Wallet and other wallets ready'],
                ['COD', 'Cash on Delivery', 'Pay when the product is delivered'],
              ].map(([key, title, note]) => <button key={key} onClick={() => setPaymentMethod(key)} className={`rounded-2xl border p-4 text-left ${paymentMethod === key ? 'border-wine bg-blush' : 'border-slate-200'}`}><p className="label-text">{title}</p><p className="body-text mt-1 text-slate-500">{note}</p></button>)}
            </div>
            {paymentMethod === 'UPI' && <div className="mt-4 rounded-2xl bg-[#fbf8f4] p-4"><div className="flex flex-wrap gap-2">{['Google Pay', 'PhonePe', 'Paytm', 'Other UPI Apps'].map((app) => <Button key={app} onClick={() => setPaymentApp(app)} variant={paymentApp === app ? 'primary' : 'secondary'} size="sm">{app}</Button>)}</div><TextInput value={upiId} onChange={(event) => setUpiId(event.target.value)} className="mt-3 w-full" placeholder="yourname@upi" /><p className="body-text mt-3 rounded-xl border border-dashed border-slate-300 p-4 text-slate-500">UPI payment details will appear when gateway checkout is connected.</p></div>}
            {paymentMethod === 'COD' && <p className="body-text mt-4 rounded-2xl bg-[#fbf8f4] p-4 text-slate-600">Please keep exact amount ready at delivery.</p>}
            </CardContent>
          </Card>
          {error && <p className="body-text rounded-xl bg-rose/10 p-3 text-rose">{error}</p>}
        </div>
        <PriceSummary cart={cart} cta={placing ? 'Placing...' : 'Place Order'} onAction={placeOrder} />
      </div>
      <div className="fixed bottom-16 left-0 right-0 z-40 flex items-center justify-between border-t border-slate-200 bg-white p-3 md:hidden"><span className="price">Rs. {cart.finalAmount}</span><Button onClick={placeOrder} variant="accent">{placing ? 'Placing...' : 'Place Order'}</Button></div>
    </section>
  );
}
