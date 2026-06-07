const User = require('../models/User');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ user: sanitize(user), token: generateToken(user._id, user.role) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
  res.json({ user: sanitize(user), token: generateToken(user._id, user.role) });
};

exports.profile = async (req, res) => res.json(req.user);

exports.updateProfile = async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();
  res.json(sanitize(req.user));
};

function sanitize(user) {
  const data = user.toObject();
  delete data.password;
  return data;
}
