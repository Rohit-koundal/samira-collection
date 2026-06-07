const Order = require('../models/Order');

exports.createOrder = async (req, res) => res.status(201).json(await Order.create({ ...req.body, user: req.user._id, statusTimeline: [{ status: 'Pending', date: new Date() }] }));
exports.myOrders = async (req, res) => res.json(await Order.find({ user: req.user._id }).sort('-createdAt'));
exports.getOrder = async (req, res) => res.json(await Order.findById(req.params.id).populate('user', 'name email phone'));
exports.adminOrders = async (req, res) => res.json(await Order.find().populate('user', 'name email phone').sort('-createdAt'));
exports.updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);
  order.orderStatus = req.body.orderStatus;
  order.statusTimeline.push({ status: req.body.orderStatus, date: new Date(), note: req.body.note });
  await order.save();
  res.json(order);
};
exports.updatePaymentStatus = async (req, res) => res.json(await Order.findByIdAndUpdate(req.params.id, { paymentStatus: req.body.paymentStatus }, { new: true }));
