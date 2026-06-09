import { normalizeIndianPhone } from './phoneFormatter';

export function buildReceiptMessage(receipt) {
  const lines = [
    `Hello, your ${receipt.storeDetails?.storeName || 'Samira Collection'} order has been placed successfully.`,
    '',
    `Order ID: #${String(receipt.orderId).slice(-8).toUpperCase()}`,
    `Order Date: ${new Date(receipt.orderDate).toLocaleString('en-IN')}`,
    `Customer: ${receipt.customer?.name || receipt.shippingAddress?.fullName || '-'}`,
    `Payment Method: ${receipt.paymentMethod}`,
    `Payment Status: ${receipt.paymentStatus}`,
    `Order Status: ${receipt.orderStatus}`,
    '',
    'Items:',
    ...receipt.items.map((item, index) => `${index + 1}. ${item.name} - Size: ${item.size || '-'}, Qty: ${item.quantity}, Amount: Rs. ${item.price * item.quantity}`),
    '',
    `Total MRP: Rs. ${receipt.totalMRP || 0}`,
    `Product Discount: Rs. ${receipt.productDiscount || 0}`,
    `Coupon Discount: Rs. ${receipt.couponDiscount || 0}`,
    `Delivery Charge: Rs. ${receipt.deliveryCharge || 0}`,
    `COD Charge: Rs. ${receipt.codCharge || 0}`,
    `Final Amount: Rs. ${receipt.finalAmount || 0}`,
    '',
    'Delivery Address:',
    formatAddress(receipt.shippingAddress),
    '',
    'Thank you for shopping with Samira Collection.',
  ];
  return lines.join('\n');
}

export function getWhatsAppUrl(receipt, phone) {
  const mobile = normalizeIndianPhone(phone);
  if (!mobile) return '';
  return `https://wa.me/91${mobile}?text=${encodeURIComponent(buildReceiptMessage(receipt))}`;
}

export function formatAddress(address = {}) {
  return [address.fullName, address.houseNo || address.houseNumber, address.area, address.landmark, address.city, address.state, address.pincode].filter(Boolean).join(', ');
}
