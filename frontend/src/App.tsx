import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth';
import LoginPage from './pages/auth/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import DriverLayout from './layouts/DriverLayout';
import DashboardPage from './pages/admin/DashboardPage';
import VehiclesPage from './pages/admin/VehiclesPage';
import ChargeSessionsPage from './pages/admin/ChargeSessionsPage';
import StationsPage from './pages/admin/StationsPage';
import TariffsPage from './pages/admin/TariffsPage';
import UsersPage from './pages/admin/UsersPage';
import ChargeCardsPage from './pages/admin/ChargeCardsPage';
import DriverDashboardPage from './pages/driver/DriverDashboardPage';
import OdometerEntryPage from './pages/driver/OdometerEntryPage';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <Toaster position="top-right" />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    );
  }

  // Route based on user role
  if (user?.role === 'driver') {
    return (
      <ErrorBoundary>
        <Toaster position="top-right" />
        <BrowserRouter>
          <Routes>
            <Route element={<DriverLayout />}>
              <Route path="/" element={<DriverDashboardPage />} />
              <Route path="/odometer" element={<OdometerEntryPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    );
  }

  // Admin or fleet_manager routes
  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/charge-sessions" element={<ChargeSessionsPage />} />
            <Route path="/stations" element={<StationsPage />} />
            <Route path="/tariffs" element={<TariffsPage />} />
            <Route path="/charge-cards" element={<ChargeCardsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
