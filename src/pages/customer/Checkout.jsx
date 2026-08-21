import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  ChevronDown,
  CreditCard,
  Headphones,
  Landmark,
  LockKeyhole,
  MapPin,
  Minus,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
  Trash2,
  Wallet,
} from 'lucide-react';
import PriceSummary from '../../components/cart/PriceSummary';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, TextInput } from '../../components/ui';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { openRazorpayCheckout } from '../../utils/razorpayCheckout';
import { trackEvent } from '../../utils/analytics';
import { AddressForm } from './AddressManagement';
import { getPrimaryImageUrl, normalizeImageUrl } from '../../services/normalize';
import useDesktopFeedback from '../../hooks/useDesktopFeedback';
import './Checkout.css';

const PAYMENT_METHOD_NOTES = {
  UPI: 'Razorpay checkout — Google Pay, PhonePe, Paytm and other UPI apps',
  CARD: 'Secure card payment through Razorpay checkout',
  NETBANKING: 'Bank selection through Razorpay checkout',
  WALLET: 'Paytm Wallet and other wallets via Razorpay',
  COD: 'Pay when the product is delivered — no online payment',
};

function describePaymentOption(option) {
  if (option.disabledReason) return option.disabledReason;
  if (option.key === 'COD' && option.charge > 0) {
    return `${PAYMENT_METHOD_NOTES.COD} (Rs. ${option.charge} handling fee)`;
  }
  return PAYMENT_METHOD_NOTES[option.key] || '';
}

function getPlaceOrderLabel(paymentMethod, placing) {
  if (placing) return paymentMethod === 'COD' ? 'Placing order...' : 'Opening payment...';
  return paymentMethod === 'COD' ? 'Place COD Order' : 'Pay Now';
}

function OnlinePaymentNote({ paymentMethod, paymentApp, setPaymentApp, upiId, setUpiId }) {
  if (paymentMethod === 'UPI') {
    return (
      <div className="mt-4 rounded-2xl bg-[#fbf8f4] p-4">
        <div className="flex flex-wrap gap-2">
          {['Google Pay', 'PhonePe', 'Paytm', 'Other UPI Apps'].map((app) => (
            <Button key={app} onClick={() => setPaymentApp(app)} variant={paymentApp === app ? 'primary' : 'secondary'} size="sm">{app}</Button>
          ))}
        </div>
        <TextInput value={upiId} onChange={(event) => setUpiId(event.target.value)} className="mt-3 w-full" placeholder="yourname@upi (optional)" />
        <p className="body-text mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          Click <strong>Pay Now</strong> to open the secure Razorpay payment window.
        </p>
      </div>
    );
  }

  if (paymentMethod !== 'COD') {
    return (
      <p className="body-text mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
        Click <strong>Pay Now</strong> to open the secure Razorpay payment window.
      </p>
    );
  }

  return <p className="body-text mt-4 rounded-2xl bg-[#fbf8f4] p-4 text-slate-600">Please keep exact amount ready at delivery.</p>;
}

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
  const { isDesktop, notify } = useDesktopFeedback();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState('');
  const [addressForm, setAddressForm] = useState({ ...emptyAddress, fullName: user?.name || '', mobile: user?.phone || '' });
  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [paymentApp, setPaymentApp] = useState('Google Pay');
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const [mobileStep, setMobileStep] = useState(2);
  const [showMobileAddressSelector, setShowMobileAddressSelector] = useState(false);

  useEffect(() => {
    trackEvent('BEGIN_CHECKOUT');
  }, []);
  const showFeedback = (text, type = 'error') => {
    if (!text) return;
    if (!notify(text, type, 'Checkout')) {
      setError(text);
    }
  };

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

  // Which payment methods exist is decided by the store settings, not the UI.
  useEffect(() => {
    let alive = true;
    api.get('/settings/payment-methods')
      .then((data) => {
        if (!alive) return;
        const methods = Array.isArray(data?.methods) ? data.methods : [];
        setPaymentOptions(methods);
        setPaymentMethod((current) => {
          if (current && methods.some((option) => option.key === current && option.enabled)) return current;
          return methods.find((option) => option.enabled)?.key || '';
        });
      })
      .catch(() => {
        if (alive) setPaymentOptions([]);
      });
    return () => { alive = false; };
  }, []);

  const cartSignature = cart.items
    .map((item) => `${item.product._id || item.product.id}:${item.quantity}:${item.size || ''}:${item.color || ''}`)
    .join('|');

  // Totals always come from the backend so delivery, COD fee and coupon
  // discount match exactly what the order will be created with.
  useEffect(() => {
    if (!cart.items.length || !paymentMethod) {
      setQuote(null);
      setQuoteError('');
      return undefined;
    }

    let alive = true;
    setQuoteError('');
    api.post('/orders/quote', {
      orderItems: buildOrderItems(cart.items),
      coupon: cart.coupon,
      paymentMethod,
    })
      .then((data) => {
        if (!alive) return;
        setQuote(data?.totals || null);
        setQuoteError(data?.totals ? '' : 'Unable to calculate order totals. Please refresh and try again.');
      })
      .catch((err) => {
        if (!alive) return;
        setQuote(null);
        setQuoteError(err.message || 'Unable to calculate order totals. Please refresh and try again.');
      });

    return () => { alive = false; };
  }, [cartSignature, paymentMethod, cart.coupon?.code]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const placeOrderLabel = getPlaceOrderLabel(paymentMethod, placing);

  // Backend quote wins; the cart figures are only a placeholder while it loads.
  const summary = useMemo(() => ({
    items: cart.items,
    totalMRP: quote?.totalMRP ?? cart.totalMRP,
    discount: quote?.productDiscount ?? cart.discount,
    couponDiscount: quote?.couponDiscount ?? cart.couponDiscount,
    deliveryCharge: quote?.deliveryCharge ?? cart.deliveryCharge,
    codCharge: quote?.codCharge ?? 0,
    finalAmount: quote?.finalAmount ?? cart.finalAmount,
  }), [cart.couponDiscount, cart.deliveryCharge, cart.discount, cart.finalAmount, cart.items, cart.totalMRP, quote]);

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
      showFeedback(err.message, 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const applyCoupon = async () => {
    setError('');
    try {
      const data = await api.post('/coupons/apply', {
        code: couponCode,
        cartTotal: cart.sellingTotal,
        paymentMethod,
        items: cart.items.map((item) => ({
          product: item.product._id || item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          category: item.product.category?._id || item.product.category,
        })),
      });
      cart.setCoupon({ code: data.couponCode, discount: data.discountAmount });
      trackEvent('COUPON_APPLIED');
      setToast(data.message);
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  const orderPayload = () => ({
    orderItems: buildOrderItems(cart.items),
    shippingAddress: selectedAddress,
    paymentMethod,
    coupon: cart.coupon ? { code: cart.coupon.code } : undefined,
    attribution: JSON.parse(sessionStorage.getItem('samira_attribution') || '{}'),
  });

  const placeOrder = async () => {
    setError('');
    if (!user) return navigate('/login');
    if (!user.isPhoneVerified) return showFeedback('Please verify your mobile number to continue checkout.', 'warning');
    if (!cart.items.length) return showFeedback('Your cart is empty.', 'warning');
    if (!selectedAddress) return showFeedback('Please select or add a delivery address.', 'warning');
    if (!paymentMethod) return showFeedback('Please choose a payment method.', 'warning');
    if (!quote) return showFeedback(quoteError || 'Please wait while we calculate your order total.', 'warning');
    setPlacing(true);

    const payload = orderPayload();
    let pendingPayment = null;

    try {
      if (paymentMethod === 'COD') {
        const order = await api.post('/orders/cod', payload);
        cart.clearCart();
        setToast('COD order placed successfully');
        navigate(`/order-success?id=${order._id}`);
        return;
      }

      pendingPayment = await api.post('/payments/create-order', payload);
      const razorpayOrderId = pendingPayment.razorpayOrderId || pendingPayment.order_id;
      const razorpayKey = pendingPayment.keyId || process.env.REACT_APP_RAZORPAY_KEY_ID;

        if (!razorpayOrderId || !razorpayKey) {
          throw new Error('Online payment is not configured. Please use Cash on Delivery.');
        }

      await openRazorpayCheckout({
        key: razorpayKey,
        amount: pendingPayment.amount,
        currency: pendingPayment.currency,
        orderId: razorpayOrderId,
        name: selectedAddress?.fullName || user?.name,
        email: user?.email,
        contact: selectedAddress?.mobile || user?.phone,
        onSuccess: async (response) => {
          // The backend finalises the order it already stored; nothing about
          // the items or amounts is resent from the browser.
          const result = await api.post('/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          cart.clearCart();
          setToast('Payment successful');
          navigate(`/order-success?id=${result.order._id}`);
        },
        onDismiss: async () => {
          setError('Payment cancelled. You can retry or choose Cash on Delivery.');
          if (pendingPayment?.razorpayOrderId) {
            await api.post('/payments/failure', {
              reason: 'Payment cancelled by customer',
              razorpayOrderId: pendingPayment.razorpayOrderId,
            }).catch(() => null);
          }
        },
      });
    } catch (err) {
      if (paymentMethod !== 'COD') {
        const reason = err.message === 'Payment cancelled'
          ? 'Payment cancelled by customer'
          : err.message;

        try {
          await api.post('/payments/failure', {
            reason,
            razorpayOrderId: pendingPayment?.razorpayOrderId,
          });
        } catch {
          // ignore logging failure
        }

        if (err.message !== 'Payment cancelled') {
          navigate('/payment-failed');
          return;
        }
      }
        showFeedback(err.message === 'Payment cancelled'
          ? 'Payment cancelled. You can retry or choose Cash on Delivery.'
          : err.message === 'Razorpay is not configured. Use COD or add payment keys in .env.'
            ? 'Online payment is not configured. Please use Cash on Delivery.'
            : err.message, 'error');
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
      showFeedback(err.message, 'error');
    }
  };

  const continueToPayment = () => {
    setError('');
    if (!selectedAddress) {
      showFeedback('Please select or add a delivery address.', 'warning');
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
      showFeedback('Please select a delivery address.', 'warning');
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
            summary={summary}
            paymentOptions={paymentOptions}
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
            placeOrderLabel={placeOrderLabel}
            error={error}
            quoteError={quoteError}
            quoteReady={Boolean(quote)}
            onBack={() => setMobileStep(2)}
          />
        )}
      </section>
    );
  }

  return (
    <DesktopCheckout
      navigate={navigate}
      user={user}
      cart={cart}
      summary={summary}
      paymentOptions={paymentOptions}
      addresses={addresses}
      selectedAddressId={selectedAddressId}
      setSelectedAddressId={setSelectedAddressId}
      showAddressForm={showAddressForm}
      setShowAddressForm={setShowAddressForm}
      addressForm={addressForm}
      setAddressForm={setAddressForm}
      saveAddress={saveAddress}
      savingAddress={savingAddress}
      editing={Boolean(editingAddressId)}
      openNewAddressForm={openNewAddressForm}
      openEditAddressForm={openEditAddressForm}
      removeAddress={removeAddress}
      resetAddressEditor={resetAddressEditor}
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
      placeOrderLabel={placeOrderLabel}
      error={isDesktop ? error : ''}
      quoteError={isDesktop ? quoteError : ''}
      quoteReady={Boolean(quote)}
    />
  );
}

function DesktopCheckout({
  navigate,
  user,
  cart,
  summary,
  paymentOptions,
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  showAddressForm,
  setShowAddressForm,
  addressForm,
  setAddressForm,
  saveAddress,
  savingAddress,
  editing,
  openNewAddressForm,
  openEditAddressForm,
  removeAddress,
  resetAddressEditor,
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
  placeOrderLabel,
  error,
  quoteError,
  quoteReady,
}) {
  const needsLogin = !user;
  const needsVerification = Boolean(user && !user.isPhoneVerified);

  return (
    <section className="sc-checkout">
      <div className="sc-checkout__shell">
        <div className="sc-checkout__top">
          <h1>Checkout</h1>
          <CheckoutSteps />
          <button type="button" className="sc-checkout__support" onClick={() => navigate('/contact')}>
            <Headphones size={15} aria-hidden="true" />
            Need help? Contact Support
          </button>
        </div>

        {needsLogin || needsVerification ? (
          <div className="sc-checkout__notice">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>{needsLogin ? 'Please login to continue checkout.' : 'Please verify your mobile number to continue checkout.'}</span>
            <button type="button" onClick={() => navigate('/login')}>{needsLogin ? 'Login' : 'Verify Mobile'}</button>
          </div>
        ) : null}

        <div className="sc-checkout__layout">
          <main className="sc-checkout__main">
            <section className="sc-checkout__card">
              <SectionTitle number="1" icon={MapPin} title="Delivery Address">
                <button type="button" className="sc-checkout__outline-btn" onClick={openNewAddressForm}>
                  <Plus size={14} aria-hidden="true" />
                  Add New Address
                </button>
              </SectionTitle>

              {showAddressForm || !addresses.length ? (
                <div className="sc-checkout__address-form">
                  <AddressForm
                    form={addressForm}
                    setForm={setAddressForm}
                    onSubmit={saveAddress}
                    message={error}
                    editing={editing}
                    onCancel={() => {
                      resetAddressEditor();
                      if (addresses.length) setShowAddressForm(false);
                    }}
                    saving={savingAddress}
                  />
                </div>
              ) : (
                <div className="sc-checkout__address-grid">
                  {addresses.slice(0, 4).map((address) => (
                    <DesktopAddressCard
                      key={address._id}
                      address={address}
                      selected={selectedAddressId === address._id}
                      onSelect={() => setSelectedAddressId(address._id)}
                      onEdit={() => openEditAddressForm(address)}
                      onRemove={() => removeAddress(address._id)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="sc-checkout__card">
              <SectionTitle number="2" icon={ShoppingBag} title="Order Summary" />
              {cart.items.length ? (
                <div className="sc-checkout__items">
                  {cart.items.map((item) => (
                    <DesktopOrderItem
                      key={item.cartKey || `${item.product._id || item.product.id}-${item.size}-${item.color}`}
                      item={item}
                      onIncrease={() => cart.increaseQuantity(item.cartKey || item.product, { cartKey: item.cartKey })}
                      onDecrease={() => cart.decreaseQuantity(item.cartKey || item.product, { cartKey: item.cartKey })}
                      onRemove={() => cart.removeFromCart(item.cartKey || item.product, { cartKey: item.cartKey })}
                    />
                  ))}
                </div>
              ) : (
                <div className="sc-checkout__empty">
                  <p>Your bag is empty.</p>
                  <button type="button" onClick={() => navigate('/products')}>Continue Shopping</button>
                </div>
              )}
            </section>

            <section className="sc-checkout__card sc-checkout__coupon">
              <SectionTitle number="3" icon={Tag} title="Coupon / Offers" />
              <div className="sc-checkout__coupon-row">
                <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Enter coupon code" />
                <button type="button" onClick={applyCoupon}>Apply Coupon</button>
                <button type="button" className="sc-checkout__offer-link" onClick={() => navigate('/products?discount=20')}>
                  View Available Offers
                  <ChevronDown size={13} aria-hidden="true" />
                </button>
              </div>
              {cart.coupon ? <p className="sc-checkout__coupon-success">{cart.coupon.code} applied: ₹{formatAmount(cart.coupon.discount)}</p> : null}
            </section>

            <section className="sc-checkout__card">
              <SectionTitle number="4" icon={CreditCard} title="Payment Method" />
              <div className="sc-checkout__payment">
                {paymentOptions.length ? (
                  <div className="sc-checkout__payment-tabs">
                    {paymentOptions.map((option) => {
                      const Icon = paymentIconFor(option.key);
                      return (
                        <button
                          key={option.key}
                          type="button"
                          disabled={!option.enabled}
                          title={option.disabledReason || undefined}
                          className={paymentMethod === option.key ? 'is-active' : ''}
                          onClick={() => option.enabled && setPaymentMethod(option.key)}
                        >
                          <Icon size={14} aria-hidden="true" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="sc-checkout__payment-copy">Loading payment options...</p>
                )}
                <div className="sc-checkout__payment-panel">
                  {paymentMethod === 'UPI' ? (
                    <>
                      <div className="sc-checkout__app-row">
                        {['Google Pay', 'PhonePe', 'Paytm', 'Other UPI Apps'].map((app) => (
                          <button key={app} type="button" className={paymentApp === app ? 'is-active' : ''} onClick={() => setPaymentApp(app)}>{app}</button>
                        ))}
                      </div>
                      <input value={upiId} onChange={(event) => setUpiId(event.target.value)} placeholder="Enter your UPI ID (e.g. name@upi)" />
                    </>
                  ) : (
                    <p className="sc-checkout__payment-copy">{paymentCopyFor(paymentMethod)}</p>
                  )}
                  {paymentMethod === 'COD' && summary.codCharge > 0 ? (
                    <p className="sc-checkout__payment-copy">A Rs. {summary.codCharge} Cash on Delivery handling fee is added to this order.</p>
                  ) : null}
                  <p className="sc-checkout__secure-note">
                    <ShieldCheck size={14} aria-hidden="true" />
                    {paymentMethod === 'COD' ? 'Please keep exact amount ready at delivery.' : 'You will be redirected to a secure payment page to complete the transaction.'}
                  </p>
                </div>
              </div>
            </section>
          </main>

          <aside className="sc-checkout__side">
            <DesktopPriceSummary summary={summary} cta={placeOrderLabel} placing={placing} quoteReady={quoteReady} onAction={placeOrder} />
            <DesktopAssurance />
          </aside>
        </div>

        {error ? <p className="sc-checkout__error">{error}</p> : null}
        {quoteError ? <p className="sc-checkout__error">{quoteError}</p> : null}
      </div>
    </section>
  );
}

function CheckoutSteps() {
  return (
    <div className="sc-checkout__steps" aria-label="Checkout steps">
      {[
        ['1', 'Bag', true],
        ['2', 'Address', true],
        ['3', 'Payment', false],
      ].map(([number, label, active]) => (
        <div key={label} className={active ? 'is-active' : ''}>
          <span>{number}</span>
          <strong>{label}</strong>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ number, icon: Icon, title, children }) {
  return (
    <div className="sc-checkout__section-head">
      <h2>
        <Icon size={16} aria-hidden="true" />
        {number}. {title}
      </h2>
      {children}
    </div>
  );
}

function DesktopAddressCard({ address, selected, onSelect, onEdit, onRemove }) {
  const lines = buildAddressLines(address);
  return (
    <article className={`sc-checkout__address${selected ? ' is-selected' : ''}`}>
      <button type="button" className="sc-checkout__radio" onClick={onSelect} aria-label={`Deliver to ${address.fullName}`}>
        <span />
      </button>
      <div className="sc-checkout__address-copy">
        <div className="sc-checkout__address-name">
          <strong>{address.fullName || 'Samaira Customer'}</strong>
          <span>{address.addressType || 'Home'}{address.isDefault ? ' (Default)' : ''}</span>
        </div>
        <p>{address.mobile || address.phone || '-'}</p>
        {lines.map((line) => <p key={line}>{line}</p>)}
        <div className="sc-checkout__address-actions">
          <button type="button" onClick={onEdit}><Pencil size={13} aria-hidden="true" /> Edit Address</button>
          <button type="button" onClick={onSelect}>Deliver Here</button>
          <button type="button" onClick={onRemove} className="sc-checkout__remove-address">Remove</button>
        </div>
      </div>
    </article>
  );
}

function DesktopOrderItem({ item, onIncrease, onDecrease, onRemove }) {
  const image = getPrimaryImageUrl(item.product.images);
  return (
    <article className="sc-checkout__item">
      <div className="sc-checkout__item-image">
        {image ? <img src={normalizeImageUrl(image)} alt={item.product.name} /> : <ShoppingBag size={22} aria-hidden="true" />}
      </div>
      <div>
        <h3>{item.product.name}</h3>
        <p>Size: {item.size || '-'} <span>•</span> Qty: {item.quantity}</p>
        <strong>₹{formatAmount(Number(item.product.price || 0) * Number(item.quantity || 1))}</strong>
        <div className="sc-checkout__item-actions">
          <div className="sc-checkout__qty-control" aria-label={`Quantity for ${item.product.name}`}>
            <button type="button" onClick={onDecrease} aria-label="Decrease quantity">
              <Minus size={12} aria-hidden="true" />
            </button>
            <span>{item.quantity}</span>
            <button type="button" onClick={onIncrease} aria-label="Increase quantity">
              <Plus size={12} aria-hidden="true" />
            </button>
          </div>
          <button type="button" className="sc-checkout__remove-item" onClick={onRemove} aria-label={`Remove ${item.product.name}`}>
            <Trash2 size={13} aria-hidden="true" />
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

function DesktopPriceSummary({ summary, cta, placing, quoteReady, onAction }) {
  return (
    <section className="sc-checkout__summary">
      <h2><ShoppingBag size={17} aria-hidden="true" /> Price Summary</h2>
      <SummaryRow label="Total MRP" value={`₹${formatAmount(summary.totalMRP)}`} />
      <SummaryRow label="Discount on MRP" value={`- ₹${formatAmount(summary.discount)}`} success />
      <SummaryRow label="Coupon Discount" value={`- ₹${formatAmount(summary.couponDiscount)}`} success />
      <SummaryRow label="Delivery Charges" value={summary.deliveryCharge ? `₹${formatAmount(summary.deliveryCharge)}` : 'FREE'} success={!summary.deliveryCharge} />
      {summary.codCharge > 0 ? <SummaryRow label="Cash on Delivery Fee" value={`₹${formatAmount(summary.codCharge)}`} /> : null}
      <div className="sc-checkout__grand">
        <span>
          <strong>Grand Total</strong>
          <small>Inclusive of all taxes</small>
        </span>
        <b>₹{formatAmount(summary.finalAmount)}</b>
      </div>
      <button type="button" onClick={onAction} disabled={placing || !quoteReady || !summary.items.length}>
        <LockKeyhole size={15} aria-hidden="true" />
        {cta}
      </button>
      <p><ShieldCheck size={14} aria-hidden="true" /> Safe and secure payments. Easy returns.</p>
    </section>
  );
}

function SummaryRow({ label, value, success }) {
  return (
    <div className="sc-checkout__summary-row">
      <span>{label}</span>
      <strong className={success ? 'is-success' : ''}>{value}</strong>
    </div>
  );
}

function DesktopAssurance() {
  const items = [
    [ShieldCheck, '100% Secure Checkout', 'Your payments are safe with us'],
    [RefreshCcw, 'Easy Returns', 'Hassle-free returns within 7 days'],
    [Truck, 'Free Shipping Above ₹999', 'Enjoy free delivery on orders above ₹999'],
  ];
  return (
    <section className="sc-checkout__assurance">
      {items.map(([Icon, title, text]) => (
        <div key={title}>
          <span><Icon size={20} aria-hidden="true" /></span>
          <strong>{title}</strong>
          <p>{text}</p>
        </div>
      ))}
    </section>
  );
}

function paymentIconFor(key) {
  if (key === 'UPI') return BadgeCheck;
  if (key === 'CARD') return CreditCard;
  if (key === 'NETBANKING') return Landmark;
  if (key === 'WALLET') return Wallet;
  if (key === 'COD') return Banknote;
  return CreditCard;
}

function paymentCopyFor(key) {
  if (key === 'CARD') return 'Your card details will be entered securely in the Razorpay payment window.';
  if (key === 'NETBANKING') return 'Select your bank securely after continuing to payment.';
  if (key === 'WALLET') return 'Pay with supported wallets through secure Razorpay checkout.';
  if (key === 'COD') return 'Pay when your order is delivered to your selected address.';
  return 'Continue to complete your payment securely.';
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString('en-IN');
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

        {error && <p className="mx-5 mt-4 rounded-xl bg-rose/10 px-4 py-3 text-[13px] font-medium text-rose md:hidden">{error}</p>}
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

            {error && <p className="px-5 py-4 text-[13px] font-medium text-rose md:hidden">{error}</p>}
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
  summary,
  paymentOptions,
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
  placeOrderLabel,
  error,
  quoteError,
  quoteReady,
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
              {paymentOptions.length ? paymentOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  disabled={!option.enabled}
                  onClick={() => option.enabled && setPaymentMethod(option.key)}
                  className={`rounded-2xl border p-4 text-left disabled:opacity-50 ${paymentMethod === option.key ? 'border-wine bg-blush' : 'border-slate-200 bg-white'}`}
                >
                  <p className="label-text">{option.label}</p>
                  <p className="body-text mt-1 text-slate-500">{describePaymentOption(option)}</p>
                </button>
              )) : (
                <p className="body-text text-slate-500">Loading payment options...</p>
              )}
            </div>
            <OnlinePaymentNote paymentMethod={paymentMethod} paymentApp={paymentApp} setPaymentApp={setPaymentApp} upiId={upiId} setUpiId={setUpiId} />
          </CardContent>
        </Card>

        <div className="px-4">
          <PriceSummary cart={summary} cta={placeOrderLabel} onAction={placeOrder} />
        </div>

        {error && <p className="mx-4 rounded-xl bg-rose/10 p-3 text-[13px] text-rose">{error}</p>}
        {quoteError && <p className="mx-4 rounded-xl bg-rose/10 p-3 text-[13px] text-rose">{quoteError}</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[12px] uppercase tracking-[0.04em] text-slate-500">Total</p>
            <p className="text-[18px] font-bold text-[#1f2a44]">Rs. {summary.finalAmount}</p>
          </div>
          <Button onClick={placeOrder} disabled={placing || !quoteReady} variant="accent" className="h-14 min-w-[180px] rounded-[4px] text-[14px] font-bold uppercase tracking-[0.05em]">
            {placeOrderLabel}
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

/**
 * Only identifiers and chosen options are sent. Prices come from the
 * database on the server, never from this payload.
 */
function buildOrderItems(items) {
  return items.map((item) => ({
    product: item.product._id || item.product.id,
    size: item.size || '',
    color: item.color || '',
    variantId: item.variantId || '',
    quantity: item.quantity,
  }));
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
