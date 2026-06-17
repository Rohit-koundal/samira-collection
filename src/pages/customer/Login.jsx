import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, TextInput } from '../../components/ui';
import { ArrowLeft, HelpCircle, Smartphone } from 'lucide-react';

const OTP_STORAGE_KEY = 'samira_login_otp_state';
const OTP_COOLDOWN_SECONDS = 60;

export default function Login({ route = '/login' }) {
  const searchParams = useMemo(() => new URLSearchParams(route.split('?')[1] || ''), [route]);
  const redirectTo = searchParams.get('redirect') || '/profile';
  const initialMode = searchParams.get('mode') || 'otp';
  const savedOtpState = readOtpState();
  const { sendOtp, verifyOtp, resendOtp, login } = useAuth();
  const routePhone = searchParams.get('phone') || '';
  const [step, setStep] = useState(savedOtpState?.step || (initialMode === 'password' ? 'password' : 'phone'));
  const [countryCode, setCountryCode] = useState(savedOtpState?.countryCode || '+91');
  const [phone, setPhone] = useState(savedOtpState?.phone || routePhone || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [consent, setConsent] = useState(false);
  const [cooldown, setCooldown] = useState(() => getRemainingCooldown(savedOtpState?.cooldownExpiresAt));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const inputs = useRef([]);
  const normalizedPhone = normalizePhone(phone, countryCode);
  const isOtpComplete = otp.every(Boolean);
  const canSubmitPhone = consent && Boolean(normalizedPhone);

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (step !== 'otp' || !normalizedPhone) {
      clearOtpState();
      return;
    }
    writeOtpState({
      step,
      phone,
      countryCode,
      cooldownExpiresAt: Date.now() + cooldown * 1000,
    });
  }, [cooldown, countryCode, normalizedPhone, phone, step]);

  const requestOtp = async (event) => {
    event?.preventDefault();
    setMessage('');
    setMessageType('info');
    if (!consent) {
      setMessageType('error');
      return setMessage('Please accept the terms to continue.');
    }
    if (!normalizedPhone) {
      setMessageType('error');
      return setMessage('Enter a valid mobile number for the selected country code.');
    }
    setLoading(true);
    try {
      const data = await sendOtp(normalizedPhone);
      if (data.token && data.user) {
        setMessageType('success');
        clearOtpState();
        return setMessage('Logged in successfully.');
      }
      setStep('otp');
      setCooldown(OTP_COOLDOWN_SECONDS);
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
      await verifyOtp({ phone: normalizedPhone, otp: code, redirectTo });
      clearOtpState();
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
      setCooldown(OTP_COOLDOWN_SECONDS);
      setMessageType('success');
      setMessage(data.devOtp ? `Development OTP: ${data.devOtp}` : 'OTP resent successfully.');
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setMessage('');
    setMessageType('info');
    if (!email.trim() || !password.trim()) {
      setMessageType('error');
      return setMessage('Enter email and password to continue.');
    }
    setLoading(true);
    try {
      const result = await login({ email, password, redirectTo });
      if (result?.ok) {
        return;
      }
      setMessageType('error');
      setMessage(result?.error || 'Unable to login.');
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-font min-h-screen bg-[#f6f7fb] px-0 py-0">
      <div className="mx-auto min-h-screen w-full max-w-[470px] overflow-hidden bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.06)] md:max-w-[560px]">
        <div className="relative h-[160px] overflow-hidden bg-gradient-to-r from-[#f8e6db] via-[#fff1e6] to-[#f9e7f1] px-4 pt-4">
          <button
            type="button"
            onClick={() => {
              if (step === 'otp' || step === 'password') {
                setStep('phone');
                setMessage('');
                setOtp(['', '', '', '', '', '']);
                return;
              }
              window.history.back();
            }}
            className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/75 text-slate-700 backdrop-blur"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="absolute right-4 top-4 rounded-2xl bg-[#ff5f86] px-3 py-2 text-center text-white shadow-lg">
            <p className="text-[8px] font-bold leading-none">UP TO</p>
            <p className="text-[13px] font-extrabold leading-none">₹200</p>
          </div>
          <div className="mt-11 flex items-end justify-between gap-4">
            <div className="max-w-[220px]">
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-wine">Samira Collection</p>
              <h1 className="mt-1.5 text-[18px] font-bold leading-[1.02] text-[#ff3f7f] sm:text-[21px]">GET 25% OFF, UP TO ₹200</h1>
              <p className="mt-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-600 sm:text-[9px]">On your 1st order + exciting offers</p>
            </div>
            <div className="relative h-18 w-14 shrink-0 sm:h-20 sm:w-16">
              <div className="absolute inset-x-3 bottom-0 h-16 rounded-t-full bg-[#ffd6bf]" />
              <div className="absolute left-1/2 top-1 h-6 w-6 -translate-x-1/2 rounded-full bg-[#ffd6bf]" />
              <div className="absolute left-1/2 top-5 h-11 w-9 -translate-x-1/2 rounded-t-[40px] bg-[#f0cc73]" />
            </div>
          </div>
        </div>
        <div className="px-5 py-5 sm:px-6">
          {step === 'otp' ? (
            <form onSubmit={submitOtp} className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-[#f2f6ff] text-[#2f3851]">
                  <Smartphone className="h-9 w-9" />
                </div>
                <div className="pt-1">
                  <h2 className="text-[17px] font-bold leading-[1.05] text-[#2f3851] sm:text-[21px]">Verify with OTP</h2>
                  <p className="mt-1 text-[11px] text-slate-500 sm:text-[12px]">Sent to {maskPhone(phone)}</p>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-2" onPaste={pasteOtp}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      inputs.current[index] = node;
                    }}
                    value={digit}
                    onChange={(event) => handleOtp(index, event.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 text-center text-[14px] font-semibold text-[#2f3851] outline-none focus:border-[#ff5f86] focus:ring-2 focus:ring-[#ff5f86]/10 sm:text-[15px]"
                    inputMode="numeric"
                  />
                ))}
              </div>
              <p className="text-[11px] text-slate-400 sm:text-[12px]">Resend OTP in: <span className="font-bold text-[#2f3851]">{String(Math.floor(cooldown / 60)).padStart(2, '0')}:{String(cooldown % 60).padStart(2, '0')}</span></p>
              <Button
                type="submit"
                disabled={loading || !isOtpComplete}
                className={`h-10 w-full rounded-xl text-white disabled:opacity-60 ${isOtpComplete ? 'bg-[#ff5f86] hover:bg-[#ff4c7b]' : 'bg-[#a8a8b3] hover:bg-[#a8a8b3]'}`}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <div className="flex flex-col items-start gap-4">
                <button type="button" onClick={() => setStep('password')} className="text-[11px] font-semibold text-[#2f3851] sm:text-[12px]">
                  Log in using <span className="text-[#ff5f86]">Password</span>
                </button>
                <button type="button" onClick={doResend} disabled={!!cooldown} className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#ff5f86] disabled:text-slate-400 sm:text-[12px]">
                  Resend OTP
                </button>
                <button type="button" className="flex items-center gap-2 text-[11px] font-semibold text-[#2f3851] sm:text-[12px]">
                  Having trouble logging in? <span className="text-[#ff5f86]">Get help</span> <HelpCircle className="h-4 w-4 text-[#ff5f86]" />
                </button>
              </div>
              {message && messageType === 'error' && <StatusMessage type={messageType} message={message} onRetry={doResend} loading={loading || !!cooldown} />}
            </form>
          ) : step === 'password' ? (
            <form onSubmit={submitPassword} className="space-y-4">
              <div>
                <h2 className="text-[18px] font-bold leading-[1.05] text-[#2f3851] sm:text-[21px]">Login or Signup</h2>
                <p className="mt-2 text-[11px] text-slate-500 sm:text-[12px]">Use your mobile number and password to continue.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <TextInput value={email} onChange={(event) => setEmail(event.target.value)} className="h-10 rounded-xl border-slate-300 text-[13px]" placeholder="Email" type="email" />
                <div className="w-full overflow-hidden rounded-xl border border-slate-300">
                  <div className="flex items-center">
                    <span className="px-4 text-[11px] font-semibold text-slate-500 sm:text-[12px]">+91</span>
                    <span className="h-10 w-px bg-slate-300" />
                    <TextInput value={phone} onChange={(event) => setPhone(event.target.value)} className="h-10 w-full min-w-0 flex-1 basis-0 border-0 px-4 text-[15px] shadow-none focus:ring-0 sm:text-[16px] md:text-[16px] md:tracking-normal" placeholder="Mobile Number*" inputMode="tel" />
                  </div>
                </div>
                <TextInput value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 rounded-xl border-slate-300 text-[13px]" placeholder="Password" type="password" />
              </div>
              <Button type="submit" disabled={loading} className="h-10 w-full rounded-xl bg-[#a8a8b3] text-white hover:bg-[#9d9da8] disabled:opacity-60">{loading ? 'Logging in...' : 'Continue'}</Button>
              <button type="button" onClick={() => setStep('phone')} className="text-[11px] font-semibold text-[#2f3851] sm:text-[12px]">
                Log in using <span className="text-[#ff5f86]">OTP</span>
              </button>
              {message && <StatusMessage type={messageType} message={message} onRetry={() => {}} loading={loading} />}
            </form>
          ) : (
            <form onSubmit={requestOtp} className="space-y-4">
              <div>
                <h2 className="text-[18px] font-bold leading-[1.05] text-[#2f3851] sm:text-[21px]">Login or Signup</h2>
                <p className="mt-2 text-[11px] text-slate-500 sm:text-[12px]">Enter your mobile number to receive a one-time password.</p>
              </div>
              <div className="w-full overflow-hidden rounded-xl border border-slate-300">
                <div className="flex w-full items-center">
                  <span className="shrink-0 px-4 text-[16px] font-semibold text-slate-500 sm:text-[14px]">{countryCode}</span>
                  <span className="h-10 w-px shrink-0 bg-slate-300" />
                  <TextInput
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="h-10 w-full min-w-0 flex-1 basis-0 border-0 px-4 text-[15px] shadow-none focus:ring-0 sm:text-[16px] md:text-[16px] md:tracking-normal"
                    style={{ fontSize: '16px' }}
                    placeholder="Mobile Number*"
                    inputMode="tel"
                  />
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-3 text-[11px] text-slate-600 sm:text-[12px]">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-rose"
                />
                <span>
                  By continuing, I agree to the <span className="font-semibold text-[#ff5f86]">Terms of Use</span> & <span className="font-semibold text-[#ff5f86]">Privacy Policy</span> and I am above 18 years old.
                </span>
              </label>
              <Button
                type="submit"
                disabled={loading || !canSubmitPhone}
                className={`h-10 w-full rounded-xl text-white disabled:opacity-60 ${canSubmitPhone ? 'bg-[#ff5f86] hover:bg-[#ff4c7b]' : 'bg-[#a8a8b3] hover:bg-[#a8a8b3]'}`}
              >
                {loading ? 'Sending...' : 'Continue'}
              </Button>
              <button type="button" onClick={() => setStep('password')} className="text-[11px] font-semibold text-[#2f3851] sm:text-[12px]">
                Log in using <span className="text-[#ff5f86]">Password</span>
              </button>
              <button type="button" className="flex items-center gap-2 text-[11px] font-semibold text-[#2f3851] sm:text-[12px]">
                Having trouble logging in? <span className="text-[#ff5f86]">Get help</span> <HelpCircle className="h-4 w-4 text-[#ff5f86]" />
              </button>
              {message && <StatusMessage type={messageType} message={message} onRetry={requestOtp} loading={loading} />}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function StatusMessage({ type, message, onRetry, loading }) {
  const isError = type === 'error';
  const isSuccess = type === 'success';
  return (
    <div className={`body-text mt-4 rounded-2xl p-4 ${isError ? 'bg-rose/10 text-wine' : isSuccess ? 'bg-emerald-50 text-emerald-800' : 'bg-blush text-wine'}`}>
      <p className="text-[12px] font-semibold">{isError ? 'We could not continue right now' : isSuccess ? 'All set' : 'Note'}</p>
      <p className="mt-1 text-[12px] leading-[1.4]">{message}</p>
      {isError && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={onRetry} disabled={loading} className="rounded-xl bg-white px-4 py-2 text-[12px] text-rose shadow-sm disabled:opacity-60">
            Try Again
          </button>
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

function readOtpState() {
  try {
    const raw = localStorage.getItem(OTP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.phone || !parsed?.cooldownExpiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeOtpState(state) {
  try {
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures and continue with in-memory countdown.
  }
}

function clearOtpState() {
  try {
    localStorage.removeItem(OTP_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function getRemainingCooldown(cooldownExpiresAt) {
  const expiresAt = Number(cooldownExpiresAt || 0);
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}
