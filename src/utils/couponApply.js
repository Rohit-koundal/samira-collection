export function couponApplyBody({ code, cart, paymentMethod } = {}) {
  return {
    code: String(code || '').trim().toUpperCase(),
    cartTotal: Number(cart?.sellingTotal || 0),
    paymentMethod: paymentMethod || undefined,
    items: (cart?.items || []).map((item) => ({
      product: item.product?._id || item.product?.id || item.product,
      quantity: item.quantity,
      price: item.product?.price,
      category: item.product?.category?._id || item.product?.category,
    })),
  };
}

export function formatCouponOffer(coupon) {
  if (!coupon) return '';
  const amount = coupon.type === 'Percentage'
    ? `${coupon.discountValue}% off`
    : `Rs. ${coupon.discountValue} off`;
  const min = Number(coupon.minOrderAmount || 0);
  return min > 0 ? `${amount} on orders of Rs. ${min} or more` : amount;
}
