import { createContext, useCallback, useContext, useMemo, useState } from 'react';

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

  const login = useCallback(({ email }) => {
    const account = demoUsers[email] || { name: 'Samira Customer', email, role: 'customer' };
    localStorage.setItem('samira_user', JSON.stringify(account));
    localStorage.setItem('samira_token', 'demo-jwt-token');
    setUser(account);
    setToast(`Welcome ${account.name}`);
    navigate(account.role === 'admin' ? '/admin' : '/profile');
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
