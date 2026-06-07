import products from './seedProducts';
import categories from './categories';

export const coupons = [
  { code: 'SAMIRA10', type: 'Percentage', discountValue: 10, minOrderAmount: 999, maxDiscountAmount: 500, isActive: true },
  { code: 'FESTIVE20', type: 'Percentage', discountValue: 20, minOrderAmount: 1999, maxDiscountAmount: 900, isActive: true },
  { code: 'NEWUSER15', type: 'Percentage', discountValue: 15, minOrderAmount: 799, maxDiscountAmount: 450, isActive: true },
  { code: 'FREESHIP', type: 'Flat', discountValue: 99, minOrderAmount: 999, maxDiscountAmount: 99, isActive: true },
  { code: 'SALE250', type: 'Flat', discountValue: 250, minOrderAmount: 1499, maxDiscountAmount: 250, isActive: false },
];

export const banners = [
  { title: 'Festive Radiance', subtitle: 'Up to 55% off on celebration wear', type: 'Hero', isActive: true },
  { title: 'Daily Wear Edit', subtitle: 'Easy silhouettes under Rs. 999', type: 'Offer', isActive: true },
  { title: 'Wedding Closet', subtitle: 'Lehengas, sarees and gowns', type: 'Category', isActive: true },
  { title: 'New Arrivals', subtitle: 'Fresh drops every week', type: 'Offer', isActive: true },
  { title: 'Dupatta Story', subtitle: 'Finish every outfit beautifully', type: 'Category', isActive: true },
];

export const orders = Array.from({ length: 10 }, (_, index) => ({
  id: `SCORD-${202600 + index}`,
  customer: index % 2 ? 'Anaya Sharma' : 'Riya Mehta',
  email: index % 2 ? 'anaya@example.com' : 'customer@test.com',
  phone: '9876543210',
  amount: 1599 + index * 420,
  paymentMethod: index % 3 ? 'COD' : 'UPI',
  paymentStatus: index % 3 ? 'Pending' : 'Paid',
  orderStatus: ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'][index % 5],
  date: `2026-06-${String(index + 1).padStart(2, '0')}`,
}));

export const customers = [
  { name: 'Riya Mehta', email: 'customer@test.com', phone: '9876543210', totalOrders: 6, totalSpent: 14890, status: 'Active' },
  { name: 'Anaya Sharma', email: 'anaya@example.com', phone: '9811122233', totalOrders: 3, totalSpent: 7290, status: 'Active' },
  { name: 'Mira Kapoor', email: 'mira@example.com', phone: '9900011112', totalOrders: 1, totalSpent: 2190, status: 'Blocked' },
];

export { products, categories };
