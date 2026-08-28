import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LanguageSelect from './pages/Landing/LanguageSelect.jsx';
import RoleSelect from './pages/Landing/RoleSelect.jsx';
import FarmerLogin from './pages/Farmer/FarmerLogin.jsx';
import FarmerHome from './pages/Farmer/FarmerHome.jsx';
import BookSlot from './pages/Farmer/BookSlot.jsx';
import AdminLogin from './pages/Admin/AdminLogin.jsx';
import AdminHome from './pages/Admin/AdminHome.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LanguageSelect />} />
      <Route path="/role" element={<RoleSelect />} />

      <Route path="/farmer/login" element={<FarmerLogin />} />
      <Route
        path="/farmer"
        element={
          <ProtectedRoute role="farmer">
            <FarmerHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/farmer/book"
        element={
          <ProtectedRoute role="farmer">
            <BookSlot />
          </ProtectedRoute>
        }
      />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminHome />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
