export function normalizeIndianPhone(value = '') {
  const digits = String(value).replace(/\D/g, '').replace(/^91/, '');
  return digits.length === 10 && /^[6-9]/.test(digits) ? digits : '';
}
