import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, TextInput } from '../../components/ui';
import { ArrowLeft, Eye, EyeOff, HelpCircle, Smartphone } from 'lucide-react';
import useDesktopFeedback from '../../hooks/useDesktopFeedback';
import { pushAppRoute } from '../../utils/routing';
import { clearOtpState, readOtpState, writeOtpState } from '../../utils/loginOtpStorage';
import { digitsOnly, isValidIndianMobile, PHONE_VALIDATION_MESSAGE } from '../../utils/phoneInput';

const OTP_COOLDOWN_SECONDS = 60;

export default function Login({ route = '/login' }) {
  const searchParams = useMemo(() => new URLSearchParams(route.split('?')[1] || ''), [route]);
  const redirectTo = searchParams.get('redirect') || '/profile';
  const initialMode = searchParams.get('mode') || 'otp';
  const autoSendOtp = searchParams.get('autoSendOtp') === '1';
  const routeStep = searchParams.get('step') || '';
  const { sendOtp, verifyOtp, resendOtp, login } = useAuth();
  const { notify } = useDesktopFeedback();
  const routePhone = searchParams.get('phone') || '';
  const savedOtpState = readOtpState();
  const [step, setStep] = useState(() => (routeStep === 'otp' || routeStep === 'password' ? routeStep : (initialMode === 'password' ? 'password' : 'phone')));
  const [countryCode] = useState('+91');
  const [phone, setPhone] = useState(digitsOnly(routePhone, 10));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [consent, setConsent] = useState(searchParams.get('consent') === '1');
  const [cooldown, setCooldown] = useState(() => getRemainingCooldown(savedOtpState?.cooldownExpiresAt));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [autoRequested, setAutoRequested] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const inputs = useRef([]);
  const normalizedPhone = normalizePhone(phone, countryCode);
  const isOtpComplete = otp.every(Boolean);
  const canSubmitPhone = consent && Boolean(normalizedPhone);
  const canSubmitPassword = Boolean(normalizedPhone) && password.trim().length >= 6;
  const phoneHint = phone && !normalizedPhone ? PHONE_VALIDATION_MESSAGE : '';
  const setPhoneDigits = (value) => setPhone(digitsOnly(value, 10));
  const showFeedback = useCallback((text, type = 'info') => {
    if (!text) return;
    if (!notify(text, type, 'Login')) {
      setMessageType(type);
      setMessage(text);
    } else {
      setMessage('');
    }
  }, [notify]);

  const buildLoginUrl = useCallback((nextStep, nextPhone = normalizedPhone || phone) => {
    const params = new URLSearchParams();
    if (redirectTo) params.set('redirect', redirectTo);
    const digits = String(nextPhone || '').replace(/\D/g, '').slice(-10);
    if (digits) params.set('phone', digits);
    if (consent) params.set('consent', '1');
    if (nextStep && nextStep !== 'phone') params.set('step', nextStep);
    const qs = params.toString();
    return qs ? `/login?${qs}` : '/login';
  }, [consent, normalizedPhone, phone, redirectTo]);

  const enterAuthStep = useCallback((nextStep, nextPhone = normalizedPhone || phone) => {
    const phoneUrl = buildLoginUrl('phone', nextPhone);
    const nextUrl = buildLoginUrl(nextStep, nextPhone);
    const current = `${window.location.pathname}${window.location.search}`;
    const onLoginPhone = window.location.pathname === '/login' && !new URLSearchParams(window.location.search).get('step');

    if (nextStep === 'phone') {
      clearOtpState();
      setStep('phone');
      setOtp(['', '', '', '', '', '']);
      setDemoOtp('');
      setMessage('');
      if (current !== phoneUrl) pushAppRoute(phoneUrl);
      return;
    }

    if (!onLoginPhone) {
      if (window.location.pathname === '/login') {
        window.history.replaceState(null, '', phoneUrl);
      } else {
        window.history.pushState(null, '', phoneUrl);
      }
    } else if (new URLSearchParams(window.location.search).get('autoSendOtp')) {
      window.history.replaceState(null, '', phoneUrl);
    }
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) pushAppRoute(nextUrl);
    setStep(nextStep);
  }, [buildLoginUrl, normalizedPhone, phone]);

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const nextStep = routeStep === 'otp' || routeStep === 'password'
      ? routeStep
      : (initialMode === 'password' ? 'password' : 'phone');
    setStep(nextStep);
    if (routePhone && digitsOnly(routePhone, 10) !== phone) setPhone(digitsOnly(routePhone, 10));
    if (nextStep !== 'otp') {
      setOtp(['', '', '', '', '', '']);
      setDemoOtp('');
    }
  }, [initialMode, routePhone, routeStep]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step !== 'otp' || !normalizedPhone) {
      if (step !== 'otp') clearOtpState();
      return;
    }
    writeOtpState({
      step,
      phone: normalizedPhone,
      countryCode,
      cooldownExpiresAt: Date.now() + cooldown * 1000,
    });
  }, [cooldown, countryCode, normalizedPhone, step]);

  const requestOtp = useCallback(async (event) => {
    event?.preventDefault();
    setMessage('');
    setMessageType('info');
    if (!consent) {
      return showFeedback('Please accept the terms to continue.', 'error');
    }
    if (!normalizedPhone) {
      return showFeedback('Enter a valid mobile number for the selected country code.', 'error');
    }
    setLoading(true);
    try {
      const data = await sendOtp(normalizedPhone);
      if (data.token && data.user) {
        clearOtpState();
        return showFeedback('Logged in successfully.', 'success');
      }
      setCooldown(OTP_COOLDOWN_SECONDS);
      setDemoOtp(readDemoOtp(data));
      enterAuthStep('otp', normalizedPhone);
      showFeedback(otpSentMessage(data), 'success');
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (error) {
      showFeedback(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [consent, enterAuthStep, normalizedPhone, sendOtp, showFeedback]);

  useEffect(() => {
    if (!autoSendOtp || autoRequested) return;
    if (step !== 'phone' || !normalizedPhone || !consent || loading) return;
    setAutoRequested(true);
    requestOtp();
  }, [autoRequested, autoSendOtp, consent, loading, normalizedPhone, requestOtp, step]);

  const submitOtp = async (event) => {
    event.preventDefault();
    setMessage('');
    setMessageType('info');
    const code = otp.join('');
    if (code.length !== 6) {
      return showFeedback('Enter the 6-digit OTP.', 'error');
    }
    setLoading(true);
    try {
      await verifyOtp({ phone: normalizedPhone, otp: code, redirectTo });
      clearOtpState();
    } catch (error) {
      showFeedback(error.message, 'error');
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
      setDemoOtp(readDemoOtp(data));
      showFeedback(otpSentMessage(data, 'OTP resent successfully.'), 'success');
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setMessage('');
    setMessageType('info');
    if (!normalizedPhone) {
      return showFeedback(PHONE_VALIDATION_MESSAGE, 'error');
    }
    if (password.trim().length < 6) {
      return showFeedback('Enter your password to continue.', 'error');
    }
    setLoading(true);
    try {
      const result = await login({ phone: normalizedPhone, password, redirectTo });
      if (result?.ok) {
        return;
      }
      showFeedback(result?.error || 'Unable to login.', 'error');
    } catch (error) {
      showFeedback(error.message, 'error');
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
                if (window.history.length > 1 && routeStep) {
                  window.history.back();
                  return;
                }
                enterAuthStep('phone');
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
              {demoOtp ? (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-amber-700">Demo Mode</p>
                  <p className="mt-1 text-[13px] font-semibold text-amber-900">Demo OTP: {demoOtp}</p>
                </div>
              ) : null}
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
                <button type="button" onClick={() => enterAuthStep('password')} className="text-[11px] font-semibold text-[#2f3851] sm:text-[12px]">
                  Log in using <span className="text-[#ff5f86]">Password</span>
                </button>
                <button type="button" onClick={doResend} disabled={!!cooldown} className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#ff5f86] disabled:text-slate-400 sm:text-[12px]">
                  Resend OTP
                </button>
                <HelpLink />
              </div>
              {message && messageType === 'error' && <StatusMessage type={messageType} message={message} onRetry={doResend} loading={loading || !!cooldown} className="md:hidden" />}
            </form>
          ) : step === 'password' ? (
            <form onSubmit={submitPassword} className="space-y-4">
              <div>
                <h2 className="text-[18px] font-bold leading-[1.05] text-[#2f3851] sm:text-[21px]">Login with Phone</h2>
                <p className="mt-2 text-[11px] text-slate-500 sm:text-[12px]">Use your mobile number and password to continue.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <PhoneField value={phone} onChange={setPhoneDigits} />
                {phoneHint ? <p className="text-[11px] font-medium text-[#c81e4a]">{phoneHint}</p> : null}
                <div className="relative">
                  <TextInput
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-10 rounded-xl border-slate-300 pr-12 text-[13px]"
                    placeholder="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading || !canSubmitPassword}
                className={`h-10 w-full rounded-xl text-white disabled:cursor-not-allowed disabled:opacity-60 ${canSubmitPassword ? 'bg-[#ff5f86] hover:bg-[#ff4c7b]' : 'bg-[#a8a8b3] hover:bg-[#a8a8b3]'}`}
              >
                {loading ? 'Logging in...' : 'Continue'}
              </Button>
              <button type="button" onClick={() => enterAuthStep('phone')} className="text-[11px] font-semibold text-[#2f3851] sm:text-[12px]">
                Log in using <span className="text-[#ff5f86]">OTP</span>
              </button>
              <HelpLink />
              {message && <StatusMessage type={messageType} message={message} onRetry={() => {}} loading={loading} className="md:hidden" />}
            </form>
          ) : (
            <form onSubmit={requestOtp} className="space-y-4">
              <div>
                <h2 className="text-[18px] font-bold leading-[1.05] text-[#2f3851] sm:text-[21px]">Login or Signup</h2>
                <p className="mt-2 text-[11px] text-slate-500 sm:text-[12px]">Enter your mobile number to receive a one-time password.</p>
              </div>
              <PhoneField value={phone} onChange={setPhoneDigits} countryCode={countryCode} />
              {phoneHint ? <p className="text-[11px] font-medium text-[#c81e4a]">{phoneHint}</p> : null}
              <div className="flex items-start gap-3 text-[11px] text-slate-600 sm:text-[12px]">
                <input
                  id="login-consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-rose"
                />
                <p>
                  By continuing, I agree to the <PolicyLink href="/terms">Terms of Use</PolicyLink>
                  {' & '}
                  <PolicyLink href="/privacy-policy">Privacy Policy</PolicyLink>
                  {' '}and I am above 18 years old.
                </p>
              </div>
              <Button
                type="submit"
                disabled={loading || !canSubmitPhone}
                className={`h-10 w-full rounded-xl text-white disabled:opacity-60 ${canSubmitPhone ? 'bg-[#ff5f86] hover:bg-[#ff4c7b]' : 'bg-[#a8a8b3] hover:bg-[#a8a8b3]'}`}
              >
                {loading ? 'Sending...' : 'Continue'}
              </Button>
              <button type="button" onClick={() => enterAuthStep('password')} className="text-[11px] font-semibold text-[#2f3851] sm:text-[12px]">
                Log in using <span className="text-[#ff5f86]">Password</span>
              </button>
              <HelpLink />
              {message && <StatusMessage type={messageType} message={message} onRetry={requestOtp} loading={loading} className="md:hidden" />}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function StatusMessage({ type, message, onRetry, loading, className = '' }) {
  const isError = type === 'error';
  const isSuccess = type === 'success';
  return (
    <div className={`body-text mt-4 rounded-2xl p-4 ${className} ${isError ? 'bg-rose/10 text-wine' : isSuccess ? 'bg-emerald-50 text-emerald-800' : 'bg-blush text-wine'}`}>
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

/**
 * The backend only returns a code when it is running in demo mode. In
 * production mode nothing is returned and nothing is shown.
 */
function readDemoOtp(response) {
  if (response?.otpMode && response.otpMode !== 'demo') return '';
  return String(response?.demoOtp || response?.devOtp || '');
}

function otpSentMessage(response, fallback = 'OTP sent successfully.') {
  const code = readDemoOtp(response);
  return code ? `Demo OTP: ${code}` : fallback;
}

function PhoneField({ value, onChange, countryCode = '+91' }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-300">
      <div className="flex w-full items-center">
        <span className="shrink-0 px-4 text-[14px] font-semibold text-slate-500">{countryCode}</span>
        <span className="h-10 w-px shrink-0 bg-slate-300" />
        <TextInput
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full min-w-0 flex-1 basis-0 border-0 px-4 text-[15px] shadow-none focus:ring-0 sm:text-[16px]"
          style={{ fontSize: '16px' }}
          placeholder="Mobile Number*"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={10}
          pattern="[0-9]*"
        />
      </div>
    </div>
  );
}

function PolicyLink({ href, children }) {
  return (
    <a href={href} className="font-semibold text-[#ff5f86] underline-offset-2 hover:underline">
      {children}
    </a>
  );
}

function HelpLink() {
  return (
    <p className="flex items-center gap-2 text-[11px] font-semibold text-[#2f3851] sm:text-[12px]">
      Having trouble logging in?
      <a href="/contact" className="inline-flex items-center gap-1 text-[#ff5f86] underline-offset-2 hover:underline">
        Get help <HelpCircle className="h-4 w-4" />
      </a>
    </p>
  );
}

function normalizePhone(value, countryCode) {
  const digits = digitsOnly(value, 12);
  if (countryCode === '+91') {
    return isValidIndianMobile(digits.replace(/^91/, '')) ? digits.replace(/^91/, '').slice(-10) : '';
  }
  return digits.length >= 6 ? `${countryCode}${digits}` : '';
}

function maskPhone(value) {
  return value ? `${value.slice(0, 2)}XXXXX${value.slice(-3)}` : '';
}

function getRemainingCooldown(cooldownExpiresAt) {
  const expiresAt = Number(cooldownExpiresAt || 0);
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}
