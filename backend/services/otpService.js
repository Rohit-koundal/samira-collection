const crypto = require('crypto');

function normalizePhone(phone = '') {
  const digits = String(phone).replace(/\D/g, '').replace(/^91/, '');
  return /^[6-9]\d{9}$/.test(digits) ? digits : '';
}

function generateOtp() {
  if (process.env.OTP_PROVIDER === 'mock') return process.env.OTP_DEV_CODE || '123456';
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(phone, otp) {
  return crypto.createHash('sha256').update(`${phone}:${otp}:${process.env.JWT_SECRET || 'dev_secret_change_me'}`).digest('hex');
}

function verifyOtpHash(phone, otp, otpHash) {
  return hashOtp(phone, otp) === otpHash;
}

module.exports = { normalizePhone, generateOtp, hashOtp, verifyOtpHash };
