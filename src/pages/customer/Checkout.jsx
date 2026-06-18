import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import OrderSummary from '../../components/checkout/OrderSummary';
import PriceSummary from '../../components/cart/PriceSummary';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, TextInput } from '../../components/ui';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { AddressForm } from './AddressManagement';
import { getPrimaryImageUrl, normalizeImageUrl } from '../../services/normalize';

const emptyAddress = {
  fullName: '',
  mobile: '',
  pincode: '',
  state: 'Rajasthan',
  city: 'Jaipur',
  houseNo: '',
  area: '',
  landmark: '',
  addressType: 'Home',
  isDefault: false,
};

export default function Checkout({ navigate }) {
  const cart = useCart();
  const { setToast, user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState('');
  const [addressForm, setAddressForm] = useState({ ...emptyAddress, fullName: user?.name || '', mobile: user?.phone || '' });
  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [paymentApp, setPaymentApp] = useState('Google Pay');
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const [mobileStep, setMobileStep] = useState(2);
  const [showMobileAddressSelector, setShowMobileAddressSelector] = useState(false);

  const loadAddresses = async (preferredAddressId) => {
    try {
      const items = await api.get('/user/addresses');
      const nextAddresses = Array.isArray(items) ? items : [];
      setAddresses(nextAddresses);
      setSelectedAddressId((current) => {
        const requestedAddressId = preferredAddressId && nextAddresses.some((item) => item._id === preferredAddressId)
          ? preferredAddressId
          : '';
        if (requestedAddressId) return requestedAddressId;
        if (current && nextAddresses.some((item) => item._id === current)) return current;
        const selected = nextAddresses.find((item) => item.isDefault) || nextAddresses[0];
        return selected?._id || '';
      });
      return nextAddresses;
    } catch {
      return [];
    }
  };

  useEffect(() => { loadAddresses(); }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const onChange = (event) => setIsMobile(event.matches);
    media.addEventListener('change', onChange);
    setIsMobile(media.matches);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileStep(2);
      setShowMobileAddressSelector(false);
      setShowAddressForm(false);
      setEditingAddressId('');
    }
  }, [isMobile]);

  const selectedAddress = addresses.find((item) => item._id === selectedAddressId);
  const deliveryWindow = useMemo(() => getDeliveryWindow(), []);

  const resetAddressEditor = () => {
    setShowAddressForm(false);
    setEditingAddressId('');
    setAddressForm({ ...emptyAddress, fullName: user?.name || '', mobile: user?.phone || '' });
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    setError('');
    setSavingAddress(true);
    try {
      const savedAddress = editingAddressId
        ? await api.put(`/user/addresses/${editingAddressId}`, addressForm)
        : await api.post('/user/addresses', addressForm);
      resetAddressEditor();
      await loadAddresses(savedAddress?._id || editingAddressId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingAddress(false);
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
      image: getPrimaryImageUrl(item.product.images),
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

  const openNewAddressForm = () => {
    setError('');
    setEditingAddressId('');
    setAddressForm({ ...emptyAddress, fullName: user?.name || '', mobile: user?.phone || '' });
    setShowAddressForm(true);
  };

  const openEditAddressForm = (address) => {
    setError('');
    setEditingAddressId(address._id);
    setAddressForm({
      ...emptyAddress,
      ...address,
      mobile: address.mobile || address.phone || '',
      houseNo: address.houseNo || address.houseNumber || '',
    });
    setShowAddressForm(true);
  };

  const removeAddress = async (addressId) => {
    setError('');
    try {
      await api.delete(`/user/addresses/${addressId}`);
      if (selectedAddressId === addressId) setSelectedAddressId('');
      if (editingAddressId === addressId) resetAddressEditor();
      await loadAddresses();
    } catch (err) {
      setError(err.message);
    }
  };

  const continueToPayment = () => {
    setError('');
    if (!selectedAddress) {
      setError('Please select or add a delivery address.');
      return;
    }
    setShowMobileAddressSelector(false);
    setShowAddressForm(false);
    setEditingAddressId('');
    setMobileStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmSelectedAddress = () => {
    setError('');
    if (!selectedAddress) {
      setError('Please select a delivery address.');
      return;
    }
    setShowMobileAddressSelector(false);
    setShowAddressForm(false);
    setEditingAddressId('');
  };

  if (isMobile) {
    return (
      <section className="min-h-screen bg-[#f6f7fb] pb-28">
        {mobileStep === 2 ? (
          showMobileAddressSelector ? (
            <MobileAddressSelector
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              setSelectedAddressId={setSelectedAddressId}
              showAddressForm={showAddressForm}
              addressForm={addressForm}
              setAddressForm={setAddressForm}
              saveAddress={saveAddress}
              openNewAddressForm={openNewAddressForm}
              openEditAddressForm={openEditAddressForm}
              removeAddress={removeAddress}
              onBack={() => {
                resetAddressEditor();
                setShowMobileAddressSelector(false);
              }}
              onConfirm={confirmSelectedAddress}
              onCancelForm={resetAddressEditor}
              error={error}
              editing={Boolean(editingAddressId)}
              savingAddress={savingAddress}
            />
          ) : (
            <MobileAddressSummary
              navigate={navigate}
              selectedAddress={selectedAddress}
              cartItems={cart.items}
              deliveryWindow={deliveryWindow}
              onChange={() => {
                setError('');
                setShowMobileAddressSelector(true);
              }}
              onContinue={continueToPayment}
              error={error}
            />
          )
        ) : (
          <MobilePaymentStep
            navigate={navigate}
            cart={cart}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            applyCoupon={applyCoupon}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            paymentApp={paymentApp}
            setPaymentApp={setPaymentApp}
            upiId={upiId}
            setUpiId={setUpiId}
            placeOrder={placeOrder}
            placing={placing}
            error={error}
            onBack={() => setMobileStep(2)}
          />
        )}
      </section>
    );
  }

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
              {showAddressForm || !addresses.length ? <div className="mt-4"><AddressForm form={addressForm} setForm={setAddressForm} onSubmit={saveAddress} message={error} onCancel={() => setShowAddressForm(false)} saving={savingAddress} /></div> : null}
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

function MobileAddressSummary({ navigate, selectedAddress, cartItems, deliveryWindow, onChange, onContinue, error }) {
  return (
    <>
      <MobileStepHeader title="Address" stepLabel="Step 2/3" onBack={() => navigate('/cart')} />
      <div className="mx-auto w-full max-w-[470px] bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.06)]">
        <div className="border-t border-slate-200 bg-white px-5 py-6">
          {selectedAddress ? (
            <SelectedAddressCard address={selectedAddress} onChange={onChange} />
          ) : (
            <button
              type="button"
              onClick={onChange}
              className="w-full rounded-[6px] border border-slate-300 px-4 py-4 text-center text-[14px] font-bold uppercase tracking-[0.02em] text-[#1f2a44]"
            >
              Select Address
            </button>
          )}
        </div>

        <div className="bg-[#f5f5f6] px-5 py-3">
          <p className="text-[12px] font-bold uppercase tracking-[0.03em] text-[#4b5563]">Delivery Estimates</p>
        </div>

        <div className="bg-white">
          {cartItems.map((item, index) => (
            <DeliveryEstimateRow
              key={item.cartKey || `${item.product._id || item.product.id}-${item.size || ''}-${item.color || ''}`}
              item={item}
              deliveryWindow={deliveryWindow}
              bordered={index !== cartItems.length - 1}
            />
          ))}
        </div>

        {error && <p className="mx-5 mt-4 rounded-xl bg-rose/10 px-4 py-3 text-[13px] font-medium text-rose">{error}</p>}
      </div>

      <MobileBottomAction label="Continue" onClick={onContinue} />
    </>
  );
}

function MobileAddressSelector({
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  showAddressForm,
  addressForm,
  setAddressForm,
  saveAddress,
  openNewAddressForm,
  openEditAddressForm,
  removeAddress,
  onBack,
  onConfirm,
  onCancelForm,
  error,
  editing,
  savingAddress,
}) {
  return (
    <>
      {showAddressForm ? (
        <div className="min-h-screen bg-[#f6f7fb]">
          <div className="mx-auto w-full max-w-[470px] bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.06)]">
            <AddressForm
              form={addressForm}
              setForm={setAddressForm}
              onSubmit={saveAddress}
              message={error}
              editing={editing}
              onCancel={onCancelForm}
              saving={savingAddress}
            />
          </div>
        </div>
      ) : (
        <>
          <MobileStepHeader title="Select Address" onBack={onBack} />
          <div className="mx-auto w-full max-w-[470px] bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.06)]">
            <div className="border-t border-slate-200 bg-white px-4 py-4">
              <button
                type="button"
                onClick={openNewAddressForm}
                className="flex h-11 w-full items-center justify-center rounded-[4px] border border-[#8c94a6] text-[14px] font-bold uppercase tracking-[0.02em] text-[#1f2a44]"
              >
                Add New Address
              </button>
            </div>

            <div className="bg-[#f5f5f6] px-5 py-3">
              <p className="text-[12px] font-bold uppercase tracking-[0.03em] text-[#4b5563]">Default Address</p>
            </div>

            <div className="bg-white">
              {addresses.length ? (
                addresses.map((address) => (
                  <SelectableAddressCard
                    key={address._id}
                    address={address}
                    selected={selectedAddressId === address._id}
                    onSelect={() => setSelectedAddressId(address._id)}
                    onEdit={() => openEditAddressForm(address)}
                    onRemove={() => removeAddress(address._id)}
                  />
                ))
              ) : (
                <p className="px-5 py-6 text-[13px] text-slate-500">No saved addresses yet.</p>
              )}
            </div>

            {error && <p className="px-5 py-4 text-[13px] font-medium text-rose">{error}</p>}
          </div>

          <MobileBottomAction label="Confirm" onClick={onConfirm} />
        </>
      )}
    </>
  );
}

function MobilePaymentStep({
  navigate,
  cart,
  couponCode,
  setCouponCode,
  applyCoupon,
  paymentMethod,
  setPaymentMethod,
  paymentApp,
  setPaymentApp,
  upiId,
  setUpiId,
  placeOrder,
  placing,
  error,
  onBack,
}) {
  return (
    <>
      <MobileStepHeader title="Payment" stepLabel="Step 3/3" onBack={onBack} />
      <div className="mx-auto w-full max-w-[470px] space-y-4 bg-[#f6f7fb] px-0 pb-28">
        <Card className="rounded-none border-x-0 border-t-0 shadow-none">
          <CardHeader><CardTitle className="text-[16px]">Order Summary</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {cart.items.map((item) => (
              <div key={item.cartKey || `${item.product._id || item.product.id}-${item.size || ''}-${item.color || ''}`} className="flex justify-between gap-3 text-[14px]">
                <span className="text-slate-600">{item.product.name} x {item.quantity}</span>
                <span className="font-bold text-[#1f2a44]">Rs. {item.product.price * item.quantity}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-none border-x-0 shadow-none">
          <CardHeader><CardTitle className="text-[16px]">Apply Coupon</CardTitle></CardHeader>
          <CardContent>
            <div className="mt-4 flex gap-2">
              <TextInput value={couponCode} onChange={(event) => setCouponCode(event.target.value)} className="flex-1" placeholder="Coupon code" />
              <Button onClick={applyCoupon}>Apply</Button>
            </div>
            {cart.coupon && <p className="mt-2 text-[13px] font-semibold text-emerald-600">{cart.coupon.code} applied: Rs. {cart.coupon.discount}</p>}
          </CardContent>
        </Card>

        <Card className="rounded-none border-x-0 shadow-none">
          <CardHeader><CardTitle className="text-[16px]">Payment Method</CardTitle></CardHeader>
          <CardContent>
            <div className="mt-4 grid gap-3">
              {[
                ['UPI', 'Pay using UPI', 'Google Pay, PhonePe, Paytm and other UPI apps'],
                ['CARD', 'Credit / Debit Card', 'Secure card payment through Razorpay checkout'],
                ['NETBANKING', 'Net Banking', 'Bank selection through gateway'],
                ['WALLET', 'Wallet', 'Paytm Wallet and other wallets ready'],
                ['COD', 'Cash on Delivery', 'Pay when the product is delivered'],
              ].map(([key, title, note]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPaymentMethod(key)}
                  className={`rounded-2xl border p-4 text-left ${paymentMethod === key ? 'border-wine bg-blush' : 'border-slate-200 bg-white'}`}
                >
                  <p className="label-text">{title}</p>
                  <p className="body-text mt-1 text-slate-500">{note}</p>
                </button>
              ))}
            </div>
            {paymentMethod === 'UPI' && <div className="mt-4 rounded-2xl bg-[#fbf8f4] p-4"><div className="flex flex-wrap gap-2">{['Google Pay', 'PhonePe', 'Paytm', 'Other UPI Apps'].map((app) => <Button key={app} onClick={() => setPaymentApp(app)} variant={paymentApp === app ? 'primary' : 'secondary'} size="sm">{app}</Button>)}</div><TextInput value={upiId} onChange={(event) => setUpiId(event.target.value)} className="mt-3 w-full" placeholder="yourname@upi" /><p className="body-text mt-3 rounded-xl border border-dashed border-slate-300 p-4 text-slate-500">UPI payment details will appear when gateway checkout is connected.</p></div>}
            {paymentMethod === 'COD' && <p className="body-text mt-4 rounded-2xl bg-[#fbf8f4] p-4 text-slate-600">Please keep exact amount ready at delivery.</p>}
          </CardContent>
        </Card>

        <div className="px-4">
          <PriceSummary cart={cart} cta={placing ? 'Placing...' : 'Place Order'} onAction={placeOrder} />
        </div>

        {error && <p className="mx-4 rounded-xl bg-rose/10 p-3 text-[13px] text-rose">{error}</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[12px] uppercase tracking-[0.04em] text-slate-500">Total</p>
            <p className="text-[18px] font-bold text-[#1f2a44]">Rs. {cart.finalAmount}</p>
          </div>
          <Button onClick={placeOrder} variant="accent" className="h-14 min-w-[180px] rounded-[4px] text-[14px] font-bold uppercase tracking-[0.05em]">
            {placing ? 'Placing...' : 'Place Order'}
          </Button>
        </div>
      </div>
    </>
  );
}

function MobileStepHeader({ title, stepLabel, onBack }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-[470px] items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack} className="text-slate-600" aria-label="Back">
            <ArrowLeft className="h-7 w-7 stroke-[1.75]" />
          </button>
          <h1 className="text-[16px] font-semibold uppercase tracking-[0.02em] text-[#4b5563]">{title}</h1>
        </div>
        {stepLabel ? <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6b7280]">{stepLabel}</span> : null}
      </div>
    </header>
  );
}

function SelectedAddressCard({ address, onChange }) {
  const label = (address.addressType || 'Home').toUpperCase();

  return (
    <div className="text-[#1f2a44]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-bold">{address.fullName}</span>
            {address.isDefault ? <span className="text-[14px] text-slate-400">(Default)</span> : null}
            <Badge className="rounded-full border border-[#0cc3a1] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[#0ca78a]">
              {label}
            </Badge>
          </div>
          <div className="mt-2 space-y-0.5 text-[13px] leading-[1.35] text-[#24314d]">
            {buildAddressLines(address).map((line) => <p key={line}>{line}</p>)}
          </div>
          <p className="mt-3 text-[13px] text-[#24314d]">Mobile: <span className="text-[15px] font-bold">{address.mobile || address.phone}</span></p>
        </div>
        <button type="button" onClick={onChange} className="pt-1 text-[14px] font-bold text-rose">
          Change
        </button>
      </div>
    </div>
  );
}

function SelectableAddressCard({ address, selected, onSelect, onEdit, onRemove }) {
  const label = (address.addressType || 'Home').toUpperCase();

  return (
    <div className="px-5 py-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onSelect}
          className={`mt-1 h-5 w-5 rounded-full border-2 ${selected ? 'border-rose' : 'border-slate-300'} flex items-center justify-center`}
          aria-label={`Select ${address.fullName} address`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${selected ? 'bg-rose' : 'bg-transparent'}`} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-bold text-[#1f2a44]">{address.fullName}</span>
            <Badge className="rounded-full border border-[#0cc3a1] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[#0ca78a]">
              {label}
            </Badge>
          </div>
          <div className="mt-3 space-y-0.5 pl-0 text-[13px] leading-[1.35] text-[#24314d]">
            {buildAddressLines(address).map((line) => <p key={line}>{line}</p>)}
          </div>
          <p className="mt-3 text-[13px] text-[#24314d]">Mobile: <span className="text-[15px] font-bold">{address.mobile || address.phone}</span></p>
          <div className="mt-4 flex gap-4">
            <button
              type="button"
              onClick={onRemove}
              className="flex h-10 min-w-[104px] items-center justify-center rounded-[6px] border border-[#8c94a6] px-4 text-[14px] font-bold uppercase tracking-[0.02em] text-[#1f2a44]"
            >
              Remove
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="flex h-10 min-w-[72px] items-center justify-center rounded-[6px] border border-[#8c94a6] px-4 text-[14px] font-bold uppercase tracking-[0.02em] text-[#1f2a44]"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeliveryEstimateRow({ item, deliveryWindow, bordered }) {
  const image = getPrimaryImageUrl(item.product.images);

  return (
    <div className={`flex items-center gap-4 px-5 py-5 ${bordered ? 'border-b border-slate-100' : ''}`}>
      <div className="h-16 w-12 shrink-0 overflow-hidden bg-[#f6efe8]">
        {image ? (
          <img src={normalizeImageUrl(image)} alt={item.product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[#f3e5d7]" />
        )}
      </div>
      <p className="text-[14px] leading-[1.4] text-[#1f2a44]">
        Delivery between <span className="font-bold">{deliveryWindow}</span>
      </p>
    </div>
  );
}

function MobileBottomAction({ label, onClick }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.08)]">
      <div className="mx-auto w-full max-w-[470px]">
        <Button onClick={onClick} variant="accent" className="h-14 w-full rounded-[4px] text-[14px] font-bold uppercase tracking-[0.05em]">
          {label}
        </Button>
      </div>
    </div>
  );
}

function buildAddressLines(address) {
  const lines = [];
  if (address.houseNo || address.houseNumber) lines.push(address.houseNo || address.houseNumber);
  if (address.area) lines.push(address.area);
  const cityStateLine = [address.city, address.state, address.pincode].filter(Boolean).join(', ').replace(/, ([^,]+)$/, ' $1');
  if (cityStateLine) lines.push(cityStateLine);
  return lines;
}

function getDeliveryWindow() {
  const start = new Date();
  start.setDate(start.getDate() + 5);
  const end = new Date();
  end.setDate(end.getDate() + 7);
  const startLabel = start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const endLabel = end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  return `${startLabel} - ${endLabel}`;
}
