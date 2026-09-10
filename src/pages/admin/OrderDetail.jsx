import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clipboard, FileText, Mail, MapPin, MessageCircle, PackageCheck, Phone, Plus, ReceiptText, UserRound } from 'lucide-react';
import Receipt from '../../components/order/Receipt';
import ReceiptActions from '../../components/order/ReceiptActions';
import ConfirmModal from '../../components/admin/ConfirmModal';
import OrderWorkflowActions from '../../components/admin/OrderWorkflowActions';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';
import ShipmentPanel from '../../components/admin/ShipmentPanel';

const blankAddress = { fullName: '', mobile: '', alternateMobile: '', houseNo: '', area: '', landmark: '', city: '', state: '', pincode: '', addressType: 'Home' };

export default function OrderDetail({ route = '' }) {
  const orderId = new URLSearchParams(route.split('?')[1] || '').get('id');
  const seller = route.startsWith('/seller');
  const apiBase = seller ? '/seller' : '/admin';
  const [order, setOrder] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [message, setMessage] = useState('');
  const [receiptError, setReceiptError] = useState('');
  const [saving, setSaving] = useState(false);
  const [shipmentForm, setShipmentForm] = useState({ courierName: '', trackingNumber: '', trackingUrl: '', awb: '' });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [codOpen, setCodOpen] = useState(false);
  const [codForm, setCodForm] = useState({ reference: '', note: 'COD payment collected from customer' });
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundForm, setRefundForm] = useState({ amount: '', reference: '', note: '' });
  const [staffNote, setStaffNote] = useState('');
  const [addressForm, setAddressForm] = useState(blankAddress);
  const [addressReason, setAddressReason] = useState('');
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const loadVersion = useRef(0);
  const mutationVersion = useRef(0);
  const mutationPending = useRef(false);

  const loadReceipt = useCallback(async (version = loadVersion.current) => {
    setReceiptError('');
    try {
      const data = await api.get(`${apiBase}/orders/${orderId}/receipt`);
      if (version === loadVersion.current) setReceipt(data);
    } catch (error) { if (version === loadVersion.current) setReceiptError(error.message || 'Invoice could not load.'); }
  }, [apiBase, orderId]);
  const load = useCallback(async () => {
    if (!orderId) { setMessage('Choose an order from the orders list.'); return; }
    const version = ++loadVersion.current;
    loadReceipt(version);
    try {
      const data = await api.get(`${apiBase}/orders/${orderId}`);
      if (version !== loadVersion.current) return;
      setOrder(data); setMessage('');
      setShipmentForm({ courierName: data.shipment?.courierName || '', trackingNumber: data.shipment?.trackingNumber || '', trackingUrl: data.shipment?.trackingUrl || '', awb: data.shipment?.awb || '' });
      setAddressForm({ ...blankAddress, ...(data.shippingAddress || {}) });
    } catch (error) { if (version === loadVersion.current) setMessage(error.message); }
  }, [apiBase, orderId, loadReceipt]);
  useEffect(() => {
    setOrder(null); setReceipt(null); setMessage(''); setReceiptError(''); setSaving(false); setCancelOpen(false); setCodOpen(false); setRefundOpen(false); setInvoiceOpen(false); mutationPending.current = false;
    load();
    return () => { loadVersion.current += 1; mutationVersion.current += 1; mutationPending.current = false; };
  }, [load]);

  const mutate = async (path, body, method = 'put') => {
    if (mutationPending.current || !order || order._id !== orderId) return false;
    mutationPending.current = true;
    const version = ++mutationVersion.current;
    setSaving(true); setMessage('');
    try {
      await api[method](`${apiBase}/orders/${orderId}/${path}`, body);
      if (version === mutationVersion.current) await load();
      return version === mutationVersion.current;
    } catch (error) {
      if (version === mutationVersion.current) { setMessage(error.message); if (error.status === 409) await load(); }
      return false;
    } finally { if (version === mutationVersion.current) { mutationPending.current = false; setSaving(false); } }
  };

  const updateStatus = (current, orderStatus, label) => mutate('status', { orderStatus, revision: Number(current.revision || 0), note: `${label} by staff` });
  const saveShipment = event => { event.preventDefault(); mutate('shipment', { ...shipmentForm, note: 'Manual shipment updated by staff' }); };
  const cancelOrder = async () => {
    if (!cancelReason.trim()) { setMessage('Enter the cancellation reason.'); return; }
    if (await mutate('status', { orderStatus: 'Cancelled', revision: Number(order.revision || 0), note: cancelReason.trim() })) { setCancelOpen(false); setCancelReason(''); }
  };
  const collectCod = async () => {
    if (!codForm.note.trim()) { setMessage('Enter a COD collection note.'); return; }
    if (await mutate('payment-status', { paymentStatus: 'Paid', revision: Number(order.revision || 0), reference: codForm.reference.trim(), note: codForm.note.trim() })) { setCodOpen(false); setCodForm({ reference: '', note: 'COD payment collected from customer' }); }
  };
  const recordRefund = async () => {
    const amount = Number(refundForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) { setMessage('Enter the amount returned to the customer.'); return; }
    if (!refundForm.note.trim()) { setMessage('Enter a refund note.'); return; }
    if (await mutate('payment-status', { paymentStatus: 'Refunded', amount, revision: Number(order.revision || 0), reference: refundForm.reference.trim(), note: refundForm.note.trim() })) {
      setRefundOpen(false); setRefundForm({ amount: '', reference: '', note: '' });
    }
  };
  const addNote = async event => {
    event.preventDefault();
    if (!staffNote.trim()) return;
    if (await mutate('staff-notes', { text: staffNote.trim(), revision: Number(order.revision || 0) }, 'patch')) setStaffNote('');
  };
  const saveAddress = async event => {
    event.preventDefault();
    if (!addressReason.trim()) { setMessage('Enter why the delivery address is being corrected.'); return; }
    if (await mutate('shipping-address', { shippingAddress: addressForm, reason: addressReason.trim(), revision: Number(order.revision || 0) })) setAddressReason('');
  };

  const timeline = useMemo(() => {
    if (!order) return [];
    const orderEvents = (order.statusTimeline || []).map(item => ({ ...item, group: 'Order', label: item.status }));
    const shipmentEvents = (order.shipment?.events || []).map(item => ({ ...item, group: 'Courier', label: String(item.status || '').replaceAll('_', ' ') }));
    const paymentEvents = (order.paymentEvents || []).map(item => ({ ...item, group: 'Payment', label: item.status || item.state }));
    const returns = (order.returnRequests || []).map(item => ({ date: item.updatedAt || item.createdAt, group: item.type === 'exchange' ? 'Exchange' : 'Return', label: item.status, note: item.reason }));
    return [...orderEvents, ...shipmentEvents, ...paymentEvents, ...returns].filter(item => item.date).sort((left, right) => new Date(right.date) - new Date(left.date));
  }, [order]);

  if (message && !order) return <section className="space-y-5"><PageHeader title="Order Detail" /><p role="alert" className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{message}</p>{orderId && <button className="admin-btn" onClick={load}>Retry loading order</button>}<a className="admin-table-action-link" href={`${apiBase}/orders`}>Back to orders</a></section>;
  if (!order) return <section className="space-y-5"><PageHeader title="Order Detail" /><p className="rounded-xl bg-white p-6 font-bold shadow-sm">Loading order...</p></section>;

  const displayId = order.invoiceNumber || `#${order._id.slice(-8).toUpperCase()}`;
  const address = order.shippingAddress || {};
  const canEditAddress = ['Pending', 'Confirmed', 'Packed'].includes(order.orderStatus) && !order.shipment?.awb && !['BOOKING', 'BOOKED', 'UNKNOWN'].includes(order.shipment?.bookingState);
  const showManualShipment = (!order.shipment || order.shipment.provider === 'manual') && ['Confirmed', 'Packed', 'Shipped', 'Out for Delivery'].includes(order.orderStatus);
  const returnHref = seller ? `${apiBase}/orders` : `/admin/returns?orderId=${order._id}`;

  return <section className="order-detail-workspace space-y-5">
    <PageHeader title={displayId} kicker={seller ? 'Seller / Order' : 'Admin / Order'} note={`Placed ${new Date(order.createdAt).toLocaleString('en-IN')} · Revision ${Number(order.revision || 0)}`}>
      <button type="button" className="admin-btn-ghost inline-flex items-center gap-2" onClick={() => copy(order._id, setMessage)}><Clipboard size={15} />Copy order ID</button>
      <a href={`${apiBase}/orders`} className="admin-btn-ghost">Back to orders</a>
    </PageHeader>
    {message && <p role="alert" className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{message}</p>}
    {receiptError && <p role="alert" className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{receiptError} <button type="button" className="admin-btn-ghost" onClick={() => loadReceipt()}>Retry invoice</button></p>}

    <section className="admin-card order-detail-summary">
      <div><span>Order</span><strong><StatusBadge value={order.orderStatus} /></strong></div>
      <div><span>Payment</span><strong><StatusBadge value={order.paymentStatus} /></strong><small>{order.paymentMethod}</small></div>
      <div><span>Delivery</span><strong>{order.shipment?.status ? order.shipment.status.replaceAll('_', ' ') : 'Waiting for shipment'}</strong><small>{order.shipment?.awb ? `AWB ${order.shipment.awb}` : 'AWB not assigned'}</small></div>
      <div><span>Order total</span><strong>₹{Number(order.finalAmount || 0).toLocaleString('en-IN')}</strong><small>{order.orderItems?.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} units</small></div>
    </section>

    <div className="admin-card order-detail-next-action"><div><p className="admin-kicker">Next safe action</p><h2>Continue fulfilment</h2><p className="admin-note">Only actions allowed by the current payment, order and courier state are available.</p></div><OrderWorkflowActions order={order} busy={saving} onStatus={updateStatus} onCancel={() => { setCancelReason(''); setCancelOpen(true); }} onCollectCod={() => setCodOpen(true)} onRefund={() => { setRefundForm({ amount: Math.max(0, Number(order.finalAmount || 0) - Number(order.refundedAmount || 0)).toFixed(2), reference: '', note: '' }); setRefundOpen(true); }} onResolveException={() => document.querySelector('[aria-label="Courier delivery"]')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })} returnHref={returnHref} /></div>

    <div className="order-detail-grid">
      <main className="space-y-5">
        <ShipmentPanel orderId={orderId} onChanged={load} apiBase={apiBase} />
        <section className="admin-card p-5"><header className="order-section-heading"><div><h2>Ordered items</h2><p>{order.orderItems?.length || 0} catalogue line{order.orderItems?.length === 1 ? '' : 's'}</p></div><PackageCheck size={20} /></header><div className="order-item-list">{order.orderItems?.map(item => {
          const request = order.returnRequests?.find(entry => String(entry.orderItemId) === String(item._id));
          return <article key={`${item._id || item.product}-${item.size}-${item.color}`} className="order-item-row">{item.image ? <img src={item.image} alt="" /> : <span className="order-item-placeholder"><PackageCheck size={20} /></span>}<div><h3>{item.name || item.productName}</h3><p>{[item.sku && `SKU ${item.sku}`, item.size, item.color].filter(Boolean).join(' · ') || 'Standard item'}</p><p>{item.quantity} × ₹{Number(item.price || 0).toLocaleString('en-IN')}{item.originalPrice > item.price ? ` · MRP ₹${Number(item.originalPrice).toLocaleString('en-IN')}` : ''}</p>{request && <span className="order-return-chip">{request.type === 'exchange' ? 'Exchange' : 'Return'} · {request.status}</span>}</div><strong>₹{Number(item.price * item.quantity || 0).toLocaleString('en-IN')}</strong></article>;
        })}</div></section>
        <section className="admin-card p-5"><header className="order-section-heading"><div><h2>Complete activity</h2><p>Order, payment, courier and return events in one timeline.</p></div></header><ol className="order-unified-timeline">{timeline.map((item, index) => <li key={`${item.group}-${item.label}-${index}`}><span /><div><small>{item.group}</small><strong>{item.label}</strong>{item.note && <p>{item.note}</p>}<time>{new Date(item.date).toLocaleString('en-IN')}</time></div></li>)}</ol></section>
        {receipt && <section className="admin-card p-5"><button type="button" className="order-invoice-toggle" onClick={() => setInvoiceOpen(value => !value)}><span><ReceiptText size={20} /><span><strong>Invoice and receipt</strong><small>Download, print or review the customer invoice</small></span></span><span>{invoiceOpen ? 'Hide preview' : 'Preview invoice'}</span></button><div className="mt-4"><ReceiptActions receipt={receipt} /></div>{invoiceOpen && <div className="order-invoice-preview"><Receipt receipt={receipt} /></div>}</section>}
      </main>

      <aside className="space-y-5">
        <section className="admin-card p-5"><header className="order-section-heading"><div><h2>Customer</h2><p>Contact and delivery identity</p></div><UserRound size={19} /></header><div className="order-contact-card"><strong>{order.user?.name || address.fullName || 'Customer'}</strong>{order.user?.email && <a href={`mailto:${order.user.email}`}><Mail size={15} />{order.user.email}</a>}{(order.user?.phone || address.mobile) && <a href={`tel:+91${order.user?.phone || address.mobile}`}><Phone size={15} />+91 {order.user?.phone || address.mobile}</a>}{(order.user?.phone || address.mobile) && <a href={`https://wa.me/91${order.user?.phone || address.mobile}`} target="_blank" rel="noreferrer"><MessageCircle size={15} />Open WhatsApp</a>}</div></section>
        <section className="admin-card p-5"><header className="order-section-heading"><div><h2>Delivery address</h2><p>Snapshot saved with this order</p></div><MapPin size={19} /></header><address className="order-address"><strong>{address.fullName}</strong><span>{address.houseNo}{address.area ? `, ${address.area}` : ''}</span>{address.landmark && <span>Near {address.landmark}</span>}<span>{address.city}, {address.state} {address.pincode}</span><span>Phone: {address.mobile}</span></address><button type="button" className="order-copy-link" onClick={() => copy(addressText(address), setMessage)}><Clipboard size={14} />Copy address</button>{canEditAddress && <details className="order-edit-address"><summary>Correct address before booking</summary><form onSubmit={saveAddress}><div className="grid gap-3 sm:grid-cols-2">{[['fullName', 'Contact name'], ['mobile', 'Mobile'], ['houseNo', 'House / flat'], ['area', 'Street / area'], ['landmark', 'Landmark'], ['city', 'City'], ['state', 'State'], ['pincode', 'PIN code']].map(([key, label]) => <label key={key}>{label}<input value={addressForm[key] || ''} maxLength={key === 'area' ? 300 : 160} onChange={event => setAddressForm(value => ({ ...value, [key]: event.target.value }))} /></label>)}</div><label>Reason for correction<textarea maxLength={300} value={addressReason} onChange={event => setAddressReason(event.target.value)} /></label><button className="admin-btn w-full" disabled={saving}>Validate and update address</button></form></details>}</section>
        <section className="admin-card p-5"><header className="order-section-heading"><div><h2>Payment record</h2><p>Financial status stays separate from delivery</p></div><FileText size={19} /></header><div className="order-facts"><Row label="Method" value={order.paymentMethod} /><Row label="Provider" value={order.paymentProvider || '-'} /><Row label="State" value={order.paymentState || order.paymentStatus} /><Row label="Refunded" value={`₹${Number(order.refundedAmount || 0).toLocaleString('en-IN')}`} /><Row label="Refundable" value={`₹${Math.max(0, Number(order.finalAmount || 0) - Number(order.refundedAmount || 0)).toLocaleString('en-IN')}`} /><Row label="Razorpay order" value={order.razorpayOrderId || '-'} /><Row label="Payment ID" value={order.razorpayPaymentId || '-'} />{order.paymentFailureReason && <Row label="Failure" value={order.paymentFailureReason} />}</div>{order.refunds?.length > 0 && <details className="mt-4"><summary className="cursor-pointer text-sm font-bold">Refund history ({order.refunds.length})</summary><div className="mt-3 grid gap-2">{order.refunds.map(item => <div key={item.providerRefundId} className="rounded-xl bg-slate-50 p-3 text-xs"><strong>₹{Number(item.amount || 0).toLocaleString('en-IN')} · {item.status}</strong><p>{item.provider || 'payment provider'} · {item.providerRefundId}</p><time>{item.processedAt ? new Date(item.processedAt).toLocaleString('en-IN') : ''}</time></div>)}</div></details>}</section>
        <section className="admin-card p-5"><header className="order-section-heading"><div><h2>Private staff notes</h2><p>Never shown to the customer</p></div><Plus size={19} /></header><form onSubmit={addNote}><textarea className="admin-field__control min-h-24 w-full" maxLength={1000} value={staffNote} onChange={event => setStaffNote(event.target.value)} placeholder="Packing instruction, customer call result or internal follow-up" /><button type="submit" disabled={saving || !staffNote.trim()} className="admin-btn mt-3 w-full">Add private note</button></form><div className="order-staff-notes">{[...(order.staffNotes || [])].reverse().map((item, index) => <article key={`${item.date}-${index}`}><p>{item.text}</p><small>{item.author?.name || 'Staff'} · {item.date ? new Date(item.date).toLocaleString('en-IN') : ''}</small></article>)}{!order.staffNotes?.length && <p className="admin-note">No private notes yet.</p>}</div></section>
        {showManualShipment && <form onSubmit={saveShipment} className="admin-card p-5"><fieldset disabled={saving}><h2>Manual courier</h2><p className="admin-note">Save the real AWB before marking the order shipped.</p><input className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 font-semibold" placeholder="Courier name" value={shipmentForm.courierName} onChange={event => setShipmentForm(value => ({ ...value, courierName: event.target.value }))} /><input className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 font-semibold" placeholder="AWB / tracking number" value={shipmentForm.trackingNumber} onChange={event => setShipmentForm(value => ({ ...value, trackingNumber: event.target.value, awb: event.target.value }))} /><input className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 font-semibold" placeholder="Secure tracking URL (optional)" value={shipmentForm.trackingUrl} onChange={event => setShipmentForm(value => ({ ...value, trackingUrl: event.target.value }))} /><button type="submit" className="admin-btn mt-3 w-full">{saving ? 'Saving…' : 'Save manual shipment'}</button></fieldset></form>}
      </aside>
    </div>
    <ConfirmModal open={cancelOpen} title="Cancel this order?" message="The cancellation reason will be visible in the order history and inventory will be restored once." confirmLabel="Cancel order" onClose={() => setCancelOpen(false)} onConfirm={cancelOrder}><label className="admin-field">Cancellation reason<textarea className="admin-field__control min-h-24" maxLength={300} value={cancelReason} onChange={event => setCancelReason(event.target.value)} /></label></ConfirmModal>
    <ConfirmModal open={codOpen} title="Record COD collection" message="Confirm that cash was collected after delivery. This creates a permanent payment event." confirmLabel="Record payment" onClose={() => setCodOpen(false)} onConfirm={collectCod}><div className="grid gap-3"><label className="admin-field">Receipt/reference (optional)<input className="admin-field__control" value={codForm.reference} onChange={event => setCodForm(value => ({ ...value, reference: event.target.value }))} /></label><label className="admin-field">Collection note<textarea className="admin-field__control min-h-20" value={codForm.note} onChange={event => setCodForm(value => ({ ...value, note: event.target.value }))} /></label></div></ConfirmModal>
    <ConfirmModal open={refundOpen} title="Record COD refund" message="Use this after the return refund is completed. It records money already returned; it does not transfer funds." confirmLabel="Record refund" onClose={() => setRefundOpen(false)} onConfirm={recordRefund}><div className="grid gap-3"><label className="admin-field">Refund amount<input type="number" min="0.01" step="0.01" className="admin-field__control" value={refundForm.amount} onChange={event => setRefundForm(value => ({ ...value, amount: event.target.value }))} /></label><label className="admin-field">Receipt/reference (optional)<input className="admin-field__control" maxLength={120} value={refundForm.reference} onChange={event => setRefundForm(value => ({ ...value, reference: event.target.value }))} /></label><label className="admin-field">Refund note<textarea className="admin-field__control min-h-20" maxLength={500} value={refundForm.note} onChange={event => setRefundForm(value => ({ ...value, note: event.target.value }))} /></label></div></ConfirmModal>
  </section>;
}

function Row({ label, value }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function addressText(address) { return [address.fullName, address.houseNo, address.area, address.landmark, address.city, address.state, address.pincode, address.mobile].filter(Boolean).join(', '); }
async function copy(value, notify) { try { await navigator.clipboard.writeText(String(value || '')); notify('Copied to clipboard.'); } catch { notify('Could not copy automatically. Select and copy the value manually.'); } }
