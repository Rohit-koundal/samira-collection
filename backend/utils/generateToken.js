const jwt = require('jsonwebtoken');

function generateToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'dev_secret_change_me', { expiresIn: '30d' });
}

module.exports = generateToken;
