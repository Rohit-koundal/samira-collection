export function notificationDestination(item, user) {
  const metadata = item.metadata || {};
  const admin = item.audience === 'ADMIN';
  if (admin && user?.role !== 'admin') return '';
  if (admin) {
    if (metadata.returnId) return `/admin/returns?search=${encodeURIComponent(metadata.returnId)}`;
    if (metadata.contactId) return `/admin/support?search=${encodeURIComponent(metadata.contactId)}`;
    if (metadata.orderId) return `/admin/orders/detail?id=${encodeURIComponent(metadata.orderId)}`;
    return '/admin/notifications';
  }
  if (metadata.orderId) return `/order-detail?id=${encodeURIComponent(metadata.orderId)}`;
  if (metadata.returnId) return '/returns';
  return '';
}
export function notificationCategory(item) {
  const event = item.event || '';
  if (/^(RETURN_|EXCHANGE_)/.test(event)) return 'returns';
  if (/^(PAYMENT_|REFUND_)/.test(event)) return 'payments';
  if (/^ORDER_/.test(event) || item.metadata?.orderId) return 'orders';
  if (/^CONTACT_/.test(event)) return 'support';
  return 'updates';
}
export function notificationDate(value) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return '';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}
