import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import { logout as logoutAction, selectUser, setCredentials, setUser as setUserAction } from '../store/authSlice';

const AuthContext = createContext(null);

export function AuthProvider({ children, navigate }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [toast, setToast] = useState('');

  const persist = useCallback((data) => {
    dispatch(setCredentials(data));
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
    const onRefreshed = (event) => dispatch(setUserAction(event.detail));
    const onExpired = () => dispatch(logoutAction());
    window.addEventListener('samira:session-refreshed', onRefreshed);
    window.addEventListener('samira:session-expired', onExpired);
    return () => {
      window.removeEventListener('samira:session-refreshed', onRefreshed);
      window.removeEventListener('samira:session-expired', onExpired);
    };
  }, [dispatch]);

  const sendOtp = useCallback((phone) => api.post('/auth/send-otp', { phone }), []);
  const resendOtp = useCallback((phone) => api.post('/auth/resend-otp', { phone }), []);

  const verifyOtp = useCallback(async ({ phone, otp }) => {
    const data = await api.post('/auth/verify-otp', { phone, otp });
    persist(data);
    setToast(`Welcome ${data.user.name}`);
    navigate(data.user.role === 'admin' ? '/profile' : '/profile');
    return data;
  }, [navigate, persist]);

  const login = useCallback(async ({ email, password = '' }) => {
    try {
      const path = email.includes('admin') ? '/admin/login' : '/auth/login';
      const data = await api.post(path, { email, password });
      persist(data);
      navigate(data.user.role === 'admin' && data.user.activeMode === 'admin' ? '/admin' : '/profile');
      return { ok: true };
    } catch (error) {
      setToast(error.message);
      return { ok: false, error: error.message };
    }
  }, [navigate, persist]);

  const switchMode = useCallback(async (mode) => {
    try {
      const data = await api.post('/auth/switch-mode', { mode });
      persist(data);
      setToast(mode === 'admin' ? 'Switched to Admin Mode' : 'Switched to Customer Mode');
      navigate(mode === 'admin' ? '/admin' : '/');
      return { ok: true };
    } catch (error) {
      setToast(error.message);
      return { ok: false, error: error.message };
    }
  }, [navigate, persist]);

  const logout = useCallback(() => {
    dispatch(logoutAction());
    navigate('/');
  }, [dispatch, navigate]);

  const value = useMemo(() => ({
    user,
    login,
    sendOtp,
    resendOtp,
    verifyOtp,
    switchMode,
    refreshProfile,
    logout,
    toast,
    setToast,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    activeMode: user?.activeMode || 'customer',
    availableModes: user?.availableModes || ['customer'],
  }), [login, logout, refreshProfile, resendOtp, sendOtp, switchMode, toast, user, verifyOtp]);

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
