const router = require('express').Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
  res.json(await User.find({ role: 'customer' }).select('-password').sort('-createdAt'));
});

router.patch('/:id/block', async (req, res) => {
  const customer = await User.findByIdAndUpdate(req.params.id, { isBlocked: req.body.isBlocked }, { new: true }).select('-password');
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json(customer);
});

module.exports = router;
