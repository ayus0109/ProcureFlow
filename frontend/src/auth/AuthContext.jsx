import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api, setToken } from '../services/api';

/**
 * Holds the signed-in user. Token and user are kept in localStorage so a
 * refresh — or opening a second tab for the admin side of the demo — does not
 * sign anyone out.
 */

const AuthContext = createContext(null);
const USER_KEY = 'procureflow.user';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const apply = useCallback((session) => {
    setToken(session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    setUser(session.user);
    return session.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      registerFarmer: (body) =>
        api('/auth/farmer/register', { method: 'POST', body }).then(apply),
      loginFarmer: (body) => api('/auth/farmer/login', { method: 'POST', body }).then(apply),
      loginFarmerOtp: (body) => api('/auth/farmer/otp-login', { method: 'POST', body }).then(apply),
      loginAdmin: (body) => api('/auth/admin/login', { method: 'POST', body }).then(apply),
      logout: () => {
        setToken(null);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      },
    }),
    [user, apply]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
