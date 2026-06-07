const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subCategory: String,
  price: { type: Number, required: true },
  originalPrice: Number,
  discountPercentage: Number,
  images: [{ url: String, publicId: String }],
  sizes: [String],
  colors: [String],
  fabric: String,
  occasion: String,
  stock: { type: Number, required: true, default: 0 },
  sku: String,
  tags: [String],
  careInstructions: String,
  returnPolicy: String,
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
