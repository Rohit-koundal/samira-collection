import { useEffect, useRef, useState } from 'react';
import { Check, ExternalLink, Headphones, MapPin, RefreshCw, Star, Truck } from 'lucide-react';
import api from '../../services/api';
import Receipt from '../../components/order/Receipt';
import ReceiptActions from '../../components/order/ReceiptActions';
import ReviewModal from '../../components/product/ReviewModal';
import ReturnRequestForm from '../../components/order/ReturnRequestForm';
import { OrderItem, OrderModal, OrderShell, OrderState, StatusBadge } from '../../components/order/OrderUi';
import { canCancelOrder, productIdOf } from '../../utils/orderActions';
import { money, orderCode, orderDate, paymentLabel, paymentNote, priceLines, safeTrackingUrl } from '../../utils/orderPresentation';

export default function OrderDetail({ route = '', navigate }) {
  const orderId = new URLSearchParams(route.split('?')[1] || '').get('id');
  const scopeRef = useRef({ orderId, active: true, pending: false });
  if (scopeRef.current.orderId !== orderId) scopeRef.current = { orderId, active: true, pending: false };
  const scope = scopeRef.current;
  const isCurrent = () => scopeRef.current === scope && scope.active;
  useEffect(() => {
    scope.active = true;
    return () => { scope.active = false; };
  }, [scope]);
  const [order, setOrder] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [returns, setReturns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receiptError, setReceiptError] = useState('');
  const [returnError, setReturnError] = useState('');
  const [reload, setReload] = useState(0);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [returnItem, setReturnItem] = useState(null);
  const [reviewItem, setReviewItem] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setOrder(null); setReturns(null); setReceipt(null); setReturnError(''); setReceiptError('');
    setCancelOpen(false); setReturnItem(null); setReviewItem(null); setActionError('');
    setBusy(false); setNotice(''); setCancelReason(''); setExistingReview(null);
    setInvoiceOpen(false);
    if (!orderId) { setError('Order not found.'); setLoading(false); return undefined; }
    api.get(`/orders/${orderId}`).then((data) => { if (active) setOrder(data); })
      .catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    api.get(`/orders/${orderId}/receipt`).then((data) => { if (active) setReceipt(data); }).catch((err) => { if (active) setReceiptError(err.message); });
    api.get(`/returns/order/${orderId}`).then((data) => { if (active) setReturns(data); }).catch((err) => { if (active) setReturnError(err.message); });
    return () => { active = false; };
  }, [orderId, reload]);
  const refresh = () => setReload((value) => value + 1);
  const help = () => navigate(`/contact?order=${encodeURIComponent(orderId)}`);
  const cancel = async (event) => {
    event.preventDefault(); if (scope.pending || !isCurrent() || !canCancelOrder(order)) return;
    scope.pending = true;
    setBusy(true); setActionError('');
    try { await api.post(`/orders/${orderId}/cancel`, { reason: cancelReason }); if (!isCurrent()) return; setCancelOpen(false); setNotice('Your order has been cancelled.'); refresh(); }
    catch (err) { if (isCurrent()) setActionError(err.message); } finally { scope.pending = false; if (isCurrent()) setBusy(false); }
  };
  const submitReturn = async (form) => {
    if (scope.pending || !isCurrent()) return;
    scope.pending = true;
    setBusy(true); setActionError('');
    try {
      await api.post('/returns', { ...form, order: orderId, product: productIdOf(returnItem), orderItemId: returnItem._id, variantId: returnItem.variantId, size: returnItem.size, color: returnItem.color });
      if (!isCurrent()) return;
      setReturnItem(null); setNotice(`${form.type === 'exchange' ? 'Exchange' : 'Return'} request submitted. You can follow its progress below.`); refresh();
    } catch (err) { if (isCurrent()) setActionError(err.message); } finally { scope.pending = false; if (isCurrent()) setBusy(false); }
  };
  const openReview = async (item) => {
    if (scope.pending || !isCurrent() || !productIdOf(item)) return;
    scope.pending = true;
    setBusy(true); setActionError('');
    try {
      const eligibility = await api.get(`/reviews/${productIdOf(item)}/eligibility`);
      if (!isCurrent()) return;
      if (!eligibility.canReview) { setActionError(eligibility.message || 'Reviews are available after delivery.'); return; }
      setExistingReview(eligibility.existingReview || null); setReviewItem(item);
    } catch (err) { if (isCurrent()) setActionError(err.message); } finally { scope.pending = false; if (isCurrent()) setBusy(false); }
  };
  const saveReview = async (payload) => {
    const result = existingReview?._id ? await api.put(`/reviews/${existingReview._id}`, payload) : await api.post(`/reviews/${productIdOf(reviewItem)}`, payload);
    return { ...result, message: result.isVisible === false ? 'Your review is awaiting moderation.' : 'Your review has been saved.' };
  };
  const canReview = order && ['Delivered', 'Return Requested', 'Exchange Requested', 'Returned', 'Refunded'].includes(order.orderStatus);
  const tracking = safeTrackingUrl(order?.shipment?.trackingUrl);
  const events = [...(order?.statusTimeline || [])];
  const activeReturnEligibility = returns?.items?.find((entry) => entry.orderItemId === String(returnItem?._id));
  return <OrderShell title={order ? `Order #${orderCode(order)}` : 'Order details'} detail navigate={navigate}>
    {loading ? <OrderState loading /> : error ? <OrderState title="Unable to open this order" error={error} retry={orderId ? refresh : undefined}><button className="sc-orders__text" onClick={() => navigate('/orders')}>Back to orders</button></OrderState> : order && <>
      <div className="sc-order-detail__top"><p>Placed on {orderDate(order.createdAt, true) || 'date unavailable'}</p><button className="sc-orders__text" onClick={refresh} disabled={busy}><RefreshCw size={15} />Refresh status</button></div>
      {notice && <p role="status" className="sc-orders__notice"><Check size={17} />{notice}</p>}
      {actionError && !cancelOpen && !returnItem && <p role="alert" className="sc-orders__error">{actionError}</p>}
      <div className="sc-order-detail__grid"><div className="sc-order-detail__primary">
        <section className="sc-order-panel"><header><Truck size={20} /><h2>Order & delivery status</h2><StatusBadge status={order.orderStatus} /></header>
          <ol className="sc-order-timeline">{events.length ? events.map((entry, index) => <li key={index} className={index === events.length - 1 ? 'is-current' : ''}><span className="sc-order-timeline__dot" /><div><h3>{entry.status}</h3>{entry.date && <time>{orderDate(entry.date, true)}</time>}{entry.note && <p>{entry.note}</p>}</div></li>) : <li><span className="sc-order-timeline__dot" /><div><h3>{order.orderStatus}</h3><p>Detailed updates will appear here when available.</p></div></li>}</ol>
          {order.shipment && typeof order.shipment === 'object' ? <div className="sc-order-shipment"><p><strong>{order.shipment.courierName || 'Courier details pending'}</strong></p>{(order.shipment.trackingNumber || order.shipment.awb) && <p>Tracking ID: {order.shipment.trackingNumber || order.shipment.awb}</p>}
            {tracking && <a className="sc-orders__text" href={tracking} target="_blank" rel="noopener noreferrer">Track with courier<ExternalLink size={14} /></a>}
            {order.shipment.events?.length > 0 && <details><summary>Courier updates</summary><ol>{[...order.shipment.events].reverse().map((event, index) => <li key={index}><strong>{String(event.status || '').replaceAll('_', ' ')}</strong><p>{event.note}</p><time>{orderDate(event.date, true)}</time></li>)}</ol></details>}
          </div> : !['Delivered', 'Cancelled', 'Returned', 'Refunded'].includes(order.orderStatus) && <p className="sc-orders__muted">Courier tracking will appear after dispatch.</p>}
          <div className="sc-order-panel__actions">{canCancelOrder(order) && <button className="sc-orders__outline" disabled={busy} onClick={() => { setActionError(''); setCancelReason(''); setCancelOpen(true); }}>Cancel order</button>}<button className="sc-orders__outline" onClick={help}><Headphones size={16} />Need help?</button></div>
        </section>
        <section className="sc-order-panel"><header><h2>Items in this order</h2><span>{order.orderItems?.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} items</span></header>
          <div className="sc-order-detail__items">{(order.orderItems || []).map((item, index) => {
            const eligibility = returns?.items?.find((entry) => entry.orderItemId === String(item._id));
            return <OrderItem key={item._id || index} item={item}>
              <div className="sc-order-item__actions">{eligibility?.canRequest && <button className="sc-orders__text" disabled={busy} onClick={() => { setActionError(''); setReturnItem(item); }}>Return / exchange</button>}
                {canReview && productIdOf(item) && <button className="sc-orders__text" disabled={busy} onClick={() => openReview(item)}><Star size={14} />Rate & review</button>}
                {productIdOf(item) && <button className="sc-orders__text" onClick={() => navigate(`/product?id=${encodeURIComponent(productIdOf(item))}`)}>View product</button>}</div>
              {eligibility && !eligibility.canRequest && <p className="sc-orders__muted">{eligibility.reason}</p>}
            </OrderItem>;
          })}</div>
          {returnError ? <div role="alert" className="sc-orders__error">Return eligibility could not be loaded. <button className="sc-orders__text" onClick={refresh}>Try again</button></div> : !returns ? <p role="status" className="sc-orders__muted">Checking return eligibility…</p> : returns.deadline && <p className="sc-orders__muted">Return / exchange window: {returns.windowDays} days from delivery, until {orderDate(returns.deadline)}.</p>}
          <button className="sc-orders__text" onClick={() => navigate('/return-policy')}>Read return policy<ChevronRightIcon /></button>
        </section>
        {returns?.requests?.length > 0 && <section className="sc-order-panel"><header><h2>Returns & exchanges</h2></header>{returns.requests.map((request) => {
          const item = order.orderItems.find((entry) => String(entry._id) === request.orderItemId);
          return <article className="sc-order-return" key={request._id}><div><h3>{item?.name || 'Order item'} · {request.type === 'exchange' ? 'Exchange' : 'Return'}</h3><span className="sc-order-status sc-order-status--return">{request.status}</span></div><p>{request.quantity} unit(s) · {request.reason}</p><p>Requested {orderDate(request.createdAt, true)}</p>{request.exchangeSize && <p>Replacement: {request.exchangeSize} {request.exchangeColor}</p>}{request.pickupScheduledAt && <p>Pickup scheduled {orderDate(request.pickupScheduledAt)}</p>}{request.adminComment && <p>{request.adminComment}</p>}<p className="sc-orders__muted">Request #{String(request._id).slice(-8).toUpperCase()}</p></article>;
        })}</section>}
      </div><aside className="sc-order-detail__aside">
        <section className="sc-order-panel"><header><h2>Price details</h2></header><dl className="sc-order-prices">{priceLines(order).map(([label, value]) => <div key={label} className={value < 0 ? 'is-saving' : ''}><dt>{label}{label === 'Coupon discount' && order.coupon?.code ? ` (${order.coupon.code})` : ''}</dt><dd>{label === 'Delivery charge' && Number(value) === 0 ? 'FREE' : money(value)}</dd></div>)}<div className="sc-order-prices__total"><dt>Order total</dt><dd>{money(order.finalAmount)}</dd></div></dl>{Number(order.taxAmount) > 0 && <p className="sc-orders__muted">Includes {money(order.taxAmount)} GST{order.taxRate ? ` (${order.taxRate}%)` : ''}.</p>}
          <div className="sc-order-payment"><p><strong>{paymentLabel(order)}</strong></p><p>{order.paymentMethod === 'COD' ? 'Cash on delivery' : order.paymentMethod || 'Online payment'}</p>{order.razorpayPaymentId && <p className="sc-orders__muted">Transaction: {order.razorpayPaymentId}</p>}{paymentNote(order) && <p>{paymentNote(order)}</p>}</div>
          {receipt ? <ReceiptActions receipt={receipt} compact showShare={false} onPreview={() => setInvoiceOpen(true)} />
            : receiptError ? <div role="alert" className="sc-orders__error">Invoice unavailable. <button className="sc-orders__text" onClick={refresh}>Retry invoice</button></div> : <p role="status" className="sc-orders__muted">Loading invoice…</p>}
        </section>
        <section className="sc-order-panel"><header><MapPin size={18} /><h2>Delivery address</h2></header><DeliveryAddress address={order.shippingAddress} />{order.billingAddress && <details className="sc-order-billing"><summary>Billing address</summary><DeliveryAddress address={order.billingAddress} /></details>}</section>
        <section className="sc-order-panel sc-order-help"><Headphones size={22} /><h2>Here to help</h2><p>Questions about this delivery, a payment, or a return?</p><button className="sc-orders__text" onClick={help}>Contact us about this order<ChevronRightIcon /></button><p className="sc-orders__muted">Order ID: {order._id}</p>{order.invoiceNumber && <p className="sc-orders__muted">Invoice: {order.invoiceNumber}</p>}</section>
      </aside></div>
      {receipt && invoiceOpen && <OrderModal title="Invoice preview" onClose={() => setInvoiceOpen(false)} className="sc-order-modal--invoice"><div className="sc-invoice-preview"><ReceiptActions receipt={receipt} showShare={false} /><Receipt receipt={receipt} /></div></OrderModal>}
    </>}
    {cancelOpen && <OrderModal title="Cancel this order?" busy={busy} onClose={() => setCancelOpen(false)}><form className="sc-order-form" onSubmit={cancel}><p>This will cancel all items in this order.</p>{order.paymentStatus === 'Paid' && <p>Cancellation and refund processing are separate. Contact support to check your refund after cancellation.</p>}<label>Reason for cancellation<select required disabled={busy} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)}><option value="">Select a reason</option>{['Ordered by mistake', 'Need to change size or address', 'Delivery is taking too long', 'Changed my mind', 'Other'].map((reason) => <option key={reason}>{reason}</option>)}</select></label>{actionError && <p role="alert" className="sc-orders__error">{actionError}</p>}<div className="sc-order-form__actions"><button type="button" className="sc-orders__outline" disabled={busy} onClick={() => setCancelOpen(false)}>Keep order</button><button className="sc-orders__button" disabled={busy}>{busy ? 'Cancelling…' : 'Confirm cancellation'}</button></div></form></OrderModal>}
    {returnItem && activeReturnEligibility && <OrderModal title="Return or exchange" busy={busy} onClose={() => setReturnItem(null)}><ReturnRequestForm item={returnItem} eligibility={activeReturnEligibility} onSubmit={submitReturn} busy={busy} error={actionError} onCancel={() => setReturnItem(null)} /></OrderModal>}
    <ReviewModal key={orderId} open={!!reviewItem} product={reviewItem ? { _id: productIdOf(reviewItem), name: reviewItem.name, images: [reviewItem.image].filter(Boolean) } : null} existingReview={existingReview} onClose={() => setReviewItem(null)} onSubmit={saveReview} />
  </OrderShell>;
}
function ChevronRightIcon() { return <span aria-hidden="true">›</span>; }
function DeliveryAddress({ address }) {
  if (!address) return <p className="sc-orders__muted">Address information unavailable. Contact support for help.</p>;
  return <address className="sc-order-address"><strong>{address.fullName}</strong><p>{[address.houseNo || address.houseNumber, address.area].filter(Boolean).join(', ')}</p><p>{[address.city, address.state, address.pincode].filter(Boolean).join(', ')}</p>{address.landmark && <p>Landmark: {address.landmark}</p>}<p>Mobile: {address.mobile || address.phone || 'Not provided'}</p>{address.alternateMobile && <p>Alternate: {address.alternateMobile}</p>}</address>;
}
