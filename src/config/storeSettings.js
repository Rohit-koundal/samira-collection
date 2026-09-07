export const SETTINGS_CHANGED_EVENT = 'samira:settings-changed';
export const SETTINGS_STORAGE_KEY = 'samira:settings-revision';
export const SETTINGS_SECTIONS = [
  { id: 'identity', title: 'Brand & identity', note: 'Your name, logo and browser icon, consistent across your store.', icon: 'brand', keywords: 'logo company favicon' },
  { id: 'business', title: 'Business & invoices', note: 'Seller information customers see on receipts and invoices.', icon: 'invoice', keywords: 'GST tax receipt' },
  { id: 'contact', title: 'Contact & support', note: 'Help customers reach the right person, at the right time.', icon: 'contact', keywords: 'email phone address whatsapp footer hours' },
  { id: 'delivery', title: 'Orders & delivery', note: 'Control order availability, delivery charges and free shipping.', icon: 'delivery', keywords: 'pause minimum platform fee shipping' },
  { id: 'payments', title: 'Payments & COD', note: 'Payment options, cash on delivery limits and prepaid offers.', icon: 'payment', keywords: 'Razorpay UPI cards RTO pincode discount' },
  { id: 'policies', title: 'Policies & information', note: 'Clear expectations for delivery, returns and customer support.', icon: 'policy', keywords: 'privacy terms returns cancellation size FAQ story' },
  { id: 'social', title: 'Social & app links', note: 'Connect the storefront to your public profiles and shopping apps.', icon: 'social', keywords: 'Instagram Facebook YouTube Pinterest Android Apple' },
  { id: 'website', title: 'Website & announcement', note: 'Announcement, browser title and store description.', icon: 'website', keywords: 'SEO metadata banner' },
];
export const NUMBER_DEFAULTS = { freeShippingMinAmount: 999, deliveryCharge: 99, platformFee: 23, gstRate: 5, codCharge: 0, codMaxAmount: 0, codMinAmount: 0, prepaidDiscountValue: 0, rtoBlockMinOrders: 0, rtoBlockThreshold: 0, returnWindowDays: 7, minimumOrderAmount: 0 };
export const BOOLEAN_DEFAULTS = { acceptingOrders: true, brandIdentityEnabled: false, contactDetailsEnabled: false, razorpayEnabled: false, upiEnabled: true, cardPaymentEnabled: true, netBankingEnabled: true, walletEnabled: true, codEnabled: true, codConfirmationRequired: false, rtoBlockEnabled: false };
export function settingsForm(data = {}) {
  return { ...NUMBER_DEFAULTS, ...BOOLEAN_DEFAULTS, invoicePrefix: 'SC', ...data, socialLinks: { ...data.socialLinks }, appLinks: { ...data.appLinks } };
}
export function settingsPayload(form) {
  const { _id, __v, createdAt, updatedAt, storeId, ...body } = form;
  for (const key of Object.keys(NUMBER_DEFAULTS)) {
    if (String(body[key]).trim() === '' || !Number.isFinite(Number(body[key])) || Number(body[key]) < 0) throw new Error('Please enter a valid, non-negative value in every number field.');
    body[key] = Number(body[key]);
  }
  body.storeName = String(body.storeName || '').trim();
  if (!body.storeName) throw new Error('Store name is required.');
  body.prepaidDiscountType = body.prepaidDiscountType || '';
  if (updatedAt) body.expectedUpdatedAt = updatedAt;
  return body;
}
export function announceSettingsSaved() {
  window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT));
  try { localStorage.setItem(SETTINGS_STORAGE_KEY, String(Date.now())); } catch { /* Same-tab refresh still works when storage is disabled. */ }
}
