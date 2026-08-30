export const CANCELLABLE_ORDER_STATUSES = ['Pending', 'Confirmed', 'Packed'];

export function canCancelOrder(order) {
  return CANCELLABLE_ORDER_STATUSES.includes(String(order?.orderStatus || ''));
}

export function productIdOf(item) {
  return String(item?.product?._id || item?.product || '').trim();
}
