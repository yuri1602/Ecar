import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Car, BarChart3, Zap, LogOut, MapPin, DollarSign, Users, CreditCard } from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Car className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">ECar Fleet</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-gray-900"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Табло
                </Link>
                <Link
                  to="/vehicles"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-gray-900"
                >
                  <Car className="h-4 w-4 mr-2" />
                  Автомобили
                </Link>
                <Link
                  to="/charge-sessions"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-gray-900"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Зареждания
                </Link>
                <Link
                  to="/stations"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-gray-900"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Станции
                </Link>
                <Link
                  to="/tariffs"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-gray-900"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Тарифи
                </Link>
                <Link
                  to="/charge-cards"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-gray-900"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Карти
                </Link>
                <Link
                  to="/users"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-gray-900"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Потребители
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">{user?.fullName}</span>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Изход
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
