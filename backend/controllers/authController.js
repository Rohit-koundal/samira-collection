const User = require('../models/User');
const Otp = require('../models/Otp');
const generateToken = require('../utils/generateToken');
const { normalizePhone, generateOtp, hashOtp, verifyOtpHash } = require('../services/otpService');
const { sendOtp } = require('../services/smsProvider');

exports.register = async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ user: sanitize(user), token: generateToken(user) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
  if (user.role === 'admin') {
    user.availableModes = ['customer', 'admin'];
    user.activeMode = 'admin';
    await user.save();
  }
  res.json({ user: sanitize(user), token: generateToken(user) });
};

exports.profile = async (req, res) => res.json(req.user);

exports.updateProfile = async (req, res) => {
  const { role, availableModes, activeMode, isBlocked, ...safeBody } = req.body;
  Object.assign(req.user, safeBody);
  await req.user.save();
  res.json(sanitize(req.user));
};

exports.sendOtp = async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!phone) return res.status(400).json({ message: 'Valid 10-digit mobile number is required' });
  const latest = await Otp.findOne({ phone, isUsed: false }).sort('-createdAt');
  const cooldown = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);
  if (latest && Date.now() - latest.createdAt.getTime() < cooldown * 1000) {
    return res.status(429).json({ message: `Please wait ${cooldown}s before requesting another OTP` });
  }
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + Number(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000);
  await Otp.create({ phone, otpHash: hashOtp(phone, otp), expiresAt, purpose: 'login' });
  await sendOtp(phone, otp);
  res.json({ success: true, message: 'OTP sent successfully', devOtp: process.env.NODE_ENV === 'production' ? undefined : otp });
};

exports.resendOtp = exports.sendOtp;

exports.verifyOtp = async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const otp = String(req.body.otp || '');
  if (!phone || !/^\d{6}$/.test(otp)) return res.status(400).json({ message: 'Valid phone and OTP are required' });
  const record = await Otp.findOne({ phone, isUsed: false }).sort('-createdAt');
  if (!record) return res.status(400).json({ message: 'OTP not found or expired' });
  if (record.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });
  if (record.attempts >= Number(process.env.OTP_MAX_ATTEMPTS || 5)) return res.status(429).json({ message: 'Maximum OTP attempts exceeded' });
  if (!verifyOtpHash(phone, otp, record.otpHash)) {
    record.attempts += 1;
    await record.save();
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  record.isUsed = true;
  await record.save();

  const adminPhones = String(process.env.ADMIN_PHONE_NUMBERS || '').split(',').map((item) => normalizePhone(item)).filter(Boolean);
  const isAdminPhone = adminPhones.includes(phone);
  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({
      name: `Samira User ${phone.slice(-4)}`,
      phone,
      isPhoneVerified: true,
      role: isAdminPhone ? 'admin' : 'customer',
      availableModes: isAdminPhone ? ['customer', 'admin'] : ['customer'],
      activeMode: 'customer',
    });
  } else {
    if (user.isBlocked) return res.status(403).json({ message: 'Account is blocked' });
    user.isPhoneVerified = true;
    if (isAdminPhone && user.role !== 'admin') {
      user.role = 'admin';
      user.availableModes = ['customer', 'admin'];
    }
    if (!user.availableModes?.length) user.availableModes = user.role === 'admin' ? ['customer', 'admin'] : ['customer'];
    user.activeMode = user.activeMode || 'customer';
    await user.save();
  }

  res.json({ success: true, user: sanitize(user), token: generateToken(user) });
};

exports.me = async (req, res) => res.json(sanitize(req.user));

exports.switchMode = async (req, res) => {
  const mode = req.body.mode;
  if (!['customer', 'admin'].includes(mode)) return res.status(400).json({ message: 'Invalid mode' });
  if (mode === 'admin' && (req.user.role !== 'admin' || !req.user.availableModes?.includes('admin'))) {
    return res.status(403).json({ message: 'Admin mode is not allowed' });
  }
  req.user.activeMode = mode;
  await req.user.save();
  res.json({ success: true, user: sanitize(req.user), token: generateToken(req.user) });
};

function sanitize(user) {
  const data = user.toObject();
  delete data.password;
  return data;
}
