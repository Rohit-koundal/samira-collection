import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/samira-collection-logo.svg';

export default function Login() {
  const { sendOtp, verifyOtp, resendOtp } = useAuth();
  const [step, setStep] = useState('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const inputs = useRef([]);

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const normalizedPhone = normalizePhone(phone, countryCode);

  const requestOtp = async (event) => {
    event?.preventDefault();
    setMessage('');
    setMessageType('info');
    if (!normalizedPhone) {
      setMessageType('error');
      return setMessage('Enter a valid mobile number for the selected country code.');
    }
    setLoading(true);
    try {
      const data = await sendOtp(normalizedPhone);
      if (data.token && data.user) {
        setMessageType('success');
        return setMessage('Logged in successfully.');
      }
      setStep('otp');
      setCooldown(60);
      setMessageType('success');
      setMessage(data.devOtp ? `Development OTP: ${data.devOtp}` : 'OTP sent successfully.');
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (event) => {
    event.preventDefault();
    setMessage('');
    setMessageType('info');
    const code = otp.join('');
    if (code.length !== 6) {
      setMessageType('error');
      return setMessage('Enter the 6-digit OTP.');
    }
    setLoading(true);
    try {
      await verifyOtp({ phone: normalizedPhone, otp: code });
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };

  const pasteOtp = (event) => {
    const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      event.preventDefault();
      setOtp(text.split(''));
    }
  };

  const doResend = async () => {
    if (cooldown) return;
    try {
      const data = await resendOtp(normalizedPhone);
      setCooldown(60);
      setMessageType('success');
      setMessage(data.devOtp ? `Development OTP: ${data.devOtp}` : 'OTP resent successfully.');
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    }
  };

  return (
    <section className="grid min-h-[76vh] place-items-center overflow-x-hidden px-4 py-10">
      <form onSubmit={step === 'phone' ? requestOtp : submitOtp} className="w-full max-w-[400px] rounded-2xl bg-white p-5 shadow-xl sm:max-w-md md:rounded-3xl md:p-7">
        <img src={logo} alt="Samira Collection" className="mx-auto h-16 max-w-full sm:h-20" />
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.14em] text-wine md:mt-6 md:text-xs md:tracking-[0.22em]">Secure mobile login</p>
        <h1 className="mt-2 text-2xl font-black leading-tight md:text-3xl">Login with Mobile Number</h1>
        {step === 'phone' ? (
          <>
            <div className="mt-6 grid w-full grid-cols-[122px_minmax(0,1fr)] gap-2 sm:grid-cols-[132px_minmax(0,1fr)]">
              <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="h-12 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black">
                {countryCodes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} className="h-12 min-w-0 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder="Enter mobile number" inputMode="tel" />
            </div>
            <button disabled={loading} className="mt-5 h-12 w-full rounded-xl bg-rose text-sm font-black text-white disabled:opacity-60">{loading ? 'Sending...' : 'Continue'}</button>
          </>
        ) : (
          <>
            <p className="mt-5 text-sm font-semibold text-slate-500">Enter OTP sent to {countryCode} {maskPhone(phone)}</p>
            <div className="mt-4 grid grid-cols-6 gap-2" onPaste={pasteOtp}>
              {otp.map((digit, index) => <input key={index} ref={(node) => { inputs.current[index] = node; }} value={digit} onChange={(event) => handleOtp(index, event.target.value)} className="h-12 rounded-xl border border-slate-200 text-center text-lg font-black" inputMode="numeric" />)}
            </div>
            <button disabled={loading} className="mt-5 h-12 w-full rounded-xl bg-rose text-sm font-black text-white disabled:opacity-60">{loading ? 'Verifying...' : 'Verify OTP'}</button>
            <div className="mt-4 flex items-center justify-between text-sm font-black">
              <button type="button" onClick={() => setStep('phone')} className="text-wine">Change number</button>
              <button type="button" onClick={doResend} disabled={!!cooldown} className="text-rose disabled:text-slate-400">{cooldown ? `Resend in ${cooldown}s` : 'Resend OTP'}</button>
            </div>
          </>
        )}
        {message && <StatusMessage type={messageType} message={message} onRetry={step === 'phone' ? requestOtp : doResend} loading={loading || !!cooldown} />}
      </form>
    </section>
  );
}

function StatusMessage({ type, message, onRetry, loading }) {
  const isError = type === 'error';
  const isSuccess = type === 'success';
  return (
    <div className={`mt-4 rounded-2xl p-4 text-sm ${isError ? 'bg-rose/10 text-wine' : isSuccess ? 'bg-emerald-50 text-emerald-800' : 'bg-blush text-wine'}`}>
      <p className="font-black">{isError ? 'We could not continue right now' : isSuccess ? 'All set' : 'Note'}</p>
      <p className="mt-1 font-semibold leading-6">{message}</p>
      {isError && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={onRetry} disabled={loading} className="rounded-xl bg-white px-4 py-2 text-xs font-black text-rose shadow-sm disabled:opacity-60">
            Try Again
          </button>
          <span className="text-xs font-semibold text-slate-600">No payment or order data is affected.</span>
        </div>
      )}
    </div>
  );
}

const countryCodes = [
  { value: '+91', label: 'IN +91' },
  { value: '+1', label: 'US +1' },
  { value: '+44', label: 'UK +44' },
  { value: '+971', label: 'AE +971' },
  { value: '+61', label: 'AU +61' },
];

function normalizePhone(value, countryCode) {
  const digits = String(value).replace(/\D/g, '');
  if (countryCode === '+91') {
    const local = digits.replace(/^91/, '');
    return /^[6-9]\d{9}$/.test(local) ? local : '';
  }
  return digits.length >= 6 ? `${countryCode}${digits}` : '';
}

function maskPhone(value) {
  return value ? `${value.slice(0, 2)}XXXXX${value.slice(-3)}` : '';
}
