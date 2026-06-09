const jwt = require('jsonwebtoken');

function generateToken(user) {
  const id = user._id || user.id || user;
  return jwt.sign({
    id,
    userId: id,
    phone: user.phone,
    role: user.role,
    activeMode: user.activeMode,
  }, process.env.JWT_SECRET || 'dev_secret_change_me', { expiresIn: '30d' });
}

module.exports = generateToken;
