import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

/**
 * Keeps each role on its own side of the app. A farmer who types /admin is
 * sent back to their own home rather than shown an admin screen.
 * The server guards the data as well — this only tidies the UI.
 */
export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/farmer/login'} replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/farmer'} replace />;
  }
  return children;
}
