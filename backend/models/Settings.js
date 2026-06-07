const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'Samira Collection' },
  contactEmail: String,
  contactPhone: String,
  whatsappNumber: String,
  address: String,
  freeShippingMinAmount: { type: Number, default: 999 },
  deliveryCharge: { type: Number, default: 99 },
  socialLinks: Object,
  footerText: String,
  returnPolicy: String,
  privacyPolicy: String,
  termsConditions: String,
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
