const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) return res.status(401).json({ message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || req.user.isBlocked) return res.status(401).json({ message: 'Account unavailable' });
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token failed' });
  }
}

module.exports = { protect };
