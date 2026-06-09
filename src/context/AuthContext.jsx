import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const demoUsers = {
  'admin@samiracollection.com': { name: 'Admin', email: 'admin@samiracollection.com', role: 'admin' },
  'customer@test.com': { name: 'Demo Customer', email: 'customer@test.com', role: 'customer' },
};

export function AuthProvider({ children, navigate }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('samira_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [toast, setToast] = useState('');

  const login = useCallback(async ({ email, password = '' }) => {
    try {
      const path = email.includes('admin') ? '/admin/login' : '/auth/login';
      const data = await api.post(path, { email, password });
      localStorage.setItem('samira_user', JSON.stringify(data.user));
      localStorage.setItem('samira_token', data.token);
      setUser(data.user);
      setToast(`Welcome ${data.user.name}`);
      navigate(data.user.role === 'admin' ? '/admin' : '/profile');
      return { ok: true };
    } catch (error) {
      const account = demoUsers[email];
      if (!account || process.env.NODE_ENV === 'production') {
        setToast(error.message);
        return { ok: false, error: error.message };
      }
      localStorage.setItem('samira_user', JSON.stringify(account));
      localStorage.setItem('samira_token', '');
      setUser(account);
      setToast('Demo mode login. Start the API for live admin changes.');
      navigate(account.role === 'admin' ? '/admin' : '/profile');
      return { ok: true };
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('samira_user');
    localStorage.removeItem('samira_token');
    setUser(null);
    navigate('/');
  }, [navigate]);

  const value = useMemo(() => ({ user, login, logout, toast, setToast, isAdmin: user?.role === 'admin' }), [login, logout, toast, user]);

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
