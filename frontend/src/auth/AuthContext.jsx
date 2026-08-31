import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { api, getToken, setToken } from '../services/api';

/**
 * Holds the signed-in user. Token and user are kept in localStorage so a
 * browser back navigation, page refresh, or second tab keeps the session alive.
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
    if (!session || !session.token) return null;
    setToken(session.token);
    const userWithRole = {
      ...session.user,
      role: session.user?.role || (session.farmer ? 'farmer' : session.admin ? 'admin' : 'farmer'),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(userWithRole));
    setUser(userWithRole);
    return userWithRole;
  }, []);

  // Silently verify and refresh stored session on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      api('/auth/me')
        .then(apply)
        .catch(() => {
          // If token was rejected by server, don't crash, let user remain or clear if invalid
        });
    }
  }, [apply]);

  const value = useMemo(
    () => ({
      user,
      role: user?.role,
      isFarmer: user?.role === 'farmer',
      isAdmin: user?.role === 'admin',
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
