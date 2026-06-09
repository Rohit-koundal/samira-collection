async function sendOtp(phone, otp) {
  const provider = process.env.OTP_PROVIDER || 'mock';
  if (provider === 'mock') {
    return { success: true, provider, devOtp: process.env.NODE_ENV === 'production' ? undefined : otp };
  }
  return { success: true, provider, message: 'SMS provider integration placeholder' };
}

module.exports = { sendOtp };
