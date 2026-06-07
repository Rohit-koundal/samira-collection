const Coupon = require('../models/Coupon');

exports.getCoupons = async (req, res) => res.json(await Coupon.find({ isActive: true }));
exports.createCoupon = async (req, res) => res.status(201).json(await Coupon.create(req.body));
exports.updateCoupon = async (req, res) => res.json(await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }));
exports.deleteCoupon = async (req, res) => { await Coupon.findByIdAndDelete(req.params.id); res.json({ message: 'Coupon deleted' }); };
exports.applyCoupon = async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.body.code?.toUpperCase(), isActive: true });
  if (!coupon || coupon.expiryDate < new Date()) return res.status(400).json({ message: 'Invalid or expired coupon' });
  if (req.body.amount < coupon.minOrderAmount) return res.status(400).json({ message: 'Minimum order amount not met' });
  const raw = coupon.type === 'Percentage' ? (req.body.amount * coupon.discountValue) / 100 : coupon.discountValue;
  res.json({ coupon, discount: Math.min(raw, coupon.maxDiscountAmount || raw) });
};
