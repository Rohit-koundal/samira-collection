export function couponApplyBody({ code, cart, paymentMethod } = {}) {
  return {
    code: String(code || '').trim().toUpperCase(),
    cartTotal: Number(cart?.sellingTotal || 0),
    paymentMethod: paymentMethod || undefined,
    items: (cart?.items || []).map((item) => ({
      product: item.product?._id || item.product?.id || item.product,
      quantity: item.quantity,
      size: item.size || '',
      color: item.color || '',
      variantId: item.variantId || '',
    })),
  };
}

export function formatCouponOffer(coupon) {
  if (!coupon) return '';
  const amount = coupon.type === 'Percentage'
    ? `${coupon.discountValue}% off`
    : `Rs. ${coupon.discountValue} off`;
  const min = Number(coupon.minOrderAmount || 0);
  const cap = coupon.type === 'Percentage' && Number(coupon.maxDiscountAmount || 0) > 0
    ? `, up to Rs. ${coupon.maxDiscountAmount}`
    : '';
  return min > 0 ? `${amount}${cap} on orders of Rs. ${min} or more` : `${amount}${cap}`;
}

export function formatCouponExpiry(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function couponTerms(coupon) {
  if (!coupon) return [];
  const terms = [];
  if (coupon.firstOrderOnly) terms.push('Valid on your first order only');
  if (Number(coupon.customerLimit || 0) > 0) terms.push(`Maximum ${coupon.customerLimit} use${Number(coupon.customerLimit) === 1 ? '' : 's'} per customer`);
  if (coupon.applicablePaymentMethods?.length) terms.push(`Payment: ${coupon.applicablePaymentMethods.join(', ')}`);
  if (coupon.applicableProducts?.length || coupon.applicableCategories?.length) terms.push('Valid only on selected products');
  if (coupon.terms) terms.push(coupon.terms);
  return terms;
}
