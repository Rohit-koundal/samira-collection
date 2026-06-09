import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children, navigate }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('samira_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [toast, setToast] = useState('');

  const persist = useCallback((data) => {
    if (data.token) localStorage.setItem('samira_token', data.token);
    localStorage.setItem('samira_user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('samira_token');
    if (!token) return;
    api.get('/auth/me').then((profile) => {
      localStorage.setItem('samira_user', JSON.stringify(profile));
      setUser(profile);
    }).catch(() => {});
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
    const path = email.includes('admin') ? '/admin/login' : '/auth/login';
    const data = await api.post(path, { email, password });
    persist(data);
    navigate(data.user.role === 'admin' && data.user.activeMode === 'admin' ? '/admin' : '/profile');
    return { ok: true };
  }, [navigate, persist]);

  const switchMode = useCallback(async (mode) => {
    const data = await api.post('/auth/switch-mode', { mode });
    persist(data);
    setToast(mode === 'admin' ? 'Switched to Admin Mode' : 'Switched to Customer Mode');
    navigate(mode === 'admin' ? '/admin' : '/');
  }, [navigate, persist]);

  const logout = useCallback(() => {
    localStorage.removeItem('samira_user');
    localStorage.removeItem('samira_token');
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
    logout,
    toast,
    setToast,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    activeMode: user?.activeMode || 'customer',
    availableModes: user?.availableModes || ['customer'],
  }), [login, logout, resendOtp, sendOtp, switchMode, toast, user, verifyOtp]);

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
