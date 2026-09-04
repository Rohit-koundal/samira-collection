import { useEffect, useMemo, useState } from 'react';
import { Bell, CircleHelp, MapPin, Package2, PackageCheck, Phone, RefreshCcw, Sparkles, Star, UserRound } from 'lucide-react';
import { Button, Card, CardContent } from '../../components/ui';
import api from '../../services/api';
import Receipt from '../../components/order/Receipt';
import ReceiptActions from '../../components/order/ReceiptActions';
import ReviewModal from '../../components/product/ReviewModal';
import { downloadReceiptHtml } from '../../utils/printReceipt';
import { normalizeImageUrl, normalizeProducts } from '../../services/normalize';
import { canCancelOrder, productIdOf } from '../../utils/orderActions';

export default function OrderDetail({ route = '', navigate }) {
  const orderId = new URLSearchParams(route.split('?')[1] || '').get('id');
  const [order, setOrder] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const [returnItem, setReturnItem] = useState(null);
  const [returnForm, setReturnForm] = useState({ type: 'return', reason: '', comment: '', quantity: 1 });
  const [actionMessage, setActionMessage] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [reviewInitialRating, setReviewInitialRating] = useState(0);
  const [cancelBusy, setCancelBusy] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const onChange = (event) => setIsMobile(event.matches);
    media.addEventListener('change', onChange);
    setIsMobile(media.matches);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!orderId) return setError('Order not found.');
    api.get(`/orders/${orderId}`).then(setOrder).catch((err) => setError(err.message));
    api.get(`/orders/${orderId}/receipt`).then(setReceipt).catch(() => {});
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    const orderProductIds = new Set((order.orderItems || []).map((item) => String(item.product || '')));
    api.get('/products?sort=rating')
      .then((items) => normalizeProducts(items)
        .filter((product) => !orderProductIds.has(String(product._id || product.id)))
        .slice(0, 6))
      .then(setRecommendations)
      .catch(() => setRecommendations([]));
  }, [order]);

  const primaryItem = useMemo(() => order?.orderItems?.[0] || null, [order]);
  const savings = useMemo(() => {
    if (!order) return 0;
    return Math.max(0, Number(order.totalMRP || 0) - Number(order.finalAmount || 0));
  }, [order]);

  const canReturn = order?.orderStatus === 'Delivered';
  const canRate = ['Delivered', 'Return Requested', 'Exchange Requested', 'Returned', 'Refunded'].includes(order?.orderStatus);
  const canCancel = canCancelOrder(order);

  const submitReturn = async (event) => {
    event.preventDefault();
    if (!returnItem) return;
    setActionMessage('');
    try {
      await api.post('/returns', {
        order: order._id,
        product: returnItem.product,
        orderItemId: returnItem._id,
        variantId: returnItem.variantId,
        size: returnItem.size,
        color: returnItem.color,
        quantity: Number(returnForm.quantity || 1),
        type: returnForm.type,
        reason: returnForm.reason,
        comment: returnForm.comment,
      });
      setActionMessage('Return request submitted.');
      setReturnItem(null);
      const refreshed = await api.get(`/orders/${orderId}`);
      setOrder(refreshed);
    } catch (err) {
      setActionMessage(err.message);
    }
  };

  const openReview = async (item, rating = 0) => {
    const productId = productIdOf(item);
    if (!productId || reviewBusy) return;
    if (!canRate) {
      setActionMessage('You can rate this product after it is delivered.');
      return;
    }
    setReviewBusy(true);
    setActionMessage('');
    setExistingReview(null);
    try {
      const eligibility = await api.get(`/reviews/${productId}/eligibility`);
      if (!eligibility?.canReview) {
        setActionMessage(eligibility?.message || 'You can review this product after it is delivered.');
        return;
      }
      setExistingReview(eligibility.existingReview || null);
      setReviewInitialRating(rating);
      setReviewItem(item);
    } catch (err) {
      setActionMessage(err.message || 'Unable to open the review form right now.');
    } finally {
      setReviewBusy(false);
    }
  };

  const saveOrderReview = async (payload) => {
    const productId = productIdOf(reviewItem);
    if (!productId) throw new Error('Product information is unavailable for this order item.');
    const saved = existingReview?._id
      ? await api.put(`/reviews/${existingReview._id}`, payload)
      : await api.post(`/reviews/${productId}`, payload);
    setExistingReview(saved);
    setActionMessage(existingReview ? 'Your review was updated successfully.' : 'Thank you. Your verified review was submitted successfully.');
    return {
      ...saved,
      message: saved?.isVisible === false
        ? 'Your review was saved and is awaiting moderation.'
        : existingReview
          ? 'Your updated review is now visible.'
          : 'Your verified review is now visible to other customers.',
    };
  };

  const cancelOrder = async () => {
    if (!order?._id || cancelBusy || !canCancel) return;
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setCancelBusy(true);
    setActionMessage('');
    try {
      const cancelled = await api.post(`/orders/${order._id}/cancel`);
      setOrder(cancelled);
      setActionMessage('Order cancelled.');
    } catch (err) {
      setActionMessage(err.message);
    } finally {
      setCancelBusy(false);
    }
  };

  if (error) return <section className="container-page py-8"><Card><CardContent className="section-title p-8 text-center text-rose">{error}</CardContent></Card></section>;
  if (!order) return <section className="container-page py-8"><Card><CardContent className="section-title p-8 text-center">Loading order...</CardContent></Card></section>;

  if (isMobile) {
    return (
      <section className="min-h-screen bg-[linear-gradient(180deg,#fffdf9_0%,#f8f4fb_46%,#f6f7fb_100%)] pb-24">
        <div className="mx-auto w-full max-w-[470px]">
          <MobileHero order={order} item={primaryItem} navigate={navigate} />

          <div className="space-y-4 px-4 pb-6">
            <MobileStatusCard order={order} />
            <MobileRatingCard item={primaryItem} canRate={canRate} busy={reviewBusy} onRate={(rating) => openReview(primaryItem, rating)} />
            {canCancel ? (
              <Button type="button" variant="outline" className="w-full border-[#6d1f34] text-[#6d1f34]" disabled={cancelBusy} onClick={cancelOrder}>
                {cancelBusy ? 'Cancelling...' : 'Cancel Order'}
              </Button>
            ) : null}
            {actionMessage ? <p className="text-center text-sm font-semibold text-[#6d1f34]">{actionMessage}</p> : null}
            {recommendations.length > 0 && <MobileRecommendations items={recommendations} navigate={navigate} />}
            <MobileDeliveryCard order={order} />
            <MobileSavingsCard savings={savings} />
            <MobilePaymentCard order={order} receipt={receipt} />
            <MobileUpdatesCard order={order} />
            <MobileMetaCard order={order} />
          </div>

          {receipt && <div className="hidden"><Receipt receipt={receipt} /></div>}
        </div>
        <ReviewModal
          open={!!reviewItem}
          product={getOrderReviewProduct(reviewItem)}
          existingReview={existingReview}
          initialRating={reviewInitialRating}
          onClose={() => setReviewItem(null)}
          onSubmit={saveOrderReview}
        />
      </section>
    );
  }

  return (
    <section className="container-page py-8">
      {receipt && <div className="no-print mb-5"><ReceiptActions receipt={receipt} /></div>}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
        <div className="space-y-5">
          <Card><CardContent className="p-5 md:p-7"><h1 className="page-title md:text-3xl">Order #{order._id.slice(-8).toUpperCase()}</h1><p className="body-text mt-2 text-slate-500">Placed on {new Date(order.createdAt).toLocaleString('en-IN')}</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">Payment: {order.paymentStatus}</span><span className="rounded-full bg-wine/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-wine">Order: {order.orderStatus}</span></div><div className="mt-6 grid gap-4">{(order.statusTimeline || []).map((item, index) => <div key={`${item.status}-${index}`} className="flex items-center gap-4"><span className="h-4 w-4 rounded-full bg-rose" /><span><b>{item.status}</b><br /><span className="small-text text-slate-500">{item.date ? new Date(item.date).toLocaleString('en-IN') : ''} {item.note || ''}</span></span></div>)}</div></CardContent></Card>
          <Card><CardContent className="p-4 md:p-5"><h2 className="header-title">Items</h2><div className="mt-4 space-y-3">{order.orderItems.map((item) => <div key={`${item.product}-${item.size}-${item.color}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3"><span><b>{item.name}</b><br /><span className="small-text text-slate-500">{item.size} | {item.color} x {item.quantity}</span>{canRate ? <span className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" disabled={reviewBusy} onClick={() => openReview(item, rating)} aria-label={`Rate ${rating} stars`}><Star className="h-4 w-4 text-[#b88945]" /></button>)}</span> : <span className="small-text mt-2 block text-slate-400">Rate after delivery</span>}</span><b>Rs. {item.price * item.quantity}</b></div>)}</div></CardContent></Card>
        </div>
        <Card as="aside">
          <CardContent className="p-4 md:p-5">
            <h2 className="header-title">Invoice</h2>
            <Row label="MRP" value={`Rs. ${order.totalMRP}`} />
            <Row label="Product Discount" value={`- Rs. ${order.productDiscount || 0}`} />
            <Row label="Coupon Discount" value={`- Rs. ${order.couponDiscount || 0}`} />
            <Row label="Delivery" value={order.deliveryCharge ? `Rs. ${order.deliveryCharge}` : 'FREE'} />
            {order.platformFee > 0 ? <Row label="Platform Fee" value={`Rs. ${order.platformFee}`} /> : null}
            {order.taxAmount > 0 ? <Row label={`GST (${order.taxRate || 5}% incl.)`} value={`Rs. ${order.taxAmount}`} /> : null}
            <div className="mt-4 flex justify-between border-t border-slate-100 pt-4"><span className="label-text">Total</span><span className="price">Rs. {order.finalAmount}</span></div>
            <h3 className="small-text mt-6 font-bold uppercase tracking-[0.18em] text-slate-500">Ship To</h3>
            <p className="body-text mt-2 text-slate-600">{order.shippingAddress?.fullName}<br />{order.shippingAddress?.houseNo || order.shippingAddress?.houseNumber}, {order.shippingAddress?.area}<br />{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
            {order.shipment?.trackingNumber ? <p className="body-text mt-3 text-slate-600">Tracking: {order.shipment.courierName || 'Courier'} {order.shipment.trackingNumber}</p> : null}
            {canCancel ? (
              <Button className="no-print mt-5 w-full" variant="outline" disabled={cancelBusy} onClick={cancelOrder}>
                {cancelBusy ? 'Cancelling...' : 'Cancel Order'}
              </Button>
            ) : null}
            <Button className="no-print mt-3 w-full" variant="outline" disabled={!canReturn} onClick={() => setReturnItem(order.orderItems[0] || null)}>Request Return / Exchange</Button>
            {actionMessage && <p className="mt-3 text-sm font-bold text-wine">{actionMessage}</p>}
          </CardContent>
        </Card>
      </div>
      {receipt && <div className="mt-6"><Receipt receipt={receipt} /></div>}
      {returnItem && (
        <form onSubmit={submitReturn} className="no-print mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="header-title">Return / exchange {returnItem.name}</h2>
          <select value={returnForm.type} onChange={(event) => setReturnForm((current) => ({ ...current, type: event.target.value }))} className="mt-4 h-11 w-full rounded-xl border border-slate-200 px-3 font-bold">
            <option value="return">Return</option>
            <option value="exchange">Exchange</option>
          </select>
          <input className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3" placeholder="Reason" value={returnForm.reason} onChange={(event) => setReturnForm((current) => ({ ...current, reason: event.target.value }))} required />
          <textarea className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 p-3" placeholder="Comment (optional)" value={returnForm.comment} onChange={(event) => setReturnForm((current) => ({ ...current, comment: event.target.value }))} />
          <div className="mt-4 flex gap-3">
            <Button type="submit">Submit request</Button>
            <Button type="button" variant="outline" onClick={() => setReturnItem(null)}>Cancel</Button>
          </div>
        </form>
      )}
      <ReviewModal
        open={!!reviewItem}
        product={getOrderReviewProduct(reviewItem)}
        existingReview={existingReview}
        initialRating={reviewInitialRating}
        onClose={() => setReviewItem(null)}
        onSubmit={saveOrderReview}
      />
    </section>
  );
}

function MobileHero({ order, item, navigate }) {
  const image = item?.image ? normalizeImageUrl(item.image) : '';

  return (
    <div className="relative overflow-hidden border-b border-white/70 bg-[linear-gradient(180deg,#fff6d8_0%,#fffdf7_72%,transparent_100%)] px-4 pb-5 pt-5">
      <div className="absolute inset-x-0 top-6 select-none overflow-hidden text-center text-[64px] font-black uppercase italic leading-[0.88] tracking-[-0.08em] text-white/70">
        <div>samira</div>
        <div>samira</div>
      </div>
      <div className="relative">
        <div className="flex items-start justify-end">
          <button
            type="button"
            onClick={() => navigate?.('/contact')}
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-[12px] font-semibold text-[#1f2a44] shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
          >
            <CircleHelp className="h-4 w-4 text-[#7b8192]" />
            Help
          </button>
        </div>

        <div className="mx-auto mt-2 h-[170px] w-[140px] overflow-hidden rounded-[30px] bg-white shadow-[0_18px_34px_rgba(15,23,42,0.10)]">
          {image ? <img src={image} alt={item?.name || 'Order item'} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[#efe8dd]" />}
        </div>

        <div className="mt-5 text-center">
          <p className="text-[18px] font-bold text-[#1f2a44]">{item?.name || 'Order item'}</p>
          <p className="mt-1 text-[14px] leading-[1.4] text-slate-600">{buildMobileSubtitle(item)}</p>
          <p className="mt-2 text-[14px] text-[#334155]">
            Size: <span className="font-semibold">{item?.size || '-'}</span>
            <span className="mx-1.5 text-slate-300">•</span>
            Quantity: <span className="font-semibold">{item?.quantity || 1}</span>
          </p>
          <p className="mt-2 text-[13px] text-[#334155]">Order ID: <span className="font-medium"># {order._id}</span></p>
        </div>
      </div>
    </div>
  );
}

function MobileStatusCard({ order }) {
  const meta = getStatusMeta(order);
  return (
    <div className={`overflow-hidden rounded-[24px] ${meta.wrapperClass} shadow-[0_14px_28px_rgba(15,23,42,0.06)]`}>
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-white/18">
            <meta.icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[17px] font-bold text-white">{meta.title}</p>
            <p className="mt-1 text-[13px] text-white/85">{meta.dateText}</p>
          </div>
        </div>
        <div className="rounded-full border-2 border-dashed border-white/80 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white/90">
          {meta.badge}
        </div>
      </div>
    </div>
  );
}

function MobileRatingCard({ item, onRate, canRate = false, busy = false }) {
  if (!item) return null;
  const image = item.image ? normalizeImageUrl(item.image) : '';

  return (
    <section className="rounded-[26px] border border-[#ede8e2] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-4">
        <div className="h-[68px] w-[52px] overflow-hidden rounded-[16px] bg-[#f4f1ec]">
          {image ? <img src={image} alt={item.name} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[#ece5da]" />}
        </div>
        <div>
          <p className="text-[15px] font-bold text-[#1f2a44]">Rate this product</p>
          {canRate ? (
            <div>
              <div className="mt-2 flex gap-1.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <button key={index} type="button" disabled={busy} onClick={() => onRate?.(index + 1)} aria-label={`Rate ${index + 1} stars`}>
                  <Star className="h-6 w-6 text-[#b88945]" strokeWidth={1.7} />
                </button>
              ))}
              </div>
              <p className="mt-1 text-[10px] text-slate-400">Tap a star to write or edit your review.</p>
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-slate-500">You can rate this after delivery.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function MobileRecommendations({ items, navigate }) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-[#ede8e2] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="px-4 pb-2 pt-4">
        <p className="text-[15px] font-bold text-[#1f2a44]">Items that go well with this item</p>
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 pb-4 pt-2">
        {items.map((product) => (
          <button
            key={product.id || product._id}
            type="button"
            onClick={() => navigate?.(`/product?id=${product._id || product.id || product.slug}`)}
            className="w-[124px] shrink-0 text-left"
          >
            <div className="h-[128px] overflow-hidden rounded-[18px] bg-[#f6f1eb]">
              {product.primaryImageUrl ? <img src={product.primaryImageUrl} alt={product.name} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[#ece3d7]" />}
            </div>
            <p className="mt-3 truncate text-[14px] font-bold text-[#1f2a44]">{product.brand || 'Samira'}</p>
            <p className="mt-1 line-clamp-2 text-[13px] leading-[1.35] text-slate-500">{product.name}</p>
            <p className="mt-1 text-[15px] font-bold text-[#1f2a44]">Rs {product.price}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function MobileDeliveryCard({ order }) {
  const address = order.shippingAddress || {};
  return (
    <section className="rounded-[26px] border border-[#ede8e2] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-[linear-gradient(135deg,#efe7ff_0%,#ffe9ef_100%)]">
          <UserRound className="h-7 w-7 text-[#8a63d2]" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-[#1f2a44]">Delivery To</p>
          <p className="mt-1 text-[14px] text-slate-500">{address.fullName || 'Customer'}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-[#f0ece7] pt-4">
        <div className="flex items-start gap-3">
          <Phone className="mt-0.5 h-4 w-4 text-[#1f2a44]" />
          <div>
            <p className="text-[14px] font-bold text-[#1f2a44]">Contact Details</p>
            <p className="mt-1 text-[14px] text-slate-600">{address.mobile || address.phone || '-'}</p>
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 text-[#1f2a44]" />
            <div>
              <p className="text-[14px] font-bold text-[#1f2a44]">Delivery Address</p>
              <p className="mt-1 max-w-[210px] text-[14px] leading-[1.5] text-slate-600">
                {formatAddress(address)}
              </p>
            </div>
          </div>
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[18px] bg-[linear-gradient(135deg,#efe7ff_0%,#fff0e8_100%)]">
            <MapPin className="h-7 w-7 text-[#8a63d2]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function MobileSavingsCard({ savings }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-[#daf1e6] bg-[radial-gradient(circle_at_left,_rgba(24,181,136,0.12),_transparent_34%),linear-gradient(180deg,#fafffd_0%,#f4fffb_100%)] px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#17b789] text-white shadow-[0_8px_18px_rgba(23,183,137,0.28)]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[14px] leading-[1.45] text-[#1f2a44]">On this item you saved a total of</p>
          <p className="mt-1 text-[18px] font-bold text-[#0f9f74]">Rs. {savings}</p>
        </div>
      </div>
    </section>
  );
}

function MobilePaymentCard({ order, receipt }) {
  return (
    <section className="rounded-[26px] border border-[#ede8e2] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[15px] font-bold text-[#1f2a44]">Total Order Price</p>
        <p className="text-[16px] font-bold text-[#1f2a44]">Rs {order.finalAmount}.00</p>
      </div>

      <div className="mt-4 rounded-[18px] bg-[#f8f8fb] px-4 py-4 text-[14px] text-[#1f2a44]">
        Paid by {order.paymentMethod || 'COD'}
      </div>

      {receipt ? (
        <button
          type="button"
          onClick={() => downloadReceiptHtml(receipt)}
          className="mt-4 h-12 w-full rounded-[18px] border border-[#dfe3ea] text-[15px] font-bold text-[#1f2a44]"
        >
          Get Invoice
        </button>
      ) : null}
    </section>
  );
}

function MobileUpdatesCard({ order }) {
  return (
    <section className="rounded-[26px] border border-[#ede8e2] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#f6f4ff]">
          <Bell className="h-4 w-4 text-[#1f2a44]" />
        </div>
        <p className="text-[15px] font-bold text-[#1f2a44]">Updates sent to</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-[14px]">
        <div>
          <p className="text-[12px] text-slate-500">Call</p>
          <p className="mt-1 text-[#1f2a44]">{order.shippingAddress?.mobile || order.shippingAddress?.phone || '-'}</p>
        </div>
        <div>
          <p className="text-[12px] text-slate-500">Email</p>
          <p className="mt-1 break-words text-[#1f2a44]">{order.user?.email || order.shippingAddress?.email || 'Not available'}</p>
        </div>
      </div>
    </section>
  );
}

function MobileMetaCard({ order }) {
  return (
    <section className="rounded-[26px] border border-[#ede8e2] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#f7f7fb]">
          <Package2 className="h-4 w-4 text-[#1f2a44]" />
        </div>
        <p className="text-[15px] font-bold text-[#1f2a44]">Order details</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-[14px]">
        <div>
          <p className="text-[12px] text-slate-500">Ordered On</p>
          <p className="mt-1 text-[#1f2a44]">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
        <div>
          <p className="text-[12px] text-slate-500">Order ID</p>
          <p className="mt-1 break-all text-[#1f2a44]"># {order._id}</p>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }) {
  return <div className="body-text mt-3 flex justify-between text-slate-600"><span>{label}</span><span>{value}</span></div>;
}

function getStatusMeta(order) {
  const timeline = Array.isArray(order.statusTimeline) ? order.statusTimeline : [];
  const latest = timeline[timeline.length - 1];
  const status = String(order.orderStatus || latest?.status || '').toLowerCase();
  const dateSource = latest?.date || order.updatedAt || order.createdAt;
  const dateText = dateSource
    ? new Date(dateSource).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : 'Status updated recently';

  if (status.includes('exchange') || status.includes('return') || status.includes('refund')) {
    return {
      title: order.orderStatus || 'Exchange in progress',
      badge: 'Exchange',
      dateText,
      icon: RefreshCcw,
      wrapperClass: 'bg-[linear-gradient(135deg,#1bb47d_0%,#14a56f_100%)]',
    };
  }

  if (status.includes('deliver')) {
    return {
      title: 'Item Delivered',
      badge: 'Delivered',
      dateText,
      icon: Package2,
      wrapperClass: 'bg-[linear-gradient(135deg,#24b07a_0%,#169a67_100%)]',
    };
  }

  return {
    title: order.orderStatus || 'Order in progress',
    badge: 'Order',
    dateText,
    icon: PackageCheck,
    wrapperClass: 'bg-[linear-gradient(135deg,#8266d0_0%,#6d56bf_100%)]',
  };
}

function buildMobileSubtitle(item) {
  const details = [];
  if (item?.color) details.push(item.color);
  if (item?.name && item.name !== details[0]) details.push(item.name);
  return details.length ? details.join(' • ') : 'Order details';
}

function formatAddress(address = {}) {
  return [
    address.houseNo || address.houseNumber,
    address.area,
    [address.city, address.state].filter(Boolean).join(', '),
    address.pincode,
  ].filter(Boolean).join(', ');
}

function getOrderReviewProduct(item) {
  if (!item) return null;
  return {
    _id: productIdOf(item),
    name: item.name || 'Order item',
    brand: 'Samira Collection',
    images: item.image ? [{ url: item.image, primary: true }] : [],
  };
}
