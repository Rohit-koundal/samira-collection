const router = require('express').Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
  res.json(await User.find().select('-password').sort('-createdAt'));
});

router.patch('/:id/block', async (req, res) => {
  const customer = await User.findByIdAndUpdate(req.params.id, { isBlocked: req.body.isBlocked }, { new: true }).select('-password');
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json(customer);
});

router.patch('/:id/promote-admin', async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: 'admin', availableModes: ['customer', 'admin'], activeMode: 'customer' }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

router.patch('/:id/demote-admin', async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ message: 'You cannot demote yourself' });
  const user = await User.findByIdAndUpdate(req.params.id, { role: 'customer', availableModes: ['customer'], activeMode: 'customer' }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

module.exports = router;
