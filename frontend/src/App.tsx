import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import LoginPage from './pages/auth/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import DriverLayout from './layouts/DriverLayout';
import DashboardPage from './pages/admin/DashboardPage';
import VehiclesPage from './pages/admin/VehiclesPage';
import ChargeSessionsPage from './pages/admin/ChargeSessionsPage';
import DriverDashboardPage from './pages/driver/DriverDashboardPage';
import OdometerEntryPage from './pages/driver/OdometerEntryPage';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Route based on user role
  if (user?.role === 'driver') {
    return (
      <BrowserRouter>
        <Routes>
          <Route element={<DriverLayout />}>
            <Route path="/" element={<DriverDashboardPage />} />
            <Route path="/odometer" element={<OdometerEntryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }

  // Admin or fleet_manager routes
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/charge-sessions" element={<ChargeSessionsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
