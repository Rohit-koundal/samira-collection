import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import api from '../services/api';
import { samiraApi } from '../store/apiSlice';
import { logout as logoutAction, selectUser, setCredentials, setUser as setUserAction } from '../store/authSlice';

const AuthContext = createContext(null);

export function AuthProvider({ children, navigate }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [toast, setToastState] = useState(null);

  const setToast = useCallback((value) => {
    if (!value) {
      setToastState(null);
      return;
    }

    if (typeof value === 'string') {
      setToastState({ message: value, type: 'info' });
      return;
    }

    setToastState({
      message: value.message || '',
      type: value.type || 'info',
      title: value.title || '',
    });
  }, []);

  const notify = useCallback((message, type = 'info', title = '') => {
    setToast({ message, type, title });
  }, [setToast]);

  const persist = useCallback((data) => {
    dispatch(setCredentials(data));
  }, [dispatch]);

  const resetSessionCache = useCallback(() => {
    dispatch(samiraApi.util.resetApiState());
  }, [dispatch]);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('samira_token');
    if (!token) return null;
    try {
      const profile = await api.get('/auth/me');
      dispatch(setUserAction(profile));
      return profile;
    } catch {
      dispatch(logoutAction());
      return null;
    }
  }, [dispatch]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToastState(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onRefreshed = (event) => dispatch(setUserAction(event.detail));
    const onExpired = () => {
      dispatch(logoutAction());
      dispatch(samiraApi.util.resetApiState());
    };
    window.addEventListener('samira:session-refreshed', onRefreshed);
    window.addEventListener('samira:session-expired', onExpired);
    return () => {
      window.removeEventListener('samira:session-refreshed', onRefreshed);
      window.removeEventListener('samira:session-expired', onExpired);
    };
  }, [dispatch]);

  const sendOtp = useCallback((phone) => api.post('/auth/send-otp', { phone }), []);
  const resendOtp = useCallback((phone) => api.post('/auth/resend-otp', { phone }), []);

  const verifyOtp = useCallback(async ({ phone, otp, redirectTo = '/profile' }) => {
    const data = await api.post('/auth/verify-otp', { phone, otp });
    persist(data);
    resetSessionCache();
    setToast(`Welcome ${data.user.name}`);
    navigate(redirectTo || '/profile');
    return data;
  }, [navigate, persist, resetSessionCache]);

  const login = useCallback(async ({ email, password = '', redirectTo = '/profile' }) => {
    try {
      const path = email.includes('admin') ? '/admin/login' : '/auth/login';
      const data = await api.post(path, { email, password });
      persist(data);
      resetSessionCache();
      navigate(redirectTo || (data.user.role === 'admin' && data.user.activeMode === 'admin' ? '/admin' : '/profile'));
      return { ok: true };
    } catch (error) {
      setToast(error.message);
      return { ok: false, error: error.message };
    }
  }, [navigate, persist, resetSessionCache]);

  const switchMode = useCallback(async (mode) => {
    try {
      const data = await api.post('/auth/switch-mode', { mode });
      persist(data);
      resetSessionCache();
      setToast(mode === 'admin' ? 'Switched to Admin Mode' : 'Switched to Customer Mode');
      navigate(mode === 'admin' ? '/admin' : '/');
      return { ok: true };
    } catch (error) {
      setToast(error.message);
      return { ok: false, error: error.message };
    }
  }, [navigate, persist, resetSessionCache]);

  const updateProfile = useCallback(async (payload) => {
    const profile = await api.put('/auth/profile', payload);
    dispatch(setUserAction(profile));
    resetSessionCache();
    setToast('Profile updated successfully');
    return profile;
  }, [dispatch, resetSessionCache]);

  const sendProfilePhoneChangeOtp = useCallback((phone) => api.post('/auth/profile/send-phone-change-otp', { phone }), []);
  const verifyProfilePhoneChangeOtp = useCallback((payload) => api.post('/auth/profile/verify-phone-change-otp', payload), []);
  const sendProfileEmailChangeOtp = useCallback((email) => api.post('/auth/profile/send-email-change-otp', { email }), []);
  const verifyProfileEmailChangeOtp = useCallback((payload) => api.post('/auth/profile/verify-email-change-otp', payload), []);

  const deleteProfile = useCallback(async () => {
    const response = await api.delete('/auth/profile');
    dispatch(logoutAction());
    dispatch(samiraApi.util.resetApiState());
    try {
      localStorage.removeItem('samira_login_prompt_dismissed');
    } catch {
      // Ignore storage failures.
    }
    setToast(response?.message || 'Account deleted successfully');
    navigate('/');
    return response;
  }, [dispatch, navigate]);

  const logout = useCallback(() => {
    dispatch(logoutAction());
    dispatch(samiraApi.util.resetApiState());
    try {
      localStorage.removeItem('samira_login_prompt_dismissed');
    } catch {
      // Ignore storage failures.
    }
    navigate('/');
  }, [dispatch, navigate]);

  const value = useMemo(() => ({
    user,
    login,
    sendOtp,
    resendOtp,
    verifyOtp,
    switchMode,
    updateProfile,
    sendProfilePhoneChangeOtp,
    verifyProfilePhoneChangeOtp,
    sendProfileEmailChangeOtp,
    verifyProfileEmailChangeOtp,
    deleteProfile,
    refreshProfile,
    logout,
    toast,
    setToast,
    notify,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    activeMode: user?.activeMode || 'customer',
    availableModes: user?.availableModes || ['customer'],
  }), [deleteProfile, login, logout, notify, refreshProfile, resendOtp, sendOtp, sendProfileEmailChangeOtp, sendProfilePhoneChangeOtp, setToast, switchMode, toast, updateProfile, user, verifyOtp, verifyProfileEmailChangeOtp, verifyProfilePhoneChangeOtp]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed right-3 top-3 z-[100] w-[min(22rem,calc(100vw-1.5rem))] md:right-4 md:top-4">
          <div
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left shadow-2xl transition ${
              toast.type === 'success'
                ? 'border-emerald-700 bg-emerald-600 text-white'
                : toast.type === 'error'
                  ? 'border-red-700 bg-red-600 text-white'
                  : toast.type === 'warning'
                    ? 'border-amber-500 bg-amber-400 text-amber-950'
                    : 'border-slate-700 bg-slate-800 text-white'
            }`}
          >
            <span className="mt-0.5 shrink-0" aria-hidden="true">
              {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" />
                : toast.type === 'error' ? <XCircle className="h-5 w-5" />
                  : toast.type === 'warning' ? <AlertTriangle className="h-5 w-5" />
                    : <Info className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              {toast.title ? <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-80">{toast.title}</p> : null}
              <p className={`${toast.title ? 'mt-1' : ''} text-sm font-semibold leading-5`}>{toast.message}</p>
            </div>
            <button type="button" onClick={() => setToast('')} className="shrink-0 rounded-lg p-1 hover:bg-black/10" aria-label="Dismiss notification">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
