import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children, navigate }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('samira_user');
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem('samira_user');
      return null;
    }
  });
  const [toast, setToast] = useState('');

  const persist = useCallback((data) => {
    if (data.token) localStorage.setItem('samira_token', data.token);
    if (data.refreshToken) localStorage.setItem('samira_refresh_token', data.refreshToken);
    localStorage.setItem('samira_user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('samira_token');
    if (!token) return null;
    try {
      const profile = await api.get('/auth/me');
      localStorage.setItem('samira_user', JSON.stringify(profile));
      setUser(profile);
      return profile;
    } catch {
      localStorage.removeItem('samira_token');
      localStorage.removeItem('samira_user');
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    const onRefreshed = (event) => setUser(event.detail);
    const onExpired = () => setUser(null);
    window.addEventListener('samira:session-refreshed', onRefreshed);
    window.addEventListener('samira:session-expired', onExpired);
    return () => {
      window.removeEventListener('samira:session-refreshed', onRefreshed);
      window.removeEventListener('samira:session-expired', onExpired);
    };
  }, []);

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
    localStorage.removeItem('samira_user');
    localStorage.removeItem('samira_token');
    localStorage.removeItem('samira_refresh_token');
    setUser(null);
    navigate('/');
  }, [navigate]);

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
