import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import { samiraApi } from '../store/apiSlice';
import { logout as logoutAction, selectUser, setCredentials, setUser as setUserAction } from '../store/authSlice';

const AuthContext = createContext(null);

export function AuthProvider({ children, navigate }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [toast, setToast] = useState('');

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
    const timer = window.setTimeout(() => setToast(''), 3500);
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
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    activeMode: user?.activeMode || 'customer',
    availableModes: user?.availableModes || ['customer'],
  }), [deleteProfile, login, logout, refreshProfile, resendOtp, sendOtp, sendProfileEmailChangeOtp, sendProfilePhoneChangeOtp, switchMode, toast, updateProfile, user, verifyOtp, verifyProfileEmailChangeOtp, verifyProfilePhoneChangeOtp]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {toast && (
        <button type="button" onClick={() => setToast('')} className="fixed right-4 top-4 z-[80] rounded-xl bg-charcoal px-4 py-3 text-sm font-bold text-white shadow-2xl">
          {toast}
        </button>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
